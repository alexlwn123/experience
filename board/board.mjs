// Alex's presentation board for the Finite Sites edition. Every attendee's agent grants
// alexlwn@finite.vip editor on its project (playbook Step 4), so `fsite project list` on
// Alex's own key lists them all. This fetches each project's repo, reads its hack.json,
// and writes board/out/index.html: ready projects first, in the order they submitted.
//   node board/board.mjs            build the board once and print it
//   node board/board.mjs --watch 60 rebuild it every 60 seconds
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const CACHE = join(homedir(), ".cache", "agent-camp-board");
const OUT = join(dirname(fileURLToPath(import.meta.url)), "out", "index.html");
const MAX_TEXT = 4000;

const fsite = async (...args) => JSON.parse((await run("fsite", [...args, "--output", "json"])).stdout);
const git = (dir, ...args) => run("git", ["-C", dir, ...args]);
const readText = (dir, name) => (existsSync(join(dir, name)) ? readFileSync(join(dir, name), "utf8").slice(0, MAX_TEXT) : "");

async function fetchRepo(project) {
  const dir = join(CACHE, project.slug);
  if (!existsSync(dir)) {
    const { git_remote_url: url } = await fsite("auth", "git", project.slug, "--store");
    await run("git", ["clone", "-q", url, dir]);
  } else {
    await git(dir, "fetch", "-q", "origin");
    await git(dir, "reset", "-q", "--hard", "origin/HEAD");
  }
  return dir;
}

async function entry(project) {
  const base = { slug: project.slug, url: project.site?.url ?? null, published: project.site?.status === "published" };
  try {
    const dir = await fetchRepo(project);
    if (!existsSync(join(dir, "hack.json"))) return null; // a project of Alex's from outside the hackathon
    const hack = JSON.parse(readText(dir, "hack.json"));
    const { stdout } = await git(dir, "log", "-1", "--format=%cI");
    return { ...base, ...hack, lastPush: stdout.trim(), idea: readText(dir, "IDEA.md"), talk: readText(dir, "talk.md") };
  } catch (error) {
    return { ...base, error: String(error.message || error).split("\n")[0] };
  }
}

function order(entries) {
  const ready = entries.filter((e) => e.status === "ready").sort((a, b) => String(a.submittedAt).localeCompare(String(b.submittedAt)));
  const rest = entries.filter((e) => e.status !== "ready").sort((a, b) => String(b.lastPush).localeCompare(String(a.lastPush)));
  return [...ready, ...rest];
}

const escape = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function render(entries, at) {
  const rows = entries.map((e, i) => {
    const slides = e.slides && e.url ? `<a href="${escape(e.url.replace(/\/$/, "") + e.slides)}">Slides</a>` : "";
    const details = [e.talk && `<details><summary>Talk</summary><pre>${escape(e.talk)}</pre></details>`,
      e.idea && `<details><summary>Idea</summary><pre>${escape(e.idea)}</pre></details>`].filter(Boolean).join("");
    return `<li class="${escape(e.status || "unknown")}" data-slug="${escape(e.slug)}">
  <label><input type="checkbox"> ${e.status === "ready" ? i + 1 : "·"}</label>
  <div><h2>${escape(e.title || e.slug)} <small>${escape(e.person || "")}</small></h2>
  <p>${escape(e.pitch || e.error || "")}</p>
  <p class="links">${e.url ? `<a href="${escape(e.url)}">Site</a>` : ""} ${slides} <span>${escape(e.status || "no hack.json")} · last push ${escape(e.lastPush || "never")}</span></p>${details}</div>
</li>`;
  }).join("\n");
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="60"><title>Agent Camp board</title>
<style>body{font:16px system-ui;max-width:60rem;margin:2rem auto;padding:0 1rem}li{display:flex;gap:1rem;padding:.75rem 0;border-top:1px solid #ddd}
li:not(.ready){opacity:.6}li.presented{text-decoration:line-through;opacity:.4}h2{margin:0;font-size:1.2rem}small{font-weight:400;color:#666}
.links span{color:#888;font-size:.85rem}pre{white-space:pre-wrap;background:#f6f6f6;padding:.5rem}ol{list-style:none;padding:0}</style>
<h1>Agent Camp: ${entries.filter((e) => e.status === "ready").length} ready, ${entries.length} in all</h1><p>Updated ${escape(at)}. Tick a box once they've presented (kept in this browser).</p>
<ol>${rows}</ol>
<script>document.querySelectorAll("li").forEach((li)=>{const box=li.querySelector("input"),key="presented:"+li.dataset.slug;
const show=()=>li.classList.toggle("presented",box.checked);box.checked=localStorage.getItem(key)==="1";show();
box.addEventListener("change",()=>{localStorage.setItem(key,box.checked?"1":"0");show();});});</script>`;
}

async function build() {
  const { projects } = await fsite("project", "list");
  const theirs = projects.filter((p) => p.role !== "owner");
  mkdirSync(CACHE, { recursive: true });
  const entries = order((await Promise.all(theirs.map(entry))).filter(Boolean));
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, render(entries, new Date().toLocaleTimeString()));
  console.log(`\n${new Date().toLocaleTimeString()}  ${OUT}`);
  for (const [i, e] of entries.entries()) {
    const mark = e.status === "ready" ? String(i + 1).padStart(2) : " ·";
    console.log(`${mark} ${(e.title || e.slug).padEnd(32)} ${(e.person || "").padEnd(20)} ${e.error ? `ERROR ${e.error}` : e.status || "no hack.json"}`);
  }
}

async function main() {
  const watch = process.argv.indexOf("--watch");
  const seconds = watch >= 0 ? Number(process.argv[watch + 1] || 60) : 0;
  for (;;) {
    await build().catch((error) => console.error(`board: ${error.message}`));
    if (!seconds) return;
    await new Promise((done) => setTimeout(done, seconds * 1000));
  }
}

main();
