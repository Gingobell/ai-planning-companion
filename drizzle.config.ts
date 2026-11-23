import { defineConfig } from "drizzle-kit";

// Migrations use the direct (unpooled) connection; Vercel sets both variables for every environment.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/data/postgres/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
});
