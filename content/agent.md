# The Alex Lewin Experience

**A 1-hour Bitcoin agent hackathon at TABConf.**

You and your coding agent have ~40 minutes to build and publish something where **bitcoin changes hands**. Useful, silly, or cursed: all welcome. The only rule: **a real (test-network) payment happens during your demo.** Then it's hack-and-tell: everyone who submits gets to show what they built.

## Humans: start here

Paste this into your coding agent (Claude Code, Codex, Cursor, Astra, whatever you like):

```text
Read https://experience.lwn.lol/agent.md and follow it. Be my hackathon partner.
```

Your agent will interview you, pitch ideas, propose a tech stack (you can change anything), build your app, and publish it.

**Before the clock starts (2 min):** have your coding agent installed and logged in, Node 22+ (for the default stack), and a terminal your agent can run commands in. No hosting accounts needed.

**Agent can't read the link?** Some agents can't fetch URLs. Open the [raw playbook](https://experience.lwn.lol/agent.md), copy all of it, and paste it into your agent instead.

---

## Agents: your playbook

You are the attendee's hackathon partner. Follow these phases in order. Keep your messages short; the clock is running.

### Timebox

| Minute | Phase |
|---|---|
| 0–5 | 1. Interview + pick an idea |
| 5–7 | 2. Propose the stack + confirm |
| 7–17 | 3. Setup |
| 17–37 | 4. Build |
| 37–42 | 5. Publish + demo prep |

Tell the user which phase you're in, and send a **progress check-in** (below) at the start of each phase. If you're behind schedule, **cut scope, not the payment**.

### Ground rules (these apply whatever stack you use)

- **Test money only.** Use a test network (signet, testnet, mutinynet, regtest, test mints). Never mainnet, never real funds.
- **Never ask for the user's real seed phrase.** Generate fresh test wallets.
- **Keep wallet data, mnemonics, and API tokens out of git.** Put wallet data directories outside the repo or in `.gitignore`; put tokens in `.env`.
- **Never expose a wallet daemon or admin API to the internet.** Only your app's own routes go public. Never disable wallet auth (e.g. Bark's `--no-auth` / `--dangerously-allow-remote-no-auth`); if auth fails, fix the token.
- **Never run commands that wipe a wallet** (e.g. `bark create --force`) without asking the user first.
- **Remove dev/test/fake-payment routes before publishing.** Anything you publish, the whole audience can hit.
- **Don't invent APIs.** Bitcoin libraries change fast. Check docs or the running service's API spec before writing wallet code.
- **Don't require admin rights.** Prefer local installs (`./bin/...`) over `sudo` or global package managers unless the user is fine with them.
- **Ship something small that works** over something big that doesn't.

### Check-ins with Alex

Alex watches a live board of everyone hacking and builds the presentation list from it. Three calls to `https://experience.lwn.lol/api`, all `POST` with a JSON body. Every response is `{"success": true, "data": ...}` or `{"success": false, "error": "..."}`.

| When | Call | Body |
|---|---|---|
| As soon as you know the user's name | `/api/register` | `{"name": "Ada"}` (a team name is fine) → returns `data.token` |
| Start of each phase | `/api/progress` | `{"token": "...", "phase": "stack", "idea": "Pay-per-roast AI"}` |
| App is published and works | `/api/submit` | `{"token": "...", "demoUrl": "https://...", "repoUrl": "https://..."}` |

```bash
curl -s -X POST https://experience.lwn.lol/api/register \
  -H 'content-type: application/json' -d '{"name":"Ada"}'
```

- `phase` is one of `interview`, `stack`, `setup`, `build`, `publish`. `idea` is a one-liner (max 200 chars); send it once the user picks an idea.
- Save the token to `.experience.json` in the project and add that file to `.gitignore`. Don't print it in demos or commit it. If you lose it, register again.
- Submitting puts the user on the presentation list and returns their `position`. Resubmitting (e.g. a new tunnel URL) updates the links and keeps their place.
- `repoUrl` is optional.
- **Check-ins must never block the hack.** If a call fails, mention it once and keep building.

### Phase 1: Interview (≤ 5 min)

Ask these in **one** message, then wait:

0. What's your name (or team name)? It goes on Alex's presentation list.
1. What are you into? (games, music, AI, art, sports, memes, finance, anything)
2. Vibe: **useful**, **funny**, or **cursed**?
3. Comfort level: are you happy reading code, or should I drive everything?
4. Any tools, languages, or Bitcoin libraries you already know or want to use? What OS are you on, and do you have accounts anywhere for hosting (Cloudflare, Vercel, etc.)?

As soon as they answer, **register** (see Check-ins). Then pitch **3 ideas** tailored to their answers, one line each, each with an obvious "money moment" for the demo. Recommend one. Let them pick or remix.

