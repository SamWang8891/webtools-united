import { describe, it, expect } from "vitest";
import { buildItemListJsonLd, buildHreflangLinks, getPageMeta } from "./seo";

describe("buildItemListJsonLd", () => {
  it("emits a valid ItemList for a list of tools", () => {
    const tools = [
      {
        slug: "x",
        type: "external" as const,
        path: null,
        url: "https://x",
        repo: "https://github.com/x/x",
        icon: null,
        i18n: { en: { title: "X", description: "Y" } },
      },
    ];
    const json = buildItemListJsonLd(tools, "en", "https://tools365.link");
    expect(json["@type"]).toBe("ItemList");
    expect(json.itemListElement[0]).toMatchObject({ "@type": "ListItem", position: 1 });
  });
});

describe("buildHreflangLinks", () => {
  it("includes both langs and x-default", () => {
    const links = buildHreflangLinks("https://tools365.link");
    const langs = links.map((l) => l.hreflang);
    expect(langs).toContain("en");
    expect(langs).toContain("zh-Hant");
    expect(langs).toContain("x-default");
  });
});

describe("getPageMeta", () => {
  it("returns en title and description for en", () => {
    const meta = getPageMeta("en");
    expect(meta.title).toMatch(/Tools ?365/i);
    expect(meta.description).toBeTruthy();
    expect(meta.lang).toBe("en");
  });
});
