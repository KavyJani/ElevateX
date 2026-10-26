# ElevateX delivery outcomes

- [ ] **PART 1 — PRODUCT VISION**

  ElevateX is a startup discovery, verification, and investor–founder connection platform.

  It helps founders present their startups, submit supporting documents, receive investor interest, and understand potential financial scenarios. Investors can discover startups, complete verification, express interest, review authorized information, and communicate with founders.

  The platform includes an AI assistant named **INVESTO**, which explains onboarding steps, answers relevant questions, summarizes authorized startup information, and explains financial forecasts.

  The application has three privileged roles:

  1. Investor.
  2. Founder.
  3. Admin.

  Public visitors can browse publicly available website content and approved startup profiles without registering.

  The initial version must support discovery, onboarding, verification, connections, communication, and financial scenario analysis. Do not enable real-money investment transactions, custody, or securities execution unless a suitable legal and compliance structure is established.

- [ ] **PART 2 — TECHNOLOGY STACK**

  Build the application using the following stack.

  ## Frontend
  - Next.js with TypeScript.
  - React.
  - Tailwind CSS.
  - Reusable custom React components.
  - A maintained charting library for interactive financial graphs.
  - Accessible form controls and responsive layouts.

  ## Backend
  - Node.js LTS.
  - NestJS.
  - TypeScript with strict type checking.
  - REST APIs under `/api/v1`.
  - OpenAPI/Swagger documentation.

  ## Database
  - PostgreSQL.
  - Prisma ORM.
  - Version-controlled database migrations.
  - PostgreSQL JSONB for appropriate flexible onboarding answers and AI outputs.

  ## Infrastructure
  - Redis and BullMQ for suitable background jobs.
  - Private S3-compatible object storage for documents.
  - Configurable email provider.
  - Configurable AI model provider.
  - Docker Compose for local development where practical.

  ## Testing
  - Jest.
  - Backend unit and integration tests.
  - End-to-end tests for critical workflows.
  - Authorization and security tests.

  Use a modular monolith architecture initially. Keep modules logically separated while maintaining a manageable deployment.

  Do not introduce unnecessary microservices or multiple databases.

- [x] **PART 3 — PROJECT SETUP**

  Create a clean project structure similar to:

  `elevatex/`
  - `apps/web/` — Next.js frontend.
  - `apps/api/` — NestJS backend.
  - `packages/shared/` — Shared types and validation schemas where appropriate.
  - `infra/` — Local development configuration.
  - `docs/` — Architecture and setup documentation.

  You may adjust the structure when justified, but keep the frontend and backend clearly organized.

  Provide:
  - Root package scripts.
  - Dependency installation instructions.
  - `.env.example` files.
  - Docker Compose configuration.
  - Database migrations.
  - A development seed script.
  - API documentation.
  - A README with exact setup commands.

  Never commit real API keys, production passwords, or sensitive credentials.

- [ ] **PART 4 — ORIGINAL DESIGN SYSTEM**

  Create the entire ElevateX interface from scratch.

  **DO NOT USE PREMADE DASHBOARD TEMPLATES, ADMIN PANEL STARTERS, OR GENERIC SAAS DASHBOARD DESIGNS.**

  Build all layouts, navigation, cards, tables, forms, progress indicators, charts, dialogs, and interactions specifically for ElevateX.

  ## Visual identity
  - Premium and professional fintech aesthetic.
  - Light theme: white with deep or royal blue accents.
  - Dark theme: midnight navy and slate with blue accents.
  - Clean typography.
  - Generous spacing.
  - Clear visual hierarchy.
  - Subtle animations.
  - Consistent border, radius, and spacing tokens.
  - Responsive desktop, tablet, and mobile experiences.
  - Accessible keyboard navigation, focus states, and color contrast.

  Avoid excessive gradients, neon colors, unnecessary glassmorphism, clutter, and decorative components that do not serve a purpose.

  Create reusable components that follow the original design system.

