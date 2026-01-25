# CLAUDE.md

Habit Stacker: A habit designer (not tracker) using conversational AI to help users build survivable habits.

**Milestone:** M1 Alpha — chat intake → confirmation → 7-day runtime loop

## Commands

```bash
npm run dev          # Dev server at localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest
```

## Product Laws (Non-Negotiable)

1. **One active habit** at a time
2. **Miss is first-class** — triggers recovery, not punishment
3. **No streak framing** — use "Reps / Last done", never "streak"
4. **One clear next step** per screen
5. **Chat feels like texting** — short messages, no walls of text

**Forbidden words:** streak, failure, discipline, lazy, shame

## Architecture

```
Chat (Sonnet) → Confirmation Screen → Runtime Loop
```

- **Intake Agent:** Claude Sonnet (quality matters here)
- **Daily check-ins:** Claude Haiku (cost-efficient)
- **Prompt location:** `src/lib/ai/prompts/intakeAgent.ts`

## Key Files

| Purpose | Location |
|---------|----------|
| Intake prompt | `src/lib/ai/prompts/intakeAgent.ts` |
| Type definitions | `src/types/conversation.ts`, `src/types/habit.ts` |
| Design system | `docs/design-brief.md` |
| Product requirements | `docs/PRD.md` |
| Decision log | `docs/decisions.md` |

## Design System (Quick Reference)

Read `docs/design-brief.md` before UI work.

- **Fonts:** Fraunces (headings), Outfit (body)
- **Background:** #FDFBF7 (warm cream, never pure white)
- **Text:** #1A1816 (never pure black)
- **Accent:** #2D6A5D (deep teal, sparingly)

**Forbidden:** Inter/Roboto fonts, gradients, pure black/white, bouncy animations

## Working Conventions

- Bias to small vertical slices
- Update `docs/decisions.md` when changing state/schema
- Stream all AI responses
- Copy is product behavior — tone matters