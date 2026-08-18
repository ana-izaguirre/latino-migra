#!/usr/bin/env bash
#
# Creates the "Product Engineering" GitHub Project (Projects V2) and its fields,
# then adds every open issue to it.
#
# WHY THIS IS A SCRIPT AND NOT AUTOMATED
# Projects V2 is a GraphQL-only API. The Claude Code session that produced the
# audit had GraphQL disabled, so it could create issues and labels (REST) but
# not the Project. Run this once from a machine with the gh CLI.
#
# REQUIREMENTS
#   gh auth login --scopes project,repo
#
# USAGE
#   ./scripts/setup-github-project.sh
#
set -euo pipefail

OWNER="ana-izaguirre"
REPO="latino-migra"
PROJECT_TITLE="Product Engineering"

command -v gh >/dev/null || { echo "gh CLI not found"; exit 1; }
gh auth status >/dev/null || { echo "run: gh auth login --scopes project,repo"; exit 1; }

echo "==> Creating project '${PROJECT_TITLE}'"
PROJECT_NUMBER=$(gh project create --owner "${OWNER}" --title "${PROJECT_TITLE}" --format json | jq -r '.number')
echo "    project #${PROJECT_NUMBER}"

# --- single-select fields -----------------------------------------------------
# gh project field-create replaces the default "Status" options only if you
# delete and recreate it in the UI; the Status values below are set manually.

add_field() {
  local name="$1"; shift
  local options="$1"; shift
  echo "==> Field: ${name}"
  gh project field-create "${PROJECT_NUMBER}" --owner "${OWNER}" \
    --name "${name}" --data-type SINGLE_SELECT \
    --single-select-options "${options}" >/dev/null
}

add_field "Priority" "P0 - Critical,P1 - High,P2 - Medium,P3 - Low"
add_field "Type"     "Bug,Feature,Improvement,Technical Debt,Security,Performance,Accessibility,UX,Observability,Testing,Documentation"
add_field "Risk"     "Critical,High,Medium,Low"
add_field "Effort"   "XS,S,M,L,XL"
add_field "Area"     "Product,Architecture,Frontend,Backend,Database,Security,Testing,QA,Accessibility,UX,Performance,Observability,DevOps,AI"

# --- AI development fields ----------------------------------------------------
add_field "AI Strategy"  "Manual,AI-Assisted,Agentic"
add_field "AI Tool"      "Claude Code,GitHub Copilot,Google AI Studio,ChatGPT,OpenCode,Other"
add_field "AI Autonomy"  "Human Only,Suggest,Implement,Implement + Test,Implement + Test + Review"
add_field "Verification" "Human,Unit Test,Integration Test,E2E,CI,Security Scan,Performance Test,Accessibility Test,Multiple"

# --- add every open issue -----------------------------------------------------
echo "==> Adding open issues"
gh issue list --repo "${OWNER}/${REPO}" --state open --limit 100 --json number \
  --jq '.[].number' | while read -r n; do
    gh project item-add "${PROJECT_NUMBER}" --owner "${OWNER}" \
      --url "https://github.com/${OWNER}/${REPO}/issues/${n}" >/dev/null
    echo "    added #${n}"
done

cat <<EOF

Done. Remaining manual steps in the GitHub UI:

1. Status field — replace the default options with:
     Backlog, Ready, In Progress, AI Review, Human Review, Blocked, Done
   Set every audit issue to Backlog.

2. Field values per issue — see docs/project-fields.md

3. Views:
     Main Board          board, grouped by Status
     Production Readiness table, filter: label:P0-critical,P1-high
     Security & Data Risk table, filter: label:security,database
     AI Work Queue        table, filter: AI Strategy != Manual
     Priority View        table, sorted by Priority, grouped by Area

Project: https://github.com/users/${OWNER}/projects/${PROJECT_NUMBER}
EOF
