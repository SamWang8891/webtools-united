import { describe, it, expect } from "vitest";
import { loadAllTools } from "./tool-loader";

describe("loadAllTools", () => {
  it("returns at least one tool when tool JSONs exist", () => {
    const tools = loadAllTools();
    expect(Array.isArray(tools)).toBe(true);
  });

  it("returns tools sorted by slug", () => {
    const tools = loadAllTools();
    const slugs = tools.map((t) => t.slug);
    expect(slugs).toEqual([...slugs].sort());
  });

  it("guarantees every tool has en i18n", () => {
    const tools = loadAllTools();
    for (const t of tools) {
      expect(t.i18n.en).toBeDefined();
      expect(t.i18n.en.title).toBeTruthy();
    }
  });
});
