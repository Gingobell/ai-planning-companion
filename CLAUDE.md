# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

AI Planning Companion is a conversational planning assistant built by Jingyi Fu and Sihui Lyu for CS6983 Project 3. Users capture goals and tasks in a sentence; the assistant clarifies missing deadlines, proposes specific time blocks, checks in at agreed times and learns preferences the user confirms. The product requirements are imported below and are the source of truth for behavior.

@docs/product/PRD.md

## Rule files

Every project rule lives in one file. Before changing an area, read its rule file; when a rule changes, edit that file in the same commit instead of restating the rule elsewhere.

| Area | Rule file | Read before |
| --- | --- | --- |
| Product behavior, user stories, edge cases | [docs/product/PRD.md](docs/product/PRD.md) | Any feature work, frontend or backend |
| UI style, tokens, spacing, controls, adaptive layout | [DESIGN.md](DESIGN.md) | Any frontend or styling change |
| Test-driven development protocol | [docs/engineering/tdd-workflow.md](docs/engineering/tdd-workflow.md) | Writing or changing any code |
| Architecture, stack, coding conventions, security | this file (CLAUDE.md) | Any code change |
| Project 3 course requirements, status and evidence | [docs/plans/p3-requirements.md](docs/plans/p3-requirements.md) | Planning work, choosing what to build next, and finishing any item it lists |
| Project 3 work split and ownership | [docs/plans/p3-work-split.md](docs/plans/p3-work-split.md) | Starting work in any area, and before changing code in an area another partner owns |
| Project 3 sprint dates, goals and records | [docs/plans/p3-sprints.md](docs/plans/p3-sprints.md) | Planning a sprint, choosing what to work on, and writing standups or retrospectives |
| Feature plans | `docs/plans/<feature>.md` | Implementing that feature |
| Evidence of red, green and session commands | `docs/evidence/` | Recording TDD steps and context commands |

### Keeping rule files current

These files change as the project grows. A rule changes only after a human confirms it, and once confirmed it is written down without being asked.

- **Confirmed means** a human accepted a proposal, asked for a change and approved the result, or merged a PR. Rejected options and unreviewed experiments are not written into rule files.
- **Update in the same commit.** When a confirmed decision adds or replaces a rule (a new dependency or tool, a changed architecture choice, a new convention, a revised user story or edge case, a changed TDD step, a new design rule), the agent edits the matching rule file from the table above in the same commit as the code. For example, choosing a database provider updates the tech stack table here; changing a user story updates the PRD.
- **One home per rule.** Edit the rule where it lives and link to it from elsewhere. Do not copy a rule into a second file.
- **Raise conflicts first.** If a request contradicts an existing rule, point out the conflict and ask which one wins before editing code or rules.
- **Show the rule diff.** Before every commit, show the rule file changes next to the code changes and say in the commit message which rule changed.
- **Keep the record.** `DESIGN.md` keeps a changelog section with date, change and reason. Other rule files rely on git history and the commit message.

Current phase: HW4 is complete. The repository contains a Next.js skeleton with Vitest and the first domain feature, time block recommendation (US-02, US-06), built with TDD. Sprint 1 has added the app shell with the DESIGN.md tokens. Chat, LLM integration, database, authentication, reminders and the Mac companion are not built yet.

## Commands

