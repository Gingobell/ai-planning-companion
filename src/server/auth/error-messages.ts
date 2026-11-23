// Sign-in and sign-up never show Neon's own error text, so a visitor cannot learn whether
// an email is registered. Only "the service is down" is told apart, so the user knows to retry.
export const AUTH_ERROR_MESSAGES = {
  signIn: "Email or password is incorrect.",
  signUp: "Could not create the account. If you already have one, sign in instead.",
  unavailable: "The sign-in service can't be reached right now. Please try again in a moment.",
} as const;

export interface AuthApiError {
  code?: string;
  status?: number;
}

// Neon Auth's transport failures all use a NETWORK_ code (NEON_AUTH_NETWORK_ERROR_CODES in @neon/auth).
// Matching the prefix keeps this module free of Next.js server imports, so it runs in plain tests.
const isNetworkCode = (code: string) => code.startsWith("NETWORK_");

export function authErrorMessage(error: AuthApiError, action: "signIn" | "signUp"): string {
  const unavailable =
    (error.code !== undefined && isNetworkCode(error.code)) || (error.status !== undefined && error.status >= 500);
  return unavailable ? AUTH_ERROR_MESSAGES.unavailable : AUTH_ERROR_MESSAGES[action];
}
