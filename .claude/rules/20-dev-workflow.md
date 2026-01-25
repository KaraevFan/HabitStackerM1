description: "How to build changes safely"

Workflow:
- Prefer incremental commits with clear messages.
- When changing state/schema, update docs/decisions.md with a short note.
- For each feature, include a quick manual test checklist in the PR/commit message.

If unsure about architecture:
- Default to simplest workable approach.
- Avoid premature abstractions until at least 2 flows need the same pattern.