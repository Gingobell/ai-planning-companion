# TDD workflow

This protocol applies to every feature built in this repository.

## Before coding

1. Write the acceptance criteria as testable statements and keep them in the feature's plan.
2. Use Plan mode to map each criterion to one or more test cases and decide the order of red-green-refactor cycles.

## One cycle per acceptance criterion

1. **Red.** Write the smallest test that expresses the criterion. Run it and confirm it fails because the behavior is missing, not because of a syntax error, missing import or missing package. Add any stub needed only to make the test compile, with no logic. Commit as `test: <behavior> (red)`.
2. **Green.** Write the minimum implementation that makes the test pass. Run the full suite. Commit as `feat: <behavior> (green)`.
3. **Refactor.** Improve names, structure or duplication without changing behavior. Run the full suite again and confirm it still passes. Commit as `refactor: <what changed>`. Skip the refactor commit when there is nothing worth changing, and say so in the session log.

## Evidence

For every red and green step, save the command and the key lines of its output under `docs/evidence/` with the commit SHA it belongs to. Never recreate a red step after the implementation exists, and never squash the cycle commits.
