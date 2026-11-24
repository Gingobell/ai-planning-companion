---
name: tdd-cycle
description: Run one red-green-refactor cycle for an acceptance criterion of a TDD feature in this repo, with the evidence log and commits the course requires. Use when the user asks to start or continue TDD on a feature listed under Testing in docs/plans/p3-work-split.md, or says "next cycle", "red", "green" for such a feature.
---

# TDD cycle (v1)

Follows [docs/engineering/tdd-workflow.md](../../../docs/engineering/tdd-workflow.md); this skill adds the steps and pitfalls learned while building the progress (#30) and reminder (#31) rules. If the two ever disagree, the workflow file wins.

## Before the first cycle

1. Confirm the feature is a TDD feature in `docs/plans/p3-work-split.md` and that the user owns it.
2. Read the plan `docs/plans/<feature>.md`. Every cycle maps to one of its acceptance criteria (AC). No plan yet: write it first and stop for review.
3. Work on the feature's own branch. Pick the next free evidence folder, `docs/evidence/NN-<feature>/log.txt`, and start the log with one line naming the issue and the plan.
4. Agree with the user whether each red and green commit needs their approval, or whether cycles may be committed when results are as expected. Default: ask.

## Red

1. Add the smallest tests that express the AC. Type test helpers with the domain types (for example `ReminderDraft`), or literals such as `kind: "task"` widen to `string` and the type check fails.
2. If the function does not exist yet, add a stub with the final signature and no logic: `void` each parameter and `throw new Error("not implemented")`.
3. Run `npm run typecheck`. It must pass; a type or import error is not a red step.
4. Run the tests and read why they fail. Valid reasons: `not implemented`, or an assertion on the missing behavior. Negative cases ("creates nothing when ...") may pass during red; that is fine when at least one case fails on the behavior, and the log says so.
5. A test that passes on its first run (for example a purity check on code that already returns new objects) is not a red step. Never break the code to fake one. Log it as "passed on its first run, not a red step" and commit it as `test: <behavior>` without `(red)`.
6. Log: `TDD_LOG=docs/evidence/NN-<feature>/log.txt scripts/tdd-log.sh "Cycle N ACx red"`.
7. Commit the tests, the stub and the log: `test: <behavior> (red)`.

## Green

1. Write the minimum implementation. Domain rules stay pure: time and time zone come in as arguments, all date math uses `Temporal` from `temporal-polyfill`, and expected outcomes are results, not exceptions.
2. Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run format:check`; all must pass.
3. Log `"Cycle N ACx green"` the same way, then commit `feat: <behavior> (green)`.

## Refactor

Improve names, structure or duplication only if something is worth it, run the full checks again, log and commit `refactor: <what changed>`. Otherwise add a short "refactor skipped" note with the reason to the log; several skipped cycles can share one note.

## Pitfalls seen in this repo

- **Edit with the Edit tool, not regex scripts.** A Python replace whose end marker matched the wrong `};` deleted half a file during #52.
- **Shell loops run in zsh,** which does not split `$var` into words. Use `bash <<'EOF' ... EOF` for loops over "number branch" pairs.
- **Stop hook during red:** since #59 a red step with a stub is not blocked as long as the type check passes. If it still blocks, the type check is failing.
- **Prettier width is 120,** and Markdown is not formatted. A branch created before `.prettierrc.json` existed formats differently; merge `main` first.
- **Normalize instants before building keys or comparing,** with `Temporal.Instant.from(x).toString()`. The database returns `...:00Z` where code may have written `...:00.000Z`.

## Finish

Push the branch and open a PR that starts with `Closes #<issue>`, links the plan and the evidence log, and keeps the body short (see the PR template). List any decision taken during the cycles that the plan did not state, so the reviewer can check it.
