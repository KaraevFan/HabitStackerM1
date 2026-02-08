# Feature Audit: PRDs vs Implementation

_Audited 2025-02-08 against commit `8bddeca`_

## PRD Inventory

| # | File | Scope |
|---|---|---|
| 1 | `docs/PRD_overall.md` | Full product vision, navigation, AI roles, data model, milestones |
| 2 | `docs/PRD_logging_education_reflection_systems.md` | Logging mechanics, 3-layer education, reflection cycles |
| 3 | `docs/PRD_tracking_reflections_loop.md` | Daily check-in conversation, patterns system, weekly reflection |

---

## Status Legend

- **BUILT** — feature is implemented and functional
- **PARTIAL** — core exists but key aspects are missing
- **NOT BUILT** — described in PRD, not yet implemented

---

## BUILT

| Feature | Key Files | PRD |
|---|---|---|
| Conversational AI Intake (Sonnet) | `intakeAgent.ts`, `OnboardingFlow.tsx` | 1 |
| System Confirmation + Ritual Reveal | `RitualReveal.tsx`, `SystemDesignStep.tsx`, `PlanningStep.tsx` | 1 |
| Runtime Loop (today / done / miss / recover) | `PlanScreen.tsx`, `CheckInFlow.tsx`, `/recovery` | 1 |
| CheckIn data model | `habit.ts` — `CheckIn` interface, `getCheckInState()` | 2 |
| Habit type support (time, event, reactive) | `HabitType` in `habit.ts`, `CheckInOptionsTimeEvent`, `CheckInOptions` | 2 |
| Setup Checklist (interactive, categorized) | `SetupChecklist.tsx`, `SetupItem` type | 1 |
| Identity Section ("who you're becoming") | `IdentitySection.tsx` | 1 |
| Journey Tab (calendar + timeline + day detail) | `MonthCalendar`, `DayTimeline`, `NarrativeHeader`, `DayDetailSheet` | 1 |
| Pattern Finder (rule-based, unlocks at 7 reps) | `patternFinder.ts`, `insightGenerator.ts`, `PatternsSection.tsx` | 3 |
| Inline Whispers (education layer 1) | `whispers.ts` | 2 |
| Daily Check-in Conversation (AI) | `CheckInConversation.tsx`, `reflectionAgent.ts` | 3 |
| Recovery Coach Conversation | `CheckInConversation.tsx` (recovery mode), `recoveryCoachAgent.ts` | 1, 2 |
| Static 4-week Progression Arc | `ProgressionSection.tsx` | 1 |
| "Why this approach works" (generic) | Collapsible on `PlanScreen.tsx` | 1 |

---

## PARTIAL

### Weekly Reflection

**What exists:** 5-step structured flow at `/reflect` (summary → sustainability → friction → recommendation → done). `useReflectionTrigger` hook detects when reflection is due (7+ days since creation, not reflected this week) or when recovery is needed (3+ consecutive misses).

**What's missing:**
- No home screen banner/prompt to surface it — users must navigate manually
- Recommendation is rule-based, not AI-generated
- "Accept" does **not** mutate `HabitSystem` — only stores `lastReflectionDate`
- No `WeeklyReflection` type or reflection history storage
- Form-like step-through, not the conversational AI interface described in PRDs

**Files:** `/reflect/page.tsx`, `useReflectionTrigger.ts`
**PRD:** 2, 3

---

### Recovery Reflection (3+ consecutive misses)

**What exists:** `useReflectionTrigger` detects the condition and routes to a recovery variant of `/reflect`.

**What's missing:** Same form-based flow as weekly — not the compassionate conversational interface described.

**PRD:** 2

---

### Expandable Rationale (education layer 2)

**What exists:** `principle` and `expectations` fields in `HabitSystem` data model. Generic "Why this approach works" collapsible on PlanScreen.

**What's missing:** Not the personalized 3-section format (THE PRINCIPLE / WHY IT FITS YOU / WHAT TO EXPECT) described in the PRD.

**PRD:** 2

---

### Progression

**What exists:** 4-stage arc in `ProgressionSection.tsx` — Show Up (0 reps), Protect the Routine (7 reps), Add the Reward (14 reps), Reflect & Adjust (21 reps). Current stage highlighted, future stages dimmed.

