import { describe, it, expect } from "vitest";
import { t, getToolStrings } from "./index";

describe("t()", () => {
  it("returns the requested-language string when present", () => {
    expect(t("en", "header.tagline")).toMatch(/web tools/i);
  });

  it("falls back to en when zh-Hant key missing", () => {
    expect(t("zh-Hant", "__nonexistent_key__")).toBe(t("en", "__nonexistent_key__"));
  });

  it("returns the key itself when missing in both", () => {
    expect(t("en", "__nonexistent_key__")).toBe("__nonexistent_key__");
  });
});

describe("getToolStrings()", () => {
  const tool = {
    slug: "x",
    type: "external" as const,
    path: null,
    url: "https://x",
    repo: "https://github.com/x/x",
    icon: null,
    i18n: { en: { title: "EN Title", description: "EN desc" } },
  };

  it("returns en when zh-Hant missing", () => {
    const out = getToolStrings(tool, "zh-Hant");
    expect(out.title).toBe("EN Title");
    expect(out.description).toBe("EN desc");
  });

  it("returns zh-Hant when present", () => {
    const t2 = {
      ...tool,
      i18n: { en: tool.i18n.en, "zh-Hant": { title: "中文", description: "中描述" } },
    };
    const out = getToolStrings(t2, "zh-Hant");
    expect(out.title).toBe("中文");
  });

  it("falls back per-key when partial", () => {
    const t2 = {
      ...tool,
      i18n: { en: tool.i18n.en, "zh-Hant": { title: "中文", description: "" } },
    };
    const out = getToolStrings(t2, "zh-Hant");
    expect(out.title).toBe("中文");
    expect(out.description).toBe("EN desc");
  });
});
