// QA for the playbook: a headless agent (standing in for a Finite Hermes agent) follows
// experience/site/agent.md with a simulated attendee, against a stand-in fsite. Usage:
//   node qa/run.mjs <scenario> [--agent-model haiku] [--persona-model sonnet] [--turns 26]
// Leaves the transcript, the agent's files, fsite's call log and check.py's verdict in
// /tmp/hackqa/<scenario>-<time>/.
import { execFile } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { SCENARIOS } from "./scenarios.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(ROOT, "experience", "site");
const TURN_TIMEOUT_MS = 12 * 60 * 1000;
const END = "[[END]]";

const AGENT_PROMPT = `You are a Finite agent: a personal AI agent that runs on its own computer and chats with your person in Finite Chat.
Your person's messages arrive as user turns; your final text each turn is what they see in the chat.
Your computer has a shell (the Bash tool) with git, python3, node, curl and fsite (the Finite Sites CLI). Use the file tools too.
You have no web browser: to check a page, read its files, or open it with a quick script.
Your memory tool is the shell command: memory add "<note>". Notes you save there are shown to you at the start of every new chat.
Keep chat messages short, like a chat app.`;

function parseArgs(argv) {
  const [scenario, ...rest] = argv;
  const opts = { scenario, agentModel: "haiku", personaModel: "sonnet", turns: 26 };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i].replace(/^--/, "").replace(/-(\w)/g, (_, c) => c.toUpperCase());
    opts[key] = key === "turns" ? Number(rest[i + 1]) : rest[i + 1];
  }
  if (!SCENARIOS[opts.scenario]) throw new Error(`unknown scenario ${opts.scenario}: one of ${Object.keys(SCENARIOS).join(", ")}`);
  return opts;
}

function serveSite() {
  const types = { ".md": "text/markdown", ".py": "text/x-python", ".html": "text/html", ".txt": "text/plain" };
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
    const file = join(SITE, path.endsWith("/") ? `${path}index.html` : path);
    if (!file.startsWith(SITE) || !existsSync(file)) return res.writeHead(404).end("not found");
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(readFileSync(file));
  });
  return new Promise((done) => server.listen(0, "127.0.0.1", () => done(server)));
}

function claude(args, { cwd, env, input }) {
  return new Promise((resolve, reject) => {
    const child = execFile("claude", ["-p", ...args, "--output-format", "json", "--setting-sources", "project"],
      { cwd, env: { ...process.env, ...env }, timeout: TURN_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout) => {
        try {
          const result = JSON.parse(stdout);
          if (result.is_error || !result.result) return reject(new Error(`claude: ${result.terminal_reason || stdout.slice(0, 300)}`));
          resolve(result);
        } catch {
          reject(error || new Error(`claude answered no JSON: ${stdout.slice(0, 300)}`));
        }
      });
    child.stdin.end(input);
  });
}

