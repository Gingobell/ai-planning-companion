import { connection } from "next/server";
import { cache } from "react";
import { createDatabase } from "@/data/postgres/client";
import { createPostgresRepositories, type Database } from "@/data/postgres/repositories";
import { getAuth } from "@/server/auth/neon-auth";
import { resolveCurrentUser, type SessionUser } from "@/server/current-user";

let database: Database | undefined;

function repositories() {
  database ??= createDatabase();
  return createPostgresRepositories(database);
}

async function readSession(): Promise<SessionUser | undefined> {
  // Request-time only: prerendering stops here, so builds need no auth or database variables.
  await connection();
  const { data } = await getAuth().getSession();
  return data?.user ? { id: data.user.id, email: data.user.email } : undefined;
}

// Right after sign-in or sign-up the new session cookie is not readable in the same request,
// so those actions pass the user that Neon Auth just returned.
export function currentUserFor(user: SessionUser) {
  return resolveCurrentUser(async () => user, repositories);
}

// Route handlers, server actions and pages get personal data only through this.
// Cached per request so several components share one session read.
export const getCurrentUser = cache(() => resolveCurrentUser(readSession, repositories));