- [ ] **PART 5 — PUBLIC WEBSITE**

  Build a complete public website.

  ## Homepage
  Include:
  - Original hero section.
  - ElevateX introduction.
  - “Join as a Founder” and “Join as an Investor” actions.
  - How It Works.
  - Featured approved startups.
  - Trust and verification information.
  - Platform statistics.
  - Success Stories.
  - Contact section.
  - Footer with policy links.

  ## Explore Startups
  Implement:
  - Keyword and startup-name search.
  - Industry filters.
  - Stage filters.
  - Location filters.
  - Business-model filters.
  - Sorting.
  - Pagination.
  - Public startup detail pages.

  Only approved and publicly shareable information may appear.

  ## Success Stories
  Build a responsive success-story section or slider. Clearly label sample content and never invent real testimonials or investment outcomes.

  ## Platform Statistics
  Calculate statistics from actual database records. If development data is shown, label it as demo data.

  ## Public access
  Visitors must be able to browse public pages without creating an account.

- [ ] **PART 6 — AUTHENTICATION AND ROLE SECURITY**

  Implement secure registration and login for investors and founders.

  Required features:
  - Email verification.
  - Password hashing using Argon2id or an appropriate maintained implementation.
  - Password reset.
  - Secure sessions.
  - Logout and session revocation.
  - Rate limiting.
  - Input validation.
  - Protected API endpoints.
  - Server-side authorization.
  - Secure verification tokens.
  - Appropriate security-event logging.

  Use secure HTTP-only cookies for browser authentication where appropriate. Configure SameSite, Secure, and CSRF protection correctly.

  ## Three application roles

  `INVESTOR`, `FOUNDER`, `ADMIN`.

  The backend must enforce these roles using trusted server-side account records.

  Never trust a role submitted by the frontend.

  ## Admin exclusivity

  The platform owner must be the only initially provisioned administrator.

  - Do not create public admin registration.
  - Create the first admin through a protected, one-time setup or controlled seed command.
  - Require explicit configuration for initial provisioning.
  - Prevent ordinary users from changing their roles.
  - Protect every admin endpoint with server-side authorization.
  - Prevent users from approving their own applications.

