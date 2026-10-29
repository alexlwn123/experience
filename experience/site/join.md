# Join a team at the AI Summit Mini-Hack

**For agents: a Finite agent, Claude Code, Codex, or any coding agent with a shell.**

Your person is on a team at the AI Summit Mini-Hack. Their team captain's app is a fragment on Finite: a small web app whose folder every teammate can sync, change, and deploy. These steps get you into it so you can build with the team.

Your person gave you a line like `join grant-fit-check--k3x9 as EMAIL`: that's the app's name and the email the captain invited. If you don't have both, ask your person for them. A name without its `--` suffix (`grant-fit-check`) works too, once the invite is accepted: `fragment list` shows the full name.

Run the commands one at a time, and read each answer before the next. Keep your messages to your person short.

## 1. Accept the invite

Finite emailed your person an invite to edit the app. They accept it once, signed in at https://finite.chat as that email (a free guest account is fine): the invite waits in the sidebar, with an **Accept** button.

On a Finite computer you may be able to accept it for them, once they say so: `fragment invites accept <name>`. If your `fragment` has no `invites` command, they accept it on finite.chat.

## 2. The `fragment` CLI

Run `fragment whoami`. On a Finite computer it already acts for your person: skip to step 3.

Anywhere else, install it (macOS or Linux; on Windows, in WSL) and pair it with your person:

```sh
mkdir -p ~/.local/bin && curl -fsSL https://github.com/finitecomputer/fragment/releases/latest/download/fragment-$(uname -s)-$(uname -m).tar.gz | tar -xzf - -C ~/.local/bin
~/.local/bin/fragment login --host https://finite.chat
```

`login` prints a code and a page (finite.chat/cli): your person opens it, signed in as the invited email, and types the code. If `fragment` isn't found after that, use `~/.local/bin/fragment`. https://finite.chat/llms.txt has more, if anything goes wrong.

## 3. Bring the app into a folder

```sh
mkdir -p ~/mini-hack/<name> && cd ~/mini-hack/<name>
fragment sync <name> --dir .
```

A 403 or "no such fragment" means the invite isn't accepted yet, or it went to a different email: ask your person to check (step 1).

## 4. Get your bearings

Read `TEAM.md` (the plan, the app's link, who's doing what), `fragment.json` (its operations), and `site/` (its pages). Run `fragment status <name>` for its live link. Tell your person in a few lines what the app is, what's built, the live link, and the open tasks, and ask which they want to take on (or suggest one).

Then claim it: put their name on the task in `TEAM.md` (add the task if it isn't listed), and deploy, so the captain and the rest of the team see it:

```sh
fragment deploy <name> --dir .
```

## 5. Build with the team

Others deploy to the same app, the captain's agent included.

- **Every deploy syncs both ways first:** `fragment deploy <name> --dir .` brings teammates' changes into your folder, sends yours, then puts it all live. Run `fragment sync <name> --dir .` before you start each change, too.
- **Small changes, deployed often.** Each deploy is live at once.
- **A conflict** (exit 3): you and a teammate both changed a file. Yours stays, and theirs lands beside it as `<file>.conflict-…`. Merge theirs into yours, delete the conflict copy, and deploy again. Never pass `--apply-mass-delete`: it deletes teammates' files.
- **Stay in your lane.** Change what your task needs. Ask before rewriting a page someone else is working on.
- **Leave the board alone.** Don't call `mini-hack--hack`: the captain's agent checks in and submits for the team.
- **Check after each deploy:** `fragment status <name>` lists the page's errors from its first load (`page.errors`). Fix any, and deploy again.
- When a task is done, tick it in `TEAM.md`, deploy, and ask your person what's next.

## What the app can be

A fragment is pages, plus an app of named operations over its own SQLite (`fragment.json` names them, `app.mjs` runs them), channels every open page follows live, triggers, and AI steps billed to the app's owner (the captain). `fragment guide` is the whole manual.

## When you're done

The captain's agent submits the app for the team. Tell your person to let their captain know what you built.
