/**
 * React SSR prerender script for webtools-united.
 *
 * Produces:
 *   dist/index.html          → <Home lang="en" />
 *   dist/zh-Hant/index.html  → <Home lang="zh-Hant" />
 *
 * Usage: node scripts/prerender.mjs
 * Run after `vite build` so dist/index.html (the shell) already exists.
 */

import { createServer } from "vite";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const ROUTES = [
  { path: "/", lang: "en",      outFile: "dist/index.html" },
  { path: "/zh-Hant/", lang: "zh-Hant", outFile: "dist/zh-Hant/index.html" },
];

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function main() {
  // Spin up a Vite dev server in SSR mode so import.meta.glob resolves.
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "error",
  });

  // Load SEO helpers and tool data via Vite SSR transform.
  const seoMod = await vite.ssrLoadModule("/src/lib/seo.ts");
  const { buildItemListJsonLd, buildHreflangLinks, getPageMeta } = seoMod;

  const toolLoaderMod = await vite.ssrLoadModule("/src/lib/tool-loader.ts");
  const { loadAllTools } = toolLoaderMod;

  const themeMod = await vite.ssrLoadModule("/src/lib/theme.ts");
  const { INLINE_SCRIPT } = themeMod;

  const tools = loadAllTools();

  // Hreflang links are the same for every page (reciprocal).
  const hreflangs = buildHreflangLinks();

  // Read the shell HTML produced by `vite build`.
  const shell = readFileSync(resolve(root, "dist/index.html"), "utf-8");

  // Remove the existing <title> line from the shell (we'll inject a per-page one).
  const shellNoTitle = shell.replace(/[ \t]*<title>[^<]*<\/title>\n?/, "");

  for (const { path: routePath, lang, outFile } of ROUTES) {
    // Load the server entry via Vite's SSR transform (handles JSX + import.meta.glob).
    const mod = await vite.ssrLoadModule("/src/entry-server.tsx");
    const appHTML = mod.render(lang);

    const meta = getPageMeta(lang);
    const jsonLd = buildItemListJsonLd(tools, lang);

    // Build the <head> fragment with all SEO tags.
    const headTags = [
      `<title>${escapeHtml(meta.title)}</title>`,
      `<meta name="description" content="${escapeHtml(meta.description)}">`,
      `<link rel="canonical" href="${meta.canonical}">`,
      ...hreflangs.map((h) => `<link rel="alternate" hreflang="${h.hreflang}" href="${h.href}">`),
      `<meta property="og:title" content="${escapeHtml(meta.title)}">`,
      `<meta property="og:description" content="${escapeHtml(meta.description)}">`,
      `<meta property="og:url" content="${meta.canonical}">`,
      `<meta property="og:type" content="website">`,
      `<meta name="twitter:card" content="summary">`,
      `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`,
      `<script>${INLINE_SCRIPT}</script>`,
    ].join("\n    ");

    // Set the correct lang attribute on <html>.
    let html = shellNoTitle.replace('<html lang="en">', `<html lang="${lang}">`);

    // Inject the new head tags right before </head>.
    html = html.replace("</head>", `    ${headTags}\n  </head>`);

    // Inject the React HTML into the shell.
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${appHTML}</div>`,
    );

    const outPath = resolve(root, outFile);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html, "utf-8");
    console.log(`[prerender] ${routePath} → ${outFile}`);
  }

  await vite.close();
}

main().catch((err) => {
  console.error("[prerender] Error:", err);
  process.exit(1);
});
