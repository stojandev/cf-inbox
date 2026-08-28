import { app } from "./app";

export default {
  fetch(request: Request, env: Env, context: ExecutionContext) {
    return app.fetch(request, env, context);
  },
} satisfies ExportedHandler<Env>;
