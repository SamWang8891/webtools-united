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

async function main() {
  // Spin up a Vite dev server in SSR mode so import.meta.glob resolves.
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "error",
  });

  // Read the shell HTML produced by `vite build`.
  const shell = readFileSync(resolve(root, "dist/index.html"), "utf-8");

  for (const { path: routePath, lang, outFile } of ROUTES) {
    // Load the server entry via Vite's SSR transform (handles JSX + import.meta.glob).
    const mod = await vite.ssrLoadModule("/src/entry-server.tsx");
    const appHTML = mod.render(lang);

    // Inject the React HTML into the shell.
    const html = shell.replace(
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
