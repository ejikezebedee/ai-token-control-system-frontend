# AI Token Control System

Advanced production-grade token control app for reducing AI token waste before prompts, documents, chat logs, code tasks, or API requests are run.

## Scope

The app includes:

- React + TypeScript + Vite frontend
- Node HTTP backend API
- Token estimation, waste scoring, compression, relevance mapping, and execution planning
- Saved run persistence through local JSON files
- Settings/model-pricing endpoints
- Provider-owned donation boundaries for PayPal.me and hosted Stripe checkout

The backend does not expose API keys to the browser, does not collect card details, and does not execute submitted code.

## Run Locally

```bash
npm install
npm run api
npm run dev
```

Open:

```text
http://127.0.0.1:5174/
```

For production-style local serving:

```bash
npm run build
npm run start
```

Open:

```text
http://127.0.0.1:8787/
```

Health check:

```text
GET /api/health
```

## Verify

```bash
npm run typecheck
npm run build
```

## Deploy

Use the production environment template:

```bash
cp .env.production.example .env
```

Set `HOST=0.0.0.0` for hosted deployment, set `APP_BASE_URL` to the public URL, then run:

```bash
npm install
npm run build
npm run start
```

Full deployment and release checklist:

```text
docs/deployment/PRODUCTION_DEPLOYMENT.md
```

## Backend Handoff

The backend integration contracts live in:

```text
src/types/contracts.ts
```

Frontend service functions are wired through:

```text
src/services/aiTokenControlApi.ts
```

Backend endpoints:

```text
POST /api/analysis
POST /api/compression
POST /api/relevance
POST /api/execution-plan
GET  /api/saved-runs
POST /api/saved-runs
GET  /api/settings/model-pricing
GET  /api/settings/defaults
PUT  /api/settings/defaults
POST /api/donations/session
GET  /api/health
```

Main client functions:

```text
analyzeInput(request)
compressContext(request)
filterRelevance(request)
generateExecutionPlan(request)
getSavedRuns()
saveRun(result)
getModelPricing()
```

## Environment

Server-only values:

```text
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_DONATION_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
STRIPE_DONATION_LINK=
PAYPAL_ME_URL=
DATABASE_URL=
APP_BASE_URL=
HOST=
PORT=
MAX_REQUEST_BYTES=
```

Frontend-safe values:

```text
VITE_APP_NAME=AI Token Control System
VITE_API_BASE_URL=
VITE_PAYPAL_ME_URL=
VITE_STRIPE_DONATION_LINK=
```
