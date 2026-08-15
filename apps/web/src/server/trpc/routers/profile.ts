import { profiles } from "@hoc/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await ctx.withRLS((tx) =>
      tx.select().from(profiles).where(eq(profiles.id, ctx.userId)),
    );
    return profile ?? null;
  }),

  update: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(1),
        phone: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.withRLS((tx) =>
        tx
          .update(profiles)
          .set({ fullName: input.fullName, phone: input.phone })
          .where(eq(profiles.id, ctx.userId)),
      );
    }),
});
