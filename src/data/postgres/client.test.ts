import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createDatabase } from "@/data/postgres/client";

describe("database client", () => {
  it("fails with a clear message when DATABASE_URL is not set", () => {
    expect(() => createDatabase({})).toThrow(/DATABASE_URL is not set/);
  });

  it("connects from DATABASE_URL without opening a connection up front", () => {
    expect(createDatabase({ DATABASE_URL: "postgresql://user:password@localhost/db" })).toBeDefined();
  });

  it("lists every database variable in .env.example with placeholder values only", () => {
    const example = readFileSync(".env.example", "utf8");
    expect(example).toMatch(/^DATABASE_URL=postgresql:\/\/user:password@host\//m);
    expect(example).toMatch(/^DATABASE_URL_UNPOOLED=postgresql:\/\/user:password@host\//m);
    expect(example).not.toMatch(/neon\.tech/);
  });
});
