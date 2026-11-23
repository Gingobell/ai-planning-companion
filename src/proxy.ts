import type { NextRequest } from "next/server";
import { getAuth, SIGN_IN_PATH, SIGN_UP_PATH } from "@/server/auth/neon-auth";

// Signed-out visitors to any page are sent to sign in (PRD Section 7, issue #7).
export default function proxy(request: NextRequest) {
  return getAuth().middleware({ loginUrl: SIGN_IN_PATH, publicRoutes: [SIGN_IN_PATH, SIGN_UP_PATH] })(request);
}

export const config = {
  // Skip the auth API, Next.js internals and files with an extension (icons, images).
  matcher: ["/((?!api/auth|_next/static|_next/image|.*\\..*).*)"],
};
