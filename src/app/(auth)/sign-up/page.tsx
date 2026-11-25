import { AuthForm } from "@/components/auth/auth-form";
import { signUpAction } from "@/server/auth/actions";
import { SIGN_IN_PATH } from "@/server/auth/neon-auth";

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-xl">Create an account</h1>
      <AuthForm
        action={signUpAction}
        submitLabel="Create account"
        passwordAutoComplete="new-password"
        switchText="Already have an account?"
        switchLabel="Sign in"
        switchHref={SIGN_IN_PATH}
      />
      <p className="text-sm text-muted">
        The assistant uses Google&apos;s Gemini free tier. Google may use what you type in chat to improve its products.
      </p>
    </>
  );
}
