# cf-inbox

Lightweight self-hosted email inbox built entirely on Cloudflare.

> This project is in its initial planning stage. No application code has been added yet.

## Technical direction

The backend and core logic will use TypeScript with [Effect](https://effect.website/) for:

- typed errors
- service and dependency boundaries
- email processing pipelines
- Durable Object, R2, and Email Service interactions
- retries and failure handling where appropriate
- configuration and validation
- observability-friendly execution

Effect is intentionally scoped to the backend and core logic. The frontend can remain standard React with TypeScript. The goal is a reliable, strongly structured backend without unnecessary abstraction or overengineering.
