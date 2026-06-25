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
- `/api/verify-checkout-session`
- `/api/verify-daily-password`

If Functions is empty, the API routes did not deploy — check build logs and `vercel.json`.

---

## Step 4: Create the webhook endpoint

1. Deploy the app to Vercel first (so `/api/stripe-webhook` exists)
2. In Stripe Dashboard → **Developers → Webhooks → Add endpoint**
3. Endpoint URL: `https://YOUR-VERCEL-DOMAIN/api/stripe-webhook`

**⚠️ Do NOT include `/poker` in the webhook URL.** `/poker` is a client-side React Router route, not an API path. A wrong URL like `…/poker/api/stripe-webhook` sends POST to the static SPA and returns **405** with an empty body. Use **`/api/stripe-webhook`** at the domain root (Checkout success/cancel redirects correctly use `/poker?checkout=…` — that is different and intentional).
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
4. After redirect to `/poker?checkout=success&session_id=…`, the app verifies the session and refreshes your balance (usually within a few seconds)

Check webhook delivery in Stripe Dashboard → Developers → Webhooks → your endpoint → **Recent deliveries**.

---

## How token crediting works

1. **Stripe Checkout** completes → Stripe sends `checkout.session.completed` to `/api/stripe-webhook`
2. Webhook (or the client fallback below) writes:
   - `tokenPurchases/{sessionId}` — idempotency record (prevents double credit)
   - `courseProgress/{uid}` — increments `tokens`, `peakTokens`, `lifetimeTokens`
3. On redirect, the client calls `/api/verify-checkout-session` with `session_id` + your Firebase `uid`, then **refetches** progress from Firestore (so stale local state cannot overwrite credits)

Both webhook and verify routes share the same idempotent `creditTokens` logic — safe if both run.

---

## Troubleshooting token crediting

If payment succeeds in Stripe but tokens do not appear:

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Webhook delivery **405** with **empty body** | Wrong endpoint URL includes `/poker` (e.g. `…/poker/api/stripe-webhook`) — POST hits the SPA, not the serverless function. Or `/api/stripe-webhook` did not deploy (POST fell through to static `index.html`). | Fix Stripe endpoint to `https://YOUR-DOMAIN/api/stripe-webhook` (**no `/poker`**). Confirm **Functions** tab lists `/api/stripe-webhook`, redeploy if needed, then **Resend** failed deliveries in Stripe. A `vercel.json` rewrite also forwards `/poker/api/*` → `/api/*` as a safety net. |
| Stripe webhook delivery **400 Invalid signature** | Wrong `STRIPE_WEBHOOK_SECRET` (test vs live, or CLI vs dashboard secret) | Copy signing secret from the exact endpoint URL you deployed; redeploy Vercel |
| Webhook delivery **503** | Missing `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` | Set both in Vercel Production + Preview, redeploy |
| Webhook delivery **500** with Firebase error | `FIREBASE_SERVICE_ACCOUNT_JSON` missing or malformed | Regenerate service account key; paste **entire JSON on one line** in Vercel; redeploy |
| Webhook **200** but no tokens in Firestore | Check Vercel function logs for `[stripe-webhook]` — may show missing `metadata.uid` | Ensure checkout was created while signed in (uid sent to `/api/create-checkout-session`) |
| Webhook never arrives | Endpoint URL wrong, or app not deployed | Confirm `https://YOUR-DOMAIN/api/stripe-webhook` in Stripe; event = `checkout.session.completed` only |
| Tokens in Firestore but UI stale | Client had old balance cached | Fixed: redirect now calls verify + `refetchProgress`. Hard-refresh if on an old deploy |

### Vercel runtime logs (what to look for)

Open **Deployments → latest → Functions → Logs**, filter around purchase time:

| Log prefix | Meaning |
|------------|---------|
| `[stripe-webhook] checkout credited` | Webhook credited tokens successfully |
| `[stripe-webhook] creditTokens failed` | Firestore/Admin error — check service account JSON and project |
| `[stripe-webhook] signature verification failed` | Wrong webhook secret |
| `[verify-checkout-session] credit failed` | Client fallback failed — same Firebase/env checks |
| `[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON` | Re-paste service account as single-line JSON |

### Stripe webhook deliveries (what to look for)

In **Developers → Webhooks → your endpoint → Recent deliveries** for `checkout.session.completed`:

- **200** + response `{"received":true}` — webhook ran OK; check Firestore `courseProgress/{your-uid}` and `tokenPurchases/{sessionId}`
- **405** + empty response — function not deployed or request hit static SPA → redeploy, verify Functions tab, then **Resend** in Stripe
- **400** — signature mismatch → fix `STRIPE_WEBHOOK_SECRET`
- **500** — crediting failed → open delivery **Response** body and match to Vercel logs above; Stripe will retry

Quick webhook check (replace domain — expect **400** `Missing stripe-signature`, not **405**):

```bash
curl -sS -o /dev/null -w "%{http_code}\n" -X POST "https://YOUR-DOMAIN/api/stripe-webhook" \
  -H "Content-Type: application/json" -d '{}'
```

- **405** → webhook function missing; redeploy and check build logs.
- **400** → function is live (signature check runs next with real Stripe deliveries).

### Manual recovery

If a payment completed but crediting failed, note the Checkout **Session ID** (`cs_…`) from Stripe, then after fixing env vars redeploy and visit:

`/poker?checkout=success&session_id=cs_…`

The verify route is idempotent — it will credit once without double-charging.

---

## Troubleshooting checkout

If **Pay $0.99** fails, the modal now shows the API error when available. Common cases:

| Symptom / error | Fix |
|-----------------|-----|
| `STRIPE_SECRET_KEY is not set on the server` | Add `STRIPE_SECRET_KEY` (no `VITE_`) for **Production**, redeploy. |
| `Checkout API not found (404)` | Functions tab empty → redeploy; ensure `api/*.ts` handlers exist and Framework Preset is **Vite** (not static-only). |
| `returned the app page instead of JSON` | SPA fallback is catching `/api/*`; redeploy with current `vercel.json` (`rewrites.fallback` excludes `/api/` and runs after serverless functions). |
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
| `/api/stripe-webhook` | POST | Credits tokens after payment (primary) |
| `/api/verify-checkout-session` | POST | Verifies paid session + credits tokens (client fallback, idempotent) |
| `/api/verify-daily-password` | POST | Validates daily multiplayer password |

---

## Going live (later)

1. Complete Stripe business verification
2. Switch Dashboard to **Live mode**
3. Replace test keys with live keys (`pk_live_…`, `sk_live_…`)
4. Create a **new live webhook** endpoint with a new signing secret
5. Update all Vercel env vars and redeploy

Money goes to **your** Stripe account — standard direct integration, no platform fees from this app.
