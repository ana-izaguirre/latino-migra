#!/usr/bin/env bash
#
# Creates the "Product Engineering" GitHub Project, its fields, adds every open
# issue and sets all field values. One command, no manual data entry.
#
# WHY THIS IS A SCRIPT
# Projects V2 is a GraphQL-only API. The Claude Code web session that produced
# the audit can use REST (issues, labels, PRs) but not GraphQL, so it can create
# issues but cannot touch Projects at all — not creating them, not adding items,
# not setting field values. Run this once from a machine with the gh CLI.
#
# REQUIREMENTS
#   gh auth login --scopes project,repo
#   jq
#
# USAGE
#   ./scripts/setup-github-project.sh
#
# NOT IDEMPOTENT. Every run creates a new Project. If a run fails part way
# through, delete the half-built Project before retrying:
#   gh project delete <number> --owner ana-izaguirre
#
# The field values come from docs/project-fields.md. Keep them in sync.
#
set -euo pipefail

OWNER="ana-izaguirre"
REPO="latino-migra"
PROJECT_TITLE="Product Engineering"

command -v gh >/dev/null || { echo "gh CLI not found"; exit 1; }
command -v jq >/dev/null || { echo "jq not found"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "run: gh auth login --scopes project,repo"; exit 1; }

# --- issue -> field values ----------------------------------------------------
# issue|Priority|Type|Risk|Effort|Area|AI Strategy|AI Tool|AI Autonomy|Verification
read -r -d '' ROWS <<'DATA' || true
18|P0 - Critical|Security|Critical|S|Database|Manual|Other|Human Only|Human
19|P0 - Critical|Security|Critical|M|Security|AI-Assisted|Claude Code|Suggest|Multiple
20|P0 - Critical|Security|Critical|M|Database|AI-Assisted|Claude Code|Suggest|Integration Test
21|P0 - Critical|Technical Debt|High|L|Architecture|AI-Assisted|Claude Code|Implement + Test|CI
16|P0 - Critical|Security|Critical|S|Security|Manual|Other|Human Only|Human
22|P1 - High|Bug|High|L|Backend|AI-Assisted|Claude Code|Suggest|Integration Test
23|P1 - High|Bug|High|S|Database|AI-Assisted|Claude Code|Implement + Test|Integration Test
24|P1 - High|Bug|Medium|XS|Database|AI-Assisted|Claude Code|Implement + Test|Multiple
25|P1 - High|Improvement|Medium|S|Frontend|Agentic|Claude Code|Implement + Test|Multiple
26|P1 - High|Accessibility|Medium|M|Accessibility|Agentic|Claude Code|Implement + Test|Accessibility Test
27|P1 - High|Technical Debt|Medium|XS|DevOps|AI-Assisted|Claude Code|Implement|CI
28|P1 - High|Testing|Medium|S|Testing|AI-Assisted|Claude Code|Implement + Test|E2E
29|P1 - High|Observability|Medium|M|Observability|AI-Assisted|Claude Code|Implement + Test|CI
6|P1 - High|Testing|Medium|M|QA|Agentic|Claude Code|Implement + Test|CI
30|P2 - Medium|Security|Medium|XS|Security|AI-Assisted|Claude Code|Implement + Test|Unit Test
31|P2 - Medium|Improvement|Low|S|Frontend|AI-Assisted|GitHub Copilot|Implement|Human
4|P2 - Medium|Bug|Medium|M|AI|AI-Assisted|Claude Code|Implement + Test|Multiple
7|P2 - Medium|UX|Low|S|UX|AI-Assisted|Claude Code|Implement + Test|E2E
8|P2 - Medium|Bug|Low|XS|UX|AI-Assisted|Claude Code|Implement + Test|E2E
9|P2 - Medium|Accessibility|Medium|M|Accessibility|Agentic|Claude Code|Implement + Test|Accessibility Test
10|P2 - Medium|Performance|Medium|L|Performance|AI-Assisted|Claude Code|Implement + Test|Performance Test
12|P2 - Medium|UX|Medium|L|UX|AI-Assisted|Claude Code|Implement + Test|Multiple
13|P2 - Medium|Technical Debt|Medium|XL|Architecture|AI-Assisted|Claude Code|Implement + Test|CI
3|P3 - Low|Feature|Medium|XL|AI|AI-Assisted|Google AI Studio|Suggest|Human
5|P3 - Low|Feature|High|L|Product|AI-Assisted|Claude Code|Suggest|Multiple
11|P3 - Low|Technical Debt|Low|XS|DevOps|Manual|Other|Human Only|Human
14|P3 - Low|Testing|Low|L|Testing|Agentic|Claude Code|Implement + Test|CI
DATA

echo "==> Creating project '${PROJECT_TITLE}'"
PROJECT_JSON=$(gh project create --owner "${OWNER}" --title "${PROJECT_TITLE}" --format json)
PROJECT_NUMBER=$(jq -r '.number' <<<"${PROJECT_JSON}")
PROJECT_ID=$(jq -r '.id' <<<"${PROJECT_JSON}")
echo "    project #${PROJECT_NUMBER}"

