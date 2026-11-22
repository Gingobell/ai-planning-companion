# Project 3 work split

Who owns what in Project 3, so each partner can build, test and ship their areas without waiting for the other. An owner plans, builds with TDD, tests and documents their area. Changes to this split are agreed by both partners and recorded in this file.

## Ownership

| Area | Owner | Stories | Where it lives |
| --- | --- | --- | --- |
| Database, authentication and account isolation | Jingyi Fu | All | Data layer |
| Hosting: Vercel preview and production deploys | Jingyi Fu | All | Vercel, CI deploy stages |
| Shared contract: record types, data access interfaces, design tokens, app shell | Jingyi Fu | All | `src/domain/`, `src/app/` |
| Chat and the Gemini adapter | Jingyi Fu | US-01, US-06 | Chat routes and UI |
| Capture, clarification and scheduling | Jingyi Fu | US-01, US-02, US-06 | `src/domain/scheduling/` and chat |
| Today and week views with direct editing | Jingyi Fu | US-02 | `/today`, `/week` |
| Learning and confirming preferences in chat | Jingyi Fu | US-05 | Chat |
| Reminder scheduling and delivery | Jingyi Fu | US-04 | Server jobs |
| Progress and task state rules, goal progress page | Sihui Lyu | US-03 | `src/domain/progress/`, `/goals` |
| Reminder and preference rules, preferences and reminders page | Sihui Lyu | US-04, US-05 | `src/domain/reminders/`, `src/domain/preferences/`, `/preferences` |
| Mac companion: global shortcut, small window, notifications | Sihui Lyu | US-04, US-06 | `desktop/` |

Progress rules cover task states and corrections, partial progress, a finished time block not completing its task, and goal completion only after the user confirms it. Reminder and preference rules cover quiet hours, pausing, removing reminders when a task is completed or canceled, retries without duplicates, and temporary conditions that expire. Each is built as a TDD feature.

## Claude Code, CI and security

| Item | Owner |
| --- | --- |
| CI stages: ESLint and Prettier, `tsc --noEmit`, unit tests, `npm audit` | Sihui Lyu |
| CI stages: Playwright E2E, AI PR review, preview deploy, production deploy | Jingyi Fu |
| Security gates: pre-commit secret scan, dependency scan, security review sub-agent in `.claude/agents/` | Sihui Lyu |
| Playwright end-to-end tests | Jingyi Fu |
| MCP server and `.mcp.json` | Jingyi Fu |
| Custom skills: one each, iterated from real use | Both |

## Shared work

- Sprint planning and retrospective for each sprint.
- Async standups: each partner writes their own.
- Reviewing each other's pull requests.
- The technical blog post, written by section.
- The demo video. Each partner writes their own reflection.

## Working without waiting

1. **Contract first.** At the start of Sprint 1, Jingyi adds the shared record types (defined once and imported everywhere), the data access interfaces, the design tokens from [DESIGN.md](../../DESIGN.md) and the app shell. Sihui builds against in-memory implementations of those interfaces; Jingyi later supplies the PostgreSQL implementations without changes to Sihui's code.
2. **Own folders, own branches.** Each owner works in their own folders and in a separate branch or worktree.
3. **Call, do not edit.** Code in another owner's area is called, not changed. For example, the chat calls the progress rules when a user reports a task done. A change needed in someone else's area goes to its owner as an issue or pull request.
4. **No blocking checks.** A new CI stage becomes a required check only after it passes on `main`.
