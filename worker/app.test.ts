import { env } from "cloudflare:workers";
import {
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, expect, it } from "vitest";
import worker from "./index";

describe("Worker API", () => {
  it("runs the Effect bootstrap program through the HTTP boundary", async () => {
    const context = createExecutionContext();
    const response = await worker.fetch(
      new Request("https://cf-inbox.test/api/health"),
      env,
      context,
    );

    await waitOnExecutionContext(context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      effect: "configured",
      service: "cf-inbox",
      status: "ok",
    });
  });

  it("returns a JSON 404 for unknown API routes", async () => {
    const context = createExecutionContext();
    const response = await worker.fetch(
      new Request("https://cf-inbox.test/api/unknown"),
      env,
      context,
    );

    await waitOnExecutionContext(context);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });
});