- [ ] **PART 7 — INVESTOR ONBOARDING: 12 STEPS**

  Create a fully interactive, persistent, multi-step investor registration process.

  ### Step 1 — Account Creation
  Full legal name, email, verification, mobile number where applicable, password, country, and terms.

  ### Step 2 — Identity Verification
  Applicable identity and address information, document-type selection, secure upload, and explanation of requirements.

  ### Step 3 — Investor Category
  Individual investor, angel investor, venture capital fund, family office, or another configured category.

  Display relevant conditional fields.

  ### Step 4 — Professional Background
  Occupation, employer, designation, experience, and professional links.

  ### Step 5 — Previous Investment History
  Previous startup investments, count, years, industries, investment ranges, and optional evidence.

  Provide a valid first-time-investor path.

  ### Step 6 — Investment Capacity
  Intended investment amount, typical range, investment frequency, and personal versus managed capital.

  Clearly distinguish self-declared intentions from independently verified capacity.

  ### Step 7 — Financial Documents
  Secure upload for applicable income proofs, asset or net-worth evidence, financial statements, previous investment evidence, and organization documents.

  Show document purpose, accepted formats, size limits, progress, validation, and retry states.

  Never request bank passwords or PINs.

  ### Step 8 — Investment Preferences
  Industry, startup stage, region, investment range, business model, and relevant expertise.

  ### Step 9 — Experience and Risk
  Explain startup risks, potential loss, illiquidity, and applicable eligibility declarations.

  ### Step 10 — Affiliations and Conflicts
  Relevant affiliations, organizational relationships, and potential conflicts.

  ### Step 11 — Declarations and Consent
  Terms, privacy information, verification consent, accuracy declaration, and communication preferences.

  Do not preselect legally meaningful consent checkboxes.

  ### Step 12 — Review and Submit
  Show the complete application summary, missing information, document status, editable sections, and final confirmation.

  Investor statuses:

  `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `MORE_INFORMATION_REQUIRED`, `APPROVED`, `REJECTED`.

- [ ] **PART 8 — FOUNDER ONBOARDING: 12 STEPS**

  Create a separate fully interactive founder registration process.

  ### Step 1 — Founder Account
  Name, email, verification, mobile number where applicable, and password.

  ### Step 2 — Startup Identity
  Name, logo, tagline, website, headquarters, country, founding date, and legal status.

  Support eligible idea-stage and unincorporated startups.

  ### Step 3 — Industry and Business Stage
  Industry, business model, development stage, region, and team size.

  Support idea, prototype, MVP, revenue-generating, seed, and growth stages.

  ### Step 4 — Problem and Solution
  Problem, target users, solution, differentiation, existing alternatives, and supporting evidence.

  ### Step 5 — Market and Customers
  Target audience, customer segments, geography, market-size assumptions, sources, competitors, and acquisition strategy.

  ### Step 6 — Business and Revenue Model
  Revenue streams, pricing, sales channels, partnerships, and validation.

  ### Step 7 — Traction and Sales
  Users, paying customers, revenue, growth period, retention, and supporting evidence.

  Provide a pre-revenue option that removes irrelevant mandatory sales requirements.

  ### Step 8 — Founder and Team
  Founder roles, co-founders, experience, skills, and team structure.

  Support solo founders.

  ### Step 9 — Funding Requirements
  Funding amount, currency, stage, use of funds, prior funding, and relevant instrument information.

  ### Step 10 — Company and Legal Documents
  Applicable registration, tax, ownership, authorization, and supporting documents.

  ### Step 11 — Pitch Deck and Financial Evidence
  PDF pitch deck, financial statements or summaries, sales evidence, traction reports, and relevant supporting files.

  ### Step 12 — AI Review and Submission
  Startup summary, extracted information, missing fields, apparent inconsistencies, document checklist, correction controls, and accuracy declaration.

  Founder statuses:

  `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `MORE_INFORMATION_REQUIRED`, `VERIFIED`, `REJECTED`.

  Do not require sales evidence from idea-stage startups.

- [ ] **PART 9 — EVERY ONBOARDING STEP MUST BE INTERACTIVE**

  This requirement applies to all 24 onboarding steps.

  Do not render 24 static pages with different titles. Implement real input controls, navigation, state, validation, and backend persistence.

  Each step must contain:
  - ElevateX branding.
  - Current step title.
  - Short explanation.
  - Progress indicator.
  - Main form.
  - INVESTO help panel.
  - Back button.
  - Continue button.
  - Save and Exit.
  - Autosave status.
  - Validation feedback.

  Use appropriate interactive controls:
  - Clickable cards.
  - Radio buttons.
  - Checkboxes.
  - Searchable multi-selects.
  - Numeric and currency inputs.
  - Date pickers.
  - Text areas.
  - Conditional fields.
  - Repeatable field groups.
  - Drag-and-drop uploads with file-picker fallback.
  - Reviewable AI suggestions.
  - Confirmation dialogs where appropriate.

  ### Navigation
  - Back works without losing saved answers.
  - Continue validates the current step.
  - Invalid required fields prevent progression.
  - Completed steps can be revisited.
  - Future steps cannot bypass mandatory validation.
  - Conditional fields update dynamically.
  - Save and Exit persists progress.
  - Reloading restores saved drafts.
  - Final submission cannot be accidentally duplicated.

  ### Autosave
  Implement debounced backend autosave.

  Show:
  - Saving.
  - Saved.
  - Unable to save.

  Preserve user input when saving fails and allow retries.

  Never display “Saved” until the backend confirms persistence.

