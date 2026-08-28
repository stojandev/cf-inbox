# Local development

Milestone 0 provides one local development command for the React frontend and Cloudflare Worker API. The Cloudflare Vite plugin runs Worker code in the Workers runtime while Vite serves the frontend with hot reload.

## Requirements

- Node.js 22.12 or newer
- npm 11 or newer

## Setup

```sh
npm install
npm run typegen
npm run dev
```

Open the URL printed by Vite. The page calls `GET /api/health` and reports whether the Worker successfully executed the Effect bootstrap program.

No Cloudflare account, outbound email configuration, secrets, Durable Objects, or R2 buckets are required for Milestone 0 local development.

## Commands

```sh
npm run dev       # React + Worker local development
npm run lint      # ESLint, including floating-promise checks
npm run typecheck # Verify generated Worker types and TypeScript
npm test          # Run tests inside the Workers runtime
npm run build     # Typecheck and create a production build
npm run preview   # Preview the production build in the Workers runtime
```

Run `npm run typegen` after changing bindings in `wrangler.jsonc`. The generated `worker-configuration.d.ts` file is ignored; `npm run typecheck` regenerates it before TypeScript runs so configuration and runtime types stay synchronized without committing a large generated artifact.

Local secrets belong in `.dev.vars`, which is ignored by Git. Production secrets must be added with Wrangler rather than committed to source control.
