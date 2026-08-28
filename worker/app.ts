import { Effect } from "effect";
import { Hono } from "hono";
import { bootstrapStatus } from "./core/bootstrap";

export const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", async (context) => {
  const status = await Effect.runPromise(bootstrapStatus);
  return context.json(status);
});

app.notFound((context) => context.json({ error: "Not found" }, 404));
