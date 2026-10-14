# The Alex Lewin Experience

Site for a 1-hour Bitcoin agent hack-and-tell at TABConf: **https://experience.lwn.lol**

Attendees paste one line into their coding agent. The agent follows the playbook, registers them, builds a project where bitcoin changes hands on a test network, and submits it for the presentation list.

| Path | What |
|---|---|
| `/` | Homepage: the prompt to paste into an agent |
| `/agent.md` | The agent playbook (`content/agent.md`) |
| `/slides` | Intro deck (arrow keys or clicker, `F` for fullscreen) |
| `/dashboard` | Live registrations and presentation order (admin key required) |
| `/api/register`, `/api/progress`, `/api/submit` | Agent check-ins, proxied to Convex |

## Stack

- Static site built by `build.ts` and deployed on Vercel (`vercel.json` holds the rewrites)
- [Convex](https://convex.dev) backend in `convex/`: HTTP routes in `http.ts`, data and admin functions in `participants.ts`
- Dashboard in `src/`, bundled with esbuild and subscribed to Convex live

## Develop

```bash
pnpm install
pnpm test                 # vitest + convex-test
npx convex dev            # dev backend; writes CONVEX_URL to .env.local
set -a; . ./.env.local; set +a; pnpm build   # builds dist/
```

## Deploy

Pushing to `main` deploys everything. Vercel's build runs `npx convex deploy` (using `CONVEX_DEPLOY_KEY` from Vercel's Production env), which pushes the backend and then runs `node --experimental-strip-types build.ts` with `CONVEX_URL` set. Other branches don't deploy (`git.deploymentEnabled` in `vercel.json`).

Manual deploy, if you need one:

```bash
vercel deploy --prod                        # same build as a push to main: backend + site
npx convex env set ADMIN_KEY <key> --prod   # dashboard key (one-time)
```

Get the current dashboard key with `npx convex env get ADMIN_KEY --prod`.
