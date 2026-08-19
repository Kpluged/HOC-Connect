import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/root";

/**
 * HTTP entry point for the Expo driver app (Milestone 9b), which authenticates
 * with `Authorization: Bearer <access-token>`. Server Actions still use the
 * in-process caller (server/trpc/caller.ts). The request headers are threaded
 * into createContext so the bearer token can be verified.
 *
 * CORS: the driver app's *web* build calls this endpoint cross-origin. It uses a
 * bearer token and never cookies, so we allow CORS **without** credentials — the
 * browser therefore never attaches the web app's session cookie to a
 * cross-origin request, and authorization stays enforced by the bearer token +
 * RLS. We only echo localhost dev origins (Expo web) and an optional configured
 * driver-web origin; the native app sends no `Origin` header and is unaffected.
 */
function corsOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") return origin;
  } catch {
    return null;
  }
  if (origin === process.env.DRIVER_WEB_ORIGIN) return origin;
  return null;
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = corsOrigin(request);
  if (!origin) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, x-trpc-source",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

async function handler(request: Request) {
  const response = await fetchRequestHandler({
    createContext: () => createContext({ headers: request.headers }),
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
  });
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    response.headers.set(key, value);
  }
  return response;
}

// Preflight for the driver web build's cross-origin bearer requests.
function options(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export { handler as GET, handler as POST, options as OPTIONS };
