# Partypedia — Cloudflare (Path A) signaling + TURN

This deploys a tiny Cloudflare Worker that powers the **🧪 Cloudflare (beta)** buttons:

- **Signaling** — a Durable Object per room relays WebRTC offer/answer/ICE between
  the host and players over WebSockets (replaces Supabase Realtime). Uses the
  WebSocket Hibernation API, so idle rooms cost nothing.
- **TURN** — a `/turn` endpoint mints short-lived Cloudflare Realtime TURN
  credentials (the API token stays on the server, never in the browser).

Game data (photos, answers, roasts) still flows **peer-to-peer over WebRTC** — the
Worker only brokers the connection. STUN is `stun.cloudflare.com` (free).

## One-time setup

Prereqs: a Cloudflare account and [`wrangler`](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
(`npm i -g wrangler`, then `wrangler login`).

### 1. Deploy the Worker
```bash
cd cloudflare
wrangler deploy
```
Note the deployed URL, e.g. `https://partypedia-signaling.<your-subdomain>.workers.dev`.

### 2. Add TURN credentials (optional but recommended)
In the Cloudflare dashboard: **Realtime → TURN → Create**. Copy the **Turn Token ID**
and **API Token**, then set them as Worker secrets:
```bash
wrangler secret put TURN_KEY_ID      # paste the Turn Token ID
wrangler secret put TURN_API_TOKEN   # paste the API Token
```
Without these, the beta still works via STUN only (direct connections); cross-network
players that need a relay won't connect until TURN is set.

### 3. Point the app at the Worker
In `index.html`, find:
```js
const CF_WORKER='';
```
and set it to your Worker URL:
```js
const CF_WORKER='https://partypedia-signaling.<your-subdomain>.workers.dev';
```
Commit + deploy the site. The 🧪 beta buttons now use Cloudflare end-to-end.

## How it maps to the client
- `GET  {CF_WORKER}/turn`        → `cfICE()` fetches ICE servers
- `WS   {CF_WORKER}/ws?room=XXXX`→ `cfConnect()` opens the relay
- Host QR encodes `#cf=CODE`; scanning it routes phones into `joinCF()`.

## Free-tier notes
- **Durable Objects**: 100k requests/day free; hibernating idle sockets aren't billed
  for duration. Signaling is sparse, so this stays well within free.
- **Realtime TURN**: first 1,000 GB/month of relay free. Same-room games rarely relay,
  so usage is tiny.
- **Workers/Pages**: static hosting on Cloudflare Pages is unlimited-bandwidth free.

## Local test
```bash
wrangler dev      # serves on http://localhost:8787
```
Set `CF_WORKER='http://localhost:8787'` temporarily to test against it.
