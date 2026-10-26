# ElevateX implementation plan

## Product and implementation

Deliver an original, responsive startup discovery and investor–founder platform. Keep the requested frontend and backend as separate applications in a modular monorepo: Next.js/React/TypeScript/Tailwind in `apps/web`, NestJS/TypeScript REST API in `apps/api`, shared domain/validation code in `packages/shared`, and `infra`/`docs` for reproducible local setup, security and API guidance. PostgreSQL is accessed through an explicit external `ELEVATEX_DATABASE_URL` with Prisma schema and versioned migrations. The managed Webdev database provisioned for this project is MySQL-compatible and must not be treated as PostgreSQL. PostgreSQL-backed flows are unavailable until a compatible external Postgres URL is configured. The project also records the managed platform’s real service capabilities separately; never fabricate an integration when its runtime credential/provider is absent.

Implement by product boundary: public pages and approved startup discovery; self-managed investor/founder account and application state; 24 schema-driven step definitions with distinct content and role-aware contextual INVESTO guidance; protected admin review/audit boundaries; documents with explicit sharing; connection, messaging, meeting and notification modules; deterministic financial assumptions and scenario calculations; and provider-independent AI, email and object-storage adapters. Add Prisma data models, validation, role/resource guards, migrations/seeds, endpoint documentation, environment examples, Docker Compose and automated checks. No real-money execution, custody, securities trading or money transfer. External credentials and compliance-dependent operations remain explicitly disclosed. Do not claim database persistence, file delivery or email delivery until the actual configured service confirms it.

### Project structure

- `apps/web/`: Next.js App Router public pages, account journeys, dashboards, discovery, INVESTO and forecast visualizations.
- `apps/api/`: NestJS modules for auth, applications, startups, documents, admin, connections, messages, meetings, notifications, AI and forecasts; REST v1 and OpenAPI.
- `packages/shared/`: TypeScript domain enums, request/response types and validation contracts shared where safe.
- `infra/`: Docker Compose and local Postgres/service wiring.
- `docs/`: exact setup and credential matrix, architecture/security, API permissions and limitations.
- Root workspace files: scripts, strict TS/lint/test/build configuration, `.env.example`, Prisma schema/migrations and development seed.

## Design

Three possible directions considered: restrained institutional blue-chip editorial fintech (0.07); warm founder-journal with paper and cobalt annotations (0.04); dark venture research-terminal with compact market data (0.08). **Choose the first**: it aligns with the requested premium fintech identity while keeping investor diligence legible.

- **Design Movement:** Contemporary editorial fintech, closer to a carefully typeset annual report than a generic SaaS dashboard.
- **Core Principles:** Evidence before claims; calm hierarchy; founder and investor needs stay distinct; disclosures are visible at the decision point.
- **Color Philosophy:** Warm-white canvas and ink navy establish clarity and trust; a saturated royal-cobalt accent signals verified actions and links, while restrained sage/amber are reserved for status meaning. Dark mode uses midnight navy and slate, never neon.
- **Layout Paradigm:** Asymmetric editorial hero with a narrow context rail and wide content field; startup stories read as individual research cards, while dashboard work areas use clear left navigation and task-specific panels.
- **Signature Elements:** An upward “X”/meeting-lines brand mark; cobalt verification rule; small data-source and “demo” labels integrated into cards.
- **Interaction Philosophy:** Direct, reversible, and explicit. Save status reflects server confirmation; access-sharing and consent require intentional action; keyboard focus remains visible.
- **Animation:** Subtle 160–220 ms opacity/position transitions for drawers and state changes; no scroll hijacking or looping decoration; respect reduced-motion preferences.
- **Typography System:** Inter (or system sans fallback) for UI and data; a restrained editorial serif such as Newsreader for selected homepage headlines only; tabular numerals for financial data. Strong size/weight contrast, never tiny low-contrast labels.
- **Brand Essence:** A trusted workspace where early-stage teams become easier to evaluate and connect with; **clear, discerning, constructive**.
- **Brand Voice:** Specific, measured, and transparent; no investment promises. Examples: “Make the next conversation count.” “Every signal has a source—and every forecast has assumptions.”
- **Wordmark & Logo:** Custom text wordmark paired with a compact cobalt X formed from two ascending/connecting strokes; no generic fintech icon.
- **Signature Brand Color:** Elevate cobalt `#2457D6`.

## Application behavior and boundaries

Use server-side validation and authorization for protected resources, and explicit public projections for approved profiles. Keep applications, documents, forecasts, messages and private sharing separate by authorization scope. Onboarding definitions drive navigation/progress and per-step explanatory guidance, but every legally meaningful declaration stays unselected until the user chooses it. AI is an explanatory assistant, not a source of fabricated startup facts, financial outputs or admin decisions. Forecast engine v2 uses up to 36 owner-entered USD periods, labels actuals separately from conservative/base/optimistic projections, and models gross margin, revenue/ARPC growth, churn/new customers, expense growth, separate hiring/marketing, additional inflows/outflows, dated hypothetical funding, break-even/runway and computed downside cash sensitivity. Versions are private until a founder explicitly shares one with a verified connected investor; access can be revoked. It does not model taxes, debt, working capital or collections and does not calculate valuation. Investor capacity remains self-declared unless separately verified. Email, AI and object storage integrations are adapters, never simulated successes.

## Infrastructure and constraints

- API: NestJS on Node LTS, strict TypeScript, REST `/api/v1`, Swagger/OpenAPI, security guards, throttling, validation and standardized errors.
- Data: Prisma and PostgreSQL. Configure an external PostgreSQL service via documented `ELEVATEX_DATABASE_URL`; platform-managed DB is MySQL-compatible and is not interchangeable. Migrations must be additive and deterministic.
- Jobs: Redis/BullMQ are documented for future suitable background work but are not integrated; current API requests run synchronously. File storage: authenticated managed private object storage adapter in Cloud; external/local S3-compatible alternatives are not silently substituted. Email: provider adapter. AI: platform OpenAI-compatible endpoint only when its documented runtime variables are present, otherwise report unavailable and retain static help.
- UI: Next.js/React/Tailwind, maintained chart library, accessible responsive page layouts and keyboard interactions.
- Test strategy: Jest for unit and API modules; authorization and deterministic forecast coverage; e2e paths where the services can be configured. Tests must not write to shared production data.
- Compliance: no investment transaction, custody, securities execution, money movement, or independent AI approval. Jurisdiction-specific requirements are configurable and not presumed.

## Implementation workflow

1. Establish the workspace, design tokens, route manifest, root scripts and code diagnostics.
2. Implement public experience and public-only approved startup discovery.
3. Add shared types, Prisma schema/migrations and NestJS API foundations.
4. Implement secure account/role boundaries and both persistent onboarding paths with step-level help.
5. Implement admin review/audit, private documents/shares, connections, conversations, meetings and notifications.
6. Implement deterministic forecasts, interactive chart controls, versioning and explicit forecast shares.
7. Connect INVESTO to a real configured provider with timeouts/errors, static step-specific guidance and no fake answers.
8. Add setup/API/security/credential docs and tests; build, run available checks and start Preview.

Project is a new empty managed Webdev workspace with server and managed MySQL-compatible database capability provisioned. The requested PostgreSQL and NestJS source architecture is retained; do not silently swap either. Email and private S3 credentials are not assumed. Any feature not verifiable without its service/configuration must be reported accurately.
