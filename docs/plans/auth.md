# Plan: Authentication and account isolation (#7)

Approved by Gin on 2026-11-23. Built on top of the #6 branch.

## Context

Every later feature reads and writes personal records, so users must sign in and only ever reach their own data (#7, PRD Section 7 "Security", OWASP broken access control). The stack is decided (PR #47): Neon Auth, which is managed Better Auth on the same Neon database. The #6 data layer (PR #49) already takes a `userId` on every call; #7 supplies that id from the signed-in session and makes it impossible to pass another one. #7 is not one of the six TDD features, so tests are required but a red step is not.

## Scope

In: sign up, sign in and sign out with email and password; signed-out visitors redirected to sign in; the user's settings record created on first sign-in; every server read and write scoped to the session's user; a two-account isolation test.

Out (noted as later options, no issue yet): email verification (off by default; Neon's shared mail sender is rate-limited and cannot send verification links), "forgot password", and Google or GitHub sign-in (production needs our own OAuth apps).

## Acceptance criteria (from #7)

- **AC1** Pages that show personal data redirect a signed-out visitor to `/sign-in`.
- **AC2** A user cannot read, change or delete another user's records, through the UI or a server action.
- **AC3** Assistant actions go through the same ownership checks as direct edits.
- **AC4** An integration test with two accounts shows each sees only their own records.

## Design

- **Package:** `@neon/auth` 0.8.2 (released 2026-10-30; peer `next >=16`).
- **Server instance** `src/server/auth/neon-auth.ts`: `createNeonAuth({ baseUrl: NEON_AUTH_BASE_URL, cookies: { secret: NEON_AUTH_COOKIE_SECRET } })`, failing clearly when a variable is missing, like `createDatabase` in `src/data/postgres/client.ts`.
- **Route handler** `src/app/api/auth/[...path]/route.ts` exports `auth.handler()`.
- **Proxy** `src/proxy.ts` (Next 16 name for middleware): `auth.middleware({ loginUrl: "/sign-in" })`, matching every route except `/sign-in`, `/sign-up`, `/api/auth/*` and static files. This covers AC1.
- **One way in for data: user-scoped repositories.** `src/server/session.ts` exports `getCurrentUser()`: reads the session (cached per request with React `cache`), creates the `users` row on first sign-in, and returns `{ user, repos }` where `repos` is `scopeToUser(createPostgresRepositories(db), userId)`. `scopeToUser` (`src/data/scoped-repositories.ts`) wraps every repository so callers never pass a `userId`; it is fixed from the session. Pages, server actions and, later, assistant actions only use this, so AC2 and AC3 hold by construction. A short rule in CLAUDE.md says route handlers and server actions must get data through `getCurrentUser()`.
- **First sign-in:** the `users.id` is the Neon Auth user id. The sign-up form sends the browser's IANA time zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) in a hidden field; availability and check-in times start empty and are asked for in chat later, so nothing is invented (PRD Section 7).
- **Next 16 with `cacheComponents`:** no `force-dynamic` (the Neon guide uses it; Next 16 docs say to remove it). The session is read inside components wrapped in `<Suspense>`, so the shell still prerenders.
- **Pages:** `src/app/(auth)/sign-in/page.tsx` and `sign-up/page.tsx`, server actions with `useActionState`, labeled inputs, errors shown in text (not color alone), DESIGN.md tokens and control sizes, usable at 400 px and with Chinese text. These pages sit outside the app shell. A sign-out button goes at the bottom of the sidebar (`src/components/app-shell/sidebar.tsx`), plus the signed-in email.
- **Env:** `.env.example` gains `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` placeholders.

## Steps

1. **Local build check first.** Install `@neon/auth`, add the instance, route handler and proxy, and confirm `npm run build` passes with Next 16.4 and `cacheComponents` (placeholder env values, no network). If it does not build, stop and report before anything else.
2. **Scoped repositories with tests:** `scopeToUser` plus the two-account test (AC2, AC4) on PGlite, reusing `createTestDb` (`src/data/postgres/test-db.ts`) and the samples in `src/data/repository-contract.ts`.
3. **`getCurrentUser` with tests:** session to user id, first-sign-in row creation (time zone from sign-up, empty availability), signed-out returns nothing. The session reader is injected so tests use a double.
4. **Pages and sign-out**, checked in the browser at desktop and 400 px.
5. **One batch for Gin (only after step 1 passes),** all in the Neon and Vercel dashboards:
   - Enable Auth on the Neon project (Vercel Storage, open in Neon, Auth, Enable).
   - Copy the Auth URL.
   - Add trusted domains `https://ai-planning-companion.vercel.app` and a preview wildcard (`https://ai-planning-companion-*-gingobell.vercel.app`).
   - Run `openssl rand -base64 32` for the cookie secret.
   - Add `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` to Vercel (Production and Preview, Sensitive).
6. **Verify on the PR preview:** sign up, sign out, sign in, a signed-out redirect, and a second account. If the preview wildcard is rejected (the docs do not confirm our host pattern), add the PR's stable alias `ai-planning-companion-git-<branch>-gingobell.vercel.app` as an exact domain instead and say so in the PR.
7. **Docs in the same PR:** CLAUDE.md (data access through `getCurrentUser`, layout, tech stack status), README (local `.env.local` for auth), and `docs/plans/auth.md` (this plan).

## Known trade-off

Vercel sets one `NEON_AUTH_BASE_URL` for Production and Preview, so preview sign-ups are stored in the main branch's `neon_auth` users while their app data stays in the preview database branch. This is harmless for a class project; the PR says so.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` pass locally.
- The two-account test passes: each user's list, get, save and remove see only their own records.
- On the PR preview: a signed-out visit to `/` redirects to `/sign-in`; sign up, sign out and sign in work; a second account sees none of the first account's records.
- After merge, the same checks pass on the production URL.
