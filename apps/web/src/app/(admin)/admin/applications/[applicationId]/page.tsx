import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { StaffOnlyNotice } from "@/components/admin/staff-only-notice";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SiteHeader } from "@/components/ui/site-header";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerCaller } from "@/server/trpc/caller";

import { addStaffNote, decideApplication } from "../actions";

export const metadata: Metadata = {
  description: "Review a fleet application: documents, verification, and decision.",
  title: "Application review",
};

const statusVariant = {
  approved: "live",
  declined: "inactive",
  draft: "neutral",
  submitted: "selected",
  under_review: "selected",
} as const;

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const caller = await getServerCaller();

  let result;
  try {
    result = await caller.applications.getByIdForStaff({ id: applicationId });
  } catch (error) {
    if (error instanceof TRPCError && (error.code === "FORBIDDEN" || error.code === "UNAUTHORIZED")) {
      return (
        <main className="min-h-dvh bg-canvas" data-room="light">
          <SiteHeader />
          <section className="page-shell py-16 lg:py-24">
            <StaffOnlyNotice />
          </section>
          <MarketingFooter />
        </main>
      );
    }
    throw error;
  }

  if (!result) notFound();
  const { application, documents, notes } = result;

  const supabase = await createSupabaseServerClient();
  const documentLinks = await Promise.all(
    documents.map(async (doc) => {
      const { data } = await supabase.storage
        .from("kyc-documents")
        .createSignedUrl(doc.storagePath, 60 * 10);
      return { ...doc, url: data?.signedUrl ?? null };
    }),
  );

  const isDecided = application.status === "approved" || application.status === "declined";

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell grid gap-12 pb-24 pt-16 lg:grid-cols-12 lg:pb-32 lg:pt-24">
        <header className="min-w-0 lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
            HOC staff
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
              {application.companyName || "Untitled application"}
            </h1>
            <Chip variant={statusVariant[application.status]}>
              {application.status.replace("_", " ")}
            </Chip>
          </div>

          <dl className="mt-10 divide-y divide-contrast-low border-y border-contrast-low">
            <div className="grid gap-2 py-5 sm:grid-cols-2">
              <dt className="text-sm text-contrast-medium">Registration number</dt>
              <dd className="text-sm font-semibold sm:text-right">
                {application.companyRegistrationNumber || "Not provided"}
              </dd>
            </div>
            <div className="grid gap-2 py-5 sm:grid-cols-2">
              <dt className="text-sm text-contrast-medium">Contact phone</dt>
              <dd className="text-sm font-semibold sm:text-right">
                {application.contactPhone || "Not provided"}
              </dd>
            </div>
            <div className="grid gap-2 py-5 sm:grid-cols-2">
              <dt className="text-sm text-contrast-medium">Verification</dt>
              <dd className="text-sm font-semibold sm:text-right">
                {application.premblyStatus
                  ? `${application.premblyStatus.replace("_", " ")} - Prembly integration not yet connected`
                  : "Not started"}
              </dd>
            </div>
          </dl>

          <div className="mt-10">
            <p className="text-sm font-semibold">Documents</p>
            <ul className="mt-4 grid gap-2">
              {documentLinks.map((doc) => (
                <li className="flex items-center justify-between border-b border-contrast-low py-3 text-sm" key={doc.id}>
                  <span>{doc.kind.replace("_", " ")}</span>
                  {doc.url ? (
                    <a className="underline underline-offset-4" href={doc.url} rel="noreferrer" target="_blank">
                      View
                    </a>
                  ) : (
                    <span className="text-contrast-medium">Unavailable</span>
                  )}
                </li>
              ))}
              {documentLinks.length === 0 ? (
                <li className="py-3 text-sm text-contrast-medium">No documents uploaded yet.</li>
              ) : null}
            </ul>
          </div>

          {!isDecided ? (
            <form action={decideApplication} className="mt-10 flex flex-wrap gap-4">
              <input name="applicationId" type="hidden" value={application.id} />
              <Button name="decision" type="submit" value="approved" variant="signal">
                Approve
              </Button>
              <Button name="decision" type="submit" value="declined" variant="outline">
                Decline
              </Button>
            </form>
          ) : null}
        </header>

        <div className="min-w-0 lg:col-span-4 lg:col-start-9">
          <p className="text-sm font-semibold">Notes</p>
          <ul className="mt-4 grid gap-4">
            {notes.map((note) => (
              <li className="border-l-2 border-contrast-low pl-4 text-sm leading-6 text-contrast-high" key={note.id}>
                <p>{note.body}</p>
                <p className="mt-1 text-xs text-contrast-medium">
                  {note.internal ? "Internal" : "Visible to applicant"} ·{" "}
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
            {notes.length === 0 ? (
              <li className="text-sm text-contrast-medium">No notes yet.</li>
            ) : null}
          </ul>

          <form action={addStaffNote} className="mt-6 grid gap-4">
            <input name="applicationId" type="hidden" value={application.id} />
            <Textarea id="body" label="Add a note" name="body" required />
            <label className="flex items-center gap-2 text-sm">
              <input defaultChecked name="internal" type="checkbox" />
              Internal only
            </label>
            <Button className="justify-self-start" type="submit" variant="secondary">
              Add note
            </Button>
          </form>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
