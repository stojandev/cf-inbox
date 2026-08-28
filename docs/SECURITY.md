# Security Model

Email is hostile input.

CF Inbox must be designed as an internet-facing security-sensitive application.

## Trust boundary

One deployment is one trust boundary.

Cloudflare Access is the authentication boundary for all browser/API access.

Production deployments must **fail closed** if Access validation is not configured correctly.

## Authentication

Required:
- validate Cloudflare Access JWT
- verify issuer/team domain
- verify audience
- reject expired tokens
- reject missing tokens in production
- use the `Cf-Access-Jwt-Assertion` header rather than relying on the browser cookie
- constrain the signing algorithm to RS256 and fetch keys only from the configured `*.cloudflareaccess.com` origin

Do not implement username/password authentication in v1.

The local bypass requires development mode, an HTTP request, and a loopback hostname. Missing or invalid Access configuration on any other origin returns an error before application routes run.

## Authorization

Because v1 is single-tenant:
- authenticated users of the deployment can access the mailbox
- there is no per-message or per-mailbox RBAC

Do not add multiple unrelated customers to one deployment.

## Email HTML

Inbound HTML is untrusted.

Requirements:
- sanitize before rendering
- prohibit script execution
- strip dangerous event attributes
- block unsafe URLs
- render in a constrained container
- do not allow email HTML to escape application styles
- consider disabling remote images by default

Never render raw HTML directly with an unsanitized `innerHTML`.

## Attachments

Requirements:
- R2 bucket remains private
- attachment access requires authentication
- sanitize filenames
- send explicit `Content-Type`
- use safe `Content-Disposition`
- prevent path/key injection
- enforce maximum message/attachment sizes
- never execute attachment content

## Logging

Never log:
- full email bodies
- attachment data
- Cloudflare Access JWTs
- secrets
- authentication headers

Allowed operational logs:
- message internal ID
- sender domain or address hash where useful
- recipient identity
- operation result
- size
- latency
- error category

## Secrets

Secrets belong in Worker secrets / Cloudflare configuration.

Never commit real domains, credentials, or API tokens.

## Database safety

Use parameterized queries.
Avoid dynamically constructed SQL based on user input.
Migrations must be explicit and versioned.

## Message parsing

Do not implement MIME parsing manually.

Use a maintained parser and add tests for:
- multipart/alternative
- multipart/mixed
- nested multipart
- malformed headers
- Unicode subjects/names
- inline images
- duplicate headers
- large inputs

## Threats to test

Before v1 release:
- XSS in HTML email
- malicious SVG/HTML attachment
- forged From headers
- malformed MIME
- attachment filename traversal
- oversized message
- unauthorized attachment access
- Access JWT bypass
- cross-origin API calls
