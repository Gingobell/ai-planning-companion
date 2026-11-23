import { signOutAction } from "@/server/auth/actions";
import { getCurrentUser } from "@/server/session";

// Shows who is signed in, with a sign-out button. Reads the session, so it renders inside Suspense.
export async function AccountMenu() {
  const current = await getCurrentUser();
  if (current === undefined) return null;
  return (
    <form action={signOutAction} className="flex flex-wrap items-center gap-s2">
      <span className="min-w-0 flex-1 text-sm break-all text-muted">{current.email}</span>
      <button
        type="submit"
        className="inline-flex h-control-sm items-center justify-center self-center rounded-md bg-surface px-pad-sm text-control leading-none font-semibold text-ink-2 shadow-raised active:translate-y-px"
      >
        Sign out
      </button>
    </form>
  );
}
