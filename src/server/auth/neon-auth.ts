import { createNeonAuth } from "@neon/auth/next/server";

export type AuthEnv = { NEON_AUTH_BASE_URL?: string; NEON_AUTH_COOKIE_SECRET?: string } & Record<
  string,
  string | undefined
>;

// Pages that stay reachable without signing in; everything else redirects to SIGN_IN_PATH.
export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";

export function authConfigFromEnv(env: AuthEnv = process.env) {
  const baseUrl = env.NEON_AUTH_BASE_URL;
  const secret = env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret) {
    throw new Error(
      "NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET must be set. Copy .env.example to .env.local, or set them in Vercel.",
    );
  }
  return { baseUrl, cookies: { secret } };
}

let instance: ReturnType<typeof createNeonAuth> | undefined;

// Created on first use, so a build without auth variables still succeeds.
export function getAuth() {
  instance ??= createNeonAuth(authConfigFromEnv());
  return instance;
}
