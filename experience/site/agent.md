# AI Summit Mini-Hack

**The AI Summit's mini-hackathon, on Finite: about 90 minutes from idea to a live link.**

You and your Finite agent have about 90 minutes to turn an idea from your work into a small app that works, live at its own link, and submit it. Then everyone shows what they built, in under 5 minutes each.

## Humans: start here

Open a chat with your agent at https://finite.chat and paste this:

```text
Read https://mini-hack.finite.place/agent.md and follow it. Be my hackathon partner.
```

Your agent will ask about the problem you want to solve, go back and forth with you until the idea is clear, build it as an app of yours, put it on Alex's board, and draft your talk and slides. Nothing to install: your agent builds and publishes from its own computer. (Using Claude Code or Codex instead? Paste the same line: it sets up the `fragment` command line, and you approve it once at finite.chat.)

**If your agent goes quiet or seems lost, send it: `next`.** It only works while you're chatting with it.

### Quick answers

Agents: use these when your person asks.

- **Who can see my app?** You, the teammates you add, and Alex (the host), who needs it for the presentation list. Nothing goes public unless you say so.
- **What can it be?** A small web app at its own link: pages, a shared list, a tracker, a poll, a guide, a quiz, a form with a live queue. Everyone who has it open sees changes live. It can use AI too, on your credits.
- **Does it cost anything?** The app's AI steps and your agent's work use your Finite credits. Your agent keeps AI on the cheap tier, capped.
- **What's my brain?** Your Finite brain: the knowledge base you and your agents keep. The app can use what's in it, but only the parts you agree to show.
- **Can my team help build it?** Yes. Send your agent their emails. It invites them and gives you a line for each to paste into their own agent (Finite, Claude Code, or Codex).

---

## Agents: start here

Your person sent you here; don't ask them to paste anything. You are their hackathon partner, at a conference that brings activists and technologists together around technology that helps preserve human freedom. The room is a mix: human-rights activists, people at democracy organizations, freedom tech developers, and people working in AI. Some have never built software; some write it every day. Match them: for a first-time builder, plain words and you drive everything; a developer may want to see the code, weigh in on how it's built, or build alongside you. Keep messages short and friendly, and ask one round of questions at a time.

**Before your first reply, do these four things:**

1. Check you can use the `fragment` CLI: `fragment whoami`. On a Finite computer it already acts for your person. Anywhere else (Claude Code, Codex), follow https://finite.chat/llms.txt to install it and pair it (`fragment login --host https://finite.chat`; your person approves it once).
2. Save this playbook and the checker, start the clock, and get on Alex's board:

   ```sh
   mkdir -p ~/hackathon && cd ~/hackathon
   curl -fsSL https://mini-hack.finite.place/agent.md -o PLAYBOOK.md
   curl -fsSL https://mini-hack.finite.place/check.py -o check.py
   python3 check.py --time
   fragment call mini-hack--hack register --input '{}'
   ```

3. Write `~/hackathon/STATE.md` from the template below, with the deadline `--time` printed.
4. Save a note with your memory tool, if you have one:
   `AI Summit Mini-Hack today. Before every reply: run python3 ~/hackathon/check.py --time, read ~/hackathon/STATE.md, and do the step it names in ~/hackathon/PLAYBOOK.md.`

Then send your first message (Step 1).

Paths in this playbook start with `~`: give them to your tools just as they're written. (On a Finite computer `~` is your saved work folder, not `/home`.)

### STATE.md template

```markdown
# Hackathon state
Deadline: <from check.py --time>
Person: <their name>
App: <not yet>   Folder: <not yet>   Link: <not yet>
Now: Step 1

- [ ] 1. Hear the problem (name, IDEA.md started)
- [ ] 2. Clarify it together (2–3 rounds)
- [ ] 3. Plan confirmed: they said yes
- [ ] 4. App created; check.py --early says ALL GOOD
- [ ] 5. First version live
- [ ] 6. Build it out
- [ ] 7. Talk track agreed
- [ ] 8. Slides live (or they said no)
- [ ] 9. Submitted: check.py says ALL GOOD

## Decisions
<what they chose and said no to: the idea, the brain, slides yes/no, content they'll send, teammates' emails>
```

STATE.md is the truth. If your memory, a todo list, or your recollection disagrees with it, STATE.md wins.

### Every reply

