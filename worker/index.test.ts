import { test } from "node:test";
import assert from "node:assert/strict";
import { handle } from "./index.ts";

const REDIRECTS = { fastgoto: "https://fastgoto.xyz", clippy: "https://clippy.smashit.tw" };
const fakeAssets = { fetch: async () => new Response("asset", { status: 200 }) };

test("redirects /fastgoto to its url", async () => {
  const res = await handle(new Request("https://tools365.link/fastgoto"), { ASSETS: fakeAssets } as any, REDIRECTS);
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "https://fastgoto.xyz");
});

test("redirects /fastgoto/ (trailing slash) too", async () => {
  const res = await handle(new Request("https://tools365.link/fastgoto/"), { ASSETS: fakeAssets } as any, REDIRECTS);
  assert.equal(res.status, 302);
});

test("first visit to / with zh Accept-Language redirects", async () => {
  const req = new Request("https://tools365.link/", {
    headers: { "accept-language": "zh-TW,zh;q=0.9,en;q=0.5" },
  });
  const res = await handle(req, { ASSETS: fakeAssets } as any, REDIRECTS);
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "/zh-Hant/");
  assert.match(res.headers.get("set-cookie") || "", /wt-lang=zh-Hant/);
});

test("first visit to / with en Accept-Language sets cookie and serves asset", async () => {
  const req = new Request("https://tools365.link/", {
    headers: { "accept-language": "en-US,en;q=0.9" },
  });
  const res = await handle(req, { ASSETS: fakeAssets } as any, REDIRECTS);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("set-cookie") || "", /wt-lang=en/);
});

test("second visit (cookie present) does not redirect", async () => {
  const req = new Request("https://tools365.link/", {
    headers: { "accept-language": "zh", cookie: "wt-lang=en" },
  });
  const res = await handle(req, { ASSETS: fakeAssets } as any, REDIRECTS);
  assert.equal(res.status, 200);
});

test("unknown path falls through to assets", async () => {
  const res = await handle(new Request("https://tools365.link/unknown"), { ASSETS: fakeAssets } as any, REDIRECTS);
  assert.equal(res.status, 200);
});
