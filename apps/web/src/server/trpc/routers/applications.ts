import {
  applicationDecisionSchema,
  applicationDocumentUploadSchema,
  applicationStatusSchema,
  companyStepSchema,
  configurationSnapshotSchema,
} from "@hoc/contracts";
import {
  applicationDocuments,
  applicationNotes,
  applications,
  organizations,
  profiles,
} from "@hoc/db";
import { getPremblyAdapter } from "@hoc/integrations/prembly";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router, staffProcedure } from "../trpc";

export const applicationsRouter = router({
  addDocument: protectedProcedure
    .input(applicationDocumentUploadSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.withRLS(async (tx) => {
        const [application] = await tx
          .select({ organizationId: applications.organizationId })
          .from(applications)
          .where(eq(applications.id, input.applicationId));

        if (!application) throw new TRPCError({ code: "NOT_FOUND" });

        await tx.insert(applicationDocuments).values({
          applicationId: input.applicationId,
          kind: input.kind,
          organizationId: application.organizationId,
          storagePath: input.storagePath,
          uploadedBy: ctx.userId,
        });
      });
    }),

  addNote: staffProcedure
    .input(
      z.object({
        applicationId: z.uuid(),
        body: z.string().min(1),
        internal: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.withRLS(async (tx) => {
        const [application] = await tx
          .select({ organizationId: applications.organizationId })
          .from(applications)
          .where(eq(applications.id, input.applicationId));

        if (!application) throw new TRPCError({ code: "NOT_FOUND" });

        await tx.insert(applicationNotes).values({
          applicationId: input.applicationId,
          authorId: ctx.userId,
          body: input.body,
          internal: input.internal,
          organizationId: application.organizationId,
        });
      });
    }),

  createDraft: protectedProcedure
    .input(
      z.object({
        configurationSnapshot: configurationSnapshotSchema.optional(),
        organizationId: z.uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [application] = await ctx.withRLS((tx) =>
        tx
          .insert(applications)
          .values({
            applicantUserId: ctx.userId,
            configurationSnapshot: input.configurationSnapshot,
            organizationId: input.organizationId,
          })
          .returning(),
      );
      return application;
    }),

  decide: staffProcedure
    .input(applicationDecisionSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.withRLS(async (tx) => {
        const [updated] = await tx
          .update(applications)
          .set({
            decidedAt: new Date(),
            decidedBy: ctx.userId,
            status: input.decision,
          })
          .where(eq(applications.id, input.applicationId))
          .returning();

        if (updated && input.decision === "approved") {
          await tx
            .update(organizations)
            .set({ status: "approved" })
            .where(
              and(
                eq(organizations.id, updated.organizationId),
                inArray(organizations.status, ["draft", "applied"]),
              ),
            );
        }
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.withRLS(async (tx) => {
        const [application] = await tx
          .select()
          .from(applications)
          .where(eq(applications.id, input.id));

        if (!application) return null;

        const [documents, notes] = await Promise.all([
          tx
            .select()
            .from(applicationDocuments)
            .where(eq(applicationDocuments.applicationId, input.id)),
          tx
            .select()
            .from(applicationNotes)
            .where(
              and(
                eq(applicationNotes.applicationId, input.id),
                eq(applicationNotes.internal, false),
              ),
            )
            .orderBy(desc(applicationNotes.createdAt)),
        ]);

        return { application, documents, notes };
      });
    }),

  getByIdForStaff: staffProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.withRLS(async (tx) => {
        const [application] = await tx
          .select()
          .from(applications)
          .where(eq(applications.id, input.id));

        if (!application) return null;

        const [documents, notes] = await Promise.all([
          tx
            .select()
            .from(applicationDocuments)
            .where(eq(applicationDocuments.applicationId, input.id)),
          tx
            .select()
            .from(applicationNotes)
            .where(eq(applicationNotes.applicationId, input.id))
            .orderBy(desc(applicationNotes.createdAt)),
        ]);

        return { application, documents, notes };
      });
    }),

  getDraftForOrg: protectedProcedure
    .input(z.object({ organizationId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const [application] = await ctx.withRLS((tx) =>
        tx
          .select()
          .from(applications)
          .where(
            and(
              eq(applications.organizationId, input.organizationId),
              eq(applications.applicantUserId, ctx.userId),
            ),
          )
          .orderBy(desc(applications.createdAt)),
      );
      return application ?? null;
    }),

  getMine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.withRLS((tx) =>
      tx
        .select()
        .from(applications)
        .where(eq(applications.applicantUserId, ctx.userId))
        .orderBy(desc(applications.createdAt)),
    );
  }),

  listForReview: staffProcedure
    .input(z.object({ status: applicationStatusSchema.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const status = input?.status;
      return ctx.withRLS((tx) =>
        status
          ? tx
              .select()
              .from(applications)
              .where(eq(applications.status, status))
              .orderBy(desc(applications.createdAt))
          : tx.select().from(applications).orderBy(desc(applications.createdAt)),
      );
    }),

  submit: protectedProcedure
    .input(z.object({ applicationId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.withRLS(async (tx) => {
        const [updated] = await tx
          .update(applications)
          .set({ status: "submitted", submittedAt: new Date() })
          .where(
            and(
              eq(applications.id, input.applicationId),
              eq(applications.applicantUserId, ctx.userId),
            ),
          )
          .returning();

        if (updated) {
          await tx
            .update(organizations)
            .set({ status: "applied" })
            .where(
              and(
                eq(organizations.id, updated.organizationId),
                eq(organizations.status, "draft"),
              ),
            );
        }

        return updated;
      });

      if (!application) throw new TRPCError({ code: "NOT_FOUND" });

      // Outside the transaction - never hold one open across external I/O,
      // even the stub adapter's near-instant one.
      const verification = await getPremblyAdapter().submitForVerification({
        applicationId: application.id,
        companyName: application.companyName ?? undefined,
        companyRegistrationNumber:
          application.companyRegistrationNumber ?? undefined,
        documents: [],
        fullName: "",
      });

      await ctx.withRLS((tx) =>
        tx
          .update(applications)
          .set({
            premblyReference: verification.providerReference,
            premblyStatus: verification.status,
          })
          .where(eq(applications.id, application.id)),
      );

      return application;
    }),

  upsertCompany: protectedProcedure
    .input(companyStepSchema.extend({ applicationId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.withRLS((tx) =>
        tx
          .update(applications)
          .set({
            companyName: input.companyName,
            companyRegistrationNumber: input.companyRegistrationNumber,
          })
          .where(eq(applications.id, input.applicationId)),
      );
    }),

  upsertIdentity: protectedProcedure
    .input(
      z.object({
        applicationId: z.uuid(),
        fullName: z.string().min(1),
        phone: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.withRLS(async (tx) => {
        await tx
          .update(profiles)
          .set({ fullName: input.fullName, phone: input.phone })
          .where(eq(profiles.id, ctx.userId));

        await tx
          .update(applications)
          .set({ contactPhone: input.phone })
          .where(eq(applications.id, input.applicationId));
      });
    }),
});
