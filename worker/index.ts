import { REDIRECTS } from "./redirects.gen";

export interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

export async function handle(
  request: Request,
  env: Env,
  redirects: Record<string, string> = REDIRECTS,
): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.pathname.replace(/^\/+|\/+$/g, "");
  if (slug && redirects[slug]) {
    return new Response(null, { status: 302, headers: { location: redirects[slug] } });
  }
  if (url.pathname === "/" || url.pathname === "") {
    const cookie = parseCookie(request.headers.get("cookie") || "");
    if (!cookie["wt-lang"]) {
      const accept = (request.headers.get("accept-language") || "").toLowerCase();
      const wantsZh = /^zh\b|[, ]zh\b/.test(accept) && !/^en\b/.test(accept);
      const lang = wantsZh ? "zh-Hant" : "en";
      const headers = new Headers({
        "set-cookie": `wt-lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`,
      });
      if (wantsZh) {
        headers.set("location", "/zh-Hant/");
        return new Response(null, { status: 302, headers });
      }
      const upstream = await env.ASSETS.fetch(request);
      const merged = new Headers(upstream.headers);
      merged.append("set-cookie", headers.get("set-cookie")!);
      return new Response(upstream.body, { status: upstream.status, headers: merged });
    }
  }
  return env.ASSETS.fetch(request);
}

function parseCookie(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k) out[k] = rest.join("=");
  }
  return out;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handle(request, env);
  },
};
