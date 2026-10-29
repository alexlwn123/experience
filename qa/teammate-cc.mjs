// A teammate on Claude Code: a fresh coding agent (claude -p) follows join.md into a captain's
// app, in a sandbox HOME that holds only a paired CLI config (no fragment binary: it installs
// the released one), and a simulated engineer answers it. Usage:
//   node qa/teammate-cc.mjs <app name> <invited email> <config.json of that account's pairing>
// Pair the second account first: HOME=/tmp/x fragment login --host https://finite.chat --no-wait,
// approved at finite.chat/cli by that account (its config.json is under /tmp/x, in macOS's
// Library/Application Support/fragment/). It must have accepted the captain's invite.
// Transcript: /tmp/mini-hack-qa/teammate-cc-<time>/transcript.md.
import { execFile } from "node:child_process";
import { appendFileSync, copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [APP, EMAIL, CONFIG] = process.argv.slice(2);
if (!APP || !EMAIL || !CONFIG) throw new Error("usage: node qa/teammate-cc.mjs <app> <email> <config.json>");
const B = join("/tmp/mini-hack-qa", `teammate-cc-${new Date().toISOString().replace(/[:.]/g, "-")}`);
const CONFIG_DIR = join(B, "home", "Library", "Application Support", "fragment");
mkdirSync(CONFIG_DIR, { recursive: true });
mkdirSync(join(B, "work"), { recursive: true });
copyFileSync(CONFIG, join(CONFIG_DIR, "config.json"));
writeFileSync(join(B, "env.sh"), `export HOME="${B}/home"\nexport PATH="${B}/home/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin"\nunset FRAGMENT_HOST FRAGMENT_AS_AGENT FRAGMENT_FOR\n`);
console.log(B);
const END = "[[END]]";
const AGENT = `You are a coding agent (like Claude Code or Codex) running in a terminal on a software engineer's laptop.
Your person's messages arrive as user turns; your final text each turn is what they see.
You have a shell (the Bash tool) with git, python3, node and curl, and the file tools. Keep messages short.`;
const PERSONA = `You are Alex, a software engineer helping your team captain Sam at the AI Summit Mini-Hack, chatting with your coding agent. Sam's agent invited your email (${EMAIL}) to edit Sam's app, and you already accepted the invite on finite.chat. Your fragment CLI is already paired on this laptop.
When asked what to work on, take the agent's suggestion if it's small (one more topic, a wording fix, a small feature); otherwise ask for something small.
When the agent has deployed a change and says it's live, say thanks, that's all for now, followed by ${END}. Write only your next chat message, short, like texting.`;

const log = (who, text) => appendFileSync(`${B}/transcript.md`, `\n### ${who} (${new Date().toLocaleTimeString()})\n\n${text}\n`);
const claude = (args, input, env = {}) =>
  new Promise((resolve, reject) => {
    const child = execFile("claude", ["-p", ...args, "--output-format", "json", "--setting-sources", "project"],
      { cwd: `${B}/work`, env: { ...process.env, ...env }, timeout: 20 * 60 * 1000, maxBuffer: 64 << 20 },
      (error, stdout) => { try { resolve(JSON.parse(stdout)); } catch { reject(error ?? new Error(stdout.slice(0, 300))); } });
    child.stdin.end(input);
  });

let agent = null;
let persona = null;
let message = `Read https://mini-hack.finite.place/join.md and join ${APP} as ${EMAIL}`;
for (let turn = 0; turn < 10; turn++) {
  log(`person (turn ${turn})`, message);
  const a = await claude(["--model", "sonnet", "--system-prompt", AGENT, "--tools", "Bash,Read,Write,Edit", "--permission-mode", "bypassPermissions",
    ...(agent ? ["--resume", agent] : [])], message, { CLAUDE_ENV_FILE: `${B}/env.sh` });
  agent = a.session_id;
  log(`agent (turn ${turn}, ${a.num_turns} steps, $${(a.total_cost_usd ?? 0).toFixed(2)})`, a.result);
  const p = await claude(["--model", "sonnet", "--system-prompt", PERSONA, "--tools", "", ...(persona ? ["--resume", persona] : [])], `Your agent says:\n\n${a.result}\n\nYour reply:`);
  persona = p.session_id;
  if (String(p.result).includes(END)) { log("person (end)", String(p.result).replace(END, "").trim()); break; }
  message = String(p.result).trim();
}
console.log("done");
