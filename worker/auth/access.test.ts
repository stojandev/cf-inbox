import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWK,
} from "jose";
import { Effect, Layer } from "effect";
import {
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app";
import {
  AccessJwtVerifier,
  AccessTokenInvalid,
  isLocalDevelopmentRequest,
  readAccessConfiguration,
  verifyAccessJwt,
  type AccessBindings,
  type AccessConfiguration,
} from "./access";

const issuer = "https://example.cloudflareaccess.com";
const audience = "test-audience";

const configuration: AccessConfiguration = {
  audience,
  certsUrl: new URL(`${issuer}/cdn-cgi/access/certs`),
  issuer,
};

let signingKey: CryptoKey;
let otherSigningKey: CryptoKey;
let publicJwk: JWK;

beforeAll(async () => {
  const primary = await generateKeyPair("RS256");
  const other = await generateKeyPair("RS256");

  signingKey = primary.privateKey;
  otherSigningKey = other.privateKey;
  publicJwk = await exportJWK(primary.publicKey);
  publicJwk.kid = "primary";
  publicJwk.alg = "RS256";
});

const signToken = async ({
  expiresAt = "5m",
  tokenAudience = audience,
  tokenIssuer = issuer,
  key = signingKey,
}: {
  expiresAt?: string | number;
  key?: CryptoKey;
  tokenAudience?: string;
  tokenIssuer?: string;
} = {}): Promise<string> =>
  new SignJWT({ email: "owner@example.com", type: "app" })
    .setProtectedHeader({ alg: "RS256", kid: "primary" })
    .setSubject("user-123")
    .setIssuer(tokenIssuer)
    .setAudience(tokenAudience)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(key);

const verifyToken = async (token: string) =>
  Effect.runPromise(
    verifyAccessJwt(
      { configuration, token },
      createLocalJWKSet({ keys: [publicJwk] }),
    ).pipe(Effect.either),
  );

describe("Cloudflare Access JWT verification", () => {
  it("accepts a valid application token", async () => {
    const result = await verifyToken(await signToken());

    expect(result).toMatchObject({
      _tag: "Right",
      right: {
        authentication: "access",
        email: "owner@example.com",
        subject: "user-123",
      },
    });
  });

  it.each([
    ["bad audience", { tokenAudience: "other-audience" }],
    ["invalid issuer", { tokenIssuer: "https://other.cloudflareaccess.com" }],
    ["expired token", { expiresAt: 0 }],
    ["invalid signature", { key: undefined }],
  ] as const)("rejects a %s", async (_name, options) => {
    const token =
      _name === "invalid signature"
        ? await signToken({ key: otherSigningKey })
        : await signToken(options);
    const result = await verifyToken(token);

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("AccessTokenInvalid");
    }
  });
});

describe("Access configuration", () => {
  it("normalizes a valid Cloudflare Access team origin", async () => {
    const result = await Effect.runPromise(
      readAccessConfiguration({
        ACCESS_AUD: audience,
        ACCESS_TEAM_DOMAIN: `${issuer}/`,
      }),
    );

    expect(result).toEqual(configuration);
  });

  it("rejects a missing audience and a non-Access JWKS origin", async () => {
    const missingAudience = await Effect.runPromise(
      readAccessConfiguration({ ACCESS_TEAM_DOMAIN: issuer }).pipe(
        Effect.either,
      ),
    );
    const unsafeOrigin = await Effect.runPromise(
      readAccessConfiguration({
        ACCESS_AUD: audience,
        ACCESS_TEAM_DOMAIN: "https://example.com",
      }).pipe(Effect.either),
    );

    expect(missingAudience._tag).toBe("Left");
    expect(unsafeOrigin._tag).toBe("Left");
  });
});

describe("Access HTTP boundary", () => {
  const productionBindings: AccessBindings = {
    ACCESS_AUD: audience,
    ACCESS_TEAM_DOMAIN: issuer,
    APP_ENV: "production",
  };

  const verifierLayer = Layer.succeed(AccessJwtVerifier, {
    verify: ({ token }) =>
      token === "valid-token"
        ? Effect.succeed({
            authentication: "access" as const,
            email: "owner@example.com",
            subject: "user-123",
          })
        : Effect.fail(new AccessTokenInvalid()),
  });

  const testApp = createApp(verifierLayer);

  const request = async (path: string, bindings: AccessBindings, token?: string) => {
    const context = createExecutionContext();
    const headers = new Headers();
    if (token) {
      headers.set("Cf-Access-Jwt-Assertion", token);
    }
    const response = await testApp.fetch(
      new Request(`https://inbox.example.com${path}`, { headers }),
      bindings,
      context,
    );

    await waitOnExecutionContext(context);
    return response;
  };

  it("returns the verified identity from /api/me", async () => {
    const response = await request(
      "/api/me",
      productionBindings,
      "valid-token",
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      authentication: "access",
      email: "owner@example.com",
      subject: "user-123",
    });
  });

  it("rejects a missing token", async () => {
    const response = await request("/api/me", productionBindings);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication required",
    });
  });

  it("fails closed when production configuration is missing", async () => {
    const response = await request("/api/me", {
      APP_ENV: "production",
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication is not configured",
    });
  });

  it("cannot use the local bypass on a deployed origin", () => {
    expect(
      isLocalDevelopmentRequest(
        new Request("https://inbox.example.com/api/me"),
        { APP_ENV: "development" },
      ),
    ).toBe(false);
    expect(
      isLocalDevelopmentRequest(new Request("https://localhost/api/me"), {
        APP_ENV: "development",
      }),
    ).toBe(false);
  });
});