# --- rewrite the built-in Status options --------------------------------------
# The default Status field ships with Todo/In Progress/Done. It cannot be
# deleted -- the API rejects deleteProjectV2Field with "Only custom fields can
# be deleted" -- and `gh project` exposes no way to edit its options. The
# GraphQL mutation updateProjectV2Field does, so the option set is replaced
# through the API directly.
#
# The mutation REPLACES the option list rather than adding to it. That is safe
# here only because this runs before any item is added; on a populated board it
# would clear the status of every item whose option disappeared.
echo "==> Rewriting the built-in Status options"
STATUS_FIELD_ID=$(gh project field-list "${PROJECT_NUMBER}" --owner "${OWNER}" --format json \
  | jq -r '.fields[] | select(.name=="Status") | .id')
[ -n "${STATUS_FIELD_ID}" ] || { echo "could not find the Status field" >&2; exit 1; }

jq -n --arg field "${STATUS_FIELD_ID}" '
  {
    query: "mutation($field: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) { updateProjectV2Field(input: {fieldId: $field, singleSelectOptions: $options}) { projectV2Field { ... on ProjectV2SingleSelectField { id } } } }",
    variables: {
      field: $field,
      options: [
        { name: "Backlog",      color: "GRAY",   description: "Not scheduled yet" },
        { name: "Ready",        color: "BLUE",   description: "Scoped and ready to start" },
        { name: "In Progress",  color: "YELLOW", description: "Being worked on" },
        { name: "AI Review",    color: "PURPLE", description: "Awaiting agent self-review" },
        { name: "Human Review", color: "ORANGE", description: "Awaiting human review" },
        { name: "Blocked",      color: "RED",    description: "Waiting on something external" },
        { name: "Done",         color: "GREEN",  description: "Merged and verified" }
      ]
    }
  }' | gh api graphql --input - >/dev/null

add_field() {
  echo "==> Field: $1"
  gh project field-create "${PROJECT_NUMBER}" --owner "${OWNER}" \
    --name "$1" --data-type SINGLE_SELECT --single-select-options "$2" >/dev/null
}

add_field "Priority"     "P0 - Critical,P1 - High,P2 - Medium,P3 - Low"
add_field "Type"         "Bug,Feature,Improvement,Technical Debt,Security,Performance,Accessibility,UX,Observability,Testing,Documentation"
add_field "Risk"         "Critical,High,Medium,Low"
add_field "Effort"       "XS,S,M,L,XL"
add_field "Area"         "Product,Architecture,Frontend,Backend,Database,Security,Testing,QA,Accessibility,UX,Performance,Observability,DevOps,AI"
add_field "AI Strategy"  "Manual,AI-Assisted,Agentic"
add_field "AI Tool"      "Claude Code,GitHub Copilot,Google AI Studio,ChatGPT,OpenCode,Other"
add_field "AI Autonomy"  "Human Only,Suggest,Implement,Implement + Test,Implement + Test + Review"
add_field "Verification" "Human,Unit Test,Integration Test,E2E,CI,Security Scan,Performance Test,Accessibility Test,Multiple"

# --- cache field and option ids ----------------------------------------------
FIELDS_JSON=$(gh project field-list "${PROJECT_NUMBER}" --owner "${OWNER}" --format json)

field_id()  { jq -r --arg n "$1" '.fields[] | select(.name==$n) | .id' <<<"${FIELDS_JSON}"; }
option_id() {
  jq -r --arg n "$1" --arg o "$2" \
    '.fields[] | select(.name==$n) | .options[] | select(.name==$o) | .id' <<<"${FIELDS_JSON}"
}

set_field() { # item_id field_name option_name
  local fid oid
  fid=$(field_id "$2"); oid=$(option_id "$2" "$3")
  if [ -z "${fid}" ] || [ -z "${oid}" ]; then
    echo "    !! could not resolve $2 = $3" >&2
    return 0
  fi
  gh project item-edit --id "$1" --project-id "${PROJECT_ID}" \
    --field-id "${fid}" --single-select-option-id "${oid}" >/dev/null
}

# --- add issues and set their values -----------------------------------------
echo "==> Adding issues and setting field values"
while IFS='|' read -r num priority type risk effort area strategy tool autonomy verification; do
  [ -z "${num:-}" ] && continue
  ITEM_ID=$(gh project item-add "${PROJECT_NUMBER}" --owner "${OWNER}" \
    --url "https://github.com/${OWNER}/${REPO}/issues/${num}" --format json | jq -r '.id')

  set_field "${ITEM_ID}" "Status"       "Backlog"
  set_field "${ITEM_ID}" "Priority"     "${priority}"
  set_field "${ITEM_ID}" "Type"         "${type}"
  set_field "${ITEM_ID}" "Risk"         "${risk}"
  set_field "${ITEM_ID}" "Effort"       "${effort}"
  set_field "${ITEM_ID}" "Area"         "${area}"
  set_field "${ITEM_ID}" "AI Strategy"  "${strategy}"
  set_field "${ITEM_ID}" "AI Tool"      "${tool}"
  set_field "${ITEM_ID}" "AI Autonomy"  "${autonomy}"
  set_field "${ITEM_ID}" "Verification" "${verification}"

  echo "    #${num} → ${priority} / ${area} / ${autonomy}"
done <<<"${ROWS}"

cat <<EOF

Done. 27 issues added, all fields set, everything in Backlog.

Views must be created in the UI (the CLI cannot create them):

  Main Board            board,  group by Status
  Production Readiness  table,  filter: Priority:"P0 - Critical","P1 - High"
  Security & Data Risk  table,  filter: Area:Security,Database
  AI Work Queue         table,  filter: -"AI Strategy":Manual
  Priority View         table,  sort by Priority, group by Area

Project: https://github.com/users/${OWNER}/projects/${PROJECT_NUMBER}
EOF
