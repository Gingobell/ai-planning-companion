# AI Planning Companion

A planning assistant you talk to instead of filling in forms. Tell it about a goal or task in a sentence, and it asks what it needs to know, turns the task into a concrete time block, checks in on your progress and adapts future plans to what you tell it.

Built by Jingyi Fu and Sihui Lyu for CS6983 Project 3.

## Status

Live app: https://ai-planning-companion.vercel.app

Project 3 is being built in stages. Homework 4 is the first stage and is complete: the time block recommendation rules. Sprint 1 starts on November 24. The app shell is in place: run `npm run dev` and open http://localhost:3000 to see the sidebar with Chat, Today, Week, Goals & tasks and Preferences; each page is a placeholder until its feature is built.

## Project 3 plan

**Features.** Six user stories, all in the first release: capture and organize goals and tasks in a sentence (US-01), build a realistic time-blocked plan (US-02), break large goals into steps and track progress (US-03), reminders and daily check-ins (US-04), remember confirmed preferences (US-05), and open the assistant with a Mac keyboard shortcut (US-06).

**Who does what.**
- Jingyi Fu: data model, database, accounts and hosting; chat with Gemini; capture, clarification and scheduling; direct editing; deploy stages in CI.
- Sihui Lyu: progress, reminder and preference rules with their pages; today and week views; running reminders and check-ins; the Mac companion; Playwright and acceptance testing; CI check stages and security gates; the Playwright MCP server.
- Both: skills, sprints, standups, reviews of each other's pull requests, blog post and demo video.

**When.** Sprint 1 runs November 24 to 30, Sprint 2 December 1 to 10, and release week December 10 to 13. We submit by December 13; the course deadline is December 15.

**Read next.**

| To learn | Read |
| --- | --- |
| What the product does and its acceptance criteria | [docs/product/PRD.md](docs/product/PRD.md) |
| Who owns each area and deliverable, and the boundaries between them | [docs/plans/p3-work-split.md](docs/plans/p3-work-split.md) |
| Sprint dates and goals for each partner | [docs/plans/p3-sprints.md](docs/plans/p3-sprints.md) |
| Course requirements and their status | [docs/plans/p3-requirements.md](docs/plans/p3-requirements.md) |
| UI style and design rules | [DESIGN.md](DESIGN.md) |
| Stack, architecture, conventions and the rule file index for AI agents | [CLAUDE.md](CLAUDE.md) |

## Homework 4

Homework 4 builds the scheduling core of the product: **time block recommendation** ([src/domain/scheduling/recommend-time-block.ts](src/domain/scheduling/recommend-time-block.ts)). Given a task with a deadline, the user's availability and existing commitments, it finds the earliest time block that fits, or explains why none does. Every later feature that schedules work relies on it.

It was built with Claude Code using Explore, Plan, Implement, Commit and strict test-driven development:

- Claude Code setup: [CLAUDE.md](CLAUDE.md) and [.claude/settings.json](.claude/settings.json), with the original `/init` output in [docs/evidence/01-init/](docs/evidence/01-init/)
- Plan: [docs/plans/time-block-recommendation.md](docs/plans/time-block-recommendation.md)
- Red, green and refactor commits: `git log --oneline`, with test runs recorded in [docs/evidence/03-tdd/log.txt](docs/evidence/03-tdd/log.txt)

## Getting started

```bash
npm install
npm test            # run the tests
npm run typecheck
npm run lint
npm run dev         # http://localhost:3000
```

Tests need no database. To run the app against one, copy `.env.example` to `.env.local` and set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` to a Neon development branch, then run `npm run db:migrate`.

Built with Next.js, TypeScript and Vitest. Stack decisions are recorded in [CLAUDE.md](CLAUDE.md).
