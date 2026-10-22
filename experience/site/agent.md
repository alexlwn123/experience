# The Alex Lewin Experience

**A 1-hour agent hack-and-tell on Finite.**

You and your Finite agent have 40 minutes to build something cool and put it live at its own link. The only rule: **by the end, it's live at its own link and the room can use it.** Useful, silly, or cursed: all welcome. Bonus points if it knows something from your brain. Then it's hack-and-tell: **demos start after the 40 minutes, under 3 minutes each.**

## Humans: start here

Open a chat with your agent on https://finite.chat and paste this:

```text
Read https://hack--hack.finite.place/agent.md and follow it. Be my hackathon partner.
```

Your agent will interview you, pitch ideas, confirm the plan and the demo with you, build your app, publish it, and draft your talk (plus slides, if you want them). There's nothing to install: your agent builds and publishes from its own computer.

### Quick answers

Agents: use these when the user asks.

- **Do I need to install anything?** No. Your agent has its own computer with everything it needs to build and publish.
- **Who can see my app?** Only who you choose. By default, anyone you give its share link to. Your agent asks before making anything public.
- **Does it cost anything?** If the app uses AI, each AI step is billed to your Finite credits, so your agent keeps it on the cheap model and caps it.
- **What's my brain?** Your Finite brain: the knowledge base you and your agents keep. An app can use what's in it, but only the parts you agree to show.

---

## Agents: your playbook

You are the attendee's hackathon partner, building on Finite with the skills you already have. Follow these phases in order. Keep your messages short; the clock is running.

### Timebox

The session is 1 hour: **40 minutes** to build and publish, then demos. Run `date` when you start; that's minute 0. If Alex calls time sooner, that's your deadline.

| Minute | Phase |
|---|---|
| 0–10 | 1. Interview + develop the idea |
| 10–12 | 2. Confirm the plan + demo |
| 12–32 | 3. Build (a first version live by minute 18) |
| 32–37 | 4. Publish + submit |
| 37–40 | 5. Talk track |
| After 40, if there's time | 6. Slides (optional) |

Send a **check-in** (below) at the start of Phases 1–4. If you're behind schedule, **cut scope, not the demo moment**. **From minute 30, stop adding features**: finish what works, then publish.

### Ground rules

- **Build with your skills.** Load `apps-finite` before you build, and `brain-finite` if the idea uses the brain. Their loop, design standards, and guardrails apply here. Where this playbook talks about time, the clock wins: reveal early, but skip long rounds of aesthetic options.
- **One app, one new fragment**, owned by your person. Don't change their other apps.
- **The room will use it.** Anything a visitor can do, the whole audience can do at once. Remove test and debug operations before you share the link, and keep anything you don't want the room to change behind an editor's role.
- **AI spends your person's credits.** Every `job.ai.*` step is billed to them, so a public button that runs one spends on every click. Use the `cheap` tier, cap calls (per visitor and in total), and cache answers. No API key is needed.
- **The brain stays private.** If the app uses the brain, search it with `brain-finite` and copy only the few excerpts the app needs. Anything in the app's files, or answered by its public operations, can be read by everyone who can open the app: ask your person before any of it goes in, and never copy the whole brain.
- **Secrets never go in files.** Use `fragment secret set` and `{{NAME}}` in `job.fetch` headers.
- **Ask before you widen access.** The share link is enough for the demo. Make the app public only if your person says yes.
- **Ship something small that works** over something big that doesn't.

### Check-ins with Alex

Alex watches a live board of everyone hacking and builds the presentation list from it. Check in with `fragment call` on the board's fragment, `hack--hack`. You show up under your own name and picture, so there's no token to keep.

| When | Call |
|---|---|
| Right after reading this | `fragment call hack--hack register --input '{}'` |
| Start of each of Phases 1–4 | `fragment call hack--hack progress --input '{"phase":"build","idea":"Dog radio"}'` |
| The app is published and works | `fragment call hack--hack submit --input '{"demoUrl":"https://…"}'` |
| You lost track | `fragment call hack--hack me --input '{}'` |

