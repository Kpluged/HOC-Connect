import { organizationMemberships, organizations } from "@hoc/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

export const organizationsRouter = router({
  createDraft: protectedProcedure
    .input(z.object({ cityLabel: z.string().min(1), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.withRLS(async (tx) => {
        const [organization] = await tx
          .insert(organizations)
          .values({
            cityLabel: input.cityLabel,
            createdBy: ctx.userId,
            name: input.name,
            slug: slugify(input.name),
          })
          .returning();

        await tx.insert(organizationMemberships).values({
          organizationId: organization.id,
          role: "owner",
          status: "active",
          userId: ctx.userId,
        });

        return organization;
      });
    }),

  getMine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.withRLS((tx) =>
      tx
        .select({ organization: organizations })
        .from(organizationMemberships)
        .innerJoin(
          organizations,
          eq(organizations.id, organizationMemberships.organizationId),
        )
        .where(eq(organizationMemberships.userId, ctx.userId)),
    );
  }),
});