- [ ] **PART 10 — INVESTO AI ASSISTANT**

  Build INVESTO as a real, contextual AI assistant.

  Tagline: **“Your AI guide to smarter startup decisions.”**

  ## Interface
  Implement:
  - Floating chatbot launcher.
  - Dedicated chat page.
  - Slide-out desktop panel.
  - Mobile-friendly full-screen interface.
  - Persistent conversations.
  - Suggested prompts.
  - Context-aware follow-ups.
  - Copy response.
  - New conversation.
  - Loading, retry, and error states.
  - Streaming responses where supported.

  ## Founder capabilities
  INVESTO can:
  - Explain onboarding fields.
  - Improve startup descriptions.
  - Explain business and financial terminology.
  - Interpret sales and traction.
  - Explain burn rate and runway.
  - Explain financial forecasts.
  - Identify missing information.
  - Prepare founders for investor meetings.

  ## Investor capabilities
  INVESTO can:
  - Summarize permitted startup profiles.
  - Explain business models.
  - Interpret historical financial information.
  - Explain forecast assumptions.
  - Identify missing information.
  - Suggest due-diligence questions.
  - Explain startup risks and valuation uncertainty.

  ## Real AI integration
  Implement a provider-independent AI service.

  When a provider is configured:
  - Send real requests.
  - Return actual provider responses.
  - Handle timeouts and rate limits.
  - Validate outputs.
  - Enforce usage limits.
  - Persist conversation history securely.

  If the AI provider is unavailable, display a clear message and offer the configured static help content.

  Do not fabricate AI answers or pretend that an unconfigured provider is connected.

- [ ] **PART 11 — FIX INVESTO GUIDANCE ON ALL 24 STEPS**

  This feature is mandatory.

  Every investor and founder onboarding step must have its own contextual help configuration.

  Display a panel titled **“INVESTO explains”** containing:
  1. What the current step means.
  2. Why the information is requested.
  3. What the user should enter or upload.
  4. A simple example.
  5. Common mistakes.
  6. An Ask INVESTO follow-up interaction.

  ### Investor guidance topics
  1. Account creation.
  2. Identity verification.
  3. Investor categories.
  4. Professional background.
  5. Previous investments and first-time-investor alternatives.
  6. Intended investment capacity.
  7. Financial documents and privacy.
  8. Investment preferences.
  9. Risk and eligibility.
  10. Affiliations and conflicts.
  11. Declarations and consent.
  12. Reviewing and submitting the application.

  ### Founder guidance topics
  1. Founder account.
  2. Startup identity and unincorporated businesses.
  3. Industry and business stage.
  4. Problem and solution.
  5. Market, customers, and sources.
  6. Business and revenue model.
  7. Traction and pre-revenue alternatives.
  8. Founder and team.
  9. Funding requirements.
  10. Company documents.
  11. Pitch deck and financial evidence.
  12. Reviewing extracted information and submitting.

  ### Context behavior
  INVESTO must know the current authenticated role, current step, relevant field descriptions, configured requirements, and necessary authorized application context.

  If the founder asks “What if I have no sales yet?” on step 7, INVESTO must answer specifically for pre-revenue startups.

  Do not return generic unrelated chatbot responses.

  Use server-side help configuration for all 24 steps. Show static explanations immediately and use AI for follow-up questions.

  The onboarding process must remain functional when the AI service is unavailable.

  AI may suggest wording, but the user must explicitly review and accept it before it changes an answer. Never silently modify declarations, financial information, consent, or submissions.

- [ ] **PART 12 — CUSTOM FOUNDER DASHBOARD**

  Build an original founder dashboard with:
  - Overview.
  - Verification status.
  - Startup profile.
  - Application feedback.
  - Document management.
  - Funding requirements.
  - Investor interest requests.
  - Connections.
  - Messaging.
  - Meetings.
  - Startup updates.
  - Financial records.
  - Forecast graphs.
  - INVESTO.
  - Settings and security.

  Load data from real backend APIs.

  Provide useful empty states for new founders.

