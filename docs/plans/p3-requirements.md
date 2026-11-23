# Project 3 requirements checklist

What the course asks for in Project 3, where each item stands, and where its evidence lives. The assignment page is the authority; this file is a working summary in our own words. Update an item's status and evidence in the same commit as the work that changes it (see "Keeping rule files current" in [CLAUDE.md](../../CLAUDE.md)).

Last reviewed: 2026-11-22.

Status values: **Done**, **Configured** (set up, real usage evidence still needed), **Partial**, **Planned** (approach chosen, not started), **Not started**.

## Deadlines and scoring

- Due December 15, 2026, 11:59 pm (assignment header; the body says finals week, December 14 to 20). Timezone not confirmed.
- The professor must approve the project idea in the #projects Slack channel at least one week before the deadline.
- 200 points: Application Quality 40, Claude Code Mastery 55, Testing & TDD 30, CI/CD & Production 35, Pair Process 25, Documentation & Demo 15.
- Individual grades can move by up to 10% if commits and reviews are clearly unbalanced between partners.
- Optional bonuses (not in scope unless we decide otherwise): property-based tests with fast-check, mutation testing with Stryker, an Agent SDK feature.

## Application

| Requirement | Status | Evidence or next step |
| --- | --- | --- |
| Polished, production-ready app solving a real problem; publicly deployed | Partial | Deployed at https://ai-planning-companion.vercel.app; product defined in [PRD](../product/PRD.md) |
| 2+ user roles or distinct feature areas | Planned | Four distinct feature areas (PRD Section 5); multiple user roles are not planned |
| Next.js full stack | Partial | Next.js skeleton in `src/app/` |
| Database (PostgreSQL recommended) | Partial | Neon PostgreSQL provisioned through Vercel; schema and repositories in #6 |
| Authentication | Not started | Neon Auth chosen; built in #7 |
| Hosting with preview deploys (Vercel) | Partial | Production deploys from `main`; preview deploys checked on the next pull request (#8) |

## Claude Code mastery

| Requirement | Status | Evidence or next step |
| --- | --- | --- |
| Comprehensive CLAUDE.md with modular @imports, conventions, architecture, testing strategy; evolution visible in git | Done | [CLAUDE.md](../../CLAUDE.md) imports the PRD and the TDD protocol; history in `git log -- CLAUDE.md`; original `/init` output in [docs/evidence/01-init/](../evidence/01-init/) |
| Auto-memory usage | Not started | Record real use when it happens |
| At least 2 custom skills in `.claude/skills/`, with team usage evidence and at least one iterated v1 to v2 from real use (the Excellent rubric asks for 2+ iterated skills) | Not started | |
| At least 2 hooks in `.claude/settings.json`: one PreToolUse or PostToolUse, one quality gate | Configured | PostToolUse lint and Stop test gate, see "Hooks" in [CLAUDE.md](../../CLAUDE.md); record first real runs in `docs/evidence/` |
| At least 1 MCP server, shared `.mcp.json`, real workflow evidence | Planned | Playwright MCP server for simulated-user acceptance testing, see [p3-work-split.md](p3-work-split.md) |
| At least 1 agent option (custom sub-agents in `.claude/agents/`, agent teams, or an Agent SDK feature), with real usage | Planned | Custom sub-agents in `.claude/agents/` |
| Parallel worktrees: at least 2 features developed in parallel, visible in branch history | Not started | |
| At least 2 writer/reviewer PRs: one agent writes, another reviews; C.L.E.A.R. in review comments; AI disclosure (% AI-generated, tool, human review) | Partial | C.L.E.A.R. is defined in "Code review" in [CLAUDE.md](../../CLAUDE.md). First writer/reviewer PR: [#1](https://github.com/Gingobell/ai-planning-companion/pull/1), awaiting review |

## Testing and TDD

| Requirement | Status | Evidence or next step |
| --- | --- | --- |
| Strict red-green-refactor for at least 3 features, failing tests committed before implementation | Partial (1 of 3) | Time block recommendation: [plan](time-block-recommendation.md), [TDD log](../evidence/03-tdd/log.txt) |
| Unit and integration tests (Vitest) | Partial | Unit tests in `src/domain/`; no integration tests yet |
| At least 1 Playwright end-to-end test | Not started | Playwright planned (CLAUDE.md tech stack) |
| 70%+ coverage | Not started | Coverage not measured yet |

## CI/CD and security

| Requirement | Status | Evidence or next step |
| --- | --- | --- |
| GitHub Actions with all 8 stages passing: ESLint + Prettier, `tsc --noEmit`, unit/integration tests, Playwright E2E, `npm audit`, AI PR review (claude-code-action or `claude -p`), preview deploy, production deploy on merge to main | Not started | Prettier not installed yet |
| At least 4 security gates from the course's 8-gate pipeline | Planned | The course's eight gates (Week 13, "AI Security & Code Quality"): 1 secrets detection (Gitleaks), 2 dependency scanning, 3 SAST, 4 DAST, 5 container scanning, 6 license compliance, 7 security acceptance criteria, 8 SBOM. Planned: gates 1, 2, 3 (a security review sub-agent) and 7 (Definition of Done), see [p3-work-split.md](p3-work-split.md). OWASP Top 10 awareness in CLAUDE.md is done but is not one of the eight |

## Pair process

| Requirement | Status | Evidence or next step |
| --- | --- | --- |
| At least 2 sprints, each with planning and a retrospective | Planned | Dates and goals in [p3-sprints.md](p3-sprints.md) |
| GitHub Issues with acceptance criteria as testable specs; a branch per issue; PR reviews with C.L.E.A.R. | Not started | |
| At least 3 async standups per sprint per partner (12 entries for 2 sprints) | Not started | Record real activity only |

## Documentation and demo

| Requirement | Status | Evidence or next step |
| --- | --- | --- |
| Clear README with a Mermaid architecture diagram | Partial | [README](../../README.md) exists; no diagram yet |
| Pair-written technical blog post (Medium, dev.to or similar) | Not started | |
| 5 to 10 minute demo video covering the app and the Claude Code workflow | Not started | |
| Individual 500-word reflection per partner | Not started | Each partner writes their own |
| Showcase form (project name, URLs, thumbnail, video, blog) | Not started | Form link not received yet |
| Repository with full Claude and MCP configuration; public production app; all-green pipeline | Partial | Claude configuration in `.claude/`; MCP, app and pipeline pending |
