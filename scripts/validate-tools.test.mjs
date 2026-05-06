import { test } from "node:test";
import assert from "node:assert/strict";
import { validateToolFile, validateAll } from "./validate-tools.mjs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

test("accepts a valid submodule tool", () => {
  const result = validateToolFile(path.join(here, "_fixtures/valid-tool.json"));
  assert.equal(result.ok, true);
});

test("rejects when slug missing", () => {
  const result = validateToolFile(path.join(here, "_fixtures/invalid-tool.json"));
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /slug/);
});

test("rejects when slug does not match filename", () => {
  const result = validateToolFile(
    path.join(here, "_fixtures/valid-tool.json"),
    { expectedSlug: "wrong-slug" }
  );
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /filename/);
});

test("rejects external tool with non-https url", () => {
  const result = validateToolFile(path.join(here, "_fixtures/valid-tool.json"), {
    overrideContent: { type: "external", url: "http://example.com", path: null },
  });
  assert.equal(result.ok, false);
});

test("validateAll returns map of file→result", () => {
  const result = validateAll(path.join(here, "_fixtures"));
  assert.ok("valid-tool.json" in result);
});