- [ ] **PART 13 — CUSTOM INVESTOR DASHBOARD**

  Build an original investor dashboard with:
  - Overview.
  - Verification status.
  - Startup discovery.
  - Search and filters.
  - Saved startups.
  - Investor preferences.
  - Interest requests.
  - Founder connections.
  - Messaging.
  - Meetings.
  - Shared documents.
  - Shared financial forecasts.
  - Investment history.
  - INVESTO.
  - Settings and security.

  Unverified investors may access permitted public information but must not gain restricted document access or prohibited investment functionality.

- [ ] **PART 14 — EXCLUSIVE ADMIN DASHBOARD**

  Build an original administrative dashboard for the platform owner.

  Include:
  - Pending investor applications.
  - Pending founder applications.
  - Under-review applications.
  - Applications requiring additional information.
  - Approved and rejected applications.
  - Document review.
  - AI summaries and flags.
  - Application decision history.
  - User management.
  - Account suspension and reactivation.
  - Platform statistics.
  - Security events.
  - Audit logs.

  Allow authorized admins to approve, reject with a reason, or request additional information.

  Every decision must persist in the database and create an audit record.

  AI may assist review but must never independently approve or reject applicants.

- [ ] **PART 15 — SECURE DOCUMENT STORAGE**

  Store file contents in private object storage and document metadata in PostgreSQL.

  Support identity documents, income proofs, asset proofs, company registration documents, pitch decks, financial statements, and sales evidence.

  Implement:
  - File type and size validation.
  - File signature checks where appropriate.
  - Malware scanning where available.
  - Private storage.
  - Short-lived access links or authenticated file delivery.
  - Access revocation.
  - Document versioning.
  - Review status.
  - Access logs.
  - Retention and deletion workflows.

  Check permissions on every document request.

  Founders must explicitly share confidential documents with selected investors. An accepted connection must not automatically expose every file.

  Do not promise that screenshots can be completely prevented.

- [ ] **PART 16 — STARTUP DISCOVERY AND CONNECTIONS**

  Implement:
  - Public approved startup listings.
  - Search and filters.
  - Startup detail pages.
  - Investor watchlists.
  - Interest requests.
  - Founder acceptance or rejection.
  - Authorized connections.
  - Messaging eligibility.

  Prevent duplicate requests and invalid state transitions.

  Never return confidential startup information from public endpoints.

- [ ] **PART 17 — MESSAGING, MEETINGS, AND NOTIFICATIONS**

  Implement persistent:
  - Conversations.
  - Messages.
  - Read status.
  - Unread counts.
  - Meeting requests.
  - Accept, decline, cancel, and reschedule.
  - Time-zone-aware scheduling.
  - In-app notifications.
  - Email notifications through a configured provider.

  Authorize every conversation and message request.

  Do not simulate message delivery or claim an email was sent when the provider is unavailable.

- [ ] **PART 18 — FINANCIAL FORECASTING ENGINE**

  Build a deterministic financial engine in TypeScript. INVESTO explains the calculations; it does not invent the numbers.

  ## Inputs
  Support relevant data including:
  - Historical revenue.
  - Operating expenses.
  - Gross profit.
  - Net profit or loss.
  - Cash balance.
  - Cash inflows and outflows.
  - Customer counts.
  - Average revenue per customer.
  - Churn where applicable.
  - Hiring and marketing costs.
  - Funding assumptions.

  ## Graphs
  Implement interactive graphs for:
  1. Revenue forecast.
  2. Profit and loss.
  3. Cash flow.
  4. Cash burn and runway.
  5. Break-even estimates where supported.
  6. Valuation scenarios where a defensible methodology is available.
  7. Downside sensitivity analysis.

  ## Scenarios
  Generate:
  - Conservative.
  - Base.
  - Optimistic.

  Allow users to adjust assumptions and recalculate forecasts.

  Show historical versus projected values, units, periods, assumptions, methodology, and uncertainty.

  If historical data is insufficient, use explicitly labeled assumption-driven scenarios rather than pretending the model can predict a startup's future reliably.

  ## Valuation
  Do not equate revenue with valuation.

  Calculate valuation scenarios only when a defensible method and its assumptions are supplied. Show the methodology and label estimates as hypothetical.

  Do not invent industry multiples or guaranteed future valuations.

  ## Forecast explanations
  Pass the actual computed results to INVESTO. It must explain the assumptions and risks behind the scenario.

  Store versioned forecast inputs, methodology, results, and creation timestamps.

