# Project field values

Field values for every issue in the **Product Engineering** project, derived from
the engineering audit.

Projects V2 is a GraphQL-only API, and the session that produced the audit had
GraphQL disabled. `scripts/setup-github-project.sh` creates the project and its
fields; this table is the source for filling in the values.

Until the project exists, priority is encoded as repository labels
(`P0-critical`, `P1-high`, `P2-medium`, `P3-low`) so the information is not lost.

## Status

All audit issues start at **Backlog**. Nothing moves to In Progress by virtue of
existing.

## New issues from the audit

| Issue | Priority | Type | Risk | Effort | Area | AI Strategy | AI Tool | AI Autonomy | Verification |
|---|---|---|---|---|---|---|---|---|---|
| #18 Backup and restore strategy | P0 | Security | Critical | S | Database | Manual | — | Human Only | Human |
| #19 Remove role self-assignment | P0 | Security | Critical | M | Security | AI-Assisted | Claude Code | Suggest | Multiple |
| #20 Auth on public collections | P0 | Security | Critical | M | Database | AI-Assisted | Claude Code | Suggest | Integration Test |
| #21 Restore type checking | P0 | Technical Debt | High | L | Architecture | AI-Assisted | Claude Code | Implement + Test | CI |
| #22 Persist sync server-side | P1 | Bug | High | L | Backend | AI-Assisted | Claude Code | Suggest | Integration Test |
| #23 Bookmark race condition | P1 | Bug | High | S | Database | AI-Assisted | Claude Code | Implement + Test | Integration Test |
| #24 Visa vote rule missing | P1 | Bug | Medium | XS | Database | AI-Assisted | Claude Code | Implement + Test | Multiple |
| #25 Error boundaries | P1 | Improvement | Medium | S | Frontend | Agentic | Claude Code | Implement + Test | Multiple |
| #26 Labels and live regions | P1 | Accessibility | Medium | M | Accessibility | Agentic | Claude Code | Implement + Test | Accessibility Test |
| #27 Lockfile reproducibility | P1 | Technical Debt | Medium | XS | DevOps | AI-Assisted | Claude Code | Implement | CI |
| #28 E2E in production config | P1 | Testing | Medium | S | Testing | AI-Assisted | Claude Code | Implement + Test | E2E |
| #29 Error tracking and logging | P1 | Observability | Medium | M | Observability | AI-Assisted | Claude Code | Implement + Test | CI |
| #30 Email in logs, image URLs | P2 | Security | Medium | XS | Security | AI-Assisted | Claude Code | Implement + Test | Unit Test |
| #31 SEO metadata | P2 | Improvement | Low | S | Frontend | AI-Assisted | GitHub Copilot | Implement | Human |

## Pre-existing issues

| Issue | Priority | Type | Risk | Effort | Area | AI Strategy | AI Tool | AI Autonomy | Verification |
|---|---|---|---|---|---|---|---|---|---|
| #16 Rotate leaked API key | P0 | Security | Critical | S | Security | Manual | — | Human Only | Human |
| #6 QA strategy | P1 | Testing | Medium | M | QA | Agentic | Claude Code | Implement + Test | CI |
| #4 Unify the two chatbots | P2 | Bug | Medium | M | AI | AI-Assisted | Claude Code | Implement + Test | Multiple |
| #7 Consular map scrolling | P2 | UX | Low | S | UX | AI-Assisted | Claude Code | Implement + Test | E2E |
| #8 Chat scroll jump | P2 | Bug | Low | XS | UX | AI-Assisted | Claude Code | Implement + Test | E2E |
| #9 Shared Modal component | P2 | Accessibility | Medium | M | Accessibility | Agentic | Claude Code | Implement + Test | Accessibility Test |
| #10 Data to Firestore, splitting | P2 | Performance | Medium | L | Performance | AI-Assisted | Claude Code | Implement + Test | Performance Test |
| #12 Consolidate sections | P2 | UX | Medium | L | UX | AI-Assisted | Claude Code | Implement + Test | Multiple |
| #13 Component size and i18n | P2 | Technical Debt | Medium | XL | Architecture | AI-Assisted | Claude Code | Implement + Test | CI |
| #3 RAG for the assistant | P3 | Feature | Medium | XL | AI | AI-Assisted | Google AI Studio | Suggest | Human |
| #5 Admin dashboard | P3 | Feature | High | L | Product | AI-Assisted | Claude Code | Suggest | Multiple |
| #11 Vercel vs Cloud Run | P3 | Technical Debt | Low | XS | DevOps | Manual | — | Human Only | Human |
| #14 Coverage to 70 % | P3 | Testing | Low | L | Testing | Agentic | Claude Code | Implement + Test | CI |

## Why some autonomy values are low

Issues touching authorization, secrets, production data or infrastructure are
capped at **Human Only** or **Suggest**, regardless of how mechanical the change
looks: #16, #18, #19, #20, #22, #11, and #3 (which involves API cost decisions).

Higher autonomy is used where the change is additive and a test is a genuine
oracle: error boundaries, accessibility fixes, type checking, E2E work.

## Effort scale

| | |
|---|---|
| XS | under 1 hour |
| S | 1–4 hours |
| M | 4–8 hours |
| L | 1–3 days |
| XL | over 3 days |

Estimates for #13 (XL) and #3 (XL) are the least certain — both are open-ended
refactors whose scope depends on decisions not yet made.
