# Product Scope

## Problem

Small businesses and individuals often need a professional custom-domain email address but do not need a full Google Workspace, Microsoft 365, or iCloud mailbox subscription.

For many deployments the dominant workload is receiving B2B messages. Sending is occasional.

CF Inbox provides a lightweight Cloudflare-native inbox that can be deployed per client or domain.

## Target users

- one-person businesses
- small companies with a shared address
- consultants
- agencies managing client infrastructure
- developers with custom domains
- internal service addresses

## Primary use case

```text
partner -> person@company.com -> CF Inbox
                              -> optional Gmail forward
```

When sending is required:

```text
CF Inbox -> Cloudflare Email Service -> recipient
```

## Product principles

### Single tenant

One deployment represents one customer / trust boundary.

It can support:
- one primary mailbox
- aliases for the same owner

It does not support unrelated users sharing one deployment.

### Minimal administration

After deployment, configuration should be limited to:
- domain
- primary address
- allowed aliases
- Cloudflare Access
- optional forwarding address
- outbound sending toggle

### Receive-first

Receiving must work independently of sending.

This allows deployments where Cloudflare Email Service is not enabled.

### Portable deployment

There should be no project-specific client data in source code.

A new client should be deployable from the same repository using configuration.

## v1 functionality

### Mailbox
- Inbox
- Sent
- Archive
- Trash
- unread state
- star / important marker
- pagination
- basic search
- threads

### Message
- safe HTML rendering
- plain-text rendering
- headers
- attachments
- Reply
- Reply all
- Forward

### Compose
- To
- Cc
- Bcc
- Subject
- plain text
- attachments

### Operations
- optional inbound forwarding
- basic delivery error visibility
- observability without email-content logging

## Explicit non-goals

- arbitrary multi-user accounts
- organization management
- shared team permissions
- mailing lists
- transactional email API product
- newsletters
- AI auto-replies
- MCP
- calendar / contacts
- IMAP / POP
- running our own SMTP infrastructure
