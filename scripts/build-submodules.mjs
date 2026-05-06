import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const VENDOR_DIR = path.join(repoRoot, "tools-vendored");
const TOOLS_DIR = path.join(repoRoot, "src/tools");
const DIST_DIR = path.join(repoRoot, "dist");

function readSubmoduleTools() {
  return fs
    .readdirSync(TOOLS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "tool.schema.json")
    .map((f) => JSON.parse(fs.readFileSync(path.join(TOOLS_DIR, f), "utf8")))
    .filter((t) => t.type === "submodule");
}

function buildOne(tool) {
  const dir = path.join(VENDOR_DIR, tool.slug);
  if (!fs.existsSync(dir)) {
    throw new Error(`submodule not checked out: ${dir} (run \`git submodule update --init\`)`);
  }
  console.log(`▶ building ${tool.slug}…`);
  execSync("npm ci", { cwd: dir, stdio: "inherit" });
  // Pass --base so all asset URLs get prefixed with the slug path. Without
  // this the submodule emits root-relative /assets/... paths, which 404 when
  // the app is mounted under tools365.link/<slug>/.
  execSync(`npm run build -- --base=/${tool.slug}/`, { cwd: dir, stdio: "inherit" });
  const srcDist = path.join(dir, "dist");
  if (!fs.existsSync(srcDist)) {
    throw new Error(`${tool.slug}: build did not produce dist/`);
  }
  const target = path.join(DIST_DIR, tool.slug);
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(srcDist, target, { recursive: true });
  console.log(`✓ ${tool.slug} → dist/${tool.slug}/`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
  const tools = readSubmoduleTools();
  for (const tool of tools) {
    buildOne(tool);
  }
  console.log(`done — built ${tools.length} submodule tool(s)`);
}
