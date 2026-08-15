"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

import { verifySignInCode } from "../actions";

export function VerifyForm({
  email,
  redirectTo,
}: {
  email: string;
  redirectTo: string;
}) {
  const [state, action, pending] = useActionState(
    verifySignInCode,
    undefined,
  );

  return (
    <form action={action} className="grid gap-8">
      <input name="email" type="hidden" value={email} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <Field
        autoComplete="one-time-code"
        autoFocus
        description="Check your inbox for the verification code."
        error={state?.error}
        id="token"
        inputMode="numeric"
        label="Verification code"
        maxLength={10}
        name="token"
        pattern="\d{6,10}"
        placeholder="000000"
        required
      />
      <Button
        className="w-full sm:w-auto sm:justify-self-start"
        disabled={pending}
        type="submit"
        variant="signal"
      >
        {pending ? "Verifying…" : "Verify and continue"}
      </Button>
    </form>
  );
}
