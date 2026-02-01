# Habit Stacker — Progress Summary (V0.4)

**Date:** 2026-01-26
**Milestone:** M1 Alpha
**Status:** V0.4 Complete, Ready for Testing

---

## What We're Building

**Habit Stacker** is a Habit Designer (not a tracker) — a web app that guides users through designing survivable habits via AI-powered consultation, then supports daily execution with deterministic recovery from misses.

**Core thesis being tested:** Can a conversational AI agent make users feel more understood than a wizard, and does that translate to better habit recommendations and first-week completion rates?

---

## Implementation Progress

### V0.1 — Prompt Validation ✅
- Tested intake agent prompts directly in Claude
- Validated conversation quality before writing code
- Agent demonstrates contextual follow-ups, accurate reflection, relevant insight

### V0.2 — Chat Intake Feel ✅
- Built chat UI with messages, suggested pills, text input
- Integrated Claude Sonnet for intake conversation
- Unified intake + recommendation into single agent

### V0.3 — End-to-End Flow ✅
- Single agent handles: discovery → reflection → recommendation → confirmation
- Created `/today` page with Done/Missed actions
- Created `/recovery` page with recovery flow
- State transitions verified: rep_done, miss, recovery_done, skip

### V0.4 — Commitment & Progressive Depth ✅
- Redesigned confirmation screen (hero statement + emoji)
- Photo evidence flow after marking done
- Tune-up conversation with Haiku for habit toolkit
- Your System screen with full habit view + editing
- Plan screen with conditional cards based on progress

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SETUP FLOW                              │
│                                                              │
│  /setup (Chat Intake)                                        │
│      │                                                       │
│      ▼                                                       │
│  Intake Agent (Sonnet)                                       │
│  - Discovery phase (understand user)                         │
│  - Reflection phase (confirm understanding)                  │
│  - Recommendation phase (propose habit)                      │
│  - Ready phase (user accepts)                                │
│      │                                                       │
│      ▼                                                       │
│  Confirmation Screen                                         │
│  - Hero statement: "When I [anchor], I [action]."            │
│  - Context emoji                                             │
│  - "Felt understood" rating (1-5)                            │
│  - CTA: Start first rep / I'll start later                   │
│      │                                                       │
│      ▼                                                       │
│  Runtime Loop                                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      RUNTIME LOOP                            │
│                                                              │
│  / (Plan Screen)                                             │
│  - Shows habit with emoji + hero statement                   │
│  - Stats: Reps, Last done                                    │
│  - Conditional cards based on state:                         │
│    • pre_first_rep: basic view                               │
│    • tune_up_available: "Tune your system" card              │
│    • needs_photo_for_tuneup: photo nudge                     │
│    • tuned: "View your system" link                          │
│      │                                                       │
│      ▼                                                       │
│  /today                                                      │
│  - Shows habit to complete                                   │
│  - Done → Photo prompt → Celebration → Home                  │
│  - Missed → Home (triggers recovery next visit)              │
│      │                                                       │
│      ▼                                                       │
│  /recovery (if missed)                                       │
│  - Shows recovery action                                     │
│  - "Done — I'm back" → Active state restored                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PROGRESSIVE DEPTH                         │
│                                                              │
│  /tuneup (after 1st rep with photo)                          │
│  - Haiku conversation (4-5 turns)                            │
│  - Extracts: friction, environment prime, tiny version       │
│  - Saves toolkit to HabitSystem                              │
│      │                                                       │
│      ▼                                                       │
│  /system                                                     │
│  - The Ritual: anchor → action → then                        │
│  - Your Toolkit: tiny version, env prime, friction           │
│  - When You Miss: recovery action                            │
│  - Why This Works: collapsible reasons                       │
│  - Edit bottom sheets for each field                         │
│  - Re-tune CTA                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Files

