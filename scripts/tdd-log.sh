#!/bin/sh
# Append a TDD phase record (label, command, trimmed Vitest output) to the evidence log.
# Usage: scripts/tdd-log.sh "Cycle 1 AC3 red"
set -u
log="docs/evidence/03-tdd/log.txt"
mkdir -p "$(dirname "$log")"
{
  echo "=== $1 ==="
  echo "Time: $(date '+%Y-%m-%d %H:%M %Z')"
  echo "Base commit: $(git rev-parse --short HEAD)"
  echo "$ npx vitest run"
  npx vitest run 2>&1 | sed -e 's/\x1b\[[0-9;]*m//g' -e "s|$(pwd)|<repo>|g" | grep -v -e '^ *$' -e 'Start at' -e 'Duration' | tail -n 30
  echo "exit code: $(npx vitest run >/dev/null 2>&1; echo $?)"
  echo
} >> "$log"
tail -n 40 "$log"
