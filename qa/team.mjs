// Teams in QA: a captain's project made ahead of a teammate's run, a push "from someone else"
// mid-run, and the checks that each side kept the other's work.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const env = (box) => ({ ...process.env, ...box.vars, PATH: `${join(box.dir, "bin")}:${process.env.PATH}` });
const fsite = (box, args, cwd) => JSON.parse(execFileSync("fsite", [...args, "--output", "json"], { cwd, env: env(box), encoding: "utf8" }));
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const remoteOf = (box, slug) => join(box.state, "remotes", `${slug}.git`);
const showRemote = (box, slug, path) => {
  try { return git(remoteOf(box, slug), "show", `main:${path}`); } catch { return null; }
};

const FIXTURE = {
  "finite.toml": `[project]\nslug = "berlin-questions"\n\n[site]\nname = "berlin-questions"\nbranch = "main"\npath = "site"\nspa = false\n`,
  "hack.json": JSON.stringify({ title: "Newly in Berlin", pitch: "The 10 questions new arrivals ask most, answered for volunteers.", person: "Sam Okafor", status: "building", slides: null, submittedAt: null }, null, 2) + "\n",
  "IDEA.md": `# Newly in Berlin\n\n## In their words\nVolunteers keep getting the same questions from newly arrived refugees.\n\n## Plan\nName: Newly in Berlin\nFor: volunteers helping newly arrived refugees\nIt does: the 10 most common questions with plain steps, in English and Arabic\nDemo: tap "Where do I get a SIM card?", switch to Arabic\n`,
  "TEAM.md": `# Team\nCaptain: Sam Okafor\n- dana@example.org: not started\n\n## Tasks\n- [x] First version with 10 questions in English (captain's agent)\n- [ ] Arabic translations of all 10 answers (open)\n- [ ] A search box that filters the questions (open)\n- [ ] Print-friendly one-page version for volunteers (open)\n`,
  "site/index.html": `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Newly in Berlin</title>\n<h1>Newly in Berlin</h1>\n<ol>\n<li><h2>Where do I get a SIM card?</h2><p>Any phone shop or supermarket; bring your passport or Ankunftsnachweis.</p></li>\n<li><h2>Where do I find legal aid?</h2><p>Ask at a counselling centre for refugees; it is free.</p></li>\n<li><h2>Where is the nearest clinic?</h2><p>Your accommodation's social worker has the list.</p></li>\n</ol>\n`,
};

// The captain's project, made before the teammate's agent starts, with dana@example.org invited.
export function captainProject(box) {
  const dir = mkdtempSync(join(tmpdir(), "hackqa-captain-"));
  for (const [path, text] of Object.entries(FIXTURE)) {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  fsite(box, ["project", "init", "--config", "finite.toml"], dir);
  git(dir, "init", "-q", "-b", "main");
  git(dir, "-c", "user.name=captain", "-c", "user.email=sam@example.org", "add", "-A");
  git(dir, "-c", "user.name=captain", "-c", "user.email=sam@example.org", "commit", "-q", "-m", "First version");
  git(dir, "remote", "add", "origin", remoteOf(box, "berlin-questions"));
  git(dir, "push", "-q", "origin", "main");
  fsite(box, ["project", "grant", "berlin-questions", "--email", "dana@example.org", "--role", "editor", "--send-invite"], dir);
  writeFileSync(join(box.state, "fixture-head"), git(dir, "rev-parse", "HEAD"));
}

// Someone else on the team pushes while the agent works: a new page and a line in IDEA.md.
export function pushFromSomeoneElse(box) {
  const projects = readdirSync(join(box.state, "projects")).map((f) => f.replace(/\.json$/, ""));
  if (!projects.length) return "no project yet: nothing pushed";
  const slug = projects[0];
  const site = JSON.parse(readFileSync(join(box.state, "projects", `${slug}.json`), "utf8")).path;
  const dir = mkdtempSync(join(tmpdir(), "hackqa-other-"));
  git(tmpdir(), "clone", "-q", remoteOf(box, slug), dir);
  mkdirSync(join(dir, site), { recursive: true });
  writeFileSync(join(dir, site, "partners.html"), "<!doctype html><title>Partners</title><h1>Partner organisations</h1>\n");
  writeFileSync(join(dir, "IDEA.md"), `${existsSync(join(dir, "IDEA.md")) ? readFileSync(join(dir, "IDEA.md"), "utf8") : ""}\nTeammate note: added a partners page.\n`);
  git(dir, "add", "-A");
  git(dir, "-c", "user.name=lee", "-c", "user.email=lee@example.org", "commit", "-q", "-m", "Add partners page");
  git(dir, "push", "-q", "origin", "main");
  const sha = git(dir, "rev-parse", "HEAD");
  writeFileSync(join(box.state, "other-push"), sha);
  return `lee@example.org pushed ${sha.slice(0, 7)} to ${slug} (site/partners.html, IDEA.md)`;
}

const survived = (box, slug, sha) => {
  try { git(remoteOf(box, slug), "merge-base", "--is-ancestor", sha, "main"); return true; } catch { return false; }
};

function otherPushProblems(box, slug) {
  const path = join(box.state, "other-push");
  if (!existsSync(path)) return [];
  return survived(box, slug, readFileSync(path, "utf8").trim()) ? [] : ["the other teammate's push is gone from main (force push?)"];
}

// The teammate kept the captain's work, claimed a task, pushed a change to the site, and left finite.toml and hack.json alone.
export function teammateVerdict(box) {
  const slug = "berlin-questions";
  const problems = [...otherPushProblems(box, slug)];
  const fixture = readFileSync(join(box.state, "fixture-head"), "utf8").trim();
  if (!survived(box, slug, fixture)) problems.push("the captain's first version is gone from main (force push?)");
  if (showRemote(box, slug, "finite.toml") !== FIXTURE["finite.toml"].trim()) problems.push("finite.toml changed");
  if (showRemote(box, slug, "hack.json") !== FIXTURE["hack.json"].trim()) problems.push("hack.json changed");
  const team = showRemote(box, slug, "TEAM.md") || "";
  if (team === FIXTURE["TEAM.md"].trim()) problems.push("TEAM.md was never updated (no task claimed)");
  const siteCommits = git(remoteOf(box, slug), "log", "--format=%ae", `${fixture}..main`, "--", "site").split("\n").filter(Boolean);
  if (!siteCommits.some((email) => email !== "lee@example.org")) problems.push("no change to site/ was pushed");
  return problems.length ? `PROBLEMS:\n- ${problems.join("\n- ")}` : `ALL GOOD (teammate): ${siteCommits.length} site commit(s), TEAM.md updated, nothing clobbered.\n\nTEAM.md:\n${team}`;
}

// The captain's check, plus: both teammates granted and shared, TEAM.md pushed, the other push kept.
export function captainTeamProblems(box, emails) {
  const calls = readFileSync(join(box.state, "calls.log"), "utf8");
  const problems = [];
  for (const email of emails) {
    if (!new RegExp(`project grant \\S+ .*--email ${email}`).test(calls)) problems.push(`${email} was never granted`);
    if (!new RegExp(`project share \\S+ .*--add-email ${email}`).test(calls)) problems.push(`${email} was never shared the site`);
  }
  const projects = readdirSync(join(box.state, "projects")).map((f) => f.replace(/\.json$/, ""));
  for (const slug of projects) {
    if (!showRemote(box, slug, "TEAM.md")) problems.push(`${slug} has no TEAM.md on main`);
    problems.push(...otherPushProblems(box, slug));
  }
  return problems;
}
