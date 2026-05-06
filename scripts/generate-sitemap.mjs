import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const ORIGIN = "https://tools365.link";

export function buildSitemap(origin = ORIGIN) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${origin}/`, lang: "en", alt: `${origin}/zh-Hant/` },
    { loc: `${origin}/zh-Hant/`, lang: "zh-Hant", alt: `${origin}/` },
  ];
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <xhtml:link rel="alternate" hreflang="${u.lang === "en" ? "zh-Hant" : "en"}" href="${u.alt}" />
    <xhtml:link rel="alternate" hreflang="${u.lang}" href="${u.loc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/" />
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;
}

export function buildRobotsTxt(origin = ORIGIN) {
  return `User-agent: *
Allow: /
Sitemap: ${origin}/sitemap.xml
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dist = path.join(repoRoot, "dist");
  fs.mkdirSync(dist, { recursive: true });
  fs.writeFileSync(path.join(dist, "sitemap.xml"), buildSitemap());
  fs.writeFileSync(path.join(dist, "robots.txt"), buildRobotsTxt());
  console.log("✓ sitemap.xml and robots.txt written");
}
