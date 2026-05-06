import en from "./en.json";
import zhHant from "./zh-Hant.json";
import type { Lang, Tool, ToolI18n } from "../lib/types";

const tables: Record<Lang, Record<string, string>> = {
  en,
  "zh-Hant": zhHant,
};

export function t(lang: Lang, key: string): string {
  return tables[lang][key] ?? tables.en[key] ?? key;
}

export function getToolStrings(tool: Tool, lang: Lang): ToolI18n {
  const wanted = tool.i18n[lang];
  const fallback = tool.i18n.en;
  return {
    title: wanted?.title || fallback.title,
    description: wanted?.description || fallback.description,
  };
}

export const SUPPORTED_LANGS: Lang[] = ["en", "zh-Hant"];
