# Implementation Plan

Build only the lightweight receive-only v1 described in the product documentation. Outbound sending, reply/forward, inbound forwarding, multi-user features, and conversation threading are outside this plan.

The coding agent should complete one small, verifiable milestone at a time. After each milestone: run relevant tests and typechecks, remove unnecessary complexity, update documentation when an architectural decision changes, and commit the completed milestone.

## Milestone 0 — repository bootstrap (complete)

Delivered:
- TypeScript
- Effect configured for backend/core
- Worker and frontend development environment
- Wrangler configuration
- lint, typecheck, and test scripts
- local environment documentation

## Milestone 1 — production authentication (complete)

Deliver:
- Cloudflare Access JWT validation
- fail-closed production behavior
- explicit local-development bypass that cannot activate on a deployed hostname
- authenticated `/api/me` endpoint

Tests:
- valid token
- missing token
- bad audience
- expired token
- invalid issuer or signature
- missing production configuration

## Milestone 2 — receive and persist mail

Deliver:
- singleton Mailbox Durable Object
- small, versioned SQLite schema and migrations
- folders: Inbox, Archive, Trash
- read/unread and star state
- pagination and basic search
- Cloudflare Email Routing handler
- destination validation
- MIME parsing with `postal-mime`
- normalized text and HTML bodies
- private R2 attachment storage and metadata
- authenticated attachment download endpoint with safe filenames
- real `.eml` test fixtures

Acceptance:
- a test email, including an attachment, can be received, persisted, queried, moved, and downloaded only by an authenticated user

Keep the schema limited to fields required by the v1 UI. Do not add outbound, forwarding, or threading tables.

## Milestone 3 — minimal inbox UI

Deliver:
- Inbox, Archive, and Trash navigation
- paginated message list
- message reading view
- safe plain-text and sanitized HTML rendering
- read/unread and star actions
- archive, trash, and permanent delete actions
- basic search
- authenticated attachment display/download
- basic responsive layout

Acceptance:
- the complete receive-and-read workflow works through the browser without manual API calls

Do not add Compose, Sent, Reply, Forward, settings screens, a component framework, or a frontend state library unless an actual need is demonstrated.

## Milestone 4 — harden, deploy, and release v1

Deliver:
- HTML sanitization and remote-image behavior review
- CSP and security headers
- API input validation and size limits
- malformed MIME and unauthorized-access tests
- content-safe logging audit
- production Wrangler configuration and environment template
- repeatable per-instance deployment instructions
- README installation and operating instructions
- concise release notes

Acceptance:
- a clean instance can be configured and deployed without source-code edits
- Access protects every mailbox and attachment route
- inbound email remains durable when parsing or attachment handling encounters expected failures
- lint, typecheck, unit/integration tests, and a deployment dry run pass

This milestone completes v1. There is no active post-v1 feature roadmap in this repository.
