export type AuthEnv = { DATABASE_NEON_AUTH_BASE_URL?: string; NEON_AUTH_COOKIE_SECRET?: string } & Record<
  string,
  string | undefined
>;

// The Neon integration sets DATABASE_NEON_AUTH_BASE_URL for every Vercel deployment: production gets the main
// branch's Auth, and each preview gets the Auth of its own database branch, which already trusts the preview URL.
// Kept apart from neon-auth.ts, which imports Next.js server modules, so it runs in plain tests.
export function authConfigFromEnv(env: AuthEnv = process.env) {
  const baseUrl = env.DATABASE_NEON_AUTH_BASE_URL;
  const secret = env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret) {
    throw new Error(
      "DATABASE_NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET must be set. Copy .env.example to .env.local, or set them in Vercel.",
    );
  }
  return { baseUrl, cookies: { secret } };
}
