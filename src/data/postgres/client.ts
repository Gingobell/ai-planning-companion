import type { Database } from "@/data/postgres/repositories";

export type DatabaseEnv = { DATABASE_URL?: string } & Record<string, string | undefined>;

// Creates the app's database connection from environment variables.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub until the client is built
export function createDatabase(env: DatabaseEnv = process.env): Database {
  throw new Error("not implemented");
}
