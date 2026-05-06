import { describe, it, expect } from "vitest";
import { createSearcher } from "./search";
import type { Tool } from "./types";

const tools: Tool[] = [
  {
    slug: "wheel",
    type: "submodule",
    path: "/wheel/",
    url: null,
    repo: "https://github.com/x/wheel",
    icon: null,
    i18n: {
      en: { title: "Spinning Wheel", description: "Random picker." },
      "zh-Hant": { title: "輪盤抽選", description: "隨機選擇器。" },
    },
    tags: ["random"],
  },
  {
    slug: "qrcode-generator",
    type: "submodule",
    path: "/qrcode-generator/",
    url: null,
    repo: "https://github.com/x/qrcode-generator",
    icon: null,
    i18n: {
      en: { title: "QR Code Generator", description: "Make QR codes from text." },
    },
    tags: ["qr", "code"],
  },
];

describe("createSearcher", () => {
  it("returns all tools when query is empty", () => {
    const search = createSearcher(tools);
    expect(search("")).toHaveLength(2);
  });

  it("matches in English title", () => {
    const search = createSearcher(tools);
    const results = search("wheel");
    expect(results[0].slug).toBe("wheel");
  });

  it("matches in zh-Hant title regardless of UI lang", () => {
    const search = createSearcher(tools);
    const results = search("輪盤");
    expect(results[0].slug).toBe("wheel");
  });

  it("matches in tags", () => {
    const search = createSearcher(tools);
    const results = search("qr");
    expect(results.map((r) => r.slug)).toContain("qrcode-generator");
  });

  it("is fuzzy/typo-tolerant", () => {
    const search = createSearcher(tools);
    const results = search("whee");
    expect(results.map((r) => r.slug)).toContain("wheel");
  });
});
