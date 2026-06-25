# Payments Setup (Stripe Test Mode)

Probability Playground uses **Stripe Checkout** for token purchases. All payment logic runs on Vercel serverless API routes — secret keys never touch the browser.

## Pricing

| Product | Price |
|---------|-------|
| Single-player token pack | 1,000 tokens for **$0.99** flat |
| Multiplayer buy-in ≤ 1,000 | **$0.99** flat |
| Multiplayer buy-in > 1,000 | **$0.99 + $1 per 100 tokens** above 1,000 (e.g. 1,500 = $5.99) |

Start in **test mode** until you're ready to go live.

---

## Step 1: Create a Stripe account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Complete signup (no business verification needed for test mode)
3. Stay in **Test mode** (toggle in the top-right of the Stripe Dashboard)

---

## Step 2: Get your test API keys

1. Open [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys)
2. Copy:
   - **Publishable key** → `pk_test_…`
   - **Secret key** → `sk_test_…` (click Reveal)

---

## Step 3: Set Vercel environment variables

In your Vercel project (**Settings → Environment Variables**), add:

| Variable | Value | Environments |
|----------|-------|--------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` | Production, Preview, Development |
| `STRIPE_SECRET_KEY` | `sk_test_…` | Production, Preview |
| `STRIPE_WEBHOOK_SECRET` | (from Step 4) | Production, Preview |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | (from Step 5) | Production, Preview |
| `DAILY_PASSWORD_SECRET` | long random string | Production, Preview |

For local dev, copy `.env.example` to `.env` and fill in the same values.

**Redeploy** after adding env vars so API routes pick them up.

### Env var naming (common mistakes)

| Correct (server) | Wrong | Notes |
|------------------|-------|-------|
| `STRIPE_SECRET_KEY` | `VITE_STRIPE_SECRET_KEY` | Secret keys must **not** use the `VITE_` prefix — Vite would expose them in the browser bundle. |
| `STRIPE_WEBHOOK_SECRET` | `VITE_STRIPE_WEBHOOK_SECRET` | Server-only; set without `VITE_`. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `STRIPE_PUBLISHABLE_KEY` | Publishable key **must** use `VITE_` so the client bundle can read it at build time. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | `VITE_FIREBASE_SERVICE_ACCOUNT_JSON` | Never expose service account JSON to the client. |

Enable each variable for **Production** (and Preview if you test preview URLs). Changing env vars does not affect already-built deployments until you **Redeploy**.

After deploy, open your project on Vercel → **Deployments** → latest deploy → **Functions**. You should see:

- `/api/create-checkout-session`
- `/api/stripe-webhook`
- `/api/verify-daily-password`

If Functions is empty, the API routes did not deploy — check build logs and `vercel.json`.

---

## Step 4: Create the webhook endpoint

1. Deploy the app to Vercel first (so `/api/stripe-webhook` exists)
2. In Stripe Dashboard → **Developers → Webhooks → Add endpoint**
3. Endpoint URL: `https://YOUR-VERCEL-DOMAIN/api/stripe-webhook`
4. Events to listen for: **`checkout.session.completed`**
5. After creating, click the endpoint and copy the **Signing secret** (`whsec_…`)
6. Add it as `STRIPE_WEBHOOK_SECRET` in Vercel and redeploy

### Local webhook testing (optional)

```bash
stripe listen --forward-to localhost:5173/api/stripe-webhook
```

Use the signing secret printed by the CLI as `STRIPE_WEBHOOK_SECRET` locally.

---

## Step 5: Firebase Admin for token crediting

The webhook credits tokens via Firestore Admin SDK (client cannot be trusted).

1. Firebase Console → **Project settings → Service accounts**
2. Click **Generate new private key**
3. Copy the entire JSON file contents
4. Paste as a **single-line** value for `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel

The webhook writes to:
- `tokenPurchases/{sessionId}` — idempotency record
- `courseProgress/{uid}` — increments `tokens`, `peakTokens`, `lifetimeTokens`

---

## Step 6: Daily multiplayer password

Set `DAILY_PASSWORD_SECRET` to a long random string (e.g. 32+ chars from a password generator).

The password is deterministic per UTC day: same for all users, rotates at **midnight UTC**.

Users who **mastered all 6 lessons** bypass the password entirely.

Verification runs at `/api/verify-daily-password` (server-side only — secret never exposed).

---

## Step 7: Test a purchase

1. Open Poker Night while signed in
2. When out of tokens, click **Buy 1,000 tokens · $0.99**
3. Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC
4. After redirect, tokens appear within a few seconds (webhook → Firestore)

Check webhook delivery in Stripe Dashboard → Developers → Webhooks → your endpoint → **Recent deliveries**.

---

## Troubleshooting checkout

If **Pay $0.99** fails, the modal now shows the API error when available. Common cases:

| Symptom / error | Fix |
|-----------------|-----|
| `STRIPE_SECRET_KEY is not set on the server` | Add `STRIPE_SECRET_KEY` (no `VITE_`) for **Production**, redeploy. |
| `Checkout API not found (404)` | Functions tab empty → redeploy; ensure `api/` routes exist in repo and `vercel.json` lists `/api/*` rewrite **before** the SPA fallback. |
| `returned the app page instead of JSON` | SPA rewrite is catching `/api/*`; redeploy with current `vercel.json` (API rewrite must be first). |
| Stripe error in modal (500) | Invalid/expired `sk_test_…` key, or Stripe account issue — check Vercel function logs. |
| Publishable key works but pay fails | Client key (`VITE_STRIPE_PUBLISHABLE_KEY`) is separate from server `STRIPE_SECRET_KEY`; both must be set and redeployed. |

Quick server check (replace domain):

```bash
curl -sS -X POST "https://YOUR-DOMAIN.vercel.app/api/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{"kind":"sp_tokens","tokenAmount":1000,"uid":"test"}'
```

- `503` + JSON about `STRIPE_SECRET_KEY` → env var missing on server.
- `404` → function not deployed.
- `400` + missing fields → API is live (expected for real checkout you must be signed in via the app).

---

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/create-checkout-session` | POST | Creates Stripe Checkout session |
| `/api/stripe-webhook` | POST | Credits tokens after payment |
| `/api/verify-daily-password` | POST | Validates daily multiplayer password |

---

## Going live (later)

1. Complete Stripe business verification
2. Switch Dashboard to **Live mode**
3. Replace test keys with live keys (`pk_live_…`, `sk_live_…`)
4. Create a **new live webhook** endpoint with a new signing secret
5. Update all Vercel env vars and redeploy

Money goes to **your** Stripe account — standard direct integration, no platform fees from this app.