### Pages (Routes)
| Route | File | Purpose |
|-------|------|---------|
| `/` | `src/app/page.tsx` | Plan screen or welcome |
| `/setup` | `src/app/setup/page.tsx` | Chat intake flow |
| `/today` | `src/app/today/page.tsx` | Daily rep with photo |
| `/recovery` | `src/app/recovery/page.tsx` | Miss recovery |
| `/tuneup` | `src/app/tuneup/page.tsx` | Haiku tune-up |
| `/system` | `src/app/system/page.tsx` | Full system view |
| `/reset` | `src/app/reset/page.tsx` | Dev reset |

### API Routes
| Route | File | Purpose |
|-------|------|---------|
| `/api/intake` | `src/app/api/intake/route.ts` | Sonnet intake conversation |
| `/api/intake/stream` | `src/app/api/intake/stream/route.ts` | Streaming intake (SSE) |
| `/api/tuneup` | `src/app/api/tuneup/route.ts` | Haiku tune-up conversation |

### Core Types
| File | Key Types |
|------|-----------|
| `src/types/habit.ts` | HabitData, HabitSystem, RepLog, HabitState |
| `src/types/conversation.ts` | IntakeState, Message, HabitRecommendation |

### State Management
| File | Purpose |
|------|---------|
| `src/lib/store/habitStore.ts` | HabitData persistence (localStorage) |
| `src/lib/store/conversationStore.ts` | Conversation state |
| `src/lib/store/photoStore.ts` | Photo storage (IndexedDB) |

### AI Agents
| File | Model | Purpose |
|------|-------|---------|
| `src/lib/ai/prompts/intakeAgent.ts` | Sonnet | Intake + recommendation |
| `src/lib/ai/prompts/tuneUpAgent.ts` | Haiku | Toolkit extraction |
| `src/lib/ai/useIntakeAgent.ts` | — | Intake hook |
| `src/lib/ai/useTuneUpAgent.ts` | — | Tune-up hook |

---

## Data Model

### HabitData (persisted)
```typescript
interface HabitData {
  state: HabitState;  // install | designed | active | missed | recovery

  // Legacy (from wizard)
  planDetails: PlanDetails | null;
  snapshot: HabitSnapshot | null;

  // New (from intake agent)
  system?: HabitSystem;
  intakeState?: IntakeState;
  feltUnderstoodRating?: number;

  // Runtime
  repsCount: number;
  lastDoneDate: string | null;
  missedDate: string | null;
  repLogs?: RepLog[];
  hasCompletedFirstRepWithPhoto?: boolean;
}
```

### HabitSystem (from intake + tune-up)
```typescript
interface HabitSystem {
  // Core (from intake)
  anchor: string;
  action: string;
  then?: string;
  recovery: string;
  whyItFits: string[];

  // Toolkit (from tune-up)
  tinyVersion?: string;
  environmentPrime?: string;
  frictionReduced?: string;

  // Metadata
  tunedAt?: string;
  tuneCount?: number;
}
```

### RepLog (with photo)
```typescript
interface RepLog {
  id: string;
  timestamp: string;
  type: 'done' | 'missed' | 'recovery';
  photoUri?: string;
  photoSkipped?: boolean;
  note?: string;
}
```

---

## What Works Now

### Setup Flow
- [x] Chat-based intake with Claude Sonnet
- [x] Agent asks contextual follow-ups (not fixed checklist)
- [x] Reflection shows pattern recognition
- [x] Single recommendation with personalized "why it fits"
- [x] Confirmation screen with hero statement + emoji
- [x] "Felt understood" rating captured
- [x] Timing-aware CTA ("Start first rep tonight/now/today")

### Runtime Flow
- [x] Plan screen with habit card + stats
- [x] Conditional cards based on progress state
- [x] Done → Photo prompt → Celebration → Home
- [x] Miss → Recovery forced on next visit
- [x] Recovery completion restores active state
- [x] Rep counting (reps, last done)

