import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveFaviconUrl, originOf } from "./fetch-favicons.mjs";

test("originOf returns the origin of an https url", () => {
  assert.equal(originOf("https://example.com/path"), "https://example.com");
});

test("resolveFaviconUrl picks a <link rel=icon> when present", () => {
  const html = `<html><head><link rel="icon" href="/icons/me.png" sizes="64x64"></head></html>`;
  assert.equal(
    resolveFaviconUrl(html, "https://example.com"),
    "https://example.com/icons/me.png",
  );
});

test("resolveFaviconUrl handles absolute href", () => {
  const html = `<link rel="icon" href="https://cdn.example.com/i.png">`;
  assert.equal(
    resolveFaviconUrl(html, "https://example.com"),
    "https://cdn.example.com/i.png",
  );
});

test("resolveFaviconUrl falls back to /favicon.ico when none found", () => {
  assert.equal(resolveFaviconUrl("<html></html>", "https://example.com"), "https://example.com/favicon.ico");
});

test("resolveFaviconUrl prefers larger size when multiple present", () => {
  const html = `
    <link rel="icon" href="/small.png" sizes="16x16">
    <link rel="icon" href="/big.png" sizes="180x180">
  `;
  assert.equal(
    resolveFaviconUrl(html, "https://example.com"),
    "https://example.com/big.png",
  );
});
