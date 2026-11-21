# AI Planning Companion

A planning assistant you talk to instead of filling in forms. Tell it about a goal or task in a sentence, and it asks what it needs to know, turns the task into a concrete time block, checks in on your progress and adapts future plans to what you tell it.

Built by Jingyi Fu and Sihui Lyu for CS6983 Project 3. Full requirements: [docs/product/PRD.md](docs/product/PRD.md).

## Status

Project 3 is being built in stages. Homework 4 is the first stage and is complete. The chat interface, AI integration, accounts and Mac companion come next.

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

Built with Next.js, TypeScript and Vitest. Stack decisions are recorded in [CLAUDE.md](CLAUDE.md).
