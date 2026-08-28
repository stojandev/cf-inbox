import { Effect, Layer } from "effect";
import { Hono } from "hono";
import {
  AccessJwtVerifier,
  AccessJwtVerifierLive,
  authenticateRequest,
  type AccessBindings,
  type AccessIdentity,
} from "./auth/access";
import { bootstrapStatus } from "./core/bootstrap";

interface AppEnvironment {
  Bindings: AccessBindings;
  Variables: {
    accessIdentity: AccessIdentity;
  };
}

export const createApp = (
  verifierLayer: Layer.Layer<AccessJwtVerifier> = AccessJwtVerifierLive,
) => {
  const app = new Hono<AppEnvironment>();

  app.use("/api/*", async (context, next) => {
    context.header("Cache-Control", "no-store");

    const authentication = await Effect.runPromise(
      authenticateRequest(context.req.raw, context.env).pipe(
        Effect.provide(verifierLayer),
        Effect.either,
      ),
    );

    if (authentication._tag === "Left") {
      const error = authentication.left;
      if (error._tag === "AccessConfigurationError") {
        return context.json({ error: "Authentication is not configured" }, 503);
      }

      return context.json({ error: "Authentication required" }, 403);
    }

    context.set("accessIdentity", authentication.right);
    await next();
  });

  app.get("/api/health", async (context) => {
    const status = await Effect.runPromise(bootstrapStatus);
    return context.json(status);
  });

  app.get("/api/me", (context) => context.json(context.var.accessIdentity));

  app.notFound((context) => context.json({ error: "Not found" }, 404));

  return app;
};

export const app = createApp();
