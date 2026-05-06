import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSitemap, buildRobotsTxt } from "./generate-sitemap.mjs";

test("buildSitemap emits both languages", () => {
  const xml = buildSitemap("https://tools365.link");
  assert.match(xml, /<loc>https:\/\/tools365\.link\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/tools365\.link\/zh-Hant\/<\/loc>/);
  assert.match(xml, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
});

test("buildRobotsTxt allows all and references sitemap", () => {
  const txt = buildRobotsTxt("https://tools365.link");
  assert.match(txt, /User-agent: \*/);
  assert.match(txt, /Allow: \//);
  assert.match(txt, /Sitemap: https:\/\/tools365\.link\/sitemap\.xml/);
});
