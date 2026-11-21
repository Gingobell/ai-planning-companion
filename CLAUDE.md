# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

AI Planning Companion is a conversational planning assistant built by Jingyi Fu and Sihui Lyu for CS6983 Project 3. Users capture goals and tasks in a sentence; the assistant clarifies missing deadlines, proposes specific time blocks, checks in at agreed times and learns preferences the user confirms. The product requirements are imported below and are the source of truth for behavior.

@docs/product/PRD.md

Current phase: HW4. The repository contains a Next.js skeleton with Vitest. The first domain feature, time block recommendation (US-02, US-06), is being built with TDD. LLM, database, authentication, reminders and the Mac companion are not built yet.

## Commands

- `npm run dev` starts the Next.js dev server at http://localhost:3000 (Turbopack).
- `npm run build` creates a production build; `npm start` serves it.
- `npm run lint` runs ESLint 9 (flat config in `eslint.config.mjs`, extending `eslint-config-next` core-web-vitals and typescript).
- `npm run typecheck` runs `tsc --noEmit`.
- `npm test` runs Vitest once; `npm run test:watch` runs it in watch mode.
- Single test file: `npx vitest run path/to/file.test.ts`. Single test by name: `npx vitest run -t "test name"`.

## Next.js version warning

This project uses Next.js 16.4.6 and React 19.3, which have breaking changes compared with older Next.js versions. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `03-architecture`, etc.) and heed deprecation notices. The block in `AGENTS.md` is generated and re-added by `next dev`; do not remove it.

## Tech stack

| Layer | Choice | Status |
| --- | --- | --- |
| Web app | Next.js 16 App Router, React 19, TypeScript strict | In repo |
| Styling | Tailwind CSS v4 via Turbopack loader | In repo |
| Dates and timezones | `temporal-polyfill` (Temporal API) | In repo |
| Unit and integration tests | Vitest 4 | In repo |
| E2E tests | Playwright | Planned for P3 |
| Database | PostgreSQL | Planned, provider not chosen |
| Authentication | Managed provider (Auth.js or Clerk) | Not chosen |
| LLM | Provider not chosen | Not chosen |
| Mac companion | Framework not chosen | Not chosen |
| Hosting and CI | Vercel, GitHub Actions | Planned for P3 |

Do not add a dependency for an undecided layer without an explicit team decision recorded in this file.

## Architecture decisions

- **Domain core is framework-free.** Planning rules live in `src/domain/` as pure TypeScript functions with no imports from Next.js, React, the database or an LLM SDK. Route handlers, server actions and UI call into the domain; the domain never calls out.
- **The application validates, the assistant proposes.** LLM output is treated as a proposal. Every proposed task, deadline or time block passes the same domain validation as a direct user edit before it is saved.
- **Saved records are the source of truth.** Task status, deadlines and time blocks come from stored records, never from conversation history.
- **Deadlines are never invented.** A task without an external deadline or a user-agreed target date stays unscheduled, and scheduling functions return an explicit "needs deadline" result instead of guessing.
- **Results instead of exceptions for expected outcomes.** Domain functions return discriminated unions (for example `{ kind: "scheduled" } | { kind: "infeasible"; reason }`) for expected cases such as no fit before a deadline. Exceptions are reserved for programming errors.
- **Time handling.** Store instants in UTC and compute calendar logic in the user's IANA timezone. Use `Temporal` imported from `temporal-polyfill` for all date and time math in the domain; do not use `Date` arithmetic. Reason: Node 25 and TypeScript 5.9 have no native `Temporal`, and the Temporal API separates wall-clock times from instants, which keeps DST transition days correct. The polyfill can be swapped for the native global once the runtime supports it.

Current layout:

- App Router under `src/app/` (`layout.tsx`, `page.tsx`, `globals.css`). Layout props use the generated global `LayoutProps<"/">` type.
- Domain code goes under `src/domain/<area>/`, with tests next to the code as `*.test.ts`. No domain code exists yet.
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

- Every acceptance criterion gets a failing test before any implementation code exists.
- Unit tests cover domain rules and edge cases (boundaries, empty inputs, DST transitions). Integration tests will cover route handlers and database writes once they exist. Playwright E2E tests will cover the core user flow in P3.
- Tests assert behavior through public functions, not implementation details.
- Target at least 70% coverage for the project, measured in CI once it exists.
- Model calls are replaced with test doubles in tests. A passing test with a double verifies application behavior only, never model quality.

@docs/engineering/tdd-workflow.md

## Security (OWASP Top 10 awareness)

- **Broken access control:** every read and write checks account ownership on the server; assistant actions go through the same checks.
- **Injection:** use parameterized queries; validate and schema-check all LLM output and user input before it reaches the domain or the database.
- **Cryptographic failures and secrets:** never commit secrets or `.env` files; use `.env.example` with placeholder names only.
- **Security misconfiguration and vulnerable components:** keep `npm audit` clean; do not add dependencies without a reason.
- **Logging:** never log private conversation content or tokens.

## Do's and don'ts

Do:

- Read the PRD section for the story you are working on before planning.
- Run `npm test`, `npm run typecheck` and `npm run lint` before proposing a commit.
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
