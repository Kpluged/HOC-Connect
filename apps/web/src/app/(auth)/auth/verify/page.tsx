import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { safeRedirectTarget } from "@/lib/auth/redirect";
import { firstParam, type SearchParams } from "@/lib/search-params";

import { AuthSplitShell } from "../auth-split-shell";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = {
  description: "Enter the code sent to your email to finish signing in.",
  title: "Verify your email",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const email = firstParam(query, "email");
  const redirectTo = safeRedirectTarget(firstParam(query, "redirectTo"));

  if (!email) redirect("/auth/sign-in");

  return (
    <AuthSplitShell
      description={
        <>
          We sent a verification code to <strong>{email}</strong>. Enter it
          below to continue.
        </>
      }
      eyebrow="Account"
      title="Check your email"
    >
      <VerifyForm email={email} redirectTo={redirectTo} />
    </AuthSplitShell>
  );
}
