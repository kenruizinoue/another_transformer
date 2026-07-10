# Ken Project Prompts - Quick Track

Use with prompts/prompts.md (read Prompt 1 there first). For one ticket, one PR.

## Prompt 1 - Quick Feature

When: a small, well-scoped change that fits one ticket and one PR.

Inputs: `requirement` (link or pasted text).

Create a feature branch for this work per standards/base-sdlc.md. Read the requirement. If CLAUDE.md does not exist yet in this repo, create the short version described in prompts/full.md Prompt 1 (Bootstrap); it must refer to standards/, never copy their content. State the ticket inline using the ticket shape from standards/base-sdlc.md (objective, TDD work, edge cases, acceptance criteria) plus the verification commands from the matching standards/ file for this stack. No docs/PROJECT_PLAN.md file needed for a single ticket. Wait for approval covering both the ticket shape and permission to implement.

Once approved: implement with TDD (failing test first, minimal implementation, run tests), following the matching standards/ file. Do not commit unless the user explicitly asks; when asked, commit only after tests and checks pass.

## Prompt 2 - Quick Ship

When: the quick ticket is implemented and verified; this closes and ships it.

Inputs: none (PR target branch defaults to the default branch; state a different target if the requirement specifies one).

Run everything (tests, lint, typecheck/build). Review the diff against standards/ and the requirement; list anything a reviewer could flag, fix real gaps, and re-run checks. Commit anything pending, push the feature branch, and open a PR against the target branch.
