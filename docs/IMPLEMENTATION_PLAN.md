# Implementation Plan

The coding agent should implement this in small verifiable milestones.

## Milestone 0 — repository bootstrap

Deliver:
- TypeScript
- Effect configured for backend/core
- Worker development environment
- frontend development environment
- Wrangler config template
- lint/typecheck/test scripts
- local environment documentation

Acceptance:
- local app loads
- Worker API endpoint responds
- a small Effect program executes through the Worker boundary
- typecheck passes

## Milestone 1 — production authentication

Implement Cloudflare Access validation first.

Deliver:
- Access JWT middleware
- local-development bypass that cannot activate accidentally in production
- fail-closed production behavior
- authenticated `/api/me` or equivalent health path

Tests:
- valid token
- missing token
- bad audience
- expired token
- invalid issuer

## Milestone 2 — Mailbox Durable Object

Deliver:
- singleton MailboxDO
- SQLite schema
- migrations
- message CRUD primitives
- folders: inbox, sent, archive, trash
- read/unread
- star
- pagination

Acceptance:
- messages can be inserted/read/moved/deleted without email integration

## Milestone 3 — inbound pipeline

Deliver:
- Email Routing handler
- destination validation
- MIME parsing using `postal-mime`
- normalized message persistence
- text and HTML body handling
- threading metadata

Tests should include real `.eml` fixtures.

Acceptance:
- test email appears in Inbox

## Milestone 4 — attachments

Deliver:
- R2 storage
- metadata table
- authenticated download endpoint
- safe filename handling
- inline attachment metadata

Acceptance:
- inbound PDF/image attachment can be opened/downloaded only when authenticated

## Milestone 5 — read-only inbox UI

Deliver:
- navigation
- inbox list
- message reading pane
- unread state
- archive/trash
- search
- attachment display
- responsive basic layout

At this point the product is useful for receive-only deployments.

## Milestone 6 — optional forwarding

Deliver:
- operator-configured forwarding destination
- forwarding toggle
- forwarding loop protections
- clear failure logging without content logging

Acceptance:
- inbound message is stored and a convenience copy reaches configured external mailbox

Storage remains authoritative even if forwarding fails.

## Milestone 7 — outbound send

Deliver:
- send_email binding integration
- Compose
- sender identity validation
- recipient limits
- size limits
- rate limits
- Sent persistence
- send error UI

Acceptance:
- message sent from configured custom-domain identity
- Sent copy exists

## Milestone 8 — Reply / Forward

Deliver:
- Reply
- Reply all
- Forward
- correct Message-ID
- In-Reply-To
- References
- thread grouping

Acceptance:
- replies appear in the same thread in common external email providers

## Milestone 9 — hardening

Deliver:
- HTML sanitization review
- remote image behavior
- CSP/security headers
- attachment security review
- API validation
- send abuse controls
- malformed MIME tests
- logging audit

Do not call v1 production-ready before this milestone.

## Milestone 10 — deployment UX

Deliver:
- clean `wrangler` configuration
- environment variable template
- deployment documentation
- optional deploy-to-Cloudflare flow
- simple repeatable per-client deployment process

Goal:
A new instance should require configuration, not source-code edits.

## Milestone 11 — v1 release

Deliver:
- README installation instructions
- screenshots
- architecture documentation
- security notes
- MIT license
- changelog/release notes
