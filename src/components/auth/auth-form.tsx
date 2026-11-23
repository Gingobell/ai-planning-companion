"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import type { AuthFormState } from "@/server/auth/actions";

interface AuthFormProps {
  action: (state: AuthFormState, form: FormData) => Promise<AuthFormState>;
  submitLabel: string;
  passwordAutoComplete: "current-password" | "new-password";
  switchText: string;
  switchLabel: string;
  switchHref: string;
}

const inputClass =
  "h-control-md w-full rounded-md bg-surface-3 px-pad-sm text-base text-ink shadow-inset placeholder:text-muted";

export function AuthForm({
  action,
  submitLabel,
  passwordAutoComplete,
  switchText,
  switchLabel,
  switchHref,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const timeZone = useRef<HTMLInputElement>(null);

  // The browser knows the user's IANA time zone; the server stores it on first sign-in.
  useEffect(() => {
    if (timeZone.current) timeZone.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);

  return (
    <form action={formAction} className="flex flex-col gap-s4">
      <input ref={timeZone} type="hidden" name="timeZone" />
      <label className="flex flex-col gap-s2">
        <span className="text-sm font-semibold text-ink-2">Email</span>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="flex flex-col gap-s2">
        <span className="text-sm font-semibold text-ink-2">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={passwordAutoComplete}
          className={inputClass}
        />
        {passwordAutoComplete === "new-password" && <span className="text-sm text-muted">At least 8 characters.</span>}
      </label>
      {state?.error && (
        <p role="alert" className="rounded-md bg-rose-soft px-pad-sm py-s2 text-sm text-rose">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-control-md items-center justify-center rounded-md bg-accent px-pad-md text-control leading-none font-semibold text-on-accent shadow-raised transition-transform duration-150 ease-out active:translate-y-px disabled:opacity-60"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>
      <p className="text-sm text-muted">
        {switchText}{" "}
        <Link href={switchHref} className="font-semibold text-accent-ink underline">
          {switchLabel}
        </Link>
      </p>
    </form>
  );
}
