# AI Planning Companion

A conversational planning assistant for students and people working toward several self-directed goals. Built by Jingyi Fu and Sihui Lyu for CS6983 Project 3.

## What the product does

Most planning tools ask you to fill in a form before a plan exists, so tasks that come up during the day often never get written down. AI Planning Companion starts from a sentence instead. You tell the assistant "lab 5 is due Thursday" and it:

- saves the task right away, then asks for what is still missing and matters for the plan, such as the deadline or how long it will take;
- proposes a concrete time block, for example Tuesday 19:00 to 20:30, that fits your availability and fixed commitments;
- checks in at times you agreed to, asks how it went and helps adjust the plan;
- remembers preferences you confirm, and keeps a one-off situation ("I slept badly today") apart from a lasting habit.

It never schedules against a deadline it made up, and when something cannot fit it explains the conflict instead of quietly moving the deadline.

The planned product has a web app for Mac and Windows and a Mac companion that opens a small chat window with a keyboard shortcut. Both use the same account. The full requirements, with six user stories and their acceptance criteria, are in [docs/product/PRD.md](docs/product/PRD.md).

## Project status

| Stage | Scope | Status |
| --- | --- | --- |
| Homework 4 | Claude Code setup and the first domain feature, time block recommendation, built with strict TDD | Done |
| Project 3 | Chat with an LLM, tasks and goals, daily and weekly plans, check-ins and reminders, preferences, accounts, database, Mac companion, CI/CD and deployment | Not started |

What exists today is the domain logic and its tests. There is no chat interface, LLM integration, database, sign-in or deployed app yet; the web page is still the Next.js starter page.

## Homework 4: where it fits

Homework 4 builds the scheduling rule that the rest of the product depends on. When a user captures a task and agrees on a deadline, the assistant has to propose one time block they can accept in a single step (PRD US-06). The rule underneath decides which block is valid (PRD US-02).

**Feature: time block recommendation** ([src/domain/scheduling/recommend-time-block.ts](src/domain/scheduling/recommend-time-block.ts))

Given the current time, the user's timezone, a task with an estimate and a deadline, weekly availability, fixed commitments, existing blocks and an optional preferred time of day, it returns one of:

- `scheduled` with the earliest block that fits, and whether the preferred window was met;
- `needs-deadline` when the task has no deadline;
- `infeasible` with the reason `deadline-passed` or `no-free-slot`.

It is a pure TypeScript function with no framework imports, so the future chat, API routes and UI will all call the same rule. The six acceptance criteria and the test order are in the plan, [docs/plans/time-block-recommendation.md](docs/plans/time-block-recommendation.md).

**Where to find the Homework 4 evidence**

| Part | Evidence |
| --- | --- |
| 1. Claude Code setup | [CLAUDE.md](CLAUDE.md) with `@` imports of the PRD and [TDD workflow](docs/engineering/tdd-workflow.md); permissions in [.claude/settings.json](.claude/settings.json); original `/init` output in [docs/evidence/01-init/](docs/evidence/01-init/); later revisions in `git log -p CLAUDE.md` |
| 2. Explore, Plan, Implement, Commit | Plan written in Plan mode: [docs/plans/time-block-recommendation.md](docs/plans/time-block-recommendation.md); setup commits `c54c3c2`, `ba714fd`, `96d4c15` |
| 3. Strict TDD | Commits marked `test: ... (red)`, `feat: ... (green)` and `refactor: ...`, one sequence per acceptance criterion; every test run recorded in [docs/evidence/03-tdd/log.txt](docs/evidence/03-tdd/log.txt) |
| 4. Session log and reflection | Submitted with the Homework 4 write-up |

To see the red, green and refactor sequence:

```bash
git log --oneline
```

## Getting started

Requires Node.js and npm.

```bash
npm install
npm test            # run the test suite once
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm run dev         # Next.js dev server at http://localhost:3000
```

Run only the Homework 4 feature tests:

```bash
npx vitest run src/domain/scheduling
```

## Tech stack

| Layer | Choice | Status |
| --- | --- | --- |
| Web app | Next.js 16 App Router, React 19, TypeScript strict | In use |
| Styling | Tailwind CSS v4 | In use |
| Dates and timezones | `temporal-polyfill` | In use |
| Tests | Vitest (unit and integration), Playwright (end-to-end) | Vitest in use, Playwright planned |
| Database | PostgreSQL | Planned |
| LLM in the app | Google Gemini API, behind a provider-neutral adapter | Planned |
| Mac companion | Electron thin shell (global shortcut, small chat window, notifications) | Planned |
| Authentication | To be decided | Planned |
| Hosting and CI | Vercel, GitHub Actions | Planned |

[CLAUDE.md](CLAUDE.md) records each decision and the reason behind it.

## Project layout

```
src/app/                 Next.js App Router (starter page for now)
src/domain/              Framework-free planning rules, tests next to the code
docs/product/PRD.md      Product requirements
docs/engineering/        TDD workflow
docs/plans/              Feature plans written in Claude Code Plan mode
docs/evidence/           /init snapshot and TDD test-run log
scripts/tdd-log.sh       Appends a test run to the TDD evidence log
```

## How we work

We develop with Claude Code. [CLAUDE.md](CLAUDE.md) holds the project context, architecture decisions, conventions, testing strategy and do's and don'ts, and it changes in small commits as decisions are made. Each feature follows Explore, Plan, Implement, Commit, and implementation is strict test-driven development: a failing test for the missing behavior is committed before the code that makes it pass.