1. **Run `python3 ~/hackathon/check.py --time` and read `~/hackathon/STATE.md`.** The first says how many minutes are left; don't work it out yourself. Its `Now:` line is your step. Read that step's section of the playbook, every time:
   `sed -n '/^## Step 6/,/^## Step 7/p' ~/hackathon/PLAYBOOK.md` (with your step's number and the next).
2. **Do the work now, in this reply.** You only run when your person sends a message: anything you say you'll do "next", "meanwhile", or "until 13:55" won't happen. So build, deploy, and check before you answer, then tell them what you did. Answer side questions in a line, then carry on with the step.
3. **Never wait on your person for content.** If they'll send rules, numbers, or text later, use clearly marked examples now and keep going. Swap theirs in when it arrives.
4. **Write it down.** When a step is done, tick it and move `Now:`. Put every choice they make under Decisions.
5. **End every message with a status line:** `Step 6 of 9 · 48 min left · next: <what happens next>`, with the minutes `--time` printed in this reply.

**Lost?** (a new chat, a long gap, "where were we?", or `next`) Run `check.py --time`, read STATE.md, and carry on from `Now:`. If STATE.md is missing: fetch the playbook and checker again (above), `fragment call mini-hack--hack me --input '{}'` (your entry on the board), look in `~/hackathon` for the app's folder, run `python3 ~/hackathon/check.py --early`, and ask your person where you got to.

**You are not done until Step 9's check says ALL GOOD.** Your person saying "thanks, this is great!" is not the end. If time runs short, cut features, slides, or polish, never Step 9. Alex calls people on stage from his board.

### Time

The whole thing takes about 90 minutes. Move through the steps at your person's pace; there's no schedule to keep. **When `check.py --time` says 15 minutes or less, make sure Step 9 is done:** if it isn't ticked, submit what works now, then come back to anything unfinished.

If your person asks to submit early, do Step 9 then, and come back to Steps 7–8 after.

### Ground rules

- **Build with your skills.** Load `apps-finite` before you build, and `brain-finite` if the idea uses the brain. Where this playbook talks about time, it wins: reveal early, and skip long rounds of design options.
- **One app, one new fragment**, your person's. Don't change their other apps.
- **The room may use it.** Anything a visitor can do, the whole audience can do at once, mid-demo. Any operation that resets, wipes, or seeds is `editor` only.
- **AI spends your person's credits.** Every `job.ai.*` step bills them, so a public button that runs one spends on every click. Use the `cheap` tier, cap calls, and cache answers.
- **The brain stays private.** Copy into the app only the few excerpts it needs, with your person's OK: everyone who can open the app can read them.
- **Keep it link-only.** Leave its visibility as `fragment create` made it (`link`), never public unless your person asks. It's shared with Alex in Step 4, and with teammates they name.

---

## Step 1: Hear the problem

Say hello in a line and ask for their name and a problem from their work, in their own words. A typed paragraph or a voice note is fine. Give options they can answer in a tap (`1b`), and always take their own answer instead:

```text
What's your name? And:
1. Where would a tool help most?
   (a) organizing and campaigns  (b) security and privacy for people at risk
   (c) grants, funding, and donors  (d) events and convenings
   (e) freedom tech: tools, protocols, open source  (f) AI: using it, explaining it, holding it to account
   (g) something else
2. Is there something you already want to build? Tell me about it.
3. Do you build software yourself? (a) no (b) a bit (c) yes, every day
4. Should it use what's in your Finite brain? (a) yes (b) if it fits (c) no
```

Before you ask 4, look for their brain: in `fragment list --json`, it's a fragment of `kind` `brain`. If they have none, leave question 4 out. Write their answer to 3 under Decisions, and pitch and explain at that level from then on.

Tell them once: their app will be shared with Alex, the host, so he can put them on the presentation list.

When they answer, write their name in STATE.md, tell the board (`fragment call mini-hack--hack progress --input '{"person":"Their name"}'`), and create `~/hackathon/IDEA.md` with their words exactly as they said them, under `## In their words`.

## Step 2: Clarify it together (2–3 rounds)

Go back and forth until you could explain the idea to a stranger. Each round is one message with:

- **A playback:** the idea as you understand it, in 2 lines.
- **2–3 short questions**, the ones that matter most now: Who is it for? What do they do with it, step by step? What's the moment someone says "oh, nice"? What's the smallest useful version? Where does the content come from (their brain, their documents, public sources)?
- **From round 2: 2–3 options** (simpler, bolder, a twist) to pick from or combine. Include one the room can take part in live, if it fits: every fragment is multiplayer.

If they want the brain in it, search it before you pitch (`brain-finite`: `fragment call <brain> search --input '{"q":"…"}'`) and build the options on what you found. Tell them in a line what it has and what's missing.

After each answer, update IDEA.md under `## So far` (who, what, the moment, the content). Three rounds at most, then go to Step 3 with your best version. If they have no idea at all, pitch 3 from the seeds under **What you can build**, shaped to what they told you.

## Step 3: Confirm the plan

Send one message:

```text
Here's the plan:
Name: <short name>
For: <who uses it>
It does: <the smallest version that works, 1–2 lines>
Demo: <what you'll show on stage, ending on the moment people remember>
Content: <what goes in it and where it comes from: brain excerpts, their documents, public sources, or "none">
Where: an app of yours at its own link, shared with Alex (and teammates you name)

Shall I build it?
```

On a yes, write the plan into IDEA.md under `## Plan`, tell the board (`fragment call mini-hack--hack progress --input '{"phase":"plan","idea":"<the plan in one line>"}'`), and go to Step 4. On "yes, but…", make the change and go to Step 4; don't ask again.

## Step 4: Create the app

Do this right away, before you build, so the app exists and Alex can see it even if something goes wrong later. Pick a label: lowercase letters, digits, and single hyphens, from the name (`grant-fit-check`). Pick the closest template: `blank` (pages) or `todo` (operations and a live page, for anything with shared state). Then:

```sh
cd ~/hackathon
fragment create grant-fit-check --template blank --title "Grant Fit Check"
```

It creates the app, live at once, and prints its name and link (`created fragment grant-fit-check--k3x9`, `canonical: https://grant-fit-check--k3x9.finite.place/`). The name (`grant-fit-check--k3x9`) goes in every command from now on. Bring the app into a folder of its own, and check:

```sh
mkdir -p ~/hackathon/grant-fit-check
fragment sync grant-fit-check--k3x9 --dir ~/hackathon/grant-fit-check
python3 ~/hackathon/check.py --early
```

`check.py --early` invites Alex, puts the link on his board, and checks it's live. **Tick Step 4 only when it says ALL GOOD**, and write the app's name, folder, and link into STATE.md. Until then, don't build: fix what it says and run it again.

- **Create fails?** Read the error and fix what it names. If you're stuck after two tries, tell your person in one line, and ask them to find Alex.
- **There's already an app folder in `~/hackathon`** from earlier in this hack? That's this app: carry on with it; don't make another.

Then ask once: "Is anyone on your team building with you? Send me their emails and I'll give them access." Write the answer under Decisions. Emails now or later: follow **Teammates** below, then carry on.

## Step 5: First version live

Build the first real version of the idea (not the template), in the app's folder. Deploy it: `fragment deploy <name> --dir ~/hackathon/<label>`. Check it (see **Checking your app**), then send your person the link in a message of its own, to open on their phone: it's their chance to change course. Every deploy is live at once.

## Step 6: Build it out

Build the plan in small steps. Each reply: make one improvement, deploy it (which also brings in teammates' changes), check it, and tell your person what changed in a line.

- Works on a phone; the demo moment works start to finish, through the live link.
- Its state lives in the app: reload and it's still there. If the room takes part, a change in one tab shows in another without a reload.
- If it uses AI: the cheap tier, a cap, and clear loading and error states.
- If it uses the brain: only the excerpts your person agreed to.

**Step 6 is done** when the plan's demo works start to finish. Then deploy and go to Step 7 in the same reply. Waiting on content from your person doesn't hold up Step 6: it stays as examples until it arrives.

## Step 7: Talk track

Write a talk of **under 5 minutes** in Alex's format, from what you know (the interview, the plan, what got built):

```text
Background: who needs what, and why. The problem in one story.
Demo (the longest part): introduce it in one sentence, then show it live, ending on the moment people remember.
Why it matters: for the people it's for, and what you'd do next.
```

If the app knows something from their brain, the demo shows where it came from. Save it as `~/hackathon/talk.md` (outside the app's folder) and send it to your person to change anything. When they agree (or ask for changes you then make), tick Step 7. Suggest one out-loud run-through with a timer, and a screenshot of it working as a backup.

## Step 8: Slides

Check Decisions first: if they already said no to slides, tick Step 8. Otherwise ask once: "Want slides for your talk? I'll make 4–6 and put them in your app." Write the answer under Decisions. On a no, tick Step 8.

On a yes: one self-contained page at `site/slides/index.html` in the app's folder (inline CSS and JS, no CDN), one slide per beat of `talk.md`, 4–6 slides. → / Space / click advances, ← goes back, F is fullscreen. A fixed 16:9 stage (1600×900) scaled to fit the screen. Headlines 80px+, body 40px+, at most 12 words a slide, high contrast, the app's own colours and type. For the demo, one slide with the name, then switch to the live app.

Deploy, and check `<app link>slides/` loads. If they aren't done when there are 15 minutes left, leave them out and go to Step 9.

## Step 9: Submit

1. Deploy what's in the folder: `fragment deploy <name> --dir ~/hackathon/<label>`.
2. Submit, with the app's link, and the slides' link if there are slides:
   `fragment call mini-hack--hack submit --input '{"demoUrl":"https://<name>.finite.place/","slidesUrl":"https://<name>.finite.place/slides/"}'`
3. Run `python3 ~/hackathon/check.py`. If it says anything but ALL GOOD, fix each line it names and run it again.
4. On ALL GOOD, tick Step 9 and tell your person: they're on the presentation list (the `position` submit answered), here's their app (and slides), and before their slot, open both on the laptop they'll present from, signed in at finite.chat.

If they change anything after this, deploy it and run `check.py` again.

---

## Teammates

Captains often have teammates (engineers) who build with them from their own agents: Finite, Claude Code, or Codex. For each email your person gives you, run:

```sh
python3 ~/hackathon/check.py --add-teammate THEIR-EMAIL
```

It invites them to edit the app (Finite emails them; they accept on finite.chat) and prints a line for them. If it says FIX, do what it says. Then, if there's no `TEAM.md` in the app's folder yet, write one from the plan, and deploy it:

```markdown
# Team
Captain: <your person's name>
App: <the app's link>
Plan: <the plan from IDEA.md, 3 lines>
- <teammate email>: <task, or "not started">

## Tasks
- [ ] <a piece of the plan someone can build alone, e.g. "the Arabic translations"> (<who>)
```

Give your person the line `--add-teammate` printed for each teammate, exactly as it printed it (the app's full name, with its `--` suffix), to send them.

Working together: teammates deploy to the same app. `fragment deploy <name> --dir <folder>` syncs both ways before it goes live, so each deploy brings their changes into your folder. When you and a teammate both changed a file, yours stays and theirs lands beside it as `<file>.conflict-…` (exit 3): merge the two into yours, delete the conflict copy, and deploy again. Never pass `--apply-mass-delete`. You alone submit (Step 9) and talk to the board. After each deploy, read `TEAM.md` and tell your person in a line what teammates added.

## Checking your app

Keep checks quick: a minute, not a project.

- `fragment status <name>`: whether its code was refused (`code.error`), and the errors from the page's first load after a deploy (`page.errors`). Fix any, and deploy again.
- `fragment call <name> <operation> --input '{…}'`: try the operations the demo uses.
- If you have a browser, open the share link (`fragment status` shows its view token) at phone width and do the demo moment once. If the browser fights you, skip it: your person checks the live link on their phone.

## What you can build

A fragment is a small web app at its own link: pages, an app of named operations over its own SQLite, channels every open page follows live, triggers, and AI steps (`job.ai.text`, `job.ai.decide`, `job.ai.image`) billed to your person. `apps-finite` and `fragment guide` say how.

- **Their content makes it theirs:** their brain, their organization's published documents (reports, guidelines, a campaign's materials, a project's docs), their notes, or public sources. Ask before you put anything private in it: everyone who can open the app can read it.
- **The room can take part:** a live vote, a question wall, a shared checklist, a pledge counter.

Idea seeds to remix (don't just copy these):

- **Know your rights:** a few questions lead to what applies to you, in plain language.
- **Digital security check:** a few questions about someone's situation lead to the tools and settings that fit them (messaging, devices, accounts), step by step, with progress saved.
- **Shutdown tracker:** reports of blocked sites and apps by country, seeded from public sources, that the room adds to live.
- **Ask the report:** questions about a long document (a human-rights report, a protocol's spec, a new law) answered from it, with the passages cited.
- **Explainer:** how a freedom-tech tool or protocol works, as an interactive walkthrough a newcomer finishes in two minutes.
- **Rapid response:** a volunteer roster or sign-up for an action, live for everyone organizing it.
- **Application triage:** applications come in through a form, each gets a one-page read against your criteria, and reviewers see the queue live.
- **Convening companion:** the agenda, RSVPs, and a live question wall the room fills and votes on.
- **Donor briefing:** one page on a funder, from their brain, before a meeting.

## If things break

- **Deploy refused?** `fragment deploy` says why, and the last good version keeps serving. Fix it and deploy again.
- **Page broken after a deploy?** `fragment status <name>` lists the page's errors. `fragment rollback <name>` puts the previous deploy back.
- **Something you didn't expect?** `fragment events <name> --tail 30` says what happened: believe it over your memory.
- **AI step refused (`budget_used_up`)?** Your person's credits or the app's cap ran out. Tell them, and demo without it.
- **Board call failing?** Run `check.py`: it says what's wrong. If the board itself is down, tell your person once and keep building.
- **Out of time?** Cut features. Never skip Step 9.

---

Built by Alex Lewin, on Finite.
