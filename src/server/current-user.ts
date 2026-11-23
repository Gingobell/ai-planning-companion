import type { Id, User } from "@/domain/records";
import type { Repositories } from "@/domain/repositories";
import { scopeToUser, type ScopedRepositories } from "@/data/scoped-repositories";

export interface SessionUser {
  id: Id;
  email: string;
}

export interface CurrentUser extends SessionUser {
  repos: ScopedRepositories;
}

// The only way server code gets data: the session decides whose records it can reach.
export async function resolveCurrentUser(
  readSession: () => Promise<SessionUser | undefined>,
  repos: Repositories,
): Promise<CurrentUser | undefined> {
  const session = await readSession();
  if (session === undefined) return undefined;
  return { ...session, repos: scopeToUser(repos, session.id) };
}

export function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

// Creates the settings record on first sign-in. The time zone comes from the user's browser;
// availability and check-in times start empty and are asked for in chat, never guessed.
export async function ensureUserSettings(repos: ScopedRepositories, id: Id, timeZone: string): Promise<User> {
  const existing = await repos.user.get();
  if (existing !== undefined) return existing;
  if (!isTimeZone(timeZone)) throw new Error(`Unknown time zone: ${timeZone}`);
  const result = await repos.user.save({ id, version: 0, timeZone, availability: {}, checkInTimes: [] });
  if (result.kind === "saved") return result.record;
  if (result.kind === "conflict") return result.current;
  throw new Error("User settings could not be created");
}
