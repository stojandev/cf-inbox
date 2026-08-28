import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { bootstrapStatus } from "./bootstrap";

describe("bootstrapStatus", () => {
  it("executes as an Effect program", async () => {
    await expect(Effect.runPromise(bootstrapStatus)).resolves.toEqual({
      effect: "configured",
      service: "cf-inbox",
      status: "ok",
    });
  });
});
