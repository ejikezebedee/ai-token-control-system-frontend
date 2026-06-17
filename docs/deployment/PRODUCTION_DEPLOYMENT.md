# TokenTrim Production Deployment

This guide prepares TokenTrim for a hosted production or staging deployment.

## 1. Prepare Environment

Copy the production template and fill only the values required for the host:

```bash
cp .env.production.example .env
```

Required for a basic deployment:

```text
NODE_ENV=production
PORT=8787
HOST=0.0.0.0
APP_BASE_URL=https://your-domain.example
```

Optional provider links:

```text
PAYPAL_ME_URL=https://paypal.me/yourhandle
STRIPE_DONATION_LINK=https://buy.stripe.com/your-hosted-link
VITE_PAYPAL_ME_URL=https://paypal.me/yourhandle
VITE_STRIPE_DONATION_LINK=https://buy.stripe.com/your-hosted-link
```

Keep server-only keys out of frontend hosting dashboards unless the variable is explicitly prefixed with `VITE_`.

## 2. Install And Build

```bash
npm install
npm run typecheck
npm run build
```

## 3. Start Server

```bash
npm run start
```

The Node server serves both:

- the built frontend from `./dist`
- the backend API from `/api/*`

## 4. Health Check

After startup, verify:

```bash
curl https://your-domain.example/api/health
```

Expected result:

```json
{"data":{"status":"ok","service":"ai-token-control-system"}}
```

The response also includes `timestamp` and `requestId`.

## 5. Reverse Proxy

Point the public domain to the Node server port. For Nginx, proxy requests to:

```text
http://127.0.0.1:8787
```

Use HTTPS at the proxy or hosting platform layer.

## 6. Production Smoke Test

Confirm these flows in the browser:

- Dashboard loads without console errors.
- Analyzer returns token waste findings.
- Compressor returns an optimized prompt.
- Relevance Filter marks sections as relevant, uncertain, or removable.
- Planner returns execution steps.
- Saved Runs can save and reload a run.
- Settings can load and save defaults.
- Donation buttons show only configured provider links.
- `/api/health` returns `status: ok`.

## 7. Commercial Release Audit

Before selling or handing off:

- No private keys, tokens, emails, or internal machine paths are committed.
- Setup instructions use relative paths and public environment names only.
- Donation/payment flow uses hosted provider pages only.
- README and deployment guide explain install, build, start, and troubleshooting.
- The app can be installed from a clean clone.
- `npm run typecheck` passes.
- `npm run build` passes.
- Production server starts and `/api/health` responds.
