# AGENTS.md

Instructions for coding agents working on CF Inbox.

## Product intent

Build a small, production-oriented, single-tenant Cloudflare email inbox.

Do not turn this repository into a general-purpose email platform.

## Primary reference

Cloudflare's official `cloudflare/agentic-inbox` repository may be inspected as a reference for:

- Email Routing Worker handling
- Durable Object + SQLite mailbox storage
- R2 attachment storage
- Cloudflare Access validation
- MIME parsing

Do **not** mechanically copy the project or preserve its agentic architecture.

The implementation in this repository should be independently structured around the requirements documented here.

## Required principles

1. One deployment equals one trust boundary.
2. No multi-tenancy in core.
3. Cloudflare Access is mandatory in production.
4. Fail closed when authentication configuration is missing.
5. Minimize dependencies.
6. Prefer Cloudflare-native primitives.
7. Do not implement SMTP servers.
8. Do not implement a MIME parser from scratch.
9. Treat email HTML as untrusted input.
10. Never expose R2 objects publicly.
11. Never log full message bodies, credentials, Access JWTs, or attachment contents.
12. Keep v1 receive-only; do not add outbound or forwarding infrastructure.

## Preferred stack

Backend:
- TypeScript
- Effect for core services, typed errors, configuration, retries, and email-processing workflows
- Cloudflare Workers
- Hono as the thin HTTP/router boundary
- Durable Objects + SQLite
- R2
- `postal-mime` for inbound parsing

Frontend:
- React
- Vite
- Tailwind CSS
- minimal additional state dependencies

Auth:
- Cloudflare Access JWT validation

Effect guidance:
- use Effect for backend/core service boundaries and workflows
- model expected failures as typed errors
- wrap Cloudflare bindings behind small services where that improves testability
- keep HTTP handlers thin
- do not force Effect into React UI code
- do not create abstraction layers that add no reliability or testability

Avoid unless justified:
- Agents SDK
- AI SDK
- Zustand
- TipTap
- Drizzle
- large component frameworks
- custom auth databases

## Implementation order

Follow `docs/IMPLEMENTATION_PLAN.md`.

Do not build advanced UI before the inbound pipeline, persistence, and authentication are verified.

## Definition of done for v1

A clean deployment must allow an operator to:

1. configure one domain
2. protect the application with Cloudflare Access
3. route inbound mail to the Worker
4. receive and persist a message
5. safely render plain-text and sanitized HTML mail
6. open and download an attachment through authenticated routes
7. search stored messages
8. deploy another isolated instance without changing application code
