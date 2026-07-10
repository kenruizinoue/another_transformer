# Ken Project Prompts

Invoke as: `execute prompt N from prompts/<file>.md`, adding the inputs the prompt lists.
Always read the referenced files fresh; never work from memory of them.

## Choosing a Track

Always start with Prompt 1 below, then pick a track:

- **Full** (prompts/full.md): a feature or project that spans multiple tickets, needs a written plan, or benefits from a phase-by-phase audit.
- **Quick** (prompts/quick.md): one ticket, one PR — a bug fix, a small addition, a config/copy change. Skips docs/PROJECT_PLAN.md and the phase structure; still TDD, still audited, still gated by approval.

Both tracks read the same standards/ files; only the ceremony around planning and closing the work differs.

## Prompt 1 - Load Context

When: the very first message in a fresh session, before anything else.

Inputs: none.

Read every file in standards/. The standards are the working rules; the prompts files are the flow to follow, this file plus prompts/full.md or prompts/quick.md once a track is chosen. Prompts are invoked by number as needed. Confirm what you loaded with one line per file. Don't act on anything yet.