- `phase` is one of `interview`, `plan`, `build`, `publish`. `idea` is a one-liner (at most 200 characters); send it once the user picks an idea. Phases 5–6 come after submitting and need no `progress` check-in.
- `demoUrl` is the link the CLI gave you for the app (its share link, unless it's public). Submitting puts the user on the presentation list and answers their `position`. Submitting again keeps their place: always send `demoUrl`, and add `slidesUrl` once there are slides (a new `demoUrl` without `slidesUrl` drops the old slides).
- **Check-ins must never block the hack.** If a call says `rate_limited`, wait a few seconds and try once more; if a call still fails, mention it once and keep building. The next check-in catches the board up.

### Phase 1: Interview + develop the idea (≤ 10 min)

Don't rush this. The build goes fast; the idea is what makes the demo. Start with one quick round about the user, then grill the idea for **3–5 rounds** before committing to anything. Each round is one message; wait for answers between them. Give choices the user can answer in a tap (your `clarify` tool, or lettered options like `1b 2a`), and always take their own answer instead.

**Round 1: You**

1. What areas interest you? (games, music, AI, art, sports, memes, your day job, a cause you care about, anything)
2. Coming in with an idea already, or something you want to look into? (Fine if not.)
3. Should it use what's in your brain? (a) yes, that's the point (b) if it fits (c) no
4. Do you want to see how it works under the hood, or should I drive everything?

Tell them they'll be on Alex's presentation list under your name.

**Then grill the idea (3–5 rounds)**

Dig into what they actually want to build. Each round is 2–4 sharp questions tailored to what they've said so far, and from the second round on, give them fresh options too (ideas, variations, twists), not just questions. Stop at 3 rounds if they're excited about something; go up to 5 if it's still fuzzy. If they arrived with a clear idea, start at **Push back** and grill theirs.

A typical arc (adapt it; don't read it out):

1. **Impact.** What should the audience leave with? (a) a laugh (b) "I'd actually use that" (c) "wait, an agent built that in 20 minutes?" (d) mild horror: make it cursed. Should it connect to your life? (a) your current work or project (b) a hobby or cause you care about (c) no, pure fun. Who's it for? (a) the room, live at demo time (b) people like you (c) someone specific (a friend, your team, your dog)
2. **Options.** Pitch **3 ideas** shaped by their answers (if they brought an idea or area, build on it instead of replacing it), one line each: who it's for, what it does, and the moment the demo lands on. If they want the brain in it, make at least one idea use it. Include at least one the room can take part in live: every fragment is multiplayer. Recommend one, and let them pick or remix.
3. **Push back.** Grill their pick: what's the one moment the room will remember? What makes it *theirs* rather than a generic demo? Offer 2–3 variations (simpler, bigger, weirder) to choose from or combine.
4. **Make it demoable.** What happens on stage, step by step? Does the room take part (open the link, vote, post, play)? What's the first thing to cut if time runs short?
5. **Last call.** Play the idea back in two lines and ask what they'd change, add, or cut. Repeat until they're happy.

**Don't start Phase 2 until they say it's the one.**

Idea seeds to remix (don't just copy these):

- **Room game:** everyone opens the link and plays at once: a quiz, a vote, a drawing relay, a guessing game.
- **Ask my brain:** answers questions from the excerpts of your brain you chose to share, with sources.
- **Oracle with a personality:** a roaster, poet, or fortune teller that answers in character (capped, on the cheap model).
- **Room-powered chaos:** what visitors do makes something happen on the big screen: confetti, sound, a message wall.
- **Tool your team would use:** a tracker, board, or checklist from your day job, live for everyone who has it open.
- **Explainer:** paste something confusing (a contract clause, an error, a menu in another language) and get it in plain words.
- **Webhook toy:** something that reacts to a service you already use: a form, a repo push, a calendar.

### Phase 2: Confirm the plan + demo (≤ 2 min)

Before building anything, play the idea back so you and the user agree on what "done" looks like: the plan (the smallest version that works), the demo, and the elevator pitch. Send it all in one short message, for example:

```text
Plan: <the MVP in 1–2 lines: the smallest version that works, nothing extra>
Demo: <what we'll show on stage in under 3 minutes, step by step, ending on the moment the room remembers>
Pitch: <one sentence: what it is and why it's fun>
Shape: <a live page, plus only what the idea needs: shared state, an AI step, brain excerpts, a trigger>

Want to change anything? Otherwise I'll start building.
```

**Wait for the user to confirm or change it before building anything.** The plan is your scope for Build, and the demo and pitch become the talk track in Phase 5.

### Phase 3: Build (≤ 20 min)

Make a new fragment from the closest template (`apps-finite` lists them) and deploy it early. **Have a first version live by minute 18** and send your person its link to open on their phone. Then build out the plan, deploying as you go.

Build checklist:

- The demo moment works end to end through the live link, not just in your head.
- Its state lives in the app: reload and it's still there. If the room takes part, a change in one tab shows in another without a reload.
- If it uses AI: the cheap tier, a cap, and clear loading and error states.
- If it uses the brain: only the excerpts your person agreed to, and nothing else from it.
- No test or debug operation is left that a visitor can call.

After each deploy, `fragment status <app>` shows the page's errors from its first load; check it before you move on.

### Phase 4: Publish + submit (≤ 5 min)

**Check it like a visitor.** Open the live link in your browser at phone width and do the demo moment once through it. Have your person open it on their phone too.

**Before you share the link:** check that no test or debug operation slipped in, and that nothing lets the room run up AI costs or change what it shouldn't.

Give the app a good link preview: its `meta.title` and `meta.description` in `fragment.json`.

**Submit** once that works (see Check-ins): send `demoUrl`. Submitting shares the link with Alex, and with the room at demo time: tell your person you're doing it. If they'd like the room to open it without the share link, ask whether to make it public. Then tell them they're on the presentation list, and their position.

### Phase 5: Talk track (≤ 3 min)

Stub out a talk of **under 3 minutes** using Alex's hackathon formula. Fill it in from what you already know: the interview, the Phase 2 plan, demo, and pitch, and what actually got built. If part of the plan didn't make it, demo what works.

| Section | Share | What goes in it |
|---|---|---|
| **Background** | ~25% (45 s) | Uncover the problem (*who* needs *what* because *why*), then lead to the solution |
| **Demo** | ~50% (90 s) | Introduce the project (the Phase 2 pitch, updated if the build changed), then demo it live, ending on the moment the room remembers |
| **Review** | ~25% (45 s) | Why it matters (to the people it's for, or to the world), and what you'd do next |

Funny and cursed projects use the same structure; a straight-faced answer to "why it matters" is half the joke. Keep the stub this short:

```text
Background: Dogs & distance
- My dog gets lonely when I travel.
- "If only the whole room could feed my dog…"

Demo
- Introduce "Remote Feeder"
- Open the link, show my dog, everyone presses Feed, watch the bowl fill live

Why it matters
- Scale my dog's love to the world!
- Every visitor becomes a dog sitter
```

Send the stub and ask the user to edit it. **Wait until they agree on it**, then keep it in `talk.md` on your computer, outside the app's folder (everything in that folder is published with the app). Suggest one out-loud run-through with a timer, and have a backup ready (a screen recording or a screenshot of it working) in case the Wi-Fi dies on stage.

### Phase 6: Slides (optional)

Once the talk track is agreed, offer once to make slides. If the user says no, you're done. If yes:

- **Only with time to spare before their slot, and never at the app's expense.** Apart from adding the slides page below, don't touch the working app. If the slides aren't done in about 10 minutes, present without them.
- **One self-contained page at `site/slides/index.html`** in the app's fragment: inline CSS and JS, no framework, no CDN. Deploy and open it at `/slides` on the app's address. For a share link, `/slides` goes before the `?view=…`: `https://<app>.finite.place/slides?view=…`, never after it. Then submit again with the same `demoUrl` and that address as `slidesUrl`, so Alex's board shows a Slides button. Then check that the app and the demo moment still work.
- **One slide per beat of `talk.md`**, 4–6 slides total. For the demo, one slide with the project name, the app's link, and a big QR code of it (or the link in huge type) so the room can follow along, then switch to the live app.
- **Controls:** → / Space / click to advance, ← to go back, F for fullscreen. Use a fixed 16:9 stage (e.g. 1600×900) scaled to fit the screen, so it looks the same on any projector.

Make the design impeccable:

- **Readable from the back row:** headlines 80px+ and body 40px+ on the 1600×900 stage. One idea and at most ~12 words per slide.
- **High contrast.** Projectors wash out colour and thin font weights.
- **Borrow the app's palette and type** so the slides and the demo feel like one product. One distinctive display face plus one clean text face, from system fonts or files in the fragment (never a font CDN).
- **Generous whitespace, clear hierarchy, one accent colour.** Subtle transitions only.
- **No generic AI-slide tells:** purple-to-blue gradients, emoji bullets, card grids, stock icons, Inter on white.
- If you have design skills (`popular-web-designs`, `design-md`, `impeccable`), use them. Don't stop to install one mid-hack.

Then open every slide fullscreen in your browser (screenshot them) and fix anything that overflows or is hard to read.

---

## If things break

- **Deploy refused?** `fragment deploy` says why, and the last good version keeps serving. Fix it and deploy again.
- **Page broken after a deploy?** `fragment status <app>` lists the errors from the page's first load. `fragment rollback <app>` puts the previous deploy back.
- **Something you didn't expect?** `fragment events <app> --tail 30` says what happened: believe it over your memory.
- **A job stuck?** `fragment runs <app> --status held` shows held runs; fix the cause, then `fragment replay <app> <run>`.
- **AI step refused (`budget_used_up`)?** Your person's credits or the app's cap ran out. Tell them, and demo without it.
- **Check-in failing?** Mention it once and keep building; Alex can sort out the board.
- **Out of time?** Cut features. One working demo moment beats a broken masterpiece.

---

Built by Alex Lewin, on Finite.
