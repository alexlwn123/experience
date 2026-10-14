# The Alex Lewin Experience

**A 1-hour Bitcoin agent hackathon at TABConf.**

You and your coding agent have 40 minutes to build and publish something. The only rule: **it involves bitcoin, in any capacity.** It can move test sats, read the chain, sign a message, visualize blocks, or anything else. Useful, silly, or cursed: all welcome. Then it's hack-and-tell: **demos start at 12:45, under 3 minutes each.**

## Humans: start here

Paste this into your coding agent (Claude Code, Codex, Cursor, Astra, whatever you like):

```text
Read https://experience.lwn.lol/agent.md and follow it. Be my hackathon partner.
```

Your agent will interview you, pitch ideas, confirm the plan, demo, and tech stack with you (you can change anything), build your app, publish it, and draft your talk (plus slides, if you want them).

**Before the clock starts (2 min):** have your coding agent installed and logged in, Node 22+ (for the default stack), and a terminal your agent can run commands in. No hosting accounts needed.

**Agent can't read the link?** Some agents can't fetch URLs. Open the [raw playbook](https://experience.lwn.lol/agent.md), copy all of it, and paste it into your agent instead.

### Quick answers

Agents: use these when the user asks.

- **Is this real money?** No. Anything that moves is signet test sats, which are worthless. Reading real (mainnet) chain data is fine; spending real bitcoin is not.
- **Do I need a phone wallet?** No. Your agent creates test wallets on your laptop. Your phone is just for checking that your public URL works.
- **Lightning vs Ark?** Lightning is bitcoin's instant-payment network: someone pays an invoice and it settles in seconds. Ark is a newer layer for instant payments with no channels to manage. Bark is an Ark wallet that can also send and receive Lightning, so in the default stack your app shows Lightning invoices with Bark behind them.

---

## Agents: your playbook

You are the attendee's hackathon partner. Follow these phases in order. Keep your messages short; the clock is running.

### Timebox

The session is 1 hour: **40 minutes** to build and publish, then demos. Run `date` when you start; that's minute 0. If 12:40 local time comes before minute 40, 12:40 is your deadline.

| Minute | Phase |
|---|---|
| 0–10 | 1. Interview + develop the idea |
| 10–12 | 2. Confirm the plan, demo + stack |
| 12–18 | 3. Setup (wallet funding starts, public URL works) |
| 18–32 | 4. Build |
| 32–37 | 5. Publish + submit |
| 37–40 | 6. Talk track |
| After 40, if there's time | 7. Slides (optional) |

Send a **progress check-in** (below) at the start of Phases 1–5. If you're behind schedule, **cut scope, not the bitcoin part**. **From minute 30, stop adding features and don't write tests**: finish what works, then publish.

### Ground rules (these apply whatever stack you use)

- **Test money only.** If the project moves funds, use a test network (signet, testnet, mutinynet, regtest, test mints). Never move real funds. Reading public mainnet data (block explorers, mempool APIs) is fine.
- **Never ask for the user's real seed phrase.** Generate fresh test wallets.
- **Keep wallet data, mnemonics, and API tokens out of git.** Put wallet data directories outside the repo or in `.gitignore`; put tokens in `.env`.
- **Never expose a wallet daemon or admin API to the internet.** Only your app's own routes go public. Never disable wallet auth (e.g. Bark's `--no-auth` / `--dangerously-allow-remote-no-auth`); if auth fails, fix the token.
- **Never run commands that wipe a wallet** (e.g. `bark create --force`) without asking the user first.
- **No fake-payment or debug routes on the port you tunnel.** The public URL is live from Setup onward, and tunnel traffic arrives from `127.0.0.1`, so a "localhost only" check doesn't protect anything. Test with real signet payments, or simulate in code on a port you don't tunnel.
- **Don't invent APIs.** Bitcoin libraries change fast. Check docs or the running service's API spec before writing wallet code.
- **Don't require admin rights.** Prefer local installs (`./bin/...`) over `sudo` or global package managers unless the user is fine with them.
- **Ship something small that works** over something big that doesn't.

