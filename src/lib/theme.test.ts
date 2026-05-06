import { describe, it, expect, beforeEach, vi } from "vitest";
import { resolveTheme, applyTheme, getStoredPreference, INLINE_SCRIPT } from "./theme";

describe("resolveTheme", () => {
  it("returns the explicit choice when not auto", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it("follows prefers-color-scheme when auto", () => {
    expect(resolveTheme("auto", true)).toBe("dark");
    expect(resolveTheme("auto", false)).toBe("light");
  });
});

describe("applyTheme", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("sets data-theme on <html>", () => {
    applyTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    applyTheme("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});

describe("getStoredPreference", () => {
  beforeEach(() => localStorage.clear());

  it("returns auto when nothing stored", () => {
    expect(getStoredPreference()).toBe("auto");
  });

  it("returns the stored preference if valid", () => {
    localStorage.setItem("wt-theme", "dark");
    expect(getStoredPreference()).toBe("dark");
  });

  it("returns auto for invalid stored value", () => {
    localStorage.setItem("wt-theme", "rainbow");
    expect(getStoredPreference()).toBe("auto");
  });
});

describe("INLINE_SCRIPT", () => {
  it("includes localStorage and matchMedia logic", () => {
    expect(INLINE_SCRIPT).toContain("wt-theme");
    expect(INLINE_SCRIPT).toContain("prefers-color-scheme");
  });
});
