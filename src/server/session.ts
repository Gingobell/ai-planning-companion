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
  const { data } = await getAuth().getSession();
  return data?.user ? { id: data.user.id, email: data.user.email } : undefined;
}

// Route handlers, server actions and pages get personal data only through this.
// Cached per request so several components share one session read.
export const getCurrentUser = cache(() => resolveCurrentUser(readSession, repositories()));
