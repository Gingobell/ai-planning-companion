import { describe, expect, it } from "vitest";
import { authConfigFromEnv } from "@/server/auth/auth-config";

const SECRET = "x".repeat(32);

describe("authConfigFromEnv", () => {
  it("uses the Auth URL the Neon integration sets for this deployment", () => {
    const env = {
      DATABASE_NEON_AUTH_BASE_URL: "https://branch-auth.example/neondb/auth",
      NEON_AUTH_BASE_URL: "https://main-auth.example/neondb/auth",
      NEON_AUTH_COOKIE_SECRET: SECRET,
    };
    expect(authConfigFromEnv(env)).toEqual({
      baseUrl: "https://branch-auth.example/neondb/auth",
      cookies: { secret: SECRET },
    });
  });

  it("fails with a clear message when a variable is missing", () => {
    expect(() => authConfigFromEnv({ NEON_AUTH_COOKIE_SECRET: SECRET })).toThrow(/DATABASE_NEON_AUTH_BASE_URL/);
  });
});
