import { describe, expect, it } from "vitest";
import { AUTH_ERROR_MESSAGES, authErrorMessage } from "@/server/auth/error-messages";

describe("auth error messages", () => {
  it("gives the same sign-in message whether the email is unknown or the password is wrong", () => {
    const unknownEmail = authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 }, "signIn");
    const wrongPassword = authErrorMessage({ code: "INVALID_PASSWORD", status: 401 }, "signIn");
    expect(unknownEmail).toBe(AUTH_ERROR_MESSAGES.signIn);
    expect(wrongPassword).toBe(AUTH_ERROR_MESSAGES.signIn);
  });

  it("does not reveal that an email is already registered on sign-up", () => {
    const message = authErrorMessage({ code: "USER_ALREADY_EXISTS", status: 422 }, "signUp");
    expect(message).toBe(AUTH_ERROR_MESSAGES.signUp);
    expect(message).not.toMatch(/exists|registered/i);
  });

  it("tells the user to retry when the sign-in service cannot be reached", () => {
    expect(authErrorMessage({ code: "NETWORK_DNS", status: 0 }, "signIn")).toBe(AUTH_ERROR_MESSAGES.unavailable);
    expect(authErrorMessage({ code: "INTERNAL_ERROR", status: 503 }, "signUp")).toBe(AUTH_ERROR_MESSAGES.unavailable);
  });
});
