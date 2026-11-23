"use server";

import { redirect } from "next/navigation";
import { authErrorMessage } from "@/server/auth/error-messages";
import { getAuth, SIGN_IN_PATH } from "@/server/auth/neon-auth";
import { ensureUserSettings, type SessionUser } from "@/server/current-user";
import { currentUserFor } from "@/server/session";

export type AuthFormState = { error: string } | null;

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

type AuthUser = { id: string; email: string } | null | undefined;

// After a successful sign-in or sign-up, make sure the user's settings record exists.
async function finishSignIn(user: AuthUser, timeZone: string) {
  if (!user) return { error: "Signed in, but the account was not returned. Please try again." };
  const current = await currentUserFor({ id: user.id, email: user.email } satisfies SessionUser);
  if (current === undefined) return { error: "Signed in, but the account was not returned. Please try again." };
  try {
    await ensureUserSettings(current.repos, current.id, timeZone);
  } catch {
    // Keep the message generic: errors from the database can include the user's own data.
    return { error: "Your account is ready, but your settings could not be saved. Please sign in again." };
  }
  redirect("/");
}

export async function signUpAction(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = field(form, "email");
  const { data, error } = await getAuth().signUp.email({
    email,
    name: field(form, "name") || email,
    password: field(form, "password"),
  });
  if (error) return { error: authErrorMessage(error, "signUp") };
  return finishSignIn(data?.user, field(form, "timeZone"));
}

export async function signInAction(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const { data, error } = await getAuth().signIn.email({ email: field(form, "email"), password: field(form, "password") });
  if (error) return { error: authErrorMessage(error, "signIn") };
  return finishSignIn(data?.user, field(form, "timeZone"));
}

export async function signOutAction() {
  await getAuth().signOut();
  redirect(SIGN_IN_PATH);
}
