#!/bin/sh
# Stop hook: quality gate before Claude finishes a turn.
# When src/ has uncommitted changes, runs the test suite and the type check.
# Failures block the stop (exit 2) so Claude fixes them first, except in a TDD
# red step: test files changed, the type check passes and only tests fail. A red
# step may add a stub with no logic, so other changed files do not rule it out.
set -u
input=$(cat)
already_retried=$(printf '%s' "$input" | jq -r '.stop_hook_active // false')
cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" || exit 0

changed=$({ git diff --name-only HEAD -- src; git ls-files --others --exclude-standard -- src; } | sort -u)
[ -n "$changed" ] || exit 0

test_out=$(npm test --silent 2>&1); test_code=$?
type_out=$(npm run --silent typecheck 2>&1); type_code=$?
[ "$test_code" -eq 0 ] && [ "$type_code" -eq 0 ] && exit 0

test_files=$(printf '%s\n' "$changed" | grep -E '\.test\.tsx?$' || true)
if [ -n "$test_files" ] && [ "$type_code" -eq 0 ]; then
  echo '{"systemMessage":"TDD red step: test files changed and the type check passes, so failing tests are expected. Stop not blocked."}'
  exit 0
fi
if [ "$already_retried" = "true" ]; then
  echo '{"systemMessage":"Tests or type check still fail after one fix attempt. Stopping so a human can look."}'
  exit 0
fi

{
  echo "Tests or type check fail with uncommitted changes in src/. Fix them before finishing."
  [ "$test_code" -ne 0 ] && { echo "--- npm test ---"; printf '%s\n' "$test_out" | tail -n 40; }
  [ "$type_code" -ne 0 ] && { echo "--- npm run typecheck ---"; printf '%s\n' "$type_out" | tail -n 40; }
} >&2
exit 2
