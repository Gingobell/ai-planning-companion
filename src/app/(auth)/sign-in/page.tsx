import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/server/auth/actions";
import { SIGN_UP_PATH } from "@/server/auth/neon-auth";

export default function SignInPage() {
  return (
    <>
      <h1 className="text-xl">Sign in</h1>
      <AuthForm
        action={signInAction}
        submitLabel="Sign in"
        passwordAutoComplete="current-password"
        switchText="New here?"
        switchLabel="Create an account"
        switchHref={SIGN_UP_PATH}
      />
    </>
  );
}
