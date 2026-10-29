// QA for the playbook on a real Finite agent: a simulated attendee (Claude, `claude -p`)
// chats with one of your agents through `fragment ask`, in a fresh chat each run, so the
// agent works on its real model, computer, and fragment CLI. Usage:
//   node qa/run.mjs <scenario> --agent <agent> [--persona-model sonnet] [--turns 20] [--wait 1200]
//     [--home <dir>]   run fragment with this HOME: a second account's pairing, for a teammate's agent
// Before the run it clears the agent's ~/hackathon (in a chat of its own) and takes the
// agent off the board, so each run starts fresh. The apps it makes are yours: delete them
// after with `fragment rm`. The transcript and the board's entry land in
// /tmp/mini-hack-qa/<scenario>-<time>/.
import { execFile } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SCENARIOS } from "./scenarios.mjs";

const BOARD = "mini-hack--hack";
const END = "[[END]]";
const FIRST = "Read https://mini-hack.finite.place/agent.md and follow it. Be my hackathon partner.";

function parseArgs(argv) {
  const [scenario, ...rest] = argv;
  const opts = { scenario, personaModel: "sonnet", turns: 20, wait: 1200 };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i].replace(/^--/, "").replace(/-(\w)/g, (_, c) => c.toUpperCase());
    opts[key] = ["turns", "wait"].includes(key) ? Number(rest[i + 1]) : rest[i + 1];
  }
  if (!SCENARIOS[opts.scenario]) throw new Error(`unknown scenario ${opts.scenario}: one of ${Object.keys(SCENARIOS).join(", ")}`);
  if (!opts.agent) throw new Error("--agent <your agent's name> is required (fragment list: kind agent)");
  return opts;
}

let fragmentHome = null; // --home: the CLI's pairing lives under HOME; claude keeps the real one

function run(command, args, { input, timeoutMs = 30 * 60 * 1000 } = {}) {
  const env = command === "fragment" && fragmentHome ? { ...process.env, HOME: fragmentHome } : process.env;
  return new Promise((resolve, reject) => {
    const child = execFile(command, args, { env, timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) =>
      error && !stdout ? reject(new Error(`${command} ${args[0]}: ${(stderr || error.message).trim().split("\n").pop()}`)) : resolve(stdout),
    );
    child.stdin.end(input ?? "");
  });
}

async function fragment(...args) {
  const out = await run("fragment", [...args, "--json"]);
  const answer = JSON.parse(out.trim().split("\n").pop());
  if (!answer.ok) throw new Error(`fragment ${args.slice(0, 2).join(" ")}: ${JSON.stringify(answer.error ?? answer).slice(0, 300)}`);
  // `fragment call` answers {id, replayed, result}: the operation's own answer is `result`.
  return args[0] === "call" ? answer.data.result : answer.data;
}

// One message to the agent in the run's chat; its replies once its turn ends.
async function ask(opts, chat, text) {
  const data = await fragment("ask", opts.agent, text, "--chat", chat, "--wait", String(opts.wait));
  const replies = data.answer?.replies ?? [];
  const said = replies.map((r) => r.text).filter(Boolean).join("\n\n");
  return { text: said || `(no reply: ${data.answer?.outcome ?? "the wait ran out"})`, outcome: data.answer?.outcome ?? "timeout" };
}

async function personaTurn(opts, scenario, session, agentText) {
  const system = `${scenario.persona}\n\nYou are chatting with your AI agent at a hackathon, the AI Summit Mini-Hack. Write only your next chat message, in character: short and natural, like texting. Never mention that you are simulated. Don't bring up publishing, submitting, sharing, Alex's board or slides unless the agent does. The host told you: if your agent goes quiet or seems stuck, send it "next". When the agent says everything is done and submitted, or there is nothing left for you to do, reply with a short goodbye followed by ${END}.`;
  const args = ["-p", "--model", opts.personaModel, "--system-prompt", system, "--tools", "", "--output-format", "json", "--setting-sources", "project"];
  const out = await run("claude", session ? [...args, "--resume", session] : args, { input: `Your agent says:\n\n${agentText}\n\nYour reply:` });
  const result = JSON.parse(out);
  return { session: result.session_id, text: String(result.result).trim(), cost: result.total_cost_usd || 0 };
}

async function freshStart(opts, identity, say) {
  const board = await fragment("call", BOARD, "board", "--input", "{}");
  if (board.participants.some((p) => p.id === identity)) {
    await fragment("call", BOARD, "remove", "--input", JSON.stringify({ id: identity }));
    say("harness", "Took the agent's old entry off the board.");
  }
  const chat = await fragment("create", `mh-qa-reset-${Date.now().toString(36)}`, "--template", "chat", "--title", "Mini-hack QA reset");
  const reset = await ask(opts, chat.name, "QA housekeeping, not part of any hackathon: run `rm -rf ~/hackathon`, and remove any notes about the AI Summit Mini-Hack from your memory. Reply `done` when both are done.");
  say("harness", `Reset chat ${chat.name}: ${reset.text.slice(0, 300)}`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const scenario = SCENARIOS[opts.scenario];
  fragmentHome = opts.home ?? null;
  const dir = join("/tmp/mini-hack-qa", `${opts.scenario}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  mkdirSync(dir, { recursive: true });
  const log = join(dir, "transcript.md");
  const say = (who, text) => appendFileSync(log, `\n### ${who} (${new Date().toLocaleTimeString()})\n\n${text}\n`);
  console.log(`${opts.scenario}: ${dir}`);

  const identity = (await fragment("status", opts.agent)).npub;
  // A teammate's agent never talks to the board (its account isn't the board's editor).
  if (!scenario.teammate) await freshStart(opts, identity, say);
  const chat = await fragment("create", `mh-qa-${opts.scenario}-${Date.now().toString(36)}`, "--template", "chat", "--title", `Mini-hack QA: ${opts.scenario}`);
  say("harness", `Chat ${chat.name}, agent ${opts.agent} (${identity}).`);

  let persona = null;
  let cost = 0;
  let message = scenario.firstMessage || FIRST;
  let turn = 0;
  for (; turn < opts.turns; turn += 1) {
    say(`person (turn ${turn})`, message);
    const started = Date.now();
    const reply = await ask(opts, chat.name, message).catch((error) => ({ text: `(ask failed: ${error.message})`, outcome: "error" }));
    say(`agent (turn ${turn}, ${Math.round((Date.now() - started) / 1000)} s, ${reply.outcome})`, reply.text);
    const next = await personaTurn(opts, scenario, persona, reply.text).catch((error) => ({ error }));
    if (next.error) { say("harness", `persona turn failed: ${next.error.message}`); break; }
    persona = next.session;
    cost += next.cost;
    if (next.text.includes(END)) { say("person (end)", next.text.replace(END, "").trim()); break; }
    message = next.text;
  }

  const board = scenario.teammate ? { participants: [] } : await fragment("call", BOARD, "board", "--input", "{}");
  const entry = board.participants.find((p) => p.id === identity) ?? null;
  say("board entry", "```json\n" + JSON.stringify(entry, null, 2) + "\n```");
  const summary = { scenario: opts.scenario, chat: chat.name, turns: turn + 1, personaCost: Number(cost.toFixed(2)), submitted: entry?.phase === "ready", entry, dir };
  writeFileSync(join(dir, "result.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
