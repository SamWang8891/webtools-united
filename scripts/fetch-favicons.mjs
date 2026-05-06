import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const TOOLS_DIR = path.join(repoRoot, "src/tools");
const ICONS_OVERRIDE_DIR = path.join(TOOLS_DIR, "icons");
const OUT_DIR = path.join(repoRoot, "public/favicons");

export function originOf(url) {
  const u = new URL(url);
  return `${u.protocol}//${u.host}`;
}

export function resolveFaviconUrl(html, origin) {
  const links = [...html.matchAll(/<link[^>]*rel=["']?(?:shortcut )?icon["']?[^>]*>/gi)].map(
    (m) => m[0],
  );
  if (links.length === 0) return `${origin}/favicon.ico`;
  let best = null;
  let bestSize = -1;
  for (const tag of links) {
    const href = (tag.match(/href=["']([^"']+)["']/i) || [])[1];
    if (!href) continue;
    const sizesAttr = (tag.match(/sizes=["']([^"']+)["']/i) || [])[1];
    const size = sizesAttr ? parseInt(sizesAttr.split("x")[0], 10) || 0 : 0;
    if (size > bestSize) {
      bestSize = size;
      best = href;
    }
  }
  if (!best) return `${origin}/favicon.ico`;
  return new URL(best, origin).toString();
}

async function fetchBuf(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function processTool(tool) {
  const outFile = path.join(OUT_DIR, `${tool.slug}.png`);
  if (tool.icon) {
    const src = path.join(ICONS_OVERRIDE_DIR, tool.icon);
    if (!fs.existsSync(src)) throw new Error(`icon override missing: ${src}`);
    fs.copyFileSync(src, outFile);
    return { slug: tool.slug, source: "override" };
  }
  if (fs.existsSync(outFile) && process.env.FORCE_REFETCH !== "1") {
    return { slug: tool.slug, source: "cached" };
  }
  if (tool.type !== "external") {
    if (!fs.existsSync(outFile)) {
      console.warn(`⚠ ${tool.slug}: submodule with no icon override and no cached favicon — leaving blank`);
    }
    return { slug: tool.slug, source: "skipped" };
  }
  const origin = originOf(tool.url);
  let html = "";
  try {
    const res = await fetch(origin, { redirect: "follow" });
    html = await res.text();
  } catch (e) {
    console.warn(`⚠ ${tool.slug}: failed to fetch HTML (${e.message}), trying /favicon.ico`);
  }
  const iconUrl = resolveFaviconUrl(html, origin);
  try {
    const buf = await fetchBuf(iconUrl);
    fs.writeFileSync(outFile, buf);
    return { slug: tool.slug, source: "fetched", url: iconUrl };
  } catch (e) {
    console.warn(`⚠ ${tool.slug}: ${e.message}`);
    return { slug: tool.slug, source: "failed" };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tools = fs
    .readdirSync(TOOLS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "tool.schema.json")
    .map((f) => JSON.parse(fs.readFileSync(path.join(TOOLS_DIR, f), "utf8")));
  for (const tool of tools) {
    const r = await processTool(tool);
    console.log(`${r.source === "failed" ? "✖" : "✓"} ${r.slug} (${r.source})`);
  }
}
