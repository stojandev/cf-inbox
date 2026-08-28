# Architecture

## Design goal

Keep the architecture as close as possible to the Cloudflare platform primitives needed to operate a normal mailbox.

## High-level system

```text
                     +----------------------+
Internet ------------> Cloudflare Email     |
                     | Routing              |
                     +----------+-----------+
                                |
                                v
                     +----------------------+
                     | Email Worker         |
                     |                      |
                     | parse / validate     |
                     | persist              |
                     +----+-----------------+
                          v
                  +----------------+
                  | MailboxDO      |
                  | SQLite         |
                  +-------+--------+
                          |
                          +------------------------+
                                                   v
                                            +-------------+
                                            | R2          |
                                            | attachments |
                                            +-------------+

Browser
   |
   v
Cloudflare Access
   |
   v
Hono API / Web app
   |
   +------> MailboxDO
   |
   +------> authenticated attachment endpoint
```

## Deployment boundary

**One deployment = one customer / trust boundary.**

The application should not contain a tenant table.

Configuration identifies:
- domain
- primary address
- optional aliases

This intentionally avoids the authorization complexity of a shared multi-tenant mailbox service.

## Backend programming model

The backend is TypeScript with **Effect** used for core application workflows and service boundaries. Hono remains a thin transport/router layer. React UI code stays conventional TypeScript/React.

Use Effect for:
- typed domain/infrastructure errors
- configuration validation
- email processing pipelines
- storage service boundaries
- retries/timeouts where semantically appropriate
- structured logging/tracing hooks

Do not wrap trivial pure functions or UI state in Effect merely for consistency.

## Worker responsibilities

The Worker is responsible for:
- HTTP application/API entrypoint
- Cloudflare Access JWT validation
- Email Routing handler
- inbound address validation
- MIME parsing
- message normalization
- routing operations to MailboxDO
- authenticated attachment streaming

The Worker should remain mostly stateless.

## Authentication flow

Cloudflare Access protects the deployed hostname. The Worker also validates the signed `Cf-Access-Jwt-Assertion` header before serving any `/api/*` route.

The backend:
- validates the RS256 signature against the team JWKS endpoint
- validates the configured issuer and application audience
- rejects expired or not-yet-valid tokens
- accepts only application tokens with a user subject and email claim
- fails closed when Access configuration is missing or invalid

The JWT verifier is an Effect service so cryptographic verification can be tested without network access. Hono only translates the typed authentication result into an HTTP response and exposes the verified identity to handlers.

Local development bypasses Access only when all three conditions hold: `APP_ENV` is `development`, the request uses HTTP, and the hostname is loopback. A deployed HTTPS origin cannot activate this bypass even if the development variable is accidentally retained.

## Mailbox Durable Object

v1 uses one logical mailbox Durable Object per deployment.

Suggested stable identity:

```text
MAILBOX.idFromName("primary")
```

All configured aliases can deliver into the same mailbox.

Why:
- simplest operational model
- one SQLite database
- atomic mailbox operations
- no cross-mailbox authorization
- aliases behave like identities, not separate users

## SQLite responsibilities

Suggested entities:

### messages

- id
- internet_message_id
- folder
- from_address
- from_name
- to_json
- cc_json
- subject
- text_body
- html_body
- received_at
- read
- starred
- has_attachments
- size_bytes

### attachments

- id
- message_id
- filename
- content_type
- size_bytes
- r2_key
- content_id
- disposition

### settings

Small mailbox configuration that is safe to persist.

Secrets must remain Worker secrets, not SQLite records.

## R2

R2 stores attachment bytes.

Recommended key format:

```text
attachments/{messageId}/{attachmentId}/{safeFilename}
```

R2 is private. Attachments are only retrieved through authenticated application routes.

## Inbound mail

1. Email Routing sends the message to the Worker.
2. Validate destination against configured address / aliases.
3. Read MIME message.
4. Parse with a mature MIME parsing library such as `postal-mime`.
5. Normalize headers.
6. Sanitize filename metadata.
7. Store attachments in R2.
8. Store normalized message + attachment metadata atomically where practical.
9. Return success only after durable storage has succeeded.

## Frontend

Recommended initial structure:

```text
src/
  app/
  components/
  features/
    inbox/
    message/
  lib/
workers/
  app.ts
  email/
  auth/
  mailbox/
```

## Dependencies

Prefer:
- `effect`
- `hono`
- `postal-mime`
- `jose`
- React
- Tailwind

Only add a dependency when it removes meaningful protocol/security complexity.

## Reference

Cloudflare's official Agentic Inbox demonstrates the same core Cloudflare primitives: Email Routing, Hono/Workers, Durable Objects with SQLite, R2, and Cloudflare Access.

CF Inbox deliberately removes the agent/AI layer and simplifies the trust model.
