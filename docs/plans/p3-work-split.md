# Project 3 work split

Who owns what in Project 3, so each partner can build, test and ship their areas without waiting for the other. Work is grouped by the six course grading categories, and every deliverable in [p3-requirements.md](p3-requirements.md) has an owner. Dates are in [p3-sprints.md](p3-sprints.md). Changes to this split are agreed by both partners and recorded in this file.

## At a glance

| Category | Jingyi Fu | Sihui Lyu | Both |
| --- | --- | --- | --- |
| 1. Application | Data, accounts, hosting, chat, planning core | Progress, reminders and preferences rules and pages; today and week views; running reminders; Mac companion | |
| 2. Claude Code | Hook evidence | MCP, sub-agents | Skills, auto-memory, worktrees, writer/reviewer PRs |
| 3. Testing | TDD for capture; integration tests | TDD for own rules; Playwright; coverage; acceptance testing | |
| 4. CI/CD and security | AI PR review and deploy stages | Check stages; security gates | |
| 5. Pair process | Issue template and the full issue backlog | PR template; sprint notes | Sprints, standups, reviews |
| 6. Documentation and demo | Mermaid diagram | | Blog, video, showcase form, own reflections |

## 1. Application

**Jingyi Fu**
- Database, authentication and account isolation.
- Vercel hosting and the public production app.
- Shared contract: record types and their fields for every record, including progress, reminders and preferences; data access interfaces; design tokens; app shell.
- Chat and the Gemini adapter.
- Capture, clarification and scheduling (US-01, US-02, US-06).
- Task breakdown and help when the user feels stuck, in chat (US-01, US-03).
- Direct editing of tasks and time blocks, with undo (US-02).
- Learning and confirming preferences in chat (US-05).
- Professor approval of the idea in #projects by November 30.

**Sihui Lyu**
- Progress and task state rules in `src/domain/progress/`, and the `/goals` page (US-03).
- Reminder and preference rules in `src/domain/reminders/` and `src/domain/preferences/`, and the `/preferences` page (US-04, US-05).
- Today and week views (US-02).
- Running reminders and check-ins, and web notifications (US-04).
- Mac companion in `desktop/`: global shortcut, small window, Mac notifications (US-04, US-06).

**Boundaries.** Sihui owns the rules as pure functions. Jingyi runs them from chat and the server, except reminders and check-ins, which Sihui also runs.
- Reminders and check-ins: Sihui's rules decide which reminders and check-ins should exist and when (agreed check-in times, quiet hours, pausing, removal when a task is completed or canceled, updates when a block moves, no duplicates on retry). An unanswered check-in leaves progress unknown and triggers no follow-up messages. Sihui's server jobs call them, store the result through the data access interfaces and send web notifications. Jingyi supplies the database, the Vercel setup for scheduled jobs and a chat function that posts a check-in message.
- Preferences: Sihui's rules own preference state (tentative, confirmed, corrected, removed, temporary conditions that expire). A corrected or removed preference is never restored. Jingyi's chat proposes a preference and calls these rules when the user confirms or corrects it.
- Today and week: Sihui builds the views; they call Jingyi's edit and undo actions for direct editing.
- Progress: Sihui's rules own task states and corrections, partial progress, a finished time block not completing its task, and goal completion only after the user confirms it. Progress reported in chat or on `/today` goes through the same rules.

## 2. Claude Code

**Jingyi Fu**
- Record real hook runs in `docs/evidence/`.

**Sihui Lyu**
- Playwright MCP server in a shared `.mcp.json`.
- Sub-agents in `.claude/agents/`: a security reviewer and a simulated-user tester.

**Both**
- Keep CLAUDE.md and the rule files current for their own areas.
- One custom skill each, iterated from v1 to v2 from real use.
- Record real auto-memory use.
- Develop features in parallel worktrees.
- At least one writer/reviewer pull request each, reviewed by the other partner.

## 3. Testing

The course asks for strict red-green-refactor on at least 3 features. These six TDD features, three per partner, are the ones that follow the full protocol in the [TDD workflow](../engineering/tdd-workflow.md); all other code with logic still gets tests, written before or after the code.

**Jingyi Fu**
- TDD features: time block recommendation (done in HW4), database and repositories (#6), capture and clarification (#10, #11).
- Integration tests for route handlers and database writes.

**Sihui Lyu**
- TDD features: progress rules (#30), reminder and check-in rules (#31), preference and temporary context rules (#36).
- Playwright end-to-end tests of the core flow.
- Coverage tool and the 70% target.
- Acceptance testing with simulated users: scenarios with expected results from PRD Section 8 and each story's acceptance criteria, run against the deployed app by the simulated-user sub-agent through Playwright MCP. The Mac shortcut and Mac notifications are tested by hand. Each failure becomes a GitHub Issue labeled `acceptance`, assigned to the owner of that area.

## 4. CI/CD and security

**Jingyi Fu**
- CI stages: AI PR review, preview deploy, production deploy on merge to `main`.

**Sihui Lyu**
- CI stages: ESLint and Prettier, `tsc --noEmit`, unit and integration tests, Playwright, `npm audit`.
- Security gates from the course's eight (listed in [p3-requirements.md](p3-requirements.md)): pre-commit secret scan, dependency scan, a security review sub-agent as SAST, and security criteria in a Definition of Done.

## 5. Pair process

**Jingyi Fu**
- Issue template with acceptance criteria as testable specs.
- The full issue backlog: one GitHub Issue per piece of work for both partners, each with testable acceptance criteria and an owner, written before Sprint 1 planning.

**Sihui Lyu**
- Pull request template with C.L.E.A.R. review and AI disclosure (% AI-generated, tool, human review).
- Write up sprint planning and retrospective notes.

**Both**
- Sprint planning and a retrospective for each sprint.
- Work from the issues for their own areas, one branch per issue. Either partner can propose a new or changed issue.
- At least three async standups per sprint each.
- Review each other's pull requests.

## 6. Documentation and demo

**Jingyi Fu**
- README Mermaid architecture diagram.

**Both**
- Technical blog post, written and published together.
- Demo video of 5 to 10 minutes, recorded and edited together.
- Showcase form.
- Individual 500-word reflection, each partner their own.

## Working without waiting

1. **Contract first.** By November 25, Jingyi adds the shared record types with all their fields (defined once and imported everywhere), the data access interfaces, the design tokens from [DESIGN.md](../../DESIGN.md) and the app shell. Sihui writes in-memory implementations of those interfaces and builds against them; Jingyi later supplies the PostgreSQL implementations without changes to Sihui's code. If Sihui needs a field that is missing, Sihui asks Jingyi through an issue or pull request.
2. **Plan before code.** Each owner writes `docs/plans/<feature>.md` with testable acceptance criteria before starting a feature, as the [TDD workflow](../engineering/tdd-workflow.md) requires.
3. **Own folders, own branches.** Each owner works in their own folders and in a separate branch or worktree.
4. **Call, do not edit.** Code in another owner's area is called, not changed. A change needed in someone else's area goes to its owner as an issue or pull request.
5. **No blocking checks.** A new CI stage becomes a required check only after it passes on `main`.
6. **Late dependencies are planned.** Playwright tests and acceptance testing need the deployed core flow. Scenarios and test setup are prepared earlier, so only the runs wait for the deploy.
