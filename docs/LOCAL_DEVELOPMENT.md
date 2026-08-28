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

No Cloudflare account, secrets, Durable Objects, or R2 buckets are required for local development.

API routes use a local development identity only for HTTP requests to `localhost`, `127.0.0.1`, or `[::1]` while `APP_ENV` is `development`. HTTPS or a non-loopback hostname always uses production Access validation and fails closed when `ACCESS_TEAM_DOMAIN` or `ACCESS_AUD` is missing.

`GET /api/me` shows the current authenticated identity. In local development it returns the fixed `developer@localhost` identity; production returns claims from a verified Cloudflare Access application token.

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

`ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` are non-secret production configuration. The team domain must be an HTTPS `*.cloudflareaccess.com` origin, for example `https://example.cloudflareaccess.com`, and the audience must match the Access application's AUD tag. The committed blank values deliberately make an accidental deployment fail closed; the repeatable production configuration flow will be finalized in Milestone 4.
