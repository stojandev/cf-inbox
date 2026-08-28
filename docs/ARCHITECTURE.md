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
                     | optional forward     |
                     +----+------------+----+
                          |            |
                          |            +----------> external inbox
                          |                         e.g. Gmail
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
   |
   +------> Cloudflare Email Service -> outbound mail
```

## Deployment boundary

**One deployment = one customer / trust boundary.**

The application should not contain a tenant table.

Configuration identifies:
- domain
- primary address
- optional aliases
- optional forwarding destination

This intentionally avoids the authorization complexity of a shared multi-tenant mailbox service.

## Backend programming model

The backend is TypeScript with **Effect** used for core application workflows and service boundaries. Hono remains a thin transport/router layer. React UI code stays conventional TypeScript/React.

Use Effect for:
- typed domain/infrastructure errors
- configuration validation
- email processing pipelines
- storage and outbound service boundaries
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
- optional forwarding
- routing operations to MailboxDO
- outbound send requests
- authenticated attachment streaming

The Worker should remain mostly stateless.

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
- thread_id
- folder
- from_address
- from_name
- to_json
- cc_json
- bcc_json
- subject
- text_body
- html_body
- received_at
- sent_at
- in_reply_to
- references_json
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
9. Optionally forward the original incoming message to the configured external mailbox.
10. Return success only after durable storage has succeeded.

## Outbound mail

1. Authenticated user submits Compose/Reply.
2. Validate sender identity against configured addresses.
3. Validate recipient fields and message size.
4. Construct MIME message.
5. Add threading headers when replying.
6. Send using Cloudflare Email Service.
7. Persist Sent copy.
8. Record delivery submission status.

No bulk sending endpoints.

## Reply threading

Preserve:
- Message-ID
- In-Reply-To
- References

The UI thread identifier should be internal and separate from the Internet Message-ID.

## Frontend

Recommended initial structure:

```text
src/
  app/
  components/
  features/
    inbox/
    message/
    compose/
    settings/
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

Cloudflare's official Agentic Inbox demonstrates the same core Cloudflare primitives: Email Routing, Hono/Workers, Durable Objects with SQLite, R2, Cloudflare Access, and Email Service.

CF Inbox deliberately removes the agent/AI layer and simplifies the trust model.