**What's missing:**
- No `currentStage` or `progressionPlan` (ProgressionStage[]) in data model — computed from `repsCount` each render
- No Month 2+ "Expand or Stack" stage
- No stage transition celebrations or reflections
- Rep-based thresholds, not calendar-week-based
- Shows immediately in Self tab — not gated behind Week 1 completion per progressive disclosure rules

**Files:** `ProgressionSection.tsx`
**PRD:** 1

---

### Toolkit

**What exists:** Fields in `HabitSystem` (`tinyVersion`, `environmentPrime`, `frictionReduced`).

**What's missing:** Not surfaced as its own section. PRD describes a dedicated Toolkit section available after tune-up.

**PRD:** 1

---

### Pattern → Action link

**What exists:** `insightGenerator.ts` generates suggestions with action types (anchor adjustment, tiny version, recovery, timing). "Adjust anchor" / "Use tiny version" buttons rendered in `PatternsSection.tsx`.

**What's missing:** `onAction` callback is not wired to actual system edit in PlanScreen.

**Files:** `PatternsSection.tsx`, `insightGenerator.ts`
**PRD:** 3

---

### Navigation tabs (System / Journey / Self)

**What exists:** Inline expansion tabs in PlanScreen.

**What's missing:**
- YOUR SYSTEM tab: Ritual and Setup visible; Toolkit and Recovery not shown as separate items; Science is on main screen, not under tab
- YOUR JOURNEY tab: Timeline and Patterns built; Photo Log not built
- YOUR SELF tab: Identity and Progression built; Reflection is a separate route, not embedded

**PRD:** 1

---

## NOT BUILT

### Home screen reflection banner
Weekly Check-in card on PlanScreen with "Remind me later" (24-hour dismiss) and auto-dismiss after 3 days. The trigger hook exists but is not wired to any UI on the home screen.

**PRD:** 3

### System mutation from reflection
"Accept and update" should apply recommendation changes to `HabitSystem` (adjust anchor, switch to tiny version, update recovery action). Currently a no-op.

**PRD:** 2, 3

### Stage Transition Reflections
Celebrations and reflections at Week 1 / Week 2 / Week 4 completion boundaries.

**PRD:** 2

### On-Demand Reflection ("Talk to coach")
The "..." menu button exists on PlanScreen but has no functionality.

**PRD:** 1

### Coach's Notes (education layer 3)
Deep-dive reference document, personalized and auto-updated from reflections.

**PRD:** 2

### Photo Log / Evidence Gallery
`RepLog` has photo fields but no gallery view or photo capture UI.

**PRD:** 1

### WeeklyReflection data model
No `WeeklyReflection` interface. No `reflections[]` array or `nextReflectionDue` in `HabitData`. No reflection history storage.

**PRD:** 2, 3

### Pattern history storage
Patterns regenerate on every render. No caching, no historical records, no longitudinal analysis.

**PRD:** 3

### AI-generated patterns
Patterns are entirely rule-based via `insightGenerator.ts`. PRD describes AI-generated insight text.

**PRD:** 3

### Graduation / Habit Stacking
`HabitState` has a comment noting `// (later: Review/Graduate)` but no mechanism to complete a habit, mark it as mastered, or stack a second habit.

**PRD:** 1

### Frequency / Avoidance habit types
Deferred per M1 scope. Only time-anchored, event-anchored, and reactive are implemented.

**PRD:** 2

### Conversation timeout
30-second gentle prompt described in PRD 3. Not implemented.

**PRD:** 3

---

## The Key Structural Gap

The biggest missing piece is the **reflection → system mutation feedback loop**.

The PRDs describe a cycle:

```
Check-ins → Patterns → Weekly Reflection → System Update → Better check-ins
```

Currently the loop is **open** — data flows in (check-ins feed patterns, patterns feed reflection summary) but nothing flows back out to update the system. The "Accept and update" button stores a date but doesn't change `HabitSystem`.

This is also where longer-term progression should have behavioral teeth. The 4-week arc exists visually but nothing changes for the user at stage boundaries — no new prompts, no system adjustments, no celebrations.

### To close the loop, roughly:

1. **WeeklyReflection data model** — type, history, outcomes
2. **Home screen banner** — surface reflection when due
3. **AI-powered recommendation** — replace rule-based logic
4. **System mutation** — "Accept" actually updates `HabitSystem` fields
5. **Stage transitions** — trigger special reflection + unlock new features at boundaries
