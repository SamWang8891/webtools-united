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
  ensureFaviconInIndex(path.join(target, "index.html"));
  console.log(`✓ ${tool.slug} → dist/${tool.slug}/`);
}

// If the submodule's index.html has no <link rel="icon"> at all, inject one
// pointing at the main site's icons so the browser tab doesn't fall back to
// a stale cached favicon when the user navigates into the embedded app.
function ensureFaviconInIndex(htmlPath) {
  if (!fs.existsSync(htmlPath)) return;
  const html = fs.readFileSync(htmlPath, "utf8");
  if (/<link[^>]+rel=["']?(?:shortcut )?icon["']?/i.test(html)) return;
  const fallback = `    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`;
  const updated = html.replace(/<\/head>/i, `${fallback}\n  </head>`);
  fs.writeFileSync(htmlPath, updated);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
  const tools = readSubmoduleTools();
  for (const tool of tools) {
    buildOne(tool);
  }
  console.log(`done — built ${tools.length} submodule tool(s)`);
}
