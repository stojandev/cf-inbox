# CF Inbox

A lightweight, single-tenant email inbox built entirely on Cloudflare.

> **Status:** planning / pre-implementation.

CF Inbox is intended for small businesses, personal domains, and client deployments that need a real custom-domain inbox without running an SMTP server or subscribing to a traditional mailbox provider.

The project deliberately focuses on a small, reliable core:

- receive email through Cloudflare Email Routing
- store mailbox state in a Durable Object with SQLite
- store attachments in R2
- authenticate with Cloudflare Access
- structure backend/core flows with Effect
- send email through Cloudflare Email Service
- optionally forward inbound messages to an existing Gmail or other mailbox
- deploy one isolated instance per person, company, or client

It is **not** intended to be a multi-tenant SaaS, AI email agent, team collaboration platform, or full Gmail replacement.

## Core architecture

```text
Incoming mail
    |
    v
Cloudflare Email Routing
    |
    v
Email Worker
    |---------------------> optional forward to Gmail
    |
    v
Mailbox Durable Object
    |             |
    |             +-------> R2 attachments
    v
SQLite
    |
    v
Web Inbox
    |
    +-------> Compose / Reply
                    |
                    v
             Cloudflare Email Service
```

## Initial feature set

- Inbox
- Sent
- Archive
- Trash
- read / unread
- search
- threads
- attachments
- Compose
- Reply / Reply all
- Forward
- optional inbound forwarding
- single-domain deployment
- one primary mailbox with optional aliases
- Cloudflare Access authentication

## Non-goals for v1

- multi-tenant architecture
- organization / team permissions
- AI agents
- MCP
- calendar
- contacts
- IMAP / POP3
- SMTP server hosting
- complex rules engine
- marketing email / bulk sending

## Cloudflare services

- Workers
- Effect (TypeScript backend/core)
- Email Routing
- Email Service
- Durable Objects with SQLite
- R2
- Cloudflare Access

## Reference implementation

The project is a new implementation. Cloudflare's official `cloudflare/agentic-inbox` project is used as an architectural and product reference for Cloudflare-native email flows.

See `docs/LICENSING.md`.

## Documents

- [Product scope](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Technical stack](docs/TECH_STACK.md)
- [Security](docs/SECURITY.md)
- [UI](docs/UI.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Licensing and references](docs/LICENSING.md)

## License

MIT. See `LICENSE`.
