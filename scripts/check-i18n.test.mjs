import { test } from "node:test";
import assert from "node:assert/strict";
import { findMissingUiKeys, findMissingToolKeys, formatReport } from "./check-i18n.mjs";

test("findMissingUiKeys reports keys in en but not zh-Hant", () => {
  const en = { a: "A", b: "B" };
  const zh = { a: "甲" };
  const missing = findMissingUiKeys(en, zh);
  assert.deepEqual(missing, ["b"]);
});

test("findMissingUiKeys returns [] when full coverage", () => {
  const en = { a: "A" };
  const zh = { a: "甲" };
  assert.deepEqual(findMissingUiKeys(en, zh), []);
});

test("findMissingToolKeys reports per-tool missing fields", () => {
  const tools = [
    { slug: "x", i18n: { en: { title: "X", description: "Y" } } },
    { slug: "y", i18n: { en: { title: "Y", description: "Z" }, "zh-Hant": { title: "尾", description: "" } } },
  ];
  const out = findMissingToolKeys(tools, "zh-Hant");
  assert.deepEqual(out, [
    { slug: "x", missing: ["title", "description"] },
    { slug: "y", missing: ["description"] },
  ]);
});

test("formatReport produces a markdown summary", () => {
  const md = formatReport({
    ui: { "zh-Hant": ["foo"] },
    tools: { "zh-Hant": [{ slug: "x", missing: ["title"] }] },
  });
  assert.match(md, /Translation coverage/);
  assert.match(md, /foo/);
  assert.match(md, /x/);
});

test("formatReport says all-clear when nothing missing", () => {
  const md = formatReport({ ui: {}, tools: {} });
  assert.match(md, /All translations present/);
});
