"use server";

import { redirect } from "next/navigation";
import { getAuth, SIGN_IN_PATH } from "@/server/auth/neon-auth";
import { ensureUserSettings } from "@/server/current-user";
import { getCurrentUser } from "@/server/session";

export type AuthFormState = { error: string } | null;

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

// After a successful sign-in or sign-up, make sure the user's settings record exists.
async function finishSignIn(timeZone: string) {
  const current = await getCurrentUser();
  if (current === undefined) return { error: "Signed in, but the session was not found. Please try again." };
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
  const { error } = await getAuth().signUp.email({
    email,
    name: field(form, "name") || email,
    password: field(form, "password"),
  });
  if (error) return { error: error.message || "Could not create the account. Please try again." };
  return finishSignIn(field(form, "timeZone"));
}

export async function signInAction(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const { error } = await getAuth().signIn.email({ email: field(form, "email"), password: field(form, "password") });
  if (error) return { error: error.message || "Email or password is incorrect." };
  return finishSignIn(field(form, "timeZone"));
}

export async function signOutAction() {
  await getAuth().signOut();
  redirect(SIGN_IN_PATH);
}
