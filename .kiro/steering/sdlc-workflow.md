# SDLC Workflow Guide

This document defines the team's standard development workflow using Jira, GitHub, and code-review-graph MCP tools.

---

## 🔵 Phase 1: Start Development (New Ticket)

1. **Pick Jira ticket** assigned to me from the board
2. **Set Jira status → `In Progress`**
3. Create a new git branch matching the ticket number (e.g. `SCRUM-42-login-api-integration`)
4. Develop according to the Specification and Acceptance Criteria in the Jira ticket
5. When dev is done → **Set Jira status → `Ready for Review`**
6. Push branch and open a Pull Request on GitHub

---

## 🟡 Phase 2: Bug Fixing

1. Get all Bugs associated to the Story from Jira
2. For each Bug:
   - Review if the **Actual Result** is still happening
   - Review if the **Expected Result** is NOT happening
   - If bug is reproducible → Fix according to expected results → **Mark `Ready for QA`**
   - If bug is NOT reproducible → **Mark `Ready for QA`** and add comment: `Not Reproducible`
3. When all bugs are fixed → **Set Jira status → `Ready for Review`**

---

## 🟠 Phase 3: Code Review

1. **Set Jira status → `In Review`**
2. Download the PR from GitHub using the GitHub MCP server
3. Start Review using:
   - `code-review-graph` MCP tools (`detect_changes`, `get_impact_radius`, `get_review_context`)
   - Speckit review prompts (`.kiro/prompts/speckit.analyze.md`)
4. Review checklist:
   - [ ] Code matches Acceptance Criteria in Jira ticket
   - [ ] No regressions (check blast radius via `get_impact_radius`)
   - [ ] Tests cover the changes (`query_graph` pattern=`tests_for`)
   - [ ] No dead code introduced (`refactor_tool` mode=`dead_code`)
   - [ ] TypeScript types are correct
   - [ ] No lint errors
5. If review passes → **Set Jira status → `Ready for QA`**
6. If changes needed → **Set Jira status → `In Progress`** and add review comments on PR

---

## 🟢 Phase 4: QA Review

1. **Set Jira status → `In QA`**
2. QA tests against Acceptance Criteria
3. If **bugs found** → **Set Jira status → `In Progress`** (back to Phase 2)
4. If **no bugs found** → **Set Jira status → `Done`** ✅

---

## MCP Tools Reference

### Jira (mcp-atlassian)
- Get my assigned tickets
- Get ticket details (description, acceptance criteria, status)
- Update ticket status
- Add comments to tickets
- Get bugs linked to a story

### GitHub (mcp-server-github)
- List open PRs
- Get PR diff and files changed
- Add review comments
- Approve or request changes on PR

### Code Review Graph (code-review-graph)
- `detect_changes` — risk-scored analysis of what changed
- `get_impact_radius` — blast radius of changes
- `get_review_context` — token-efficient review context with source
- `query_graph` pattern=`tests_for` — check test coverage
- `refactor_tool` mode=`dead_code` — find dead code

---

## Jira Project Info

- **Jira URL**: https://intelera-team-gbifcm47.atlassian.net
- **Project**: SCRUM

## Status Transitions

| From | Action | To |
|---|---|---|
| Backlog/To Do | Start work | `In Progress` |
| In Progress | Dev complete | `Ready for Review` |
| Ready for Review | Review started | `In Review` |
| In Review | Review passed | `Ready for QA` |
| In Review | Changes needed | `In Progress` |
| Ready for QA | QA started | `In QA` |
| In QA | Bug found | `In Progress` |
| In QA | No bugs | `Done` |