- `npm run dev` starts the Next.js dev server at http://localhost:3000 (Turbopack).
- `npm run build` creates a production build; `npm start` serves it.
- `npm run lint` runs ESLint 9 (flat config in `eslint.config.mjs`, extending `eslint-config-next` core-web-vitals and typescript).
- `npm run typecheck` runs `next typegen` (generates route types such as `LayoutProps`) and then `tsc --noEmit`.
- `npm test` runs Vitest once; `npm run test:watch` runs it in watch mode; `npm run test:coverage` adds a V8 coverage report.
- `npm run format:check` runs Prettier (`.prettierrc.json`, print width 120); `npm run format` rewrites files. Markdown is excluded in `.prettierignore`.
- CI (`.github/workflows/ci.yml`) runs lint, format check, typecheck and tests with coverage on every pull request and push to `main`.
- `.github/workflows/neon-branch-cleanup.yml` deletes a pull request's Neon preview branch (`preview/<git branch>`) when the pull request is merged or closed, so the Free plan's 10-branch limit is not reached. It needs the repository variable `NEON_PROJECT_ID` and the secret `NEON_API_KEY` (a project-scoped Neon API key).
- Single test file: `npx vitest run path/to/file.test.ts`. Single test by name: `npx vitest run -t "test name"`.
- `npm run db:generate` writes a SQL migration into `drizzle/` after a change to `src/data/postgres/schema.ts`; commit it with the schema change. `npm run db:migrate` applies migrations to the database in `DATABASE_URL_UNPOOLED`. Vercel runs `vercel-build`, which migrates before `next build`, so production and every preview branch are migrated on deploy. Tests need no database.

## Hooks

Configured in `.claude/settings.json`; scripts live in `.claude/hooks/`.

- **PostToolUse, `post-edit.sh`:** after Claude edits or writes a `.ts` or `.tsx` file under `src/`, ESLint runs on that file and any error is sent back to Claude to fix. Editing a `.tsx` or `.css` file under `src/` also reminds Claude to follow `DESIGN.md`.
- **Stop, `stop-tests.sh`:** before Claude ends a turn with uncommitted changes in `src/`, `npm test` and `npm run typecheck` run. A failure blocks the stop once so Claude fixes it. A TDD red step (only `*.test.ts` files changed) is reported but not blocked, and a second failure in a row is handed to the human instead of looping.

## Next.js version warning

This project uses Next.js 16.4.6 and React 19.3, which have breaking changes compared with older Next.js versions. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `03-architecture`, etc.) and heed deprecation notices. The block in `AGENTS.md` is generated and re-added by `next dev`; do not remove it.

## Tech stack

| Layer | Choice | Status |
| --- | --- | --- |
| Web app | Next.js 16 App Router, React 19, TypeScript strict | In repo |
| Styling | Tailwind CSS v4 via Turbopack loader | In repo |
| Dates and timezones | `temporal-polyfill` (Temporal API) | In repo |
| Unit and integration tests | Vitest 4 | In repo |
| Test coverage | Vitest coverage with `@vitest/coverage-v8`, 70% target | In repo, reported in CI |
| E2E tests | Playwright | Planned for P3 |
| Formatting | Prettier, checked in CI with ESLint | In repo |
| Secret scanning | Gitleaks as a pre-commit hook | Chosen, not in repo |
| Database | PostgreSQL on Neon (Free plan), added through the Vercel Marketplace integration, in the Washington, D.C. region (Vercel `iad1`, Neon `aws-us-east-1`). Each preview deploy gets its own database branch. The connection string is `DATABASE_URL` | In repo |
| ORM and migrations | Drizzle ORM with drizzle-kit migrations; PGlite for database tests without a server | In repo |
| Authentication | Neon Auth (managed Better Auth; users stored in the `neon_auth` schema of the same database) | In repo; enabled on the main branch, with the production URL and the `feat/auth` preview as trusted domains |
| LLM (in the app) | Google Gemini API behind a provider-neutral adapter | Chosen, not in repo |
| Mac companion | Electron thin shell: global shortcut, small window loading the web chat, notifications | Chosen, not in repo |
| Hosting and CI | Vercel Hobby, production at https://ai-planning-companion.vercel.app, a preview deploy for every pull request; GitHub Actions | Vercel in use; GitHub Actions planned |
| MCP for Claude Code | Playwright MCP server in a shared `.mcp.json`, used for simulated-user acceptance testing | Chosen, not in repo |

Why these providers: all are free, and the public app must stay reachable for grading and the showcase. Neon free compute scales to zero after 5 minutes idle and wakes on the next query in a few hundred milliseconds, but the project itself is never paused for inactivity (Supabase free projects pause after a week), and keeping authentication in the same database means one service and one set of secrets. Environment variable values live in Vercel and `.env.local`, never in the repository.

