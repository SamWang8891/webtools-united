import Fuse from "fuse.js";
import type { Tool } from "./types";

interface IndexedTool extends Tool {
  _searchTitle: string;
  _searchDescription: string;
  _searchTags: string;
}

function indexTool(tool: Tool): IndexedTool {
  const titles: string[] = [];
  const descriptions: string[] = [];
  for (const lang of Object.keys(tool.i18n)) {
    const block = tool.i18n[lang as keyof typeof tool.i18n];
    if (block?.title) titles.push(block.title);
    if (block?.description) descriptions.push(block.description);
  }
  return {
    ...tool,
    _searchTitle: titles.join(" "),
    _searchDescription: descriptions.join(" "),
    _searchTags: (tool.tags ?? []).join(" "),
  };
}

export function createSearcher(tools: Tool[]): (query: string) => Tool[] {
  const indexed = tools.map(indexTool);
  const fuse = new Fuse(indexed, {
    keys: [
      { name: "_searchTitle", weight: 0.6 },
      { name: "_searchDescription", weight: 0.3 },
      { name: "_searchTags", weight: 0.1 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: false,
  });
  return (query: string) => {
    if (!query.trim()) return tools;
    return fuse.search(query).map((r) => {
      const { _searchTitle, _searchDescription, _searchTags, ...rest } = r.item;
      return rest as Tool;
    });
  };
}
