import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { Database } from "@/data/postgres/repositories";
import * as schema from "@/data/postgres/schema";

export type DatabaseEnv = { DATABASE_URL?: string } & Record<string, string | undefined>;

// Creates the app's database connection from environment variables. The Neon WebSocket pool
// supports transactions, so multi-record changes can be saved completely or not at all.
// The pool connects lazily, on the first query.
export function createDatabase(env: DatabaseEnv = process.env): Database {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local, or set it in Vercel.");
  }
  return drizzle({ client: new Pool({ connectionString: url }), schema });
}