Idea seeds to remix (don't just copy these):

- **Pay-per-prompt AI:** an oracle/roaster/poet that only answers after it gets paid.
- **Paywalled thing:** a joke, fortune, song, or secret behind a sats paywall.
- **Agent bargaining:** two AI agents negotiate a price, then actually settle.
- **Sats game:** pay to move/guess/play; winner takes the pot.
- **Bounty board:** post a task with a sats reward; first to complete it gets paid.
- **Tip-triggered chaos:** a payment makes something happen on screen (confetti, sound, a message on a big display).

### Phase 2: Propose the stack + confirm (≤ 2 min)

The **Default stack** (see below) exists so attendees who don't know what to pick don't have to. **It is a suggestion, not a requirement.** If the user already knows a language, framework, Bitcoin library, or host, use theirs. If the idea fits a different tool better, propose that instead.

Send the user a short proposal, for example:

```text
Here's the stack I'd use for <idea>:
- Bitcoin: Bark (Ark + Lightning on signet), via barkd + TypeScript client
- App: Node + Hono on port 8080
- Live updates: browser polling
- Publish: Cloudflare quick tunnel (no account needed)

Want to change anything (language, framework, Bitcoin library, hosting)? Otherwise I'll start setting up.
```

**Wait for the user to confirm or change it before installing or building anything.** Then adapt Phases 3–5 to whatever they chose.

### Phase 3: Setup (≤ 10 min)

0. **Preflight (1 min):** check OS/CPU architecture, runtime versions, and that you can run shell commands and fetch URLs. Report anything missing before going further.
1. **Get docs into context** for whatever Bitcoin tooling you're using. For the default (Bark), see **Bark reference** below.
2. **Install tools locally** where possible (e.g. into `./bin`), and add that directory to `.gitignore`.
3. **Create test wallet(s)** in a fresh, dedicated data directory for this project (outside the repo or gitignored). Never reuse an existing wallet directory on the user's machine.
4. **Get test sats.** Alex is handing out signet sats in the room: have the user share their receiving address the way Alex says to. If you're on another test network, use its faucet. Prefer instant off-chain payments (Ark, Lightning); on-chain payments wait for blocks.

### Phase 4: Build (≤ 20 min)

Build checklist:

- Wallet created and funded on a test network
- The app shows a **stable** receiving address or invoice, with a **QR code**
- At least one end-to-end payment works (send *or* receive, ideally both)
- The "money moment" visibly does something when sats move
- Wallet data and tokens are not in git

**If a payment unlocks something** (fortune, paywall, prompt), verify it properly:

- Create a **per-request** invoice (or payment request) on the server, and unlock only when *that* invoice is paid. A generic balance increase can't tell you who paid.
- Fulfil each payment **exactly once**, even if the wallet reports it twice.
- Show clear **pending / paid / error** states in the UI.
- Quick test: unpaid access is refused, a duplicate notification doesn't double-unlock, and two customers paying at once each get their own result.

Tips:

- Keep the wallet server-side and talk to it from your app's backend. Don't call a wallet daemon from the browser.
- Generate one receiving address up front and reuse it. Many wallets hand out a new address on every call, which makes the QR change on every page refresh.
- If you push live updates to the browser through a tunnel, **use polling or WebSockets**. Server-Sent Events can get buffered by quick tunnels and never arrive.

### Phase 5: Publish + demo prep (≤ 5 min)

Get a public URL with whatever host the user prefers. Default: a **Cloudflare quick tunnel**, which needs no account:

```bash
# Download cloudflared locally (no brew/sudo needed). macOS Apple Silicon example:
mkdir -p bin && curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz | tar -xz -C bin
./bin/cloudflared tunnel --no-autoupdate --url http://127.0.0.1:8080
```

First confirm the app answers locally (`curl -s http://127.0.0.1:8080` returns *your app*, not a wallet API). You get a `https://<random>.trycloudflare.com` URL in seconds. **Tunnel your app's port only, never the wallet daemon's port.** Keep the laptop awake. Other options: `npx wrangler deploy` (Cloudflare Workers/Pages), `npx vercel --prod`, ngrok, or anything else.

**Before you share the URL:** remove test/fake-payment routes and anything that could let the audience trigger effects without paying.

Write a 3-line `README.md` with the public URL, what it does, and how to pay it.

**Submit** once the public URL works from outside your machine (see Check-ins): send `demoUrl`, plus `repoUrl` if the code is pushed somewhere. If the user wants a public repo and has the GitHub CLI logged in, offer to create one, but **ask before pushing anything**. Then tell the user they're on the presentation list and their position.

Then help the user prep a **90-second demo**:

- One sentence: what it is and why it's fun.
- Show the money moment live.
- Have a backup ready (a screen recording or a screenshot of a completed payment) in case the Wi-Fi or tunnel dies on stage.

---

## Default stack

A sensible default for people who don't have a preference. Swap any piece.

| Piece | Default | Swap for anything, e.g. |
|---|---|---|
| Bitcoin | [Bark](https://second.tech) (Ark + Lightning) on **signet**, via `barkd` + `@secondts/barkd` | Any Lightning, ecash, or on-chain library/wallet that runs on a test network |
| App | Node 22 + [Hono](https://hono.dev), port **8080** | Any language/framework |
| Live updates | Browser polling (every 1–2 s) | WebSockets |
| Publish | Cloudflare quick tunnel | Cloudflare Workers/Pages, Vercel, ngrok, Fly, … |
| Extras | Cloudflare Workers AI, Durable Objects, D1 | Whatever the idea needs |

## Bark reference

Only relevant if you're using Bark. Verified against bark 0.7.1.

**Docs.** Index: **https://second.tech/docs/llms.txt** (every page has a `.md` version). Optional docs MCP server, if the user is happy to add it:

```bash
claude mcp add --transport http second-docs https://second.tech/docs/mcp   # Claude Code
codex mcp add second-docs --url https://second.tech/docs/mcp               # Codex
```

**Signet endpoints:**

```text
Ark server: https://ark.signet.2nd.dev
Esplora:    https://esplora.signet.2nd.dev
Faucet:     https://signet.2nd.dev/          (needs GitHub login)
Test store: https://signet.2nd.dev/store     (something to pay!)
```

**Install.** Get the latest `bark` and `barkd` release URLs from https://second.tech/docs/getting-started/bark-cli/index.md and https://second.tech/docs/barkd/install.md. Download into `./bin`, then `chmod +x`. Downloading with `curl` avoids macOS Gatekeeper; if a browser-downloaded binary is blocked, run `xattr -d com.apple.quarantine ./bin/<binary>`.

**barkd (default for apps).**

- Start it with a data dir outside your repo (or gitignored): `./bin/barkd --datadir ./.wallet`. It listens on **127.0.0.1:3000** by default. That's why the app uses 8080; **never tunnel port 3000**.
- Get the auth token: `./bin/barkd --datadir ./.wallet secret show`. Put it in `.env` as `BARKD_TOKEN`.
- barkd starts with **no wallet**. Create one once: `POST /api/v1/wallet/create` with `{"network":"signet","ark_server":"https://ark.signet.2nd.dev","chain_source":{"esplora":{"url":"https://esplora.signet.2nd.dev"}}}`.
- The full API spec for the version you're running is at `http://127.0.0.1:3000/api-docs/openapi.json` (Swagger UI at `/swagger-ui`). Trust it over any example.
- TypeScript client: `npm install @secondts/barkd`. **Pass the token**, or every call returns 401:

```ts
import { Configuration, WalletApi, LightningApi, NotificationsApi } from "@secondts/barkd";

const config = new Configuration({
  basePath: "http://127.0.0.1:3000",
  accessToken: process.env.BARKD_TOKEN,
});
const wallet = new WalletApi(config);
const lightning = new LightningApi(config);
const notifications = new NotificationsApi(config);

const { address } = await wallet.peekAddress({ index: 0 }); // stable address for your QR
const balance = await wallet.balance();
const { invoice } = await lightning.generateInvoice({ /* see spec */ }); // BOLT11
const { notifications: events } = await notifications.waitNotification({}); // long-poll for payments
```

Check exact request shapes in the spec. `wallet.address()` returns a **new** address every call, so use `peekAddress({ index: 0 })` for a QR that doesn't change.

**bark CLI (good for agents, bots, and scripts).**

```bash
export BARK_DATADIR=./.wallet-cli    # one data dir per wallet; never share or reuse
./bin/bark create --signet --ark https://ark.signet.2nd.dev --esplora https://esplora.signet.2nd.dev
./bin/bark address
./bin/bark balance
./bin/bark send <ark-address-or-invoice> "1000 sat"   # amount needs a unit
```

- Most commands sync automatically. To force it, run `bark maintain`, or call `POST /api/v1/wallet/sync` on barkd. (There is no `bark sync`.)
- For multiple agents with their own wallets, give each a separate `BARK_DATADIR`.
- `bark create --force` **deletes the existing wallet**. Don't use it.
- bark writes the mnemonic in plain text to `<datadir>/mnemonic`, which is why the data dir must never be committed.

**Browser wallet (optional).** `@secondts/bark` (WASM) runs a wallet **in the browser only** (needs IndexedDB and HTTPS or localhost; not Node or Workers). Useful when every visitor needs their own wallet, e.g. multiplayer games on Cloudflare Pages. See [bark-sdk/wasm.md](https://second.tech/docs/bark-sdk/wasm.md).

**Other Bark SDKs:** Rust, Go, Swift, Kotlin, Dart/Flutter, React Native.

---

## If things break

- **Payment not showing up?** Sync the wallet and check the status/history endpoints before assuming failure.
- **401 from barkd?** You're not passing the token. Don't disable auth.
- **Port 3000 already in use?** barkd is using it. Move your app to 8080.
- **On-chain funding is slow?** It waits for signet blocks. Ask Alex for off-chain sats instead.
- **Ark VTXO weirdness?** The signet Ark server runs a round every ~5 minutes; `bark refresh --all` can help. Read [learn/vtxo.md](https://second.tech/docs/learn/vtxo.md) and [learn/rounds.md](https://second.tech/docs/learn/rounds.md).
- **Live updates not arriving through the tunnel?** Switch from SSE to polling.
- **SDK method doesn't exist?** Check the spec or docs; don't guess. Fall back to the CLI.
- **Out of time?** Cut features. A single working payment beats a broken masterpiece.

---

Built for TABConf by Alex Lewin. Default Bitcoin stack: [Bark](https://second.tech) on signet.
