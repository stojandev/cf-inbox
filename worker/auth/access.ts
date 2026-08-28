import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
  type JWTPayload,
} from "jose";
import { Context, Data, Effect, Layer } from "effect";

export interface AccessBindings {
  readonly ACCESS_AUD?: string;
  readonly ACCESS_TEAM_DOMAIN?: string;
  readonly APP_ENV?: string;
}

export interface AccessConfiguration {
  readonly audience: string;
  readonly certsUrl: URL;
  readonly issuer: string;
}

export type AccessIdentity =
  | {
      readonly authentication: "access";
      readonly email: string;
      readonly subject: string;
    }
  | {
      readonly authentication: "local";
      readonly email: "developer@localhost";
      readonly subject: "local-development";
    };

export class AccessConfigurationError extends Data.TaggedError(
  "AccessConfigurationError",
)<{
  readonly field: "ACCESS_AUD" | "ACCESS_TEAM_DOMAIN";
}> {}

export class AccessTokenMissing extends Data.TaggedError("AccessTokenMissing") {}

export class AccessTokenInvalid extends Data.TaggedError(
  "AccessTokenInvalid",
) {}

export type AccessAuthenticationError =
  | AccessConfigurationError
  | AccessTokenInvalid
  | AccessTokenMissing;

interface AccessClaims extends JWTPayload {
  readonly email?: unknown;
  readonly type?: unknown;
}

interface VerifyAccessTokenInput {
  readonly configuration: AccessConfiguration;
  readonly token: string;
}

interface AccessJwtVerifierService {
  readonly verify: (
    input: VerifyAccessTokenInput,
  ) => Effect.Effect<AccessIdentity, AccessTokenInvalid>;
}

export class AccessJwtVerifier extends Context.Tag(
  "@cf-inbox/AccessJwtVerifier",
)<AccessJwtVerifier, AccessJwtVerifierService>() {}

const localIdentity: AccessIdentity = {
  authentication: "local",
  email: "developer@localhost",
  subject: "local-development",
};

const failConfiguration = (
  field: AccessConfigurationError["field"],
): Effect.Effect<never, AccessConfigurationError> =>
  Effect.fail(new AccessConfigurationError({ field }));

export const readAccessConfiguration = (
  bindings: AccessBindings,
): Effect.Effect<AccessConfiguration, AccessConfigurationError> =>
  Effect.gen(function* () {
    const audience = bindings.ACCESS_AUD?.trim();
    if (!audience) {
      return yield* failConfiguration("ACCESS_AUD");
    }

    const teamDomain = bindings.ACCESS_TEAM_DOMAIN?.trim();
    if (!teamDomain) {
      return yield* failConfiguration("ACCESS_TEAM_DOMAIN");
    }

    const teamUrl = yield* Effect.try({
      try: () => new URL(teamDomain),
      catch: () => new AccessConfigurationError({ field: "ACCESS_TEAM_DOMAIN" }),
    });

    const isCloudflareAccessOrigin =
      teamUrl.protocol === "https:" &&
      teamUrl.username === "" &&
      teamUrl.password === "" &&
      teamUrl.hostname.endsWith(".cloudflareaccess.com") &&
      teamUrl.pathname === "/" &&
      teamUrl.search === "" &&
      teamUrl.hash === "";

    if (!isCloudflareAccessOrigin) {
      return yield* failConfiguration("ACCESS_TEAM_DOMAIN");
    }

    return {
      audience,
      certsUrl: new URL("/cdn-cgi/access/certs", teamUrl.origin),
      issuer: teamUrl.origin,
    };
  });

export const verifyAccessJwt = (
  input: VerifyAccessTokenInput,
  keySet: JWTVerifyGetKey,
): Effect.Effect<AccessIdentity, AccessTokenInvalid> =>
  Effect.gen(function* () {
    const { payload } = yield* Effect.tryPromise({
      try: () =>
        jwtVerify<AccessClaims>(input.token, keySet, {
          algorithms: ["RS256"],
          audience: input.configuration.audience,
          issuer: input.configuration.issuer,
        }),
      catch: () => new AccessTokenInvalid(),
    });

    if (
      payload.type !== "app" ||
      typeof payload.email !== "string" ||
      payload.email.length === 0 ||
      typeof payload.sub !== "string" ||
      payload.sub.length === 0
    ) {
      return yield* Effect.fail(new AccessTokenInvalid());
    }

    return {
      authentication: "access",
      email: payload.email,
      subject: payload.sub,
    };
  });

export const AccessJwtVerifierLive = Layer.succeed(AccessJwtVerifier, {
  verify: (input) =>
    verifyAccessJwt(
      input,
      createRemoteJWKSet(input.configuration.certsUrl),
    ),
});

const isLoopbackHostname = (hostname: string): boolean =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "[::1]";

export const isLocalDevelopmentRequest = (
  request: Request,
  bindings: AccessBindings,
): boolean => {
  const url = new URL(request.url);

  return (
    bindings.APP_ENV === "development" &&
    url.protocol === "http:" &&
    isLoopbackHostname(url.hostname)
  );
};

export const authenticateRequest = (
  request: Request,
  bindings: AccessBindings,
): Effect.Effect<
  AccessIdentity,
  AccessAuthenticationError,
  AccessJwtVerifier
> =>
  Effect.gen(function* () {
    if (isLocalDevelopmentRequest(request, bindings)) {
      return localIdentity;
    }

    const configuration = yield* readAccessConfiguration(bindings);
    const token = request.headers.get("cf-access-jwt-assertion");

    if (!token) {
      return yield* Effect.fail(new AccessTokenMissing());
    }

    const verifier = yield* AccessJwtVerifier;
    return yield* verifier.verify({ configuration, token });
  });
