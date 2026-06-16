# AI Token Control System Frontend

Production-grade frontend prototype for the AI Token Control System.

The app helps users estimate token usage, identify waste, compress context, filter relevance, plan cheaper execution workflows, save analysis runs, attach documents/images for mock token estimation, and prepare optional donation intents.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- lucide-react

## Frontend-only scope

This repository intentionally does not include backend logic, databases, API keys, authentication servers, payment integration, or AI model calls.

Mock services live in `src/services/mockTokenControlService.ts` and are designed to be replaced by real API calls later.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Backend Handoff

Useful integration surfaces:

- `src/types.ts` defines request/result interfaces.
- `src/services/mockTokenControlService.ts` contains replaceable mock service functions.
- Uploads are represented as frontend `UploadedAsset` metadata only.
- Donation support UI creates a local mock intent only; wire it to a payment provider later.
