import { test } from "node:test";
import assert from "node:assert/strict";
import { buildToolsTable, replaceMarkers } from "./update-readme-tools.mjs";

const tools = [
  {
    slug: "wheel",
    type: "submodule",
    path: "/wheel/",
    url: null,
    repo: "https://github.com/x/wheel",
    icon: null,
    i18n: { en: { title: "Wheel", description: "Random pick." } },
  },
  {
    slug: "fastgoto",
    type: "external",
    path: null,
    url: "https://fastgoto.xyz",
    repo: "https://github.com/x/p",
    icon: null,
    i18n: { en: { title: "Fastgoto", description: "Quick launcher." } },
  },
];

test("buildToolsTable produces a markdown table", () => {
  const table = buildToolsTable(tools);
  assert.match(table, /\| Tool \| Type \| Description \|/);
  assert.match(table, /\[Wheel\]\(\/wheel\/\)/);
  assert.match(table, /\[Fastgoto\]\(https:\/\/fastgoto\.xyz\)/);
  assert.match(table, /embedded/);
  assert.match(table, /external/);
});

test("replaceMarkers substitutes the marker block", () => {
  const original = `# Title\n<!-- BEGIN TOOLS -->\nold content\n<!-- END TOOLS -->\nfooter`;
  const out = replaceMarkers(original, "NEW");
  assert.match(out, /<!-- BEGIN TOOLS -->\nNEW\n<!-- END TOOLS -->/);
  assert.match(out, /^# Title/);
  assert.match(out, /footer$/);
});

test("replaceMarkers leaves file unchanged when markers absent", () => {
  const original = "# Title\nno markers";
  assert.equal(replaceMarkers(original, "NEW"), original);
});
