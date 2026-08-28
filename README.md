# CF Inbox

A lightweight, single-tenant email inbox built entirely on Cloudflare.

> **Status:** Milestone 0 complete — building the lightweight receive-only v1.

CF Inbox is intended for small businesses, personal domains, and client deployments that need a real custom-domain inbox without running an SMTP server or subscribing to a traditional mailbox provider.

The project deliberately focuses on a small, reliable core:

- receive email through Cloudflare Email Routing
- store mailbox state in a Durable Object with SQLite
- store attachments in R2
- authenticate with Cloudflare Access
- structure backend/core flows with Effect
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
```

## Initial feature set

- Inbox
- Archive
- Trash
- read / unread
- star
- search
- attachments
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
- outbound sending, Compose, Reply, and Forward
- forwarding incoming mail to another mailbox
- conversation threading
- complex rules engine
- marketing email / bulk sending

## Cloudflare services

- Workers
- Effect (TypeScript backend/core)
- Email Routing
- Durable Objects with SQLite
- R2
- Cloudflare Access

## Reference implementation

The project is a new implementation. Cloudflare's official `cloudflare/agentic-inbox` project is used as an architectural and product reference for Cloudflare-native email flows.

## Documents

- [Product scope](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Technical stack](docs/TECH_STACK.md)
- [Local development](docs/LOCAL_DEVELOPMENT.md)
- [Security](docs/SECURITY.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)

## License

MIT. See `LICENSE`.