function sandbox(name, port) {
  const dir = join("/tmp/hackqa", `${name}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  const home = join(dir, "home");
  const state = join(dir, "state");
  mkdirSync(home, { recursive: true });
  mkdirSync(state, { recursive: true });
  cpSync(join(ROOT, "qa", "bin"), join(dir, "bin"), { recursive: true });
  writeFileSync(join(state, "calls.log"), "");
  writeFileSync(join(state, "MEMORY.md"), "");
  const vars = { HOME: home, HACKQA_STATE: state, HACKQA_PORT: String(port), GIT_AUTHOR_NAME: "agent",
    GIT_AUTHOR_EMAIL: "agent@example.com", GIT_COMMITTER_NAME: "agent", GIT_COMMITTER_EMAIL: "agent@example.com" };
  const envFile = join(dir, "env.sh");
  writeFileSync(envFile, [...Object.entries(vars).map(([k, v]) => `export ${k}="${v}"`), `export PATH="${join(dir, "bin")}:$PATH"`].join("\n") + "\n");
  return { dir, home, state, vars, envFile };
}

async function agentTurn(box, opts, session, message) {
  const memory = readFileSync(join(box.state, "MEMORY.md"), "utf8").trim();
  const system = memory ? `${AGENT_PROMPT}\n\n## Your memory\n${memory}` : AGENT_PROMPT;
  const args = ["--model", opts.agentModel, "--system-prompt", system, "--permission-mode", "bypassPermissions",
    "--tools", "Bash,Read,Write,Edit"];
  const result = await claude(session ? [...args, "--resume", session] : args,
    { cwd: box.home, env: { CLAUDE_ENV_FILE: box.envFile, ...box.vars, HOME: process.env.HOME }, input: message });
  return { session: result.session_id, text: result.result, cost: result.total_cost_usd || 0, turns: result.num_turns };
}

async function personaTurn(box, opts, scenario, session, agentText) {
  const system = `${scenario.persona}\n\nYou are chatting with your AI agent at a hackathon. Write only your next chat message, in character: short and natural, like texting. Never mention that you are simulated. Don't bring up publishing, submitting, sharing, Alex's list or slides unless the agent does. The host told you: if your agent goes quiet or seems stuck, send it "next". When the agent says everything is done, or there is nothing left for you to do, reply with a short goodbye followed by ${END}.`;
  const input = `Your agent says:\n\n${agentText}\n\nYour reply:`;
  const args = ["--model", opts.personaModel, "--system-prompt", system, "--tools", ""];
  const result = await claude(session ? [...args, "--resume", session] : args, { cwd: box.dir, env: {}, input });
  return { session: result.session_id, text: result.result.trim(), cost: result.total_cost_usd || 0 };
}

function check(box) {
  return new Promise((resolve) => {
    execFile("python3", [join(box.home, "hackathon", "check.py"), join(box.home, "hackathon", "app")],
      { cwd: box.home, env: { ...process.env, ...box.vars, PATH: `${join(box.dir, "bin")}:${process.env.PATH}` } },
      (error, stdout, stderr) => resolve(`${stdout}${stderr}`.trim() || String(error)));
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const scenario = SCENARIOS[opts.scenario];
  const server = await serveSite();
  const box = sandbox(opts.scenario, server.address().port);
  if (scenario.taken) box.vars.HACKQA_TAKEN = scenario.taken.join(",");
  writeFileSync(box.envFile, `${readFileSync(box.envFile, "utf8")}export HACKQA_TAKEN="${(scenario.taken || []).join(",")}"\n`);
  const log = join(box.dir, "transcript.md");
  const say = (who, text) => appendFileSync(log, `\n### ${who}\n\n${text}\n`);
  console.log(`${opts.scenario}: ${box.dir}`);

  let agent = null;
  let persona = null;
  let cost = 0;
  let message = "Read https://hack.finite.site/agent.md and follow it. Be my hackathon partner.";
  let turn = 0;
  for (; turn < opts.turns; turn += 1) {
    if (scenario.resetAt === turn) {
      agent = null;
      say("harness", `New chat: the agent starts a fresh session (memory only).`);
    }
    if (scenario.squeezeAt === turn) {
      const deadline = Math.floor(Date.now() / 1000) + 12 * 60;
      writeFileSync(join(box.home, "hackathon", "deadline"), String(deadline));
      say("harness", "The clock jumps: 12 minutes left.");
    }
    say(`person (turn ${turn})`, message);
    const reply = await agentTurn(box, opts, agent, message).catch((error) => ({ error }));
    if (reply.error) { say("harness", `agent turn failed: ${reply.error.message}`); break; }
    agent = reply.session;
    cost += reply.cost;
    say(`agent (turn ${turn}, ${reply.turns} steps)`, reply.text);
    const next = await personaTurn(box, opts, scenario, persona, reply.text).catch((error) => ({ error }));
    if (next.error) { say("harness", `persona turn failed: ${next.error.message}`); break; }
    persona = next.session;
    cost += next.cost;
    if (next.text.includes(END)) { say("person (end)", next.text.replace(END, "").trim()); break; }
    message = next.text;
  }
  server.close();
  const verdict = existsSync(join(box.home, "hackathon", "check.py")) ? await check(box) : "check.py was never downloaded";
  say("check.py", "```\n" + verdict + "\n```");
  const summary = { scenario: opts.scenario, turns: turn + 1, cost: Number(cost.toFixed(2)), allGood: verdict.includes("ALL GOOD"), dir: box.dir };
  writeFileSync(join(box.dir, "result.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
