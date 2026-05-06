import Ajv from "ajv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const schemaPath = path.join(repoRoot, "src/tools/tool.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

export function validateToolFile(filePath, opts = {}) {
  const errors = [];
  let content;
  try {
    content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    return { ok: false, errors: [`parse error: ${e.message}`] };
  }
  if (opts.overrideContent) {
    content = { ...content, ...opts.overrideContent };
  }
  if (!validate(content)) {
    for (const err of validate.errors) {
      errors.push(`${err.instancePath || "/"} ${err.message}`);
    }
  }
  const expectedSlug = opts.expectedSlug ?? path.basename(filePath, ".json");
  if (typeof content.slug === "string" && content.slug !== expectedSlug) {
    errors.push(`slug "${content.slug}" must match filename "${expectedSlug}"`);
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export function validateAll(toolsDir) {
  const out = {};
  const entries = fs
    .readdirSync(toolsDir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_") && f !== "tool.schema.json");
  for (const entry of entries) {
    out[entry] = validateToolFile(path.join(toolsDir, entry));
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const toolsDir = path.join(repoRoot, "src/tools");
  const results = validateAll(toolsDir);
  let bad = 0;
  for (const [file, result] of Object.entries(results)) {
    if (!result.ok) {
      bad++;
      console.error(`✖ ${file}`);
      for (const err of result.errors) console.error(`  - ${err}`);
    } else {
      console.log(`✓ ${file}`);
    }
  }
  process.exit(bad > 0 ? 1 : 0);
}
