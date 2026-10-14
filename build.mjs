import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { build } from "esbuild";

const SITE_URL = "https://experience.lwn.lol";
const OUT_DIR = "dist";
const CONVEX_URL = process.env.CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error("CONVEX_URL is not set. Use the production Convex deployment URL (https://<name>.convex.cloud).");
}

const markdown = await readFile("content/agent.md", "utf8");

const llmsTxt = `# The Alex Lewin Experience

> A 1-hour Bitcoin (signet) agent hackathon at TABConf. Coding agents: read the full playbook and follow it.

- [Agent playbook](${SITE_URL}/agent.md): interview the attendee, pick an idea that involves bitcoin, build it, and publish.
`;

// Same sunburst as the slides, rendered at build time so the homepage needs no JS for it.
function sunburstSvg() {
  const rays = Array.from({ length: 72 }, (_, i) => {
    const angle = (i / 72) * Math.PI * 2;
    const inner = i % 2 === 0 ? 150 : 230;
    const [x1, y1, x2, y2] = [inner, inner, 500, 500].map((r, k) =>
      (k % 2 === 0 ? Math.cos(angle) : Math.sin(angle)) * r,
    );
    const width = i % 2 === 0 ? 1.4 : 0.7;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="${width}"/>`;
  });
  const rings = [110, 190, 330, 460].map(
    (r, i) => `<circle r="${r}" fill="none" stroke="currentColor" stroke-width="${i === 0 ? 2 : 1}"${i % 2 ? ' stroke-dasharray="2 10"' : ""}/>`,
  );
  return `<svg viewBox="-500 -500 1000 1000">${[...rays, ...rings].join("")}</svg>`;
}

const fill = (template, values) =>
  Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{{${key}}}`, () => value), template);

const html = fill(await readFile("content/home.html", "utf8"), {
  SITE_URL,
  SUNBURST: sunburstSvg(),
  PLAYBOOK_JSON: JSON.stringify(markdown).replace(/</g, "\\u003c"),
});

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });
await Promise.all([
  writeFile(`${OUT_DIR}/home.html`, html),
  writeFile(`${OUT_DIR}/agent.md`, markdown),
  writeFile(`${OUT_DIR}/llms.txt`, llmsTxt),
  writeFile(`${OUT_DIR}/styles.css`, await readFile("content/styles.css", "utf8")),
  writeFile(`${OUT_DIR}/home.css`, await readFile("content/home.css", "utf8")),
  writeFile(`${OUT_DIR}/dashboard.html`, await readFile("content/dashboard.html", "utf8")),
  writeFile(`${OUT_DIR}/dashboard.css`, await readFile("content/dashboard.css", "utf8")),
  ...["slides.html", "slides.css", "slides.js"].map(async (file) =>
    writeFile(`${OUT_DIR}/${file}`, await readFile(`content/${file}`, "utf8")),
  ),
  cp("content/fonts", `${OUT_DIR}/fonts`, { recursive: true }),
  build({
    entryPoints: ["src/dashboard.ts"],
    outfile: `${OUT_DIR}/dashboard.js`,
    bundle: true,
    minify: true,
    format: "iife",
    target: "es2022",
    define: { CONVEX_URL: JSON.stringify(CONVEX_URL) },
  }),
]);
