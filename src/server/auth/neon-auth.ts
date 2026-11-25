import { createNeonAuth } from "@neon/auth/next/server";
import { authConfigFromEnv } from "@/server/auth/auth-config";

// Pages that stay reachable without signing in; everything else redirects to SIGN_IN_PATH.
export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";

let instance: ReturnType<typeof createNeonAuth> | undefined;

// Created on first use, so a build without auth variables still succeeds.
export function getAuth() {
  instance ??= createNeonAuth(authConfigFromEnv());
  return instance;
}
