import "server-only";
import { platformRoles } from "@hoc/db";
import { TRPCError, initTRPC } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import superjson from "superjson";

import { withRLS, type RLSTransaction } from "@/server/db/with-rls";

import type { Context } from "./context";

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.claims) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const claims = ctx.claims;

  return next({
    ctx: {
      ...ctx,
      email: claims.email,
      userId: claims.sub,
      withRLS: <T>(fn: (tx: RLSTransaction) => Promise<T>) =>
        withRLS(claims, fn),
    },
  });
});

/**
 * Belt-and-suspenders on top of RLS, never a replacement - table policies
 * already scope staff-only rows via private.is_hoc_staff().
 */
export const staffProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const hasActiveStaffRole = await ctx.withRLS(async (tx) => {
    const rows = await tx
      .select({ id: platformRoles.id })
      .from(platformRoles)
      .where(
        and(
          eq(platformRoles.userId, ctx.userId),
          eq(platformRoles.status, "active"),
        ),
      );
    return rows.length > 0;
  });

  if (!hasActiveStaffRole) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next({ ctx });
});
