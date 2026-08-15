import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { firstParam, type SearchParams } from "@/lib/search-params";

import { AuthSplitShell } from "../../auth-split-shell";

export const metadata: Metadata = {
  description: "Confirm your email to finish creating your account.",
  title: "Check your email",
};

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const email = firstParam(query, "email");

  if (!email) redirect("/auth/register");

  return (
    <AuthSplitShell
      description={
        <>
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account, then sign in.
        </>
      }
      eyebrow="Account"
      title="Check your email"
    >
      <ButtonLink href="/auth/sign-in" variant="outline">
        Back to sign in
      </ButtonLink>
    </AuthSplitShell>
  );
}