### Progressive Depth
- [x] Photo evidence with IndexedDB storage
- [x] Tune-up unlocks after first rep with photo
- [x] Haiku conversation extracts toolkit (friction, env prime, tiny version)
- [x] Your System screen with all sections
- [x] Edit bottom sheets for individual fields
- [x] Re-tune capability

---

## What's NOT Implemented Yet

### From Product Laws
- [ ] **3-rep gate for editing** — Currently editing is unlocked immediately after tune-up
- [ ] **Re-entry flow** — 7+ day inactive detection exists but no special flow
- [ ] **Review/Graduate states** — State machine has placeholders but not implemented

### From Original PRD
- [ ] **Notifications/reminders** — No push notifications
- [ ] **Offline support** — No service worker/PWA
- [ ] **Photo journal view** — Photos stored but not viewable
- [ ] **Analytics dashboard** — Events logged but no visualization
- [ ] **Multiple habits** — Single habit only (by design for M1)

### Technical Debt
- [ ] **Tests** — Minimal test coverage
- [ ] **Error boundaries** — Basic error handling only
- [ ] **Loading skeletons** — Simple loading states
- [ ] **Accessibility** — Basic ARIA labels, needs audit
- [ ] **Old wizard cleanup** — Legacy components still in codebase

---

## Thesis Validation Status

### Primary Metric: "Felt Understood" Score
- Rating collected: ✅
- Storage: ✅ (in intakeState.feltUnderstoodRating and HabitData)
- Analysis: ❌ Not yet analyzed

### Correlation Hypothesis
> Users who feel understood (4-5) have higher first-week completion rates

**Data needed:**
- feltUnderstoodRating per user
- First-week rep completion rate per user
- Sample size for statistical significance

**Current status:** Data collection ready, needs users + analysis

---

## Environment Setup

### Required Environment Variables
```
ANTHROPIC_API_KEY=your_key_here
```

### Optional
```
ANTHROPIC_MODEL=claude-sonnet-4-20250514  # default
OPENAI_API_KEY=your_key_here              # fallback
OPENAI_MODEL=gpt-4o                       # fallback
```

### Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm test             # Run tests
```

---

## Open Questions for Next Steps

### Product
1. **When to user test?** V0.4 seems ready for initial testing — what's the minimum viable test?
2. **Editing gate:** Should we enforce 3-rep gate before editing, or is post-tune-up enough?
3. **Photo requirement:** Is photo mandatory for tune-up, or should it be optional?
4. **Recovery strictness:** Current recovery is gentle — is that the right tone?

### Technical
1. **Streaming:** Intake streaming is implemented but not enabled by default — worth enabling?
2. **Error handling:** Current retry logic is basic — need more robust handling?
3. **Photo storage:** IndexedDB works but has quota limits — need cloud backup?
4. **Analytics:** Events are logged to console — where should they go?

### Thesis Validation
1. **Sample size:** How many users needed to validate "felt understood" correlation?
2. **First-week tracking:** Need automated 7-day completion tracking?
3. **Qualitative feedback:** Should we add post-completion interviews?

---

## Relevant Documentation

| Document | Purpose |
|----------|---------|
| `docs/PRD.md` | Product requirements + laws |
| `docs/EPIC_A_IMPLEMENTATION_PLAN.md` | Implementation phases + status |
| `docs/Feedback_logs/R8_20260125.md` | Latest feedback (V0.4 spec) |
| `docs/V0.3_DESIGN_REVIEW.md` | V0.3 design decisions |
| `docs/decisions.md` | Architecture decision log |
| `CLAUDE.md` | Project context for Claude |

---

## Summary

**V0.4 is feature-complete for the core flow:**
- Conversational intake → Confirmation → Runtime loop → Progressive tune-up

**Ready for:**
- Initial user testing
- Thesis validation data collection
- Feedback on conversation quality

**Not ready for:**
- Production deployment (needs error handling, tests, cleanup)
- Scale (single user, localStorage only)
- Long-term use (no notifications, no multi-habit)
