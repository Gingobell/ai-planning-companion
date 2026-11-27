# TDD workflow

This protocol applies to the TDD features listed under Testing in [p3-work-split.md](../plans/p3-work-split.md). Other code with logic still gets unit or integration tests, written before or after the code. Pure layout, styling and configuration changes are checked with lint, typecheck, a build and a look in the browser at desktop and 400 px width, and the pull request says how they were checked.

## Before coding

1. Write the acceptance criteria as testable statements and keep them in the feature's plan.
2. Use Plan mode to map each criterion to one or more test cases and decide the order of red-green-refactor cycles.

## One cycle per acceptance criterion

1. **Red.** Write the smallest test that expresses the criterion. Run it and confirm it fails because the behavior is missing, not because of a syntax error, missing import or missing package. Add any stub needed only to make the test compile, with no logic. Commit as `test: <behavior> (red)`.
   - Cases that only check that nothing happens (for example "creates no reminder when ...") may pass during red, as long as at least one case fails on the missing behavior; the evidence log says so.
   - A test that passes on its first run, such as a purity check on code that already returns new objects, is not a red step. Never break the code to fake one: commit it as `test: <behavior>` without `(red)` and note "passed on its first run, not a red step" in the log.
2. **Green.** Write the minimum implementation that makes the test pass. Run the full suite. Commit as `feat: <behavior> (green)`.
3. **Refactor.** Improve names, structure or duplication without changing behavior. Run the full suite again and confirm it still passes. Commit as `refactor: <what changed>`. Skip the refactor commit when there is nothing worth changing, and say so in the session log.

## Evidence

For every red and green step, save the command and the key lines of its output under `docs/evidence/` with the commit SHA it belongs to. Never recreate a red step after the implementation exists, and never squash the cycle commits.
