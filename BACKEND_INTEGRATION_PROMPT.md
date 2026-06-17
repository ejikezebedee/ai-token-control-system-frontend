# Backend Integration Prompt for Emeka

Emeka, connect and configure the backend for the **AI Token Control System** frontend. Treat the current React + TypeScript + Vite app as the source of truth for the user experience and wire every view, component, action, and state to real backend services without changing the product scope or adding fake claims.

## Non-Negotiable Scope

- Keep the frontend app structure intact unless a backend contract requires a small typed adjustment.
- Replace mock services with real API calls behind the same function names where possible.
- Do not expose API keys in the browser.
- Do not run AI model calls from the client.
- Do not collect card data inside the frontend.
- Keep PayPal.me and Stripe donation flows as outbound/provider-owned experiences unless a verified hosted checkout flow is configured.
- Preserve empty, loading, success, error, and saved states across every section.

## Frontend Contracts to Wire

Start with:

```text
src/types/contracts.ts
src/services/mockAiTokenControl.ts
```

Replace these mock functions with backend-backed implementations:

```ts
analyzeInput(request)
compressContext(request)
filterRelevance(request)
generateExecutionPlan(request)
getSavedRuns()
```

Keep or extend these TypeScript contracts:

```ts
AnalysisRequest
AnalysisResult
TokenEstimate
WasteFinding
CompressionResult
RelevanceSection
ExecutionPlanStep
SavedRun
ModelPricing
```

## Required Backend Capabilities

Build API endpoints for:

1. `POST /api/analysis`
   - Accepts `AnalysisRequest`.
   - Returns a complete `AnalysisResult`.
   - Must calculate or estimate input tokens, output budget, optimized input tokens, saved tokens, compression ratio, cost before, cost after, and monthly savings projection.
   - Must return waste findings for repeated context, irrelevant content, verbose instructions, duplicated files/logs, unclear task objective, unnecessary examples, and hidden prompt bloat.

2. `POST /api/compression`
   - Accepts current input, model, mode, goal, output budget, and compression strength.
   - Returns `CompressionResult`.
   - Must include before text, optimized after text, removed sections, preserved critical facts, compression ratio, and safety warnings.

3. `POST /api/relevance`
   - Accepts current input and task goal.
   - Returns `RelevanceSection[]`.
   - Each section must include title, relevance status, token count, selected state, and reason.
   - The frontend must be able to toggle keep/remove locally and later persist if desired.

4. `POST /api/execution-plan`
   - Accepts `AnalysisRequest` or an existing analysis ID.
   - Returns `ExecutionPlanStep[]` plus suggested final prompt and output budget guidance.
   - Include steps for summarize first, retrieve relevant chunks only, cheaper model extraction, premium model final reasoning, and caching repeated context.

5. `GET /api/saved-runs`
   - Returns `SavedRun[]`.
   - Supports search, tag filtering, and future pagination.

6. `POST /api/saved-runs`
   - Saves a completed analysis.
   - Stores original and optimized versions for comparison.

7. `GET /api/settings/model-pricing`
   - Returns `ModelPricing[]`.
   - The pricing table in Settings should no longer be hardcoded once this endpoint exists.

8. `PUT /api/settings/defaults`
   - Persists default compression behavior, default output budget, and selected pricing preset.

9. `POST /api/donations/session`
   - Only if Stripe hosted checkout is configured.
   - Accepts amount and provider.
   - Returns a hosted Stripe checkout URL.
   - Never return raw secrets or collect card details in the frontend.

## AI Processing Requirements

Implement a backend-only token control pipeline:

1. Normalize input by mode: Prompt, Chat Log, Document, Code Task, API Payload.
2. Estimate tokens with provider-aware tokenization or a conservative fallback.
3. Detect waste categories:
   - repeated context
   - irrelevant content
   - verbose instructions
   - duplicated files/logs
   - unclear task objective
   - unnecessary examples
   - hidden prompt bloat
4. Score severity as `low`, `medium`, `high`, or `critical`.
5. Generate compression output while preserving:
   - exact task goal
   - critical facts
   - constraints
   - security/compliance requirements
   - required output format
   - code errors and stack traces when relevant
6. Generate relevance sections with token impact.
7. Generate an execution plan that reduces cost without damaging answer quality.

## Frontend Integration Points by Section

Dashboard:
- Replace mock metrics with aggregate backend stats.
- Wire token saved today, estimated monthly savings, average compression ratio, analyzed prompts, trend data, risk cards, and recent history.

Analyzer:
- Submit editor content to `POST /api/analysis`.
- Preserve the current loading state.
- Render backend `AnalysisResult` in the cost estimator, waste report, and right insight panel.
- Show actionable error messages if analysis fails.

Context Compressor:
- If no analysis exists, trigger analysis or compression from the current editor state.
- Wire compression strength to the backend.
- Copy optimized prompt from the returned `CompressionResult`.
- Export should download a JSON or Markdown artifact containing before, after, removed sections, preserved facts, warnings, and metadata.

Relevance Filter:
- Load relevance from backend.
- Keep local toggles responsive.
- Calculate live token savings on the client.
- Add persistence later with an endpoint such as `PATCH /api/analysis/:id/relevance`.

Execution Planner:
- Render backend recommended workflow steps.
- Show output budget planning based on returned estimates.
- Use suggested final prompt from backend.

Saved Runs:
- Load from `GET /api/saved-runs`.
- Search and filter server-side once data grows.
- Compare original versus optimized prompt versions.

Settings:
- Load pricing presets and defaults from backend.
- Persist selected model pricing preset, compression default, output budget, and theme preference.
- Theme may remain frontend-local unless user accounts are added.

Donation:
- Keep PayPal.me as an outbound link with amount where supported.
- For Stripe, use only hosted checkout or a verified Stripe Payment Link.
- Do not embed card fields unless a full PCI-safe Stripe Elements implementation is explicitly planned.
- Replace placeholder URLs:
  - `https://paypal.me/AITokenControl`
  - `https://donate.stripe.com/`

## Security and Reliability

- Validate request size and reject unsafe oversized payloads.
- Rate-limit analysis and compression endpoints.
- Store provider API keys only on the server.
- Add request IDs for traceability.
- Log errors without storing sensitive prompt data by default.
- Add clear privacy controls for saved runs.
- Sanitize exported filenames and downloaded content.
- Never execute submitted code. Treat code tasks as text.

## Environment Variables

Use server-only environment variables:

```text
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_DONATION_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
PAYPAL_ME_URL=
DATABASE_URL=
APP_BASE_URL=
```

Expose to the frontend only safe public values, such as:

```text
VITE_APP_NAME=AI Token Control System
VITE_PAYPAL_ME_URL=
VITE_STRIPE_DONATION_LINK=
```

## Testing Checklist

- Unit test token estimation and waste category scoring.
- Unit test compression safety rules.
- Unit test relevance token savings.
- Integration test every API endpoint.
- E2E test Dashboard, Analyzer, Compressor, Relevance, Planner, Saved Runs, Settings, Donation, and theme toggle.
- Test mobile layout after backend data is loaded.
- Test empty, loading, success, error, and saved states.

## Definition of Done

The backend integration is complete when every current frontend section is connected to a real endpoint or a clearly documented provider-owned outbound flow, all mock data is removed or explicitly kept as fallback demo data, the app handles errors gracefully, secrets stay server-side, and the production build passes.
