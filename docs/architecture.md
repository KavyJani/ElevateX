# Architecture and trust boundaries

## Runtime

`apps/web` is the Next.js App Router client on port 3000. Relative `/api/v1/*` requests proxy to the NestJS API at port 3001. `packages/shared` provides the 24 investor/founder step schemas and their contextual INVESTO help. The API is a modular NestJS monolith with `/api/v1` routes, DTO validation, Swagger documentation and Prisma-generated PostgreSQL types. The app uses a dedicated external PostgreSQL DSN, `ELEVATEX_DATABASE_URL`; it does not repurpose the managed Webdev MySQL `DATABASE_URL`.

## Identity and access control

Public registration only creates investor or founder accounts. Each uses Argon2id password hashing, one-time email verification/reset tokens, rotating opaque sessions whose token hashes are persisted, HTTPS-compatible `HttpOnly; Secure; SameSite=None` cookies and a separate double-submit CSRF cookie. The backend determines applicant/admin roles from account records; public forms cannot assign ADMIN. Global and route-specific throttles limit requests. Suspended users lose all active sessions. A one-time CLI-only script provisions the first administrator and refuses to elevate an existing account or create another administrator.

Each protected resource is scoped to its server-authenticated owner, role or accepted connection. Admin actions write audit records and application history; self-review is denied. Applicant files require explicit owner and document permissions, per-file event logging and short-lived server-issued links. Founders must separately provide an optional public-only summary and explicit, unchecked consent before an admin can publish a startup. Private application answers, evidence, financials and contact data are not the public profile projection.

## Persistent services

Prisma schema and a version-controlled clean-install migration define application/account data, drafts, submissions, review history, private document indexes, preferences, discovery, watchlist, interest requests, connections, conversations, messages, meetings, notifications, financial records, forecast structures, AI history and audit events. Apply migrations only to an intentionally selected PostgreSQL database; development/test writes affect that database. Local Compose is convenience infrastructure, not an automatic production service.

Application and review state, messages/read status, interest requests, meetings/reschedules, notification events, owner-entered monthly financial records, versioned forecast inputs/results/shares and user-isolated INVESTO threads/messages are persisted when PostgreSQL is configured. Forecast sharing is a separate, revocable investor permission, gated by an accepted connection; it does not grant document access. Redis/BullMQ are not required for current synchronous routes and have not been integrated into job processing.

## External provider configuration

- **Email:** Registration verification, password reset and contact require an owner-configured endpoint accepting Bearer auth and JSON `{from,to,subject,text}`. The project provides no endpoint, provider key, sender or destination. Responses indicate delivery only after provider acceptance.
- **Managed storage:** Cloud uses server-only `MANUS_API_URL`/`MANUS_API_KEY` for authenticated managed object upload and temporary reads. Those values must never be exposed as `NEXT_PUBLIC_*`. File flows report unavailable rather than substituting local MinIO when these credentials are missing. Object deletion/retention is not guaranteed until the storage provider exposes a verified deletion contract.
- **INVESTO:** Server-side requests use the configured Manus OpenAI-compatible service. Static, step-specific help remains available when no AI credential/runtime is injected. User-isolated conversations/messages are persisted when PostgreSQL is configured. Selected computed forecast inputs/results are sent only after an explicit user consent action; owner-entered historical rows are excluded from that context. AI does not edit, verify, approve, reject or submit user data; usage quotas/accounting and streaming remain unimplemented.

## User-facing discovery

Public startup discovery returns only admin-approved, explicitly consented profile fields, with server-side filters, facets, sorting and pagination. Seed records are fictional, marked demo and excluded from database-backed platform statistics. No published preview or application credentials are assumed to exist. The APIs return honest unavailable/error states when external configuration is absent.

## Financial methodology and safety

The v2 scenario engine uses up to 36 owner-entered USD historical periods and explicitly supplied/derived latest baselines. Conservative/base/optimistic cases model gross margin, revenue or ARPC growth, customers after churn/new acquisitions, base expense growth, separately entered hiring/marketing, additional inflows/outflows and dated hypothetical funding. It persists assumptions, method version and calculated result snapshots; historical rows remain separately labeled from projections. Downside sensitivity returns its own ending-cash/runway comparison. Break-even is based on projected P&L; runway is the first modeled negative-cash month. Histories are unverified user input. Taxes, debt schedules, working capital and collection timing are not modeled. The engine never implies revenue establishes value or fabricates a valuation. The product has no investment execution, custody, money transfer or securities transaction flow. Verification wording is not a regulated certification. Privacy, legal and jurisdiction-specific disclosures require qualified review before production use.
