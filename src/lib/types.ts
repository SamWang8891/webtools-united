export type Lang = "en" | "zh-Hant";

export interface ToolI18n {
  title: string;
  description: string;
}

export interface Tool {
  slug: string;
  type: "submodule" | "external";
  path: string | null;
  url: string | null;
  repo: string;
  icon: string | null;
  i18n: Partial<Record<Lang, ToolI18n>> & { en: ToolI18n };
  tags?: string[];
}