Do not add a dependency for an undecided layer without an explicit team decision recorded in this file.

## Architecture decisions

- **Domain core is framework-free.** Planning rules live in `src/domain/` as pure TypeScript functions with no imports from Next.js, React, the database or an LLM SDK. Route handlers, server actions and UI call into the domain; the domain never calls out.
- **The application validates, the assistant proposes.** LLM output is treated as a proposal. Every proposed task, deadline or time block passes the same domain validation as a direct user edit before it is saved.
- **The LLM sits behind an adapter.** The app calls the model through one small provider-neutral interface, so Gemini can be swapped without touching the domain or the UI. Development itself is done with Claude Code; Gemini is only the model the product calls at runtime.
- **Saved records are the source of truth.** Task status, deadlines and time blocks come from stored records, never from conversation history.
- **Deadlines are never invented.** A task without an external deadline or a user-agreed target date stays unscheduled, and scheduling functions return an explicit "needs deadline" result instead of guessing.
- **Results instead of exceptions for expected outcomes.** Domain functions return discriminated unions (for example `{ kind: "scheduled" } | { kind: "infeasible"; reason }`) for expected cases such as no fit before a deadline. Exceptions are reserved for programming errors.
- **Time handling.** Store instants in UTC and compute calendar logic in the user's IANA timezone. Use `Temporal` imported from `temporal-polyfill` for all date and time math in the domain; do not use `Date` arithmetic. Reason: Node 25 and TypeScript 5.9 have no native `Temporal`, and the Temporal API separates wall-clock times from instants, which keeps DST transition days correct. The polyfill can be swapped for the native global once the runtime supports it.

Current layout:

