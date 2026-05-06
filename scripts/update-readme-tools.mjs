import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const TOOLS_DIR = path.join(repoRoot, "src/tools");
const README = path.join(repoRoot, "README.md");

const BEGIN = "<!-- BEGIN TOOLS -->";
const END = "<!-- END TOOLS -->";

export function buildToolsTable(tools) {
  const lines = ["| Tool | Type | Description |", "| --- | --- | --- |"];
  const sorted = [...tools].sort((a, b) => a.slug.localeCompare(b.slug));
  for (const t of sorted) {
    const href = t.type === "external" ? t.url : t.path;
    const title = t.i18n.en.title;
    const desc = t.i18n.en.description.replace(/\|/g, "\\|");
    const type = t.type === "external" ? "external" : "embedded";
    lines.push(`| [${title}](${href}) | ${type} | ${desc} |`);
  }
  return lines.join("\n");
}

export function replaceMarkers(content, replacement) {
  const re = new RegExp(`(${BEGIN})[\\s\\S]*?(${END})`);
  if (!re.test(content)) return content;
  return content.replace(re, `$1\n${replacement}\n$2`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(README)) {
    console.log("README.md not found, skipping");
    process.exit(0);
  }
  const tools = fs
    .readdirSync(TOOLS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "tool.schema.json")
    .map((f) => JSON.parse(fs.readFileSync(path.join(TOOLS_DIR, f), "utf8")));
  const original = fs.readFileSync(README, "utf8");
  const updated = replaceMarkers(original, buildToolsTable(tools));
  if (updated === original) {
    console.log("README.md: no markers found or no change");
  } else {
    fs.writeFileSync(README, updated);
    console.log("✓ README.md tools table updated");
  }
}
