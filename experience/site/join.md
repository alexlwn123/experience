# Join a team at the AI Summit Mini-Hack

**For agents: Claude Code, Codex, a Finite agent, or any coding agent with a shell.**

Your person is on a team at the AI Summit Mini-Hack. Their team captain's project is a Finite Site: a git repository where every push to `main` publishes the website. These steps get you into it so you can build with the team.

Your person gave you a line like `join project SLUG as EMAIL`. The captain's agent has already given that email access, and Finite Sites sent it an invite ("You've been invited to collaborate on SLUG") with a one-time code. If you don't have the slug and the email, ask your person for them.

Run the commands one at a time, and read each answer before the next. Keep your messages to your person short.

## 1. Install fsite

If `fsite --version` prints a version, skip this step (Finite agents have it already). Otherwise install it (macOS or Linux):

```sh
case "$(uname -s):$(uname -m)" in
  Darwin:arm64) asset=fsite-macos-aarch64 ;;
  Darwin:x86_64) asset=fsite-macos-x86_64 ;;
  Linux:x86_64) asset=fsite-linux-x86_64 ;;
  *) echo "unsupported platform" >&2; exit 1 ;;
esac
tmp="$(mktemp -d)" && cd "$tmp"
base=https://github.com/finitecomputer/finite-releases/releases/download/fsite-latest
curl -fsSLO "$base/$asset.tar.gz" && curl -fsSLO "$base/$asset.tar.gz.sha256"
{ shasum -a 256 -c "$asset.tar.gz.sha256" || sha256sum -c "$asset.tar.gz.sha256"; } && tar -xzf "$asset.tar.gz"
mkdir -p ~/.local/bin && install -m 0755 fsite ~/.local/bin/fsite && ~/.local/bin/fsite --version
```

If `fsite` isn't found after that, use `~/.local/bin/fsite`.

## 2. Verify the email

Ask your person for the code in the invite email: it's in the line `fsite auth redeem EMAIL CODE`. A code works once, for 15 minutes. If theirs expired or they can't find the email, run `fsite auth login EMAIL` and ask them for the new one.

```sh
fsite auth redeem EMAIL CODE --output json
```

## 3. Clone the project

```sh
fsite auth git SLUG --email EMAIL --store --output json
```

It answers a `git_remote_url`. Clone it, and sign your commits with your person's name:

```sh
git clone THE-GIT-REMOTE-URL ~/mini-hack/SLUG && cd ~/mini-hack/SLUG
git config user.name "THEIR NAME" && git config user.email "EMAIL"
```

`fsite auth git … refused`? The captain's agent hasn't added this email yet, or added a different one: tell your person to check the email with their captain.

## 4. Get your bearings

Read `IDEA.md` (the idea and the plan), `TEAM.md` (who's on the team and who's doing what), and `site/` (the website). Tell your person in a few lines what the project is, what's built, the live site's link (see **What the site can be**), and the open tasks, and ask which they want to take on (or suggest one).

Then claim it: put their name on the task in `TEAM.md` (add the task if it isn't listed), and push, so the captain and the rest of the team see it:

```sh
git add TEAM.md && git commit -m "TEAM: <name> takes <task>" && git pull --rebase && git push
```

## 5. Build with the team

Others are pushing to the same project, the captain's agent included.

- **Pull before each change:** `git pull --rebase`.
- **Small commits, pushed often:** `git add -A && git commit -m "<what changed>" && git pull --rebase && git push`. Every push to `main` publishes the site in about a minute.
- **Push refused** (someone pushed first)? `git pull --rebase`, resolve any conflict keeping both sides' work, then push. **Never `git push --force`**: it deletes your teammates' work from the live site.
- **Stay in your lane.** Change what your task needs. Ask before rewriting a page someone else is working on.
- **Don't change `finite.toml`** (pushes stop publishing) **or `hack.json`** (the captain's agent submits the project).
- When a task is done, tick it in `TEAM.md`, push, and ask your person what's next.

## What the site can be

Only `site/` is on the web, and it's served as it is: HTML, CSS, JavaScript, images, data files. No build step, no server, no logins, no data shared between visitors, no API keys, no AI calls from the page. A visitor's answers can be saved on their own device (`localStorage`). Do the AI work yourself while you build (summarize, write, translate) and put the results in the page's data.

Check pages locally: `cd site && python3 -m http.server 8765`, then open `http://localhost:8765/`. The live site is at `https://NAME.finite.site/`, where NAME is the `name` under `[site]` in `finite.toml` (it's also the `Site:` line in `TEAM.md`). It's private to the team: send your person the link, and they open it by signing in with their email. Your own fetch of it may answer a sign-in page.

## When you're done

The captain's agent submits the project for the team. Tell your person to let their captain know what you built.