- App Router under `src/app/`. The root `layout.tsx` holds the font and `globals.css`. Signed-in pages live in the `(app)` route group, whose layout adds the app frame and sidebar; `/sign-in` and `/sign-up` live in `(auth)` outside the frame. Layout props use the generated global `LayoutProps<"/">` type. Routes `/`, `/today`, `/week`, `/goals` and `/preferences` start as placeholders that their owners replace.
- Authentication is Neon Auth through `src/server/auth/` (lazy `getAuth()`, server actions) and the API route `src/app/api/auth/[...path]`. `src/proxy.ts` redirects signed-out visitors to `/sign-in` on every page except `/sign-in` and `/sign-up`.
- The app shell (sidebar, nav items, brand mark, page placeholder) lives in `src/components/app-shell/`. Nav destinations are defined once in `nav-items.ts`.
- Domain code goes under `src/domain/<area>/`, with tests next to the code as `*.test.ts`. The first area is `src/domain/scheduling/` (`recommend-time-block.ts`).
- Shared record types are defined once in `src/domain/records.ts`, and data access interfaces in `src/domain/repositories.ts`. Every repository call takes the owner's `userId`. Implementations (in-memory, PostgreSQL) live outside `src/domain/`. Changes to either file go through their owner (see [docs/plans/p3-work-split.md](docs/plans/p3-work-split.md)).
- Data access implementations live in `src/data/`. `src/data/postgres/` holds the Drizzle schema, row mappers, repositories and the client (`createDatabase`, which reads `DATABASE_URL`). `src/data/repository-contract.ts` is the shared test suite every implementation runs; database tests use PGlite through `src/data/postgres/test-db.ts`. SQL migrations live in `drizzle/`.
- Import alias `@/*` maps to `./src/*` in `tsconfig.json` and in `vitest.config.mts` (`.mts` so Vite loads it as ESM).
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`, and wires Tailwind CSS v4 through a Turbopack loader rule (`@tailwindcss/turbopack`) for `*.css` instead of PostCSS. `globals.css` uses `@import "tailwindcss"` and `@theme inline` tokens.

## Coding conventions

- TypeScript `strict`; no `any`, no non-null assertions without a comment explaining why.
- Named exports only. File names in kebab-case; types and interfaces in PascalCase; functions in camelCase.
- Keep domain functions pure and deterministic: pass the current time and timezone in as arguments, never read the clock inside the domain.
- Prefer small functions with descriptive names over comments. Comments explain why, not what.
- Code, comments, docs, commit messages and PR text are written in concise, natural English without em dashes.
- Commit messages follow Conventional Commits. TDD phases are marked in the subject: `test: ... (red)`, `feat: ... (green)`, `refactor: ...`.

## Testing strategy

Strict test-driven development, following the protocol imported below. Summary:

- For the TDD features listed in [docs/plans/p3-work-split.md](docs/plans/p3-work-split.md), every acceptance criterion gets a failing test before any implementation code exists. Other code with logic still gets tests; pure layout, styling and configuration are checked without them (see the protocol).
- Unit tests cover domain rules and edge cases (boundaries, empty inputs, DST transitions). Integration tests will cover route handlers and database writes once they exist. Playwright E2E tests will cover the core user flow in P3.
- Tests assert behavior through public functions, not implementation details.
- Target at least 70% coverage for the project, measured in CI once it exists.
- Model calls are replaced with test doubles in tests. A passing test with a double verifies application behavior only, never model quality.

@docs/engineering/tdd-workflow.md

## Security (OWASP Top 10 awareness)

- **Broken access control:** every read and write checks account ownership on the server; assistant actions go through the same checks. Pages, route handlers, server actions and assistant actions get personal data only through `getCurrentUser()` in `src/server/session.ts`, whose repositories are bound to the session's user (`scopeToUser`) and take no `userId`. Never read a user id from the request body or URL.
- **Injection:** use parameterized queries; validate and schema-check all LLM output and user input before it reaches the domain or the database.
- **Cryptographic failures and secrets:** never commit secrets or `.env` files; use `.env.example` with placeholder names only.
- **Security misconfiguration and vulnerable components:** keep `npm audit` clean; do not add dependencies without a reason.
- **Logging:** never log private conversation content or tokens.

## Code review (C.L.E.A.R.)

Every pull request is reviewed by the other partner or a reviewer agent, with one comment point for each letter of the course's C.L.E.A.R. framework (Week 11, "Claude Code Extensibility"):

- **Context:** does the code fit the project's architecture and conventions?
- **Logic:** is the business logic correct, and are edge cases handled?
- **Evidence:** are there tests, and do they verify the behavior?
- **Architecture:** does it follow established patterns, and does it add dependencies?
- **Risk:** are there security, performance or data exposure concerns?

## Do's and don'ts

Do:

- Read the PRD section for the story you are working on before planning.
- Read `DESIGN.md` before any frontend change. Use only its tokens and control sizes. When a human confirms a design change, update `DESIGN.md` and its changelog in the same commit without being asked (see "How this file evolves" in `DESIGN.md`).
- Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run format:check` before proposing a commit.
- Show the exact file list and commit message to a human before every commit and push.
- Keep each commit to one TDD phase or one setup change.

Don't:

- Write implementation code before a failing test for that behavior is committed.
- Use unrelated failures (missing imports, syntax errors, uninstalled packages) as a "red" step.
- Infer task completion from silence or elapsed time, or turn a temporary condition into a permanent preference, in code or in tests.
- Rewrite or squash git history that shows the red-green-refactor sequence.
- Commit personal settings, credentials or local machine paths. `.claude/settings.local.json` is gitignored for personal Claude Code settings.

## Context management

- **Start of a session:** this file, the imported PRD and TDD protocol, `git log --oneline` and `docs/evidence/` are enough to recover context. Read them instead of relying on earlier chat.
- **`/clear`:** use between unrelated tasks, for example after finishing a feature and before starting setup work, so stale context does not leak into the next plan.
- **`/compact`:** use during a long TDD session when context grows, with a focus instruction such as "keep the acceptance criteria, current red/green status and last commit SHA".
- **`--continue`:** use `claude --continue` to resume the most recent session in this repository after a break instead of re-explaining the task.
- Record when these commands are actually used, and what happened, in `docs/evidence/`.
