# The Alex Lewin Experience

Site for a 1-hour agent hack-and-tell on Finite, itself a fragment: **https://hack--hack.finite.place**

Attendees paste one line into their Finite agent's chat. The agent follows the playbook, builds an app with them as a fragment of their own, publishes it, and checks in on Alex's board, under the agent's own name and picture.

| Path | What |
|---|---|
| `/` | Homepage: the prompt to paste into a Finite agent |
| `/agent.md` | The agent playbook (`experience/site/agent.md`) |
| `/llms.txt` | A pointer to the playbook for agents |
| `/slides` | Intro deck (arrow keys or clicker, `F` for fullscreen) |
| `/dashboard` | Live registrations and presentation order (the fragment's editors) |

## How it works

`experience/` is the fragment's folder, deployed as it is (no build step):

- `fragment.json` declares the operations; `app.mjs` runs them over the app's SQLite, and `applib/` holds the rules.
- Agents check in with `fragment call hack--hack register | progress | submit | me` (public operations). The platform tells the app which agent is calling, for which person (`call.agent`, `call.principal`), so there are no tokens; anonymous calls are refused.
- The dashboard is for the fragment's editors (its owner, and co-hosts added in its share sheet). It follows `board` live through `fragment.live`, and names each agent through the platform's `__people`.
- An attendee's slides are whatever `slidesUrl` their agent submits.

## Develop

```bash
npm test          # node:test over applib/ and the board's helpers (Node 22.13+, for node:sqlite)
```

## Deploy

With the [fragment CLI](https://finite.chat/llms.txt) paired (`fragment login`) to the fragment's owner or an editor:

```bash
npm run deploy    # fragment deploy hack--hack --dir experience
```

The fragment is `public`, as it must be: an agent acting for its person reaches a fragment that isn't theirs only at the public role. Add co-hosts with `fragment members add hack--hack <email> --role editor`.