### Check-ins with Alex

Alex watches a live board of everyone hacking and builds the presentation list from it. Three calls to `https://experience.lwn.lol/api`, all `POST` with a JSON body. Every response is `{"success": true, "data": ...}` or `{"success": false, "error": "..."}`.

| When | Call | Body |
|---|---|---|
| As soon as you know the user's name | `/api/register` | `{"name": "Ada"}` (a team name is fine) → returns `data.token`. This also marks them as in `interview`. |
| Start of each later phase | `/api/progress` | `{"token": "...", "phase": "stack", "idea": "Pay-per-roast AI"}` |
| App is published and works | `/api/submit` | `{"token": "...", "demoUrl": "https://...", "repoUrl": "https://..."}` |

```bash
curl -s -X POST https://experience.lwn.lol/api/register \
  -H 'content-type: application/json' -d '{"name":"Ada"}'
```

- `phase` is one of `interview`, `stack`, `setup`, `build`, `publish`. `idea` is a one-liner (max 200 chars); send it once the user picks an idea. Phases 6–7 come after submitting and need no check-in.
- Save the token to `.experience.json` in the project and add that file to `.gitignore`. Don't print it in demos or commit it. If you lose it, register again.
- Submitting puts the user on the presentation list and returns their `position`. Resubmitting (e.g. a new tunnel URL) updates the links and keeps their place. If the URL changes, update the README too.
- `repoUrl` is optional.
- **Check-ins must never block the hack.** If a call fails, mention it once and keep building.

### Phase 1: Interview + develop the idea (≤ 10 min)

Don't rush this. The build goes fast; the idea is what makes the demo. Develop it over **up to 3 short rounds**, one message each, waiting for answers between them. Give lettered options so the user can reply in a few keystrokes (e.g. `1b 2a`), and always take their own answer instead. If they arrive with a clear idea, skip Round 2 and build on theirs.

**Round 1: You**

0. What's your name (or team name)? It goes on Alex's presentation list.
1. What areas interest you? (games, music, AI, art, sports, memes, finance, privacy, your day job, anything)
2. Coming in with an idea already, or something you want to look into? (Fine if not.)
3. Are you an engineer who cares about the architecture, or should I drive everything for you?
4. Any tools, languages, or Bitcoin libraries you know or want to use? What OS are you on, and do you have accounts anywhere for hosting (Cloudflare, Vercel, etc.)?

As soon as they answer, **register** (see Check-ins).

**Round 2: The impact** (tailor the options to their Round 1 answers)

1. What should the audience leave with? (a) a laugh (b) "I'd actually use that" (c) "wait, bitcoin can do that?" (d) mild horror: make it cursed
2. Should it connect to your life? (a) your current work or project (b) a hobby or cause you care about (c) no, pure fun
3. Who's it for? (a) the room, live at demo time (b) people like you (c) someone specific (a friend, your team, your dog)
4. What kind of bitcoin? (a) money moves: payments, tips, paywalls (b) reading the chain: blocks, fees, mempool (c) keys: signing and proving ownership (d) surprise me

**Round 3: Pick the idea**

Pitch **3 ideas** shaped by their answers (if they brought an idea or area, build on it instead of replacing it), one line each: who it's for, what it does, and an obvious "bitcoin moment" for the demo. It doesn't have to be a payment; unless they asked for money moving, mix in at least one idea that doesn't move money. Recommend one. Let them pick or remix.

Then **ask for feedback** before moving on: what would they change, add, or cut? Play the refined idea back in a line or two and keep tweaking it with them until they're happy with it (a couple of quick passes, within the 10 minutes). Don't start Phase 2 until they say it's the one.

