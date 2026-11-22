#!/bin/sh
# PostToolUse hook (Edit, Write, MultiEdit).
# 1. Runs ESLint on an edited TypeScript file under src/ and sends errors back to Claude (exit 2).
# 2. Reminds Claude to follow DESIGN.md when a UI file (.tsx or .css under src/) changes.
set -u
input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')
root=${CLAUDE_PROJECT_DIR:-$(pwd)}
case "$file" in
  "$root"/*) rel=${file#"$root"/} ;;
  *) exit 0 ;;
esac
cd "$root" || exit 0

case "$rel" in
  src/*.ts | src/*.tsx)
    if ! out=$(npx --no-install eslint --no-warn-ignored "$rel" 2>&1); then
      echo "ESLint found problems in $rel. Fix them before continuing:" >&2
      printf '%s\n' "$out" >&2
      exit 2
    fi
    ;;
esac

case "$rel" in
  src/*.tsx | src/*.css)
    printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"UI file changed. Use only DESIGN.md tokens and control sizes. If the human has confirmed this design, update DESIGN.md and its changelog in the same commit."}}'
    ;;
esac
exit 0
