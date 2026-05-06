import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const I18N_DIR = path.join(repoRoot, "src/i18n");
const TOOLS_DIR = path.join(repoRoot, "src/tools");
const BASE_LANG = "en";

export function findMissingUiKeys(base, other) {
  return Object.keys(base).filter((k) => !(k in other) || other[k] === "");
}

export function findMissingToolKeys(tools, lang) {
  const out = [];
  for (const tool of tools) {
    const block = tool.i18n[lang];
    const missing = [];
    if (!block || !block.title) missing.push("title");
    if (!block || !block.description) missing.push("description");
    if (missing.length > 0) out.push({ slug: tool.slug, missing });
  }
  return out;
}

export function formatReport({ ui, tools }) {
  const empty =
    Object.values(ui).every((arr) => arr.length === 0) &&
    Object.values(tools).every((arr) => arr.length === 0);
  if (empty) return "## Translation coverage\n\n✅ All translations present.";
  const parts = ["## Translation coverage", ""];
  for (const [lang, keys] of Object.entries(ui)) {
    if (keys.length === 0) continue;
    parts.push(`**UI strings missing in \`${lang}\`:**`);
    for (const k of keys) parts.push(`- \`${k}\``);
    parts.push("");
  }
  for (const [lang, items] of Object.entries(tools)) {
    if (items.length === 0) continue;
    parts.push(`**Tool strings missing in \`${lang}\`:**`);
    for (const item of items) parts.push(`- **${item.slug}**: ${item.missing.join(", ")}`);
    parts.push("");
  }
  parts.push("_This is informational — the build will not fail._");
  return parts.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const enUi = JSON.parse(fs.readFileSync(path.join(I18N_DIR, "en.json"), "utf8"));
  const otherLangs = fs
    .readdirSync(I18N_DIR)
    .filter((f) => f.endsWith(".json") && f !== "en.json")
    .map((f) => ({ lang: f.replace(/\.json$/, ""), data: JSON.parse(fs.readFileSync(path.join(I18N_DIR, f), "utf8")) }));
  const tools = fs
    .readdirSync(TOOLS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "tool.schema.json")
    .map((f) => JSON.parse(fs.readFileSync(path.join(TOOLS_DIR, f), "utf8")));
  const ui = {};
  const toolReport = {};
  for (const { lang, data } of otherLangs) {
    ui[lang] = findMissingUiKeys(enUi, data);
    toolReport[lang] = findMissingToolKeys(tools, lang);
  }
  const report = formatReport({ ui, tools: toolReport });
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `report<<EOF\n${report}\nEOF\n`);
  }
  console.log(report);
}
