#!/bin/sh
# PreToolUse hook (Bash). Before Claude runs `git push`, looks at what the other partner and main changed:
# new commits on main, open pull requests by others, files they share with this branch, and merge conflicts.
# If there is anything to look at, the push is stopped once (exit 2) and the findings go to Claude, which
# explains them to the human and agrees on an order (review or merge theirs first, merge main, or push as is).
# A second push with the same findings passes, so the hook never loops. Any failure lets the push through.
set -u
input=$(cat)
command=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
# Only a real `git push` at the start of a command (or after ; && || | or a parenthesis), not text that mentions it.
printf '%s\n' "$command" | grep -Eq '(^|[;&|(])[[:space:]]*git[[:space:]]+push([[:space:]]|$)' || exit 0
cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" || exit 0
git fetch -q origin 2>/dev/null || exit 0

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
mine=$(git diff --name-only origin/main...HEAD 2>/dev/null | sort -u)
behind=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
main_files=$(git diff --name-only HEAD...origin/main 2>/dev/null | sort -u)
me=$(gh api user -q .login 2>/dev/null || echo "")
others=$(gh pr list --state open --json number,title,author,headRefName,headRefOid,files \
  --jq ".[] | select(.headRefName != \"$branch\" and .author.login != \"$me\")" 2>/dev/null || echo "")

mine_list=$(mktemp) || exit 0
trap 'rm -f "$mine_list"' EXIT
printf '%s\n' "$mine" >"$mine_list"
report=""
if [ "$behind" -gt 0 ]; then
  overlap=$([ -n "$mine" ] && printf '%s\n' "$main_files" | grep -Fx -f "$mine_list")
  report="$report
- main has $behind commit(s) this branch does not have.${overlap:+ Files changed on both sides: $(echo $overlap)}"
  if ! git merge-tree --write-tree HEAD origin/main >/dev/null 2>&1; then
    report="$report
- Merging main into this branch has conflicts: $(git merge-tree --write-tree --name-only HEAD origin/main 2>/dev/null | sed -n '2,/^$/p' | tr '\n' ' ')"
  fi
fi
if [ -n "$others" ]; then
  report="$report
$(printf '%s' "$others" | jq -r --arg mine "$mine" '
  ($mine | split("\n")) as $m
  | [.files[].path] as $f
  | ($f | map(select(. as $p | $m | index($p)))) as $both
  | "- Open PR #\(.number) by \(.author.login): \(.title)."
    + (if ($both | length) > 0 then " Shares files with this branch: \($both | join(", "))." else " No shared files." end)')"
fi
[ -z "$report" ] && exit 0

# The same findings as the last pause, with main and the partner's PRs unchanged: already discussed, let the
# push through. New commits on this branch alone do not pause it again.
fingerprint=$(printf '%s\n%s\n%s\n%s\n' "$branch" "$(git rev-parse origin/main)" \
  "$(printf '%s' "$others" | jq -r '.headRefOid' 2>/dev/null | sort)" "$report" | shasum | cut -c1-40)
marker="$(git rev-parse --git-dir)/claude-push-check"
[ -f "$marker" ] && [ "$(cat "$marker")" = "$fingerprint" ] && exit 0
printf '%s' "$fingerprint" >"$marker"
cat >&2 <<EOF
Push paused once to check the partner's work and main before pushing $branch:$report
Tell the human what this means and agree on an order: review or merge their PR first, merge main into this
branch and rerun the checks, change this branch, or push as is. Push again once they agree; the same findings
pass the second time. Steps are in the clear-review skill, "Before pushing your own work".
EOF
exit 2
