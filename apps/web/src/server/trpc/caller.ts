import "server-only";

import { createContext } from "./context";
import { appRouter } from "./root";
import { createCallerFactory } from "./trpc";

const createCaller = createCallerFactory(appRouter);

/**
 * In-process caller for Server Actions and Server Components - no HTTP
 * round trip, no client bundle. Matches /configure's existing
 * server-rendered-form convention rather than an SPA data-fetching layer.
 */
export async function getServerCaller() {
  const context = await createContext();
  return createCaller(context);
}