- [ ] **PART 19 — FINANCIAL FORECAST SHARING**

  Allow founders to share selected forecasts with selected authorized investors.

  Implement:
  - Private forecasts.
  - Explicit sharing.
  - Revocation.
  - Access validation.
  - Sharing history.

  Keep forecast access separate from document access.

  Do not expose confidential forecasts publicly or automatically share them upon connection.

- [ ] **PART 20 — DATABASE MODELS**

  Create appropriate PostgreSQL models for:

  - User.
  - Session.
  - InvestorProfile.
  - FounderProfile.
  - Startup.
  - InvestorApplication.
  - FounderApplication.
  - ApplicationStatusHistory.
  - Document.
  - DocumentAccessGrant.
  - DocumentAccessEvent.
  - VerificationReview.
  - InvestorPreference.
  - WatchlistEntry.
  - InterestRequest.
  - Connection.
  - Conversation.
  - ConversationParticipant.
  - Message.
  - MeetingRequest.
  - Notification.
  - AIConversation.
  - AIMessage.
  - FinancialRecord.
  - FinancialAssumption.
  - ForecastScenario.
  - ForecastResult.
  - ForecastShare.
  - AuditLog.

  Use Prisma migrations, foreign keys, indexes, unique constraints, timestamps, and appropriate deletion policies.

  Use JSONB only where flexible structured data is justified.

  Use transactions for multi-record operations that must remain consistent.

- [ ] **PART 21 — BACKEND API**

  Create REST endpoints under `/api/v1`.

  Route groups should include:
  - `/auth`
  - `/users`
  - `/investor-applications`
  - `/founder-applications`
  - `/startups`
  - `/documents`
  - `/admin/applications`
  - `/admin/users`
  - `/connections`
  - `/conversations`
  - `/messages`
  - `/meetings`
  - `/notifications`
  - `/ai`
  - `/ai/onboarding-help`
  - `/financial-records`
  - `/forecasts`
  - `/forecast-shares`
  - `/health`

  Implement request validation, authorization, pagination, filtering, standardized errors, and API documentation.

  Document permissions for every protected endpoint.

- [ ] **PART 22 — SECURITY AND PRIVACY**

  Implement:
  - Secure authentication.
  - Server-side role and resource authorization.
  - Rate limiting.
  - CSRF protection where applicable.
  - Input validation.
  - Protection against insecure direct object references.
  - Private file storage.
  - Secure secret management.
  - Audit trails.
  - Consent records.
  - Data-retention and deletion policies.
  - Sensitive-data redaction in logs.
  - Appropriate handling of personal and financial information.

  Do not send confidential documents to third-party AI services unless the configured provider, privacy disclosures, and permissions allow it.

  Configure jurisdiction-specific document requirements instead of assuming one set of rules applies to everyone.

  Keep live investment transactions, custody, and money transfers disabled until the required legal and compliance structure is established.

- [ ] **PART 23 — FRONTEND INTEGRATION**

  Connect every frontend feature to the real backend.

  Replace fake success handlers, hardcoded application states, mock chat responses, and decorative financial graphs for implemented functionality.

  Integrate:
  - Authentication.
  - Both onboarding journeys.
  - Conditional fields.
  - Autosave.
  - Draft restoration.
  - Document uploads.
  - Application submission.
  - Admin decisions.
  - Discovery.
  - Connections.
  - Messaging.
  - Meetings.
  - Notifications.
  - INVESTO.
  - All 24 contextual help configurations.
  - Financial records.
  - Forecast generation.
  - Interactive graphs.
  - Forecast sharing.

  Every visible interactive control must perform its intended action.

  Display loading, error, empty, success, and retry states.

  Never claim success until the backend confirms it.

