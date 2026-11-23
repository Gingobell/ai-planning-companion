import type { Id, OwnedRecord, User } from "@/domain/records";
import type { Repositories, Repository, SaveResult } from "@/domain/repositories";

// Repositories bound to one signed-in user. Callers never pass a userId, and every saved
// record is stamped with the session's user, so no code path can reach another account.

type WithoutUser<F> = F extends (userId: Id, ...args: infer A) => infer R ? (...args: A) => R : never;

type ScopedRepository<T> = {
  [K in keyof T]: K extends "save" ? (record: SavedRecord<T>) => ReturnType<WithoutUser<T[K]>> : WithoutUser<T[K]>;
};

type SavedRecord<T> = T extends Repository<infer R> ? Omit<R, "userId"> & Partial<Pick<R, "userId">> : never;

export type ScopedRepositories = {
  user: { get(): Promise<User | undefined>; save(user: User): Promise<SaveResult<User>> };
} & { [K in Exclude<keyof Repositories, "users">]: ScopedRepository<Repositories[K]> };

function scopeRepository(repository: object, userId: Id) {
  const methods = repository as Record<string, (...args: unknown[]) => unknown>;
  const bound = Object.fromEntries(
    Object.entries(methods).map(([name, method]) => [name, (...args: unknown[]) => method(userId, ...args)]),
  );
  return {
    ...bound,
    save: (record: Omit<OwnedRecord, "userId">) => (repository as Repository<OwnedRecord>).save(userId, { ...record, userId }),
  };
}

export function scopeToUser(repos: Repositories, userId: Id): ScopedRepositories {
  const { users, ...owned } = repos;
  const scoped = Object.fromEntries(Object.entries(owned).map(([name, repository]) => [name, scopeRepository(repository, userId)]));
  return {
    // Built by mapping over the repositories at runtime, which TypeScript cannot follow;
    // the two-account tests check every repository through this shape.
    ...(scoped as unknown as Omit<ScopedRepositories, "user">),
    user: {
      get: () => users.get(userId),
      save: (user) => {
        if (user.id !== userId) throw new Error("Cannot save another user's settings");
        return users.save(user);
      },
    },
  };
}
