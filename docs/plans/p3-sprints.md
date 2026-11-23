# Project 3 sprints

Project 3 runs as two sprints and a release week. Owners and boundaries are in [p3-work-split.md](p3-work-split.md); course requirements are in [p3-requirements.md](p3-requirements.md). Changes to dates or goals are agreed by both partners and recorded in this file.

The course deadline is December 15, 2026, 11:59 pm. We aim to submit by December 13 and keep the last two days as a buffer.

## Schedule

| Phase | Dates | Ends with |
| --- | --- | --- |
| Sprint 1 | November 24 to November 30 | Sprint 1 retrospective |
| Sprint 2 | December 1 to December 10 | Sprint 2 retrospective on December 10 |
| Release week | December 10 (after the retrospective) to December 13 | Submission |

## Sprint 1: foundations, November 24 to November 30

Jingyi Fu:
- Shared contract by November 25: record types with all fields (including progress, reminders and preferences), data access interfaces, design tokens and app shell.
- Database, authentication and a first Vercel deploy.
- Chat with the Gemini adapter; capture and clarification built with TDD.
- Project idea approved by the professor in #projects by November 30.
- First real hook runs recorded in `docs/evidence/`.
- Issue template and the full issue backlog for both partners, before Sprint 1 planning.

Sihui Lyu:
- Plan files with acceptance criteria for progress rules and for reminder and preference rules; both built with TDD.
- CI stages: ESLint and Prettier, `tsc --noEmit`, unit tests, `npm audit`, with a coverage report.
- Pre-commit secret scan.
- Pull request template with the C.L.E.A.R. review points from CLAUDE.md and the AI disclosure.
- First draft of acceptance scenarios from PRD Section 8.

Both:
- Sprint planning on November 24 and a retrospective on November 30.
- GitHub Issues with acceptance criteria for the sprint, one branch per issue.
- First version of each custom skill.

## Sprint 2: core flow end to end, December 1 to December 10

Jingyi Fu:
- Capture, clarification and scheduling working end to end on a preview deploy by December 7.
- Direct editing with undo; task breakdown and help when stuck.
- Learning and confirming preferences in chat.
- Integration tests; CI stages for AI PR review, preview deploy and production deploy.

Sihui Lyu:
- `/goals` and `/preferences` pages; today and week views; Mac companion in `desktop/`.
- Running reminders and check-ins with web notifications.
- Playwright MCP server in `.mcp.json`; simulated-user tester and security reviewer sub-agents.
- Definition of Done with security criteria.
- Playwright end-to-end tests and their CI stage.
- First acceptance test round on the preview deploy, December 7 to 8; failures filed as `acceptance` issues.

Both:
- At least one writer/reviewer pull request each, reviewed by the other partner.
- Features built in parallel worktrees.
- Each custom skill iterated to v2 from real use.
- Sprint planning on December 1 and a retrospective on December 10.

## Release week, December 10 to December 13

- Jingyi Fu: fix acceptance issues in owned areas; production deploy with all CI stages green on `main`; README Mermaid diagram; delete the test accounts created on preview deploys from Neon Auth before the demo.
- Sihui Lyu: fix acceptance issues in owned areas; final acceptance run, December 11 to 12.
- Both: blog post, demo video, showcase form, individual reflections, submission by December 13.

## Sprint records

- Each partner writes at least three async standups per sprint: what was done, what is next, what is blocking.
- Planning, standup and retrospective notes go in `docs/sprints/sprint-<n>/`.
- Record only real activity, on the day it happens.