- [ ] **PART 24 — TESTING AND ACCEPTANCE CRITERIA**

  Verify that:

  1. The project builds from a clean checkout.
  2. The database initializes through documented migrations.
  3. Investor registration and login work.
  4. Founder registration and login work.
  5. Public admin registration does not exist.
  6. All 12 investor onboarding steps work.
  7. All 12 founder onboarding steps work.
  8. All 24 steps have appropriate interactive fields and contextual help.
  9. Drafts persist after refresh and re-login.
  10. Conditional fields and validation work.
  11. Document uploads persist and remain private.
  12. INVESTO uses a real configured AI provider or clearly reports unavailability.
  13. INVESTO understands the current role and onboarding step.
  14. Static guidance remains available when AI is unavailable.
  15. Conversations remain isolated between users.
  16. Admin approval and rejection work and create audit records.
  17. Unauthorized users cannot access private applications or documents.
  18. Startup discovery only returns appropriate approved records.
  19. Messaging and connection records persist.
  20. Forecasts use actual backend calculations.
  21. Graphs update when assumptions change.
  22. Valuation scenarios disclose assumptions and methods.
  23. Confidential forecasts require explicit sharing.
  24. Desktop and mobile layouts work.
  25. Critical authorization rules have automated tests.

- [ ] **PART 25 — REQUIRED DELIVERABLES**

  Produce:
  - Complete frontend source code.
  - Complete backend source code.
  - Database schema.
  - Prisma migrations.
  - Development seed script.
  - Environment variable examples.
  - Docker Compose configuration where practical.
  - API documentation.
  - INVESTO integration.
  - Contextual guidance for all 24 steps.
  - Financial forecasting engine.
  - Private document storage integration.
  - Automated tests.
  - Setup and execution instructions.
  - A list of external services requiring credentials.
  - A list of implemented features and known limitations.

- [ ] **PART 26 — IMPLEMENTATION ORDER**

  Build and verify in phases:

  1. Project scaffolding and repository structure.
  2. Database, schema, and migrations.
  3. Authentication and role authorization.
  4. Investor onboarding.
  5. Founder onboarding.
  6. Contextual INVESTO help for all 24 steps.
  7. Document storage and verification.
  8. Admin review workflow.
  9. Startup discovery and connections.
  10. Messaging, meetings, and notifications.
  11. Real INVESTO AI integration.
  12. Financial records and forecasting.
  13. Forecast-sharing permissions.
  14. Complete frontend integration.
  15. Testing, security checks, and documentation.

  Run relevant tests after each phase and fix failures before moving forward.

  If implementation cannot be completed in one run, continue from the actual repository state rather than restarting or falsely claiming completion.

  # FINAL INSTRUCTION

  Build ElevateX completely from scratch as a custom-designed, full-stack application with a functioning frontend, backend, PostgreSQL database, secure authentication, three role-specific dashboards, 24 interactive onboarding steps, INVESTO AI, contextual guidance, secure documents, startup discovery, connections, messaging, and financial forecasting.

  Do not use premade dashboards. Do not deliver only UI mockups. Do not fabricate AI responses, financial figures, or successful operations.

  Implement, integrate, test, and document the actual application. Clearly disclose any external service that remains unconfigured.
- [ ] **Final delivery constraints**

  Build ElevateX completely from scratch as a custom-designed, full-stack application with a functioning frontend, backend, PostgreSQL database, secure authentication, three role-specific dashboards, 24 interactive onboarding steps, INVESTO AI, contextual guidance, secure documents, startup discovery, connections, messaging, and financial forecasting.

  Do not use premade dashboards. Do not deliver only UI mockups. Do not fabricate AI responses, financial figures, or successful operations.

  Implement, integrate, test, and document the actual application. Clearly disclose any external service that remains unconfigured.
