import type { Tool } from "./types";

const modules = import.meta.glob("../tools/*.json", { eager: true }) as Record<
  string,
  { default: Tool }
>;

const tools: Tool[] = Object.entries(modules)
  .filter(([k]) => !k.endsWith("tool.schema.json"))
  .map(([, m]) => m.default)
  .sort((a, b) => a.slug.localeCompare(b.slug));

export function loadAllTools(): Tool[] {
  return tools;
}
