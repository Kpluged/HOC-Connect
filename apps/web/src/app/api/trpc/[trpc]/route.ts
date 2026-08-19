import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/root";

/**
 * HTTP entry point for the Expo driver app (Milestone 9b), which authenticates
 * with `Authorization: Bearer <access-token>`. Server Actions still use the
 * in-process caller (server/trpc/caller.ts). The request headers are threaded
 * into createContext so the bearer token can be verified.
 */
function handler(request: Request) {
  return fetchRequestHandler({
    createContext: () => createContext({ headers: request.headers }),
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
  });
}

export { handler as GET, handler as POST };
