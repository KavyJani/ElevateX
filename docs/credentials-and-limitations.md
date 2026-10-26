# External services, credentials and known limitations

## External configuration

- **PostgreSQL 15+:** The owner must provision a PostgreSQL database and set `ELEVATEX_DATABASE_URL`. The managed Webdev database is MySQL-compatible and is not passed to the Prisma PostgreSQL client. Review and apply the committed migration to the intended database.
- **Email:** `ELEVATEX_EMAIL_API_URL`, `ELEVATEX_EMAIL_API_KEY`, `ELEVATEX_EMAIL_FROM` and, for contact delivery, `ELEVATEX_CONTACT_TO` must be configured. `ELEVATEX_PUBLIC_ORIGIN` must be the real HTTPS origin used in verification/reset links. The adapter posts Bearer-authenticated `{from,to,subject,text}` JSON; an endpoint with another contract needs an explicit adapter change.
- **Managed Storage and AI:** Cloud provides server-only `MANUS_API_URL`/`MANUS_API_KEY` for managed private file storage and the LLM service. They are not client-side variables. Local executions without them report service unavailable; Compose MinIO is not treated as a fake fallback.
- **Initial administrator:** only a trusted one-time CLI invocation can run `pnpm db:seed-admin`, with `ELEVATEX_ALLOW_ADMIN_BOOTSTRAP=true`, `ELEVATEX_ADMIN_EMAIL`, `ELEVATEX_ADMIN_NAME` and a 16+ character password. It refuses existing admins and refuses to promote an existing ordinary user. Remove bootstrap values immediately.

Do not put production secrets in source control, `NEXT_PUBLIC_*` variables, logs or public build arguments. The repository includes placeholders only, not service credentials.

## Implemented behaviors

The project currently includes role-limited registration/login, verification/reset-token flows, hashed revocable sessions, CSRF checks, throttles, server-owned sequential onboarding drafts, admin application and document decisions, audit records, explicit public-listing consent, private storage adapters, approved-only discovery, admin-approved investor application gates for interest requests, accepted connections and shared-forecast access, connection-gated persisted chat messages, timezone-aware meeting invitations/responses, owner-scoped notifications, owner-private financial records, and versioned deterministic scenarios with explicit revocable connected-investor shares. Users may separately consent to send a selected computed scenario to INVESTO for explanation; historical financial rows are excluded from that AI context.

## Remaining limitations

- Registration, verification, password reset and contact cannot operate until an email provider and public origin are configured. No provider is bundled or claimed.
- No PostgreSQL service/credentials are included; protected persistent API routes return an explicit configuration error when the DSN is absent.
- Private object bytes need the managed Cloud storage service. Soft deletion revokes database access but does not guarantee physical object erasure; the provider deletion contract and a retention policy still need approval.
- Redis/BullMQ job queues are not integrated. Current API work runs synchronously.
- INVESTO stores user-isolated conversation/message history and can restore the signed-in user’s threads. Streaming, usage quotas/accounting and a dedicated support workflow are not implemented. No AI response is fabricated when the provider is unavailable; static contextual onboarding guidance remains.
- Forecast engine v2 stores versioned inputs/results and up to 36 months of owner-entered historical financial records. Scenarios are private by default; explicit version-level sharing is limited to an active, email-verified investor with an admin-approved application and an accepted connection, and can be revoked. Values are USD, owner-entered and not independently verified. Taxes, debt schedules, working capital and collection timing remain outside the model; no valuation is calculated.
- Automated coverage remains focused and is not a complete end-to-end or production security certification. Perform a security, privacy, email-sender and jurisdiction review before external use.
- Sample startup stories, example cards and seed records are fictional demo material, not actual companies, testimonials, endorsements or outcomes. No guaranteed valuation or investment result is stated.
- There is no custody, payment, money transfer, investment execution or securities trading.
