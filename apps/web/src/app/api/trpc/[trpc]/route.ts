import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/root";

/**
 * Scaffolded for future HTTP clients (e.g. the driver app) - nothing in
 * this Milestone calls it over HTTP. Server Actions use the in-process
 * caller (server/trpc/caller.ts) instead.
 */
function handler(request: Request) {
  return fetchRequestHandler({
    createContext,
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
  });
}

export { handler as GET, handler as POST };
