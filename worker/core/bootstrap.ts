import { Effect } from "effect";

export type BootstrapStatus = {
  readonly effect: "configured";
  readonly service: "cf-inbox";
  readonly status: "ok";
};

export const bootstrapStatus = Effect.succeed<BootstrapStatus>({
  effect: "configured",
  service: "cf-inbox",
  status: "ok",
});
