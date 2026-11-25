---
name: clear-review
description: Review a pull request in this repo the way the team does, with one comment point per C.L.E.A.R. letter, checks run on the PR merged with current main, and a draft shown to the human before anything is posted; and, before pushing your own work, check what the partner and main changed and agree on an order. Use when the user asks to review, look at or approve a PR, to draft review comments, to see what the partner changed, or when the pre-push hook pauses a push.
---

# C.L.E.A.R. review (v1)

The review rules live in CLAUDE.md ("Code review (C.L.E.A.R.)", "Security", "Architecture decisions", "Coding conventions"); this skill is the procedure and the pitfalls seen while reviewing PRs #48 to #64. If the two ever disagree, CLAUDE.md wins.

## 1. Read before judging

1. `gh pr view <n> --json title,body,files,commits,baseRefName,reviewDecision` and `gh pr diff <n>`.
2. Read the linked issue's acceptance criteria, the feature plan in `docs/plans/`, and the rule file of every area the PR touches (table in CLAUDE.md). Check `docs/plans/p3-work-split.md` for who owns the area and whether it is a TDD feature.
3. Note the PR's base branch. A PR based on another feature branch is reviewed against that branch, and its merge order matters.

## 2. Run it, merged with current main

1. `git fetch origin`, then `git merge-tree --write-tree origin/main origin/<head>` to see conflicts. A conflict only in a rule file is a note for the author, not a reason to stop.
2. Check out the merge in a temporary worktree in the scratchpad (link `node_modules` from the main checkout), never in the working checkout.
3. Run `npx tsc --noEmit`, `npx vitest run`, and `npm run lint` when the PR changes code. Read the `Test Files` line as well as `Tests`: a test file that fails to load reports no failed test, only a failed file.
4. Remove the worktree when done.

## 3. Check each letter

- **Context:** layout and names follow CLAUDE.md; rule files changed in the same PR when a rule changed, each rule in one home; no em dashes in repo text.
- **Logic:** walk each acceptance criterion against the code; compare with the existing implementation of the same interface (for example the PostgreSQL repositories) for edge cases such as not-found versus conflict, unique keys and foreign keys.
- **Evidence:** tests assert behavior through public functions. For a TDD feature, the commits show `(red)` before `(green)` for every criterion and `docs/evidence/` has the matching log with the commit SHAs.
- **Architecture:** `src/domain/` imports nothing from Next.js, React, the database or an LLM SDK; data goes through `getCurrentUser()` and scoped repositories; new dependencies are recorded in the CLAUDE.md tech stack.
- **Risk:** account isolation on every read and write, no private content or secrets in logs, migrations that run on a table with rows (a new NOT NULL column needs a default), secrets only in Vercel.

## 4. Draft, show, then post

1. Write the review in English, one short point per letter, plus a verdict: approve, comment with requested changes, or request changes. Name small differences that are fine to keep, so the author can decide.
2. Show the draft to the human and post only after they approve, with `gh pr review <n> --approve|--comment|--request-changes -F -`. Posting is always in the human's name.
3. Follow-ups that need the author (merge main, fix a preview) go in the same review, not in a second comment.

## Before pushing your own work

The PreToolUse hook `.claude/hooks/pre-push-sync.sh` runs this check automatically and pauses a push once when it finds something. Run it by hand when the user asks what the partner changed.

1. `git fetch origin`; list main's new commits (`git log --oneline HEAD..origin/main`) and the partner's open PRs (`gh pr list --state open`).
2. Compare files: what this branch changed (`git diff --name-only origin/main...HEAD`) against main's new commits and each open PR's files. Check conflicts with `git merge-tree --write-tree HEAD origin/main`.
3. Decide the order with the human:
   - The partner's PR changes something this branch uses (a shared record type, a repository interface, a rule file both edit): review it first with this skill, and once it is merged, merge main into this branch and rerun the checks before pushing.
   - Main moved and touches the same files: merge main into this branch (never rebase), fix conflicts, rerun the checks.
   - Only unrelated changes: push as is, and mention any PR waiting for the human's review.
4. Explain the findings in plain words and push only after the human agrees.

## Pitfalls seen in this repo

- **A red Vercel check is not always the code.** Previews failed when Neon's 10 branches were used up; the build log says "integration resources failed to provision". The fix is a new push after branches are freed, not a code change.
- **Type errors about `LayoutProps` in a temporary worktree** come from missing generated route types; run `npx next typegen` there or ignore them. They are not the PR's problem.
- **Do not review a stale diff.** Fetch again before drafting if the author pushed after the first read.
