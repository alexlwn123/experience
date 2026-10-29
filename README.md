# AI Summit Mini-Hack

Site for the AI Summit's mini-hackathon on Finite (about 90 minutes from idea to a live link), itself a fragment: **https://mini-hack.finite.place** (the fragment `mini-hack--hack`).

Attendees (team captains) paste one line into their Finite agent's chat. The agent follows the playbook: it hears their problem, clarifies the idea with them over a few rounds, builds it as a fragment of theirs, shares it with Alex, and checks in on Alex's board, under the agent's own name and picture. Teammates join the captain's app from their own agents. (The Finite Sites edition, for the old platform, is the `finite-sites` branch; the first fragment edition is `fragment`.)

| Path | What |
|---|---|
| `/` | Homepage: the prompt to paste into a Finite agent |
| `/agent.md` | The agent playbook (`experience/site/agent.md`) |
| `/join.md` | For teammates' agents (Finite, Claude Code, Codex): join the captain's app and build with them |
| `/check.py` | The checker agents run: the clock, Step 4's early check, and Step 9's finish line |
| `/llms.txt` | A pointer to the playbook for agents |
| `/slides` | Intro deck (arrow keys or clicker, `F` for fullscreen) |
| `/dashboard` | Live registrations and presentation order (the fragment's editors) |

## How it works

`experience/` is the fragment's folder, deployed as it is (no build step):

- `fragment.json` declares the operations; `app.mjs` runs them over the app's SQLite, and `applib/` holds the rules.
- **Agents check in** with `fragment call mini-hack--hack register | progress | submit | me` (public operations). The platform tells the app which agent is calling, for which person (`call.agent`, `call.principal`), so there are no tokens; anonymous calls are refused. `progress` carries the person's name and the app's link from the moment the app exists, so the board has every app, submitted or not.
- **The agent keeps its place on disk.** It saves the playbook to `~/hackathon/PLAYBOOK.md`, keeps a nine-step checklist in `~/hackathon/STATE.md`, and saves a memory note pointing at both, so a compacted context or a new chat picks up where it was. Every message ends with `Step N of 9 · X min left · next: …`.
- **Sharing happens first, not last.** Right after the plan is agreed (Step 4), the agent creates the app (`fragment create`, then `fragment sync` into a folder) and runs `check.py --early`, which invites `alexlwn@finite.vip` as a viewer and puts the app's link on the board. Step 9 submits, and `check.py` checks it's deployed, error-free, shared with Alex, and on the presentation list. The agent isn't done until it prints ALL GOOD.
- **Teams build together.** `check.py --add-teammate EMAIL` invites a teammate as an editor and prints their line: `Read https://mini-hack.finite.place/join.md and join <app> as <email>`. They accept on finite.chat; their agent syncs the app's folder and deploys to it (`fragment deploy --dir` syncs both ways first). Only the captain's agent talks to the board.
- **Invites wait for a yes.** Alex accepts the invites to attendees' apps in finite.chat's sidebar (or `fragment invites accept <app>` with a CLI newer than 0.14.1). The dashboard's App links open once he has.
- **The dashboard** is for the fragment's editors (its owner, and co-hosts added in its share sheet). It follows `board` live through `fragment.live`, and names each agent through the platform's `__people`.

## Develop

```bash
npm test          # node:test over applib/ and the board's helpers (Node 22.13+, for node:sqlite)
```

## QA

`qa/run.mjs` runs the playbook end to end on a real Finite agent: a simulated attendee (`qa/scenarios.mjs`, on Claude) chats with one of your agents through `fragment ask`, in a fresh chat each run, so it uses the agent's real model, computer, and `fragment` CLI. Its apps are yours (delete them after with `fragment rm`). The transcript and the board's entry land in `/tmp/mini-hack-qa/<scenario>-<time>/`.

```bash
node qa/run.mjs captain --agent <your agent's name> [--persona-model sonnet] [--turns 20]
```

## Deploy

With the [fragment CLI](https://finite.chat/llms.txt) paired (`fragment login`) to the fragment's owner or an editor:

```bash
npm run deploy    # fragment deploy mini-hack--hack --dir experience
```

The fragment is `public`, as it must be: an agent acting for its person reaches a fragment that isn't theirs only at the public role. Its address `mini-hack` (`fragment address mini-hack--hack mini-hack`) serves it at mini-hack.finite.place. Add co-hosts with `fragment members add mini-hack--hack <email> --role editor`.
