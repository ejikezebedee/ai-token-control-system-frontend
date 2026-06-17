# AI Token Control System

Advanced production-grade frontend prototype for reducing AI token waste before prompts, documents, chat logs, code tasks, or API requests are run.

## Scope

Frontend only. This project intentionally does not include backend logic, database access, API keys, auth server, payment integration, or AI model calls. All analysis behavior is powered by typed mock services in `src/services/mockAiTokenControl.ts`.

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5174/
```

## Verify

```bash
npm run typecheck
npm run build
```

## Backend Handoff

The backend integration contracts live in:

```text
src/types/contracts.ts
```

Mock service functions to replace later:

```text
analyzeInput(request)
compressContext(request)
filterRelevance(request)
generateExecutionPlan(request)
getSavedRuns()
```
