# AI Summit Mini-Hack

**The AI Summit's mini-hackathon, on Finite: about 90 minutes from idea to a live link.**

You and your Finite agent have about 90 minutes to turn an idea from your work into a small website that works, put it live at its own link, and submit it. Then everyone shows what they built, in under 5 minutes each.

## Humans: start here

Open a chat with your Finite agent and paste this:

```text
Read https://hack.finite.site/agent.md and follow it. Be my hackathon partner.
```

Your agent will ask about the problem you want to solve, go back and forth with you until the idea is clear, build it, publish it, and draft your talk and slides. Nothing to install: your agent builds and publishes from its own computer.

**If your agent goes quiet or seems lost, send it: `next`.** It only works while you're chatting with it.

### Quick answers

Agents: use these when your person asks.

- **Who can see my project?** You, and Alex (the host), who needs it for the presentation list. Nothing goes public unless you say so.
- **What can it be?** A website: pages, tools, checklists, guides, quizzes, calculators, maps, a searchable list. It can save what a visitor types on their own device. It can't share data between visitors or run AI live: your agent does the AI work while it builds and puts the results in the page.
- **Does it cost anything?** No.
- **Can my team help build it?** Yes. Send your agent their emails. It gives them access and a line to paste into their own agent (Claude Code, Codex, or Finite).

---

## Agents: start here

Your person sent you here; don't ask them to paste anything. You are their hackathon partner. They work in democracy and human rights: grantmakers, organizers, activists. They know their field well, and most have never built software. Keep messages short and friendly, and ask one round of questions at a time.

**Before your first reply, do these three things:**

1. Save this playbook and the checker, and start the clock:

   ```sh
   mkdir -p ~/hackathon && cd ~/hackathon
   curl -fsSL https://hack.finite.site/agent.md -o PLAYBOOK.md
   curl -fsSL https://hack.finite.site/check.py -o check.py
   python3 check.py --time
   ```

2. Write `~/hackathon/STATE.md` from the template below, with the deadline `--time` printed.
3. Save a note with your memory tool:
   `AI Summit Mini-Hack today. Before every reply: run python3 ~/hackathon/check.py --time, read ~/hackathon/STATE.md, and do the step it names in ~/hackathon/PLAYBOOK.md.`

Then send your first message (Step 1).

### STATE.md template

```markdown
# Hackathon state
Deadline: <from check.py --time>
Person: <their name>
Slug: <not yet>   Site: <not yet>
Now: Step 1

- [ ] 1. Hear the problem (name, IDEA.md started)
- [ ] 2. Clarify it together (2–3 rounds)
- [ ] 3. Plan confirmed: they said yes
- [ ] 4. Site created; check.py --early says ALL GOOD
- [ ] 5. First version live
- [ ] 6. Build it out
- [ ] 7. Talk track agreed
- [ ] 8. Slides live (or they said no)
- [ ] 9. Submitted: check.py says ALL GOOD

## Decisions
<what they chose and said no to: the idea, slides yes/no, content they'll send, teammates' emails>
```

STATE.md is the truth. If your memory, a todo list, or your recollection disagrees with it, STATE.md wins.

### Every reply

