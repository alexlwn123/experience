# Agent Camp Hack-and-Tell

Site for a 2.5-hour agent hack-and-tell on Finite, served as a Finite Site: **https://hack.finite.site**

Attendees paste one line into their Finite agent's chat. The agent follows the playbook: it hears their problem, clarifies the idea with them over a few rounds, builds it as a Finite Site of their own, shares it with Alex, and submits it with its talk and slides. (The fragment edition, with a live check-in board, is the `fragment` branch.)

| Path | What |
|---|---|
| `/` | Homepage: the prompt to paste into a Finite agent |
| `/agent.md` | The agent playbook (`experience/site/agent.md`) |
| `/check.py` | The finish-line check agents run before they're done |
| `/llms.txt` | A pointer to the playbook for agents |
| `/slides` | Intro deck (arrow keys or clicker, `F` for fullscreen) |

## How it works

`experience/site/` is served as it is (`finite.toml`; no build step). Finite Sites serves static files only, so there is no check-in API; the attendees' own projects are the record:

- **The agent keeps its place on disk.** It saves the playbook to `~/hackathon/PLAYBOOK.md`, keeps a nine-step checklist in `~/hackathon/STATE.md`, and saves a memory note pointing at both, so a compacted context or a new chat picks up where it was. Every message ends with `Step N of 9 · next: …`.
- **Sharing happens first, not last.** Right after the plan is agreed (Step 4), the agent creates the project, grants `alexlwn@finite.vip` editor on it (`fsite project grant --nip05`), shares the site with him as a viewer, and pushes a placeholder. From then on every push publishes.
- **Submitting is a file.** Each project carries `hack.json` (title, pitch, person, status, slides), `IDEA.md` (the idea in the attendee's words, then clarified), and `talk.md`, outside the served `site/`. Step 9 sets `"status": "ready"` and runs `check.py`, which checks the site is published, Alex is on it, `hack.json` is complete, and everything is pushed. The agent isn't done until it prints ALL GOOD.

## The board

`fsite project list` on Alex's key lists every project granted to him. The board fetches each one and writes `board/out/index.html`: ready projects in the order they submitted, with links to each site and its slides, the talk track, and the idea.

```bash
npm run board     # node board/board.mjs --watch 60 (needs fsite, signed in as alexlwn@finite.vip)
```

## QA

`qa/run.mjs` runs the playbook end to end with a headless agent (standing in for a Finite agent on a small model) and a simulated attendee (`qa/scenarios.mjs`), against a stand-in `fsite` backed by local git repos (`qa/bin/`). Each scenario moves the agent to a new chat partway through, to test that it finds its place again. The transcript, the agent's files, fsite's call log, and `check.py`'s verdict land in `/tmp/hackqa/<scenario>-<time>/`.

```bash
node qa/run.mjs vague-grantmaker [--agent-model haiku] [--persona-model sonnet] [--turns 26]
```

## Deploy

With `fsite` signed in as the owner, push to the Project Repository's `main` (`fsite auth git hack --store` for its remote). The first time, `fsite project init --config finite.toml`, then make the site public: `fsite project share hack --public --yes-public`.