Idea seeds to remix (don't just copy these):

- **Pay-per-prompt AI:** an oracle/roaster/poet that only answers after it gets paid.
- **Paywalled thing:** a joke, fortune, song, or secret behind a sats paywall.
- **Agent bargaining:** two AI agents negotiate a price, then actually settle.
- **Sats game:** pay to move/guess/play; winner takes the pot.
- **Tip-triggered chaos:** a payment makes something happen on screen (confetti, sound, a message on a big display).
- **Chain art:** turn live blocks, fees, or the mempool into music, art, or a game (read-only chain data).
- **Explainer agent:** paste a transaction or address and an AI explains what happened in plain English.
- **Sign in with bitcoin:** prove you hold a key by signing a message, and unlock something with it.

### Phase 2: Confirm the plan, demo + stack (≤ 2 min)

Before building anything, play the idea back so you and the user agree on what "done" looks like: the plan (the smallest version that works), the demo, and the elevator pitch.

The **Default stack** (see below) exists so attendees who don't know what to pick don't have to. **It is a suggestion, not a requirement.** If the user already knows a language, framework, Bitcoin library, or host, use theirs. If the idea fits a different tool better, propose that instead.

Send it all in one short message, for example:

```text
Plan: <the MVP in 1–2 lines: the smallest version that works, nothing extra>
Demo: <what we'll show on stage in under 3 minutes, step by step, ending on the bitcoin moment>
Pitch: <one sentence: what it is and why it's fun>

Stack:
- Bitcoin: Bark (Ark + Lightning on signet) if the idea moves money; the mempool.space API if it only reads chain data
- App: Node + Hono on port 8080
- Live updates: browser polling
- Publish: Cloudflare quick tunnel (no account needed)

Want to change anything (scope, demo, language, framework, Bitcoin library, hosting)? Otherwise I'll start setting up.
```

**Wait for the user to confirm or change it before installing or building anything.** Then adapt Phases 3–5 to whatever they chose. The plan is your scope for Build, and the demo and pitch become the talk track in Phase 6.

### Phase 3: Setup (≤ 6 min)

0. **Preflight (1 min):** check OS/CPU architecture, runtime versions, and that you can run shell commands and fetch URLs. Report anything missing before going further.
1. **Get docs into context** for whatever Bitcoin tooling you're using. For the default (Bark), see **Bark reference** below.
2. **Install tools locally** where possible (e.g. into `./bin`), and add that directory to `.gitignore`. Grab the tunnel tool now too (see below).
3. **If the idea moves money, create test wallet(s)** in a fresh, dedicated data directory for this project (outside the repo or gitignored). Never reuse an existing wallet directory on the user's machine.
4. **If the idea moves money, ask for test sats right away** (see **Getting test sats** below). Give the user the address and the steps, then keep setting up while the sats arrive.
5. **Get a public URL now, not at the end.** Serve a hello-world page on port 8080, start the tunnel (below), and have the user open the URL on their phone. Leave the tunnel running for the rest of the session. Don't share the URL yet.
6. **Checkpoint: one small payment settles** (if the idea moves money), e.g. a payer wallet pays a 100-sat invoice from the app's wallet. Don't stall on it: if sats haven't arrived, start building anyway (creating invoices needs no balance), keep chasing sats in parallel, and move down the list in **Getting test sats**.

**Public URL.** Default: a **Cloudflare quick tunnel**, which needs no account:

```bash
# Download cloudflared locally (no brew/sudo needed). macOS Apple Silicon example:
mkdir -p bin && curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz | tar -xz -C bin
./bin/cloudflared tunnel --no-autoupdate --url http://127.0.0.1:8080
```

First confirm the app answers locally (`curl -s http://127.0.0.1:8080` returns *your app*, not a wallet API). The `https://<random>.trycloudflare.com` URL appears in the tunnel's output within seconds. Run it in the background or a second terminal so it outlives your other commands. **Tunnel your app's port only, never the wallet daemon's port.** Restarting your app keeps the same URL; restarting the tunnel gives you a new one. Keep the laptop awake. Other options: `npx wrangler deploy` (Cloudflare Workers/Pages), `npx vercel --prod`, ngrok, or anything else.

**Getting test sats.** An app that only *receives* needs no sats: Bark can receive Lightning into an empty wallet. You still need a **payer** with sats to test with and to pay during the demo, such as a second "customer" wallet in its own data dir, or someone in the room. Apps that send or pay out (prizes, agents settling a deal) need their own wallet funded. Sources, fastest first:

1. **Alex, in the room.** Have the user share their address the way Alex says to.
2. **The 2nd.dev faucet:** https://signet.2nd.dev/ (instant, sends to an Ark address). The user logs in with GitHub in their browser. The page needs JavaScript, so you can't use it yourself. It has a daily limit.
3. **A neighbour.** Anyone with signet sats can pay your invoice or send to your Ark address directly. Ask the people at your table.
4. **On-chain (slow, start early).** Bark's signet is the standard signet, so any signet faucet works (e.g. https://alt.signetfaucet.com). Have it send to your wallet's on-chain address (`bark onchain address`), then board the coins (`bark board --all`, or barkd's board endpoints). The signet Ark server needs 1 confirmation, about 10 minutes but sometimes longer.

If you still have no sats by minute 30, demo with the room: show the invoice QR on stage and invite anyone with signet sats to pay it live. Never fake a payment.

Using another test network? Use its faucet, and prefer instant off-chain payments (Ark, Lightning, ecash) over on-chain ones, which wait for blocks.

### Phase 4: Build (≤ 14 min)

Build checklist:

- The bitcoin part works end to end (a payment arrives, chain data loads, a signature verifies: whatever the idea needs)
- The "bitcoin moment" visibly does something in the demo
- If it takes payments: the app shows a **QR code** for a **stable** receiving address (tips) or a per-request invoice (unlocks), and a real payment from your payer has gone through
- Wallet data and tokens are not in git

**If a payment unlocks something** (fortune, paywall, prompt), verify it properly:

- Create a **per-request** invoice (or payment request) on the server, and unlock only when *that* invoice is paid. A generic balance increase can't tell you who paid.
- Fulfil each payment **exactly once**, even if the wallet reports it twice.
- The amount is fixed when you create the invoice. If your price changes (rising prices, auctions), honour each paid invoice at the amount it was created with, and show a fresh invoice at the new price.
- Show clear **pending / paid / error** states in the UI.
- Quick check with a few `curl` calls (not a test suite): unpaid access is refused, a duplicate notification doesn't double-unlock, and two customers paying at once each get their own result.

Tips:

- Keep the wallet server-side and talk to it from your app's backend. Don't call a wallet daemon from the browser.
- Generate one receiving address up front and reuse it. Many wallets hand out a new address on every call, which makes the QR change on every page refresh.
- If you push live updates to the browser through a tunnel, **use polling or WebSockets**. Server-Sent Events can get buffered by quick tunnels and never arrive.

### Phase 5: Publish + submit (≤ 5 min)

The public URL has been up since Setup (if you couldn't get one then, do it now; see **Public URL**).

**Before you share the URL:** check that no test/fake-payment routes slipped in, and that nothing lets the audience trigger effects without paying.

**Check it from outside.** `curl -s https://<your-url>` from your machine goes through Cloudflare, so it counts, but the real check is the user loading it on their phone. Then do the bitcoin moment once through the public URL.

Write a 3-line `README.md` with the public URL, what it does, and how to use it.

**Submit** once that works (see Check-ins): send `demoUrl`, plus `repoUrl` if the code is pushed somewhere. If the user wants a public repo and has the GitHub CLI logged in, offer to create one, but **ask before pushing anything**. Then tell the user they're on the presentation list and their position.

### Phase 6: Talk track (≤ 3 min)

Stub out a talk of **under 3 minutes** (demos start at **12:45**) using Alex's hackathon formula. Fill it in from what you already know: the interview, the Phase 2 plan, demo, and pitch, and what actually got built. If part of the plan didn't make it, demo what works.

| Section | Share | What goes in it |
|---|---|---|
| **Background** | ~25% (45 s) | Uncover the problem (*who* needs *what* because *why*), then lead to the solution |
| **Demo** | ~50% (90 s) | Introduce the project (the Phase 2 pitch, updated if the build changed), then demo it live, ending on the bitcoin moment |
| **Review** | ~25% (45 s) | Why the project is important, why it matters for human rights (or freedom, or bitcoin adoption), and future/final thoughts |

Funny and cursed projects use the same structure; a straight-faced answer to "why it matters" is half the joke. Keep the stub this short:

```text
Background: Bitcoin & dogs
- Bitcoin adoption is hard.
- "If only we could use my dog to promote bitcoin adoption…"

Demo
- Introduce "Remote Feeder"
- Navigate to the site, show my dog, pay the invoice, show my dog getting fed

Why it matters
- Scale my dog's love to the world!
- Encourages dog lovers to download a bitcoin wallet
```

Send the stub and ask the user to edit it. **Wait until they agree on it**, then save it to `talk.md` in the project. Suggest one out-loud run-through with a timer, and have a backup ready (a screen recording or a screenshot of it working) in case the Wi-Fi or tunnel dies on stage.

### Phase 7: Slides (optional)

Once the talk track is agreed, offer once to make slides. If the user says no, you're done. If yes:

- **Only with time to spare before their slot, and never at the app's expense.** Apart from adding the `/slides` route below, don't touch the working app. If the slides aren't done in about 10 minutes, present without them.
- **One self-contained `slides.html`** in the project: inline CSS and JS, no framework, no CDN, so it also opens straight from disk if the Wi-Fi or tunnel dies. If the app is hosted, serve it as a static route at `/slides` on the submitted URL's domain (e.g. `https://<your-url>/slides`). Alex's board finds it there and adds a Slides button, so there's no need to resubmit. Then check that the app and the bitcoin moment still work. If adding the route would mean changing anything else, just open the file from disk.
- **One slide per beat of `talk.md`**, 4–6 slides total. For the demo, one slide with the project name, the public URL, and a big QR code of it (reuse the app's QR library if it has one; otherwise the URL in huge type) so the room can follow along, then switch to the live app.
- **Controls:** → / Space / click to advance, ← to go back, F for fullscreen. Use a fixed 16:9 stage (e.g. 1600×900) scaled to fit the screen, so it looks the same on any projector.

Make the design impeccable:

- **Readable from the back row:** headlines 80px+ and body 40px+ on the 1600×900 stage. One idea and at most ~12 words per slide.
- **High contrast.** Projectors wash out colour and thin font weights.
- **Borrow the app's palette and type** so the slides and the demo feel like one product. One distinctive display face plus one clean text face, from system fonts or files in the project (never a font CDN).
- **Generous whitespace, clear hierarchy, one accent colour.** Subtle transitions only.
- **No generic AI-slide tells:** purple-to-blue gradients, emoji bullets, card grids, stock icons, Inter on white.
- If you already have a design skill installed (e.g. [Impeccable](https://impeccable.style) or Anthropic's `frontend-design`), use it. Don't stop to install one mid-hack.

Then open every slide fullscreen (screenshot them if you can) and fix anything that overflows or is hard to read.

---

## Default stack

A sensible default for people who don't have a preference. Swap any piece.

| Piece | Default | Swap for anything, e.g. |
|---|---|---|
| Bitcoin | To move money: [Bark](https://second.tech) (Ark + Lightning) on **signet**, via `barkd` + `@secondts/barkd`. To read chain data: the [mempool.space API](https://mempool.space/docs/api/rest) | Any Lightning, ecash, or on-chain library, wallet, or data API |
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
- A new wallet has **no addresses yet**. Call `POST /api/v1/wallet/addresses/next` once right after creating it. Until you do, `GET /api/v1/wallet/addresses/index/0` fails with `VTXO key 0 does not exist, please derive it first`.
- Lightning receive works with an empty wallet: `POST /api/v1/lightning/receives/invoice` with `{"amount_sat": 100, "description": "..."}` returns a BOLT11 invoice. Poll `GET /api/v1/lightning/receives/{invoice}` and treat it as paid when `state` is `settled`.
- The full API spec for the version you're running is at `http://127.0.0.1:3000/api-docs/openapi.json` (Swagger UI at `/swagger-ui`). Trust it over any example.
- TypeScript client: `npm install @secondts/barkd`, or call the REST API with plain `fetch` and an `Authorization: Bearer <token>` header. **Pass the token** either way, or every call returns 401:

```ts
import { Configuration, WalletApi, LightningApi, NotificationsApi } from "@secondts/barkd";

const config = new Configuration({
  basePath: "http://127.0.0.1:3000",
  accessToken: process.env.BARKD_TOKEN,
});
const wallet = new WalletApi(config);
const lightning = new LightningApi(config);
const notifications = new NotificationsApi(config);

await wallet.address(); // once, right after creating the wallet: derives address 0
const { address } = await wallet.peekAddress({ index: 0 }); // stable address for your QR
const balance = await wallet.balance();
const { invoice } = await lightning.generateInvoice({ /* see spec */ }); // BOLT11
const { notifications: events } = await notifications.waitNotification({}); // long-poll for payments
```

Check exact request shapes in the spec. `wallet.address()` returns a **new** address every call, so call it once at setup, then use `peekAddress({ index: 0 })` for a QR that doesn't change.

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
- bark writes the mnemonic in plain text to `<datadir>/mnemonic`, which is why the data dir must never be committed. Don't print that file, and don't paste `bark create` output into chat or onto a screen people can see.
- A payer ("customer") wallet for testing is just another CLI wallet: `BARK_DATADIR=./.wallet-payer ./bin/bark create ...`, fund it, then `./bin/bark send <invoice>`.

**Browser wallet (optional).** `@secondts/bark` (WASM) runs a wallet **in the browser only** (needs IndexedDB and HTTPS or localhost; not Node or Workers). Useful when every visitor needs their own wallet, e.g. multiplayer games on Cloudflare Pages. See [bark-sdk/wasm.md](https://second.tech/docs/bark-sdk/wasm.md).

**Other Bark SDKs:** Rust, Go, Swift, Kotlin, Dart/Flutter, React Native.

---

## If things break

- **Payment not showing up?** Sync the wallet and check the status/history endpoints before assuming failure.
- **401 from barkd?** You're not passing the token. Don't disable auth.
- **Port 3000 already in use?** barkd is using it. Move your app to 8080.
- **No sats?** Work down **Getting test sats** (Phase 3). Receiving doesn't need any; only your payer does.
- **`VTXO key 0 does not exist`?** Call `POST /api/v1/wallet/addresses/next` once, then read index 0 again.
- **On-chain funding is slow?** Boarding waits for a signet block. Ask Alex or a neighbour for off-chain sats instead.
- **Ark VTXO weirdness?** The signet Ark server runs a round every ~5 minutes; `bark refresh --all` can help. Read [learn/vtxo.md](https://second.tech/docs/learn/vtxo.md) and [learn/rounds.md](https://second.tech/docs/learn/rounds.md).
- **Live updates not arriving through the tunnel?** Switch from SSE to polling.
- **SDK method doesn't exist?** Check the spec or docs; don't guess. Fall back to the CLI.
- **Out of time?** Cut features. One working bitcoin moment beats a broken masterpiece.

---

Built for TABConf by Alex Lewin. Default Bitcoin stack: [Bark](https://second.tech) on signet.