1. **Run `python3 ~/hackathon/check.py --time` and read `~/hackathon/STATE.md`.** The first says how many minutes are left; don't work it out yourself. Its `Now:` line is your step. Read that step's section of the playbook, every time:
   `sed -n '/^## Step 6/,/^## Step 7/p' ~/hackathon/PLAYBOOK.md` (with your step's number and the next).
2. **Do the work now, in this reply.** You only run when your person sends a message: anything you say you'll do "next", "meanwhile", or "until 13:55" won't happen. So build, push, and check before you answer, then tell them what you did. Answer side questions in a line, then carry on with the step.
3. **Never wait on your person for content.** If they'll send rules, numbers, or text later, use clearly marked examples now and keep going. Swap theirs in when it arrives.
4. **Write it down.** When a step is done, tick it and move `Now:`. Put every choice they make under Decisions.
5. **End every message with a status line:** `Step 6 of 9 · 48 min left · next: <what happens next>`.

**Lost?** (a new chat, a long gap, "where were we?", or `next`) Run `check.py --time`, read STATE.md, and carry on from `Now:`. If STATE.md is missing: fetch the playbook and checker again (above), look in `~/hackathon/app`, run `python3 ~/hackathon/check.py --early`, and ask your person where you got to.

**You are not done until Step 9's check says ALL GOOD.** Your person saying "thanks, this is great!" is not the end. If time runs short, cut features, slides, or polish, never Step 9. Alex calls people on stage from Step 9.

### Time

The whole thing takes about 90 minutes. Move through the steps at your person's pace; there's no schedule to keep. **When `check.py --time` says 15 minutes or less, make sure Step 9 is done:** if it isn't ticked, submit what works now, then come back to anything unfinished.

If your person asks to submit early, do Step 9 then, and come back to Steps 7–8 after.

---

## Step 1: Hear the problem

Say hello in a line and ask for their name and a problem from their work, in their own words. A typed paragraph or a voice note is fine. Give options they can answer in a tap (`1b`), and always take their own answer instead:

```text
What's your name? And:
1. Where in your work would a tool help most?
   (a) grants: calls, applications, review, reporting  (b) fundraising and donors
   (c) events and convenings  (d) working with partners  (e) field work  (f) something else
2. Is there something you already want to build? Tell me about it.
```

Tell them once: their project will be shared with Alex, the host, so he can put them on the presentation list.

When they answer, write their name in STATE.md, and create `~/hackathon/IDEA.md` with their words exactly as they said them, under `## In their words`.

## Step 2: Clarify it together (2–3 rounds)

Go back and forth until you could explain the idea to a stranger. Each round is one message with:

- **A playback:** the idea as you understand it, in 2 lines.
- **2–3 short questions**, the ones that matter most now: Who is it for? What do they do with it, step by step? What's the moment someone says "oh, nice"? What's the smallest useful version? Where does the content come from (their documents, notes, public sources)?
- **From round 2: 2–3 options** (simpler, bolder, a twist) to pick from or combine.

After each answer, update IDEA.md under `## So far` (who, what, the moment, the content). Three rounds at most, then go to Step 3 with your best version. If they have no idea at all, pitch 3 from the seeds under **What you can build**, shaped to what they told you.

It's a website (see **What you can build**): if the idea needs shared live data or logins, find the version that doesn't. A shared vote can be a checklist each person fills in on their own phone.

## Step 3: Confirm the plan

Send one message:

```text
Here's the plan:
Name: <short name>
For: <who uses it>
It does: <the smallest version that works, 1–2 lines>
Demo: <what you'll show on stage, ending on the moment people remember>
Content: <what goes in it and where it comes from, or "none">
Where: a private site for you and Alex

Shall I build it?
```

On a yes, write the plan into IDEA.md under `## Plan` and go to Step 4. On "yes, but…", make the change and go to Step 4; don't ask again.

## Step 4: Create the site

Do this right away, before you build, so the project exists and Alex can see it even if something goes wrong later. Pick a slug: lowercase letters, digits, and hyphens, from the name (`grant-fit-check`). Run these one at a time, and read each answer before the next:

```sh
mkdir -p ~/hackathon/app/site && cd ~/hackathon/app
git init -b main
git config user.name "AI Summit Mini-Hack" && git config user.email "agent@hack.finite.site"
mv ~/hackathon/IDEA.md IDEA.md
```

From now on, IDEA.md lives in `~/hackathon/app/`. Write `finite.toml`, with your slug in **both** places:

```toml
[project]
slug = "grant-fit-check"

[site]
name = "grant-fit-check"
branch = "main"
path = "site"
spa = false
```

Write `site/index.html` (just the name and one line about it; Step 5 replaces it) and `hack.json`:

```json
{
  "title": "Grant Fit Check",
  "pitch": "Applicants find out in two minutes which of our calls fits them.",
  "person": "Their name",
  "status": "building",
  "slides": null,
  "submittedAt": null
}
```

Then create the project and publish it:

```sh
fsite auth register --output json
fsite project init --config finite.toml --dry-run --output json
fsite project init --config finite.toml --output json
fsite auth git YOUR-SLUG --store --output json
```

The last command answers a `git_remote_url`. Use it:

```sh
git remote add origin THE-GIT-REMOTE-URL
git add -A && git commit -m "Start" && git push -u origin main
python3 ~/hackathon/check.py --early
```

`check.py --early` shares the site with Alex and checks it's live. **Tick Step 4 only when it says ALL GOOD**, and write the slug and the `Site:` address it prints into STATE.md. Until then, don't build: fix what it says and run it again.

Then ask once: "Is anyone on your team building with you? Send me their emails and I'll give them access." Write the answer under Decisions. Emails now or later: follow **Teammates** below, then carry on.

- **The slug is taken?** Add `-2` to it (then `-3`), in both places in `finite.toml`, and run `project init` again.
- **`requester_email_required`?** Ask your person for their email, then follow your Finite Sites skill (`finite-sites-publishing-finite`): `fsite auth sites-key request EMAIL`, they send you the code from their inbox, `fsite auth sites-key add EMAIL CODE`, then both `project init` commands with `--owner-email EMAIL`.
- **Anything else fails?** Read the error and fix what it names. If you're stuck after two tries, tell your person in one line, and ask them to find Alex.
- Never change `slug`, `name`, or `path` in `finite.toml` after this step: pushes stop publishing.

Only `site/` is on the web. IDEA.md, hack.json, and talk.md stay in the project for Alex, off the site.

## Step 5: First version live

Build the first real version of the idea (not the placeholder), check it (see **Checking your pages**), and push: `git add -A && git commit -m "First version" && git pull --rebase && git push`. Every push publishes in about a minute. Send your person the site link in a message of its own, to open on their phone: it's their chance to change course.

## Step 6: Build it out

Build the plan in small steps. Each reply: `git pull --rebase` first (teammates may have pushed), make one improvement, check it, push, and tell your person what changed in a line. Use your website skill (`website-building-finite`) for design if you have one.

- Works on a phone; the demo moment works start to finish.
- Everything it needs is in `site/`: no server, no API keys, nothing from their private notes they didn't agree to show.

**Step 6 is done** when the plan's demo works start to finish. Then push and go to Step 7 in the same reply. Waiting on content from your person doesn't hold up Step 6: it stays as examples until it arrives.

## Step 7: Talk track

Write a talk of **under 5 minutes** in Alex's format, from what you know (the interview, the plan, what got built):

```text
Background: who needs what, and why. The problem in one story.
Demo (the longest part): introduce it in one sentence, then show it live, ending on the moment people remember.
Why it matters: for the people it's for, and what you'd do next.
```

Save it as `~/hackathon/app/talk.md`, push, and send it to your person to change anything. When they agree (or ask for changes you then make), tick Step 7. Suggest one out-loud run-through with a timer, and a screenshot of it working as a backup.

## Step 8: Slides

Check Decisions first: if they already said no to slides, tick Step 8. Otherwise ask once: "Want slides for your talk? I'll make 4–6 and put them on your site." Write the answer under Decisions. On a no, tick Step 8.

On a yes: one self-contained page at `site/slides/index.html` (inline CSS and JS, no CDN), one slide per beat of `talk.md`, 4–6 slides. → / Space / click advances, ← goes back, F is fullscreen. A fixed 16:9 stage (1600×900) scaled to fit the screen. Headlines 80px+, body 40px+, at most 12 words a slide, high contrast, the site's own colours and type. For the demo, one slide with the name, then switch to the live site.

Check them, push, and set `"slides": "/slides/"` in `hack.json`. If they aren't done when there are 15 minutes left, set `"slides": null` and go to Step 9.

## Step 9: Submit

1. In `hack.json`: `"status": "ready"`, `"submittedAt"` the output of `date -u +%Y-%m-%dT%H:%M:%SZ`, `"person"` their name, `"slides"` `"/slides/"` or `null`, and `title` and `pitch` matching what was built.
2. `git add -A && git commit -m "Submit" && git pull --rebase && git push`
3. Run `python3 ~/hackathon/check.py`. If it says anything but ALL GOOD, fix each line it names and run it again.
4. On ALL GOOD, tick Step 9 and tell your person: they're on the presentation list, here's their site (and slides), and before their slot, open both on the laptop they'll present from.

If they change anything after this, push it and run `check.py` again.

---

## Teammates

Captains often have teammates (engineers) who build with them from their own agents: Claude Code, Codex, or a Finite agent. For each email your person gives you:

```sh
fsite project grant YOUR-SLUG --email THEIR-EMAIL --role editor --send-invite --output json
fsite project share YOUR-SLUG --add-email THEIR-EMAIL --output json
```

The first lets them push to the project and emails them an invite with a one-time code; the second lets them open the live site. Then, if there's no `TEAM.md` yet, write one in `~/hackathon/app/` from the plan, and push it:

```markdown
# Team
Captain: <your person's name>
Site: <the Site: address from STATE.md>
- <teammate email>: <task, or "not started">

## Tasks
- [ ] <a piece of the plan someone can build alone, e.g. "the Arabic translations"> (<who>)
```

Give your person one line per teammate to send them:

```text
Paste this into your coding agent (Claude Code, Codex, or Finite): Read https://hack.finite.site/join.md and join project YOUR-SLUG as THEIR-EMAIL
```

Their agent asks them for the code from the invite email. If a grant fails, read the error, fix what it names (often a typo in the email), and try again.

Working together: teammates push to the same `main`. Run `git pull --rebase` before every change and before every push. If a push is refused, pull with `--rebase`, keep both sides' work, and push again. Never `git push --force`: it deletes your teammates' work. You alone submit (Step 9), and you alone change `hack.json` and `finite.toml`. After each pull, read `TEAM.md` and `git log --oneline -5`, and tell your person in a line what teammates pushed.

## Checking your pages

The live site is private, so fetching it yourself may answer 404 or a sign-in page. Check your files locally instead:

```sh
cd ~/hackathon/app/site && python3 -m http.server 8765
```

Open `http://localhost:8765/` in your browser if you have one (at phone width), or fetch it with `curl` and read it. Your person checks the live site on their phone.

## What you can build

A Finite Site serves the files in `site/` as they are: HTML, CSS, JavaScript, images, data files. So:

- **Yes:** pages, interactive tools, checklists, guides, quizzes, calculators, decision trees, timelines, searchable lists, maps from data you put in, printable one-pagers, letter or email drafts (a `mailto:` link), saving a visitor's answers on their own device (`localStorage`).
- **No:** data shared between visitors, logins, sending email, a server, calling an AI model from the page, API keys.
- **The AI is you.** Summarize, classify, write, and translate while you build, and put the results in the page's data. A guide that answers 40 common questions from their documents works without an AI on the page.
- **Their content makes it theirs:** their organization's published documents (guidelines, calls for proposals, reports, a scoring rubric), their notes, or public sources. Ask before you put anything private on the site: everyone who can open it can read every file in `site/`.

Idea seeds to remix (don't just copy these):

- **Grant fit check:** an applicant answers 5 questions and sees which call fits them, and why.
- **Know your rights:** a few questions lead to what applies to you, in plain language.
- **Proposal self-review:** score your own proposal against the funder's rubric before you submit.
- **Field security checklist:** step by step, with progress saved on the phone.
- **Donor briefing:** one page on a funder, from their notes, before a meeting.
- **Partner directory:** search and filter the organizations you work with.
- **Action letter:** fill in a few fields and get a letter ready to send to an official.
- **Explainer:** a campaign's story as an interactive timeline.

## If things break

- **A push is refused because someone pushed first** (`rejected`, `fetch first`, `non-fast-forward`)? `git pull --rebase`, keep both sides' work, push again. Never `git push --force`.
- **A push is refused for any other reason?** Run `fsite auth git YOUR-SLUG --store --output json` again to refresh the login, then push.
- **Not sure what's live?** `python3 ~/hackathon/check.py --early` says.
- **Out of time?** Cut features. Never skip Step 9.

---

Built by Alex Lewin, on Finite.
