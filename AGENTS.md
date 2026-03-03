# AGENTS.md

## Project Rule
- Always use the `brainstorming` skill before any creative or implementation work in this project.
- When writing design docs, use Linear MCP to create related development issues in the ticket system.
- Keep Linear MCP continuously up to date during both design and implementation:
  - create issues for planned work,
  - update issue status as work progresses,
  - and link implemented changes back to the corresponding Linear tasks.

## Branching and Pull Request Workflow
- Always create a new feature branch from the latest `main`.
- Keep each branch and PR small, focused, and reviewable.
- All PRs must target `main`.
- While there is approved work left in project plans or Linear tickets, continue implementation in feature-sized batches:
  - implement one focused feature on its own branch,
  - open/update a PR for that feature,
  - then pick the next approved item and start a new branch from latest `main`.
- If `main` changes while a PR is under review, rebase the feature branch onto latest `main`.
- After rebasing, push updates with `--force-with-lease`.
- Independent features can be developed in parallel on separate branches.
- Dependent features may temporarily stack on top of another feature branch, but must be rebased to latest `main` before opening the final PR.

## Linear MCP Auth
- Use OAuth-only authentication for Linear MCP (`codex mcp login linear`).
- Do not use bearer token / API key auth methods (including `bearer_token_env_var`) for this project workflow.
