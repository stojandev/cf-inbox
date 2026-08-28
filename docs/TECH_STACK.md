# Technical Stack

## Backend

- TypeScript
- Effect
- Cloudflare Workers
- Hono as the HTTP/router boundary
- Durable Objects with SQLite
- R2
- Cloudflare Email Routing
- Cloudflare Email Service
- Cloudflare Access
- `postal-mime` for inbound MIME parsing
- `jose` where needed for Access JWT verification

## Effect usage

Effect belongs in the backend/core, especially for:
- validated runtime configuration
- typed domain and infrastructure errors
- email receive/store/forward pipelines
- R2 and Durable Object service boundaries
- outbound send operations
- retries, backoff, timeout and interruption
- observability hooks
- deterministic unit tests with test service implementations

Do not force Effect into:
- React component state
- presentational UI components
- trivial pure utilities
- every library call merely to make the codebase look uniform

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

Keep state management minimal. Add another state library only when React primitives and server-query patterns are no longer sufficient.

## Dependency philosophy

The project is intentionally lightweight. Dependencies must either remove meaningful protocol/security complexity or materially improve correctness/testability.

The official Cloudflare Agentic Inbox is a reference implementation, not the dependency baseline for this repository.
