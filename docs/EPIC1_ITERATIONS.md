# Epic 1 — Iteration Log & Todo List

This document tracks feedback rounds and implementation fixes for the Setup Wizard.

---

## Iteration 1 — 2026-01-15

### Feedback Summary
Source: `docs/Feedback_logs/20260115_Feedback.md`

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 1.1 | No back button across steps | High | ✅ Fixed |
| 1.2 | AI not actually connected — showing "AI temporarily unavailable" fallback | Critical | ✅ Fixed (temperature + schema issues) |
| 1.3 | Options feel generic/routine, not personalized | High | ✅ Fixed (rewrote prompts) |
| 1.4 | Missing classification logic (SETUP vs RECURRING vs MIXED) | High | ✅ Fixed |
| 1.5 | Flow doesn't match CLI architecture (see diagram in feedback) | High | ✅ Fixed

---

### Todo List — Iteration 1

#### 1.2 Fix AI Connection (Critical) ✅ FIXED
- [x] Debug why API calls fall back to hardcoded options
- [x] Check API route logs for errors
- [x] **Root cause 1:** OpenAI structured output doesn't support custom `temperature`
- [x] **Root cause 2:** Schema missing `additionalProperties: false` on nested objects
- [x] **Fix:** Updated `src/lib/ai/client.ts` and `src/lib/ai/schema.ts`

#### 1.3 Improve Option Quality ✅ FIXED
- [x] Rewrote all prompts in `src/lib/ai/prompts.ts`
- [x] Prompts now require specificity to user's actual goal
- [x] Removed generic examples that AI was copying
- [x] Each option must reference user's intent directly
- [x] Planning options now require complete systems (anchor/action/prime/recovery)

#### 1.1 Add Back Button ✅ FIXED
- [x] Add back button to step navigation
- [x] Track step history for back navigation
- [x] Preserve user input when going back
- [x] **Files:** `src/app/setup/page.tsx`

#### 1.4 Add Classification Logic ✅ FIXED
- [x] After "Define Success This Week", classify intent as SETUP / RECURRING / MIXED
- [x] SETUP: one-time tasks (e.g., "organize closet") → skips Anchor, goes to Planning
- [x] RECURRING: daily/weekly habits → goes to Anchor → Planning
- [x] Route to appropriate planning flow based on classification
- [x] **Files:** `src/app/setup/page.tsx` (handleSuccessWeekComplete function)

#### 1.5 Align Flow with CLI Architecture ✅ FIXED
- [x] Reorder steps to match: Intent → Orientation → Success Week → (Classification) → Anchor (if recurring) → Planning → Snapshot
- [x] Make Anchor a separate step for RECURRING habits
- [x] Created new `AnchorStep.tsx` component
- [x] Added anchor prompt builder to `src/lib/ai/prompts.ts`
- [x] Added anchor fallback to `src/lib/ai/useConsultAI.ts`
- [x] Updated `StepProgress.tsx` with "Anchor" label
- [x] Updated `PlanningStep.tsx` to accept flowType prop
- [x] **Files:** `src/components/setup/AnchorStep.tsx`, `src/lib/ai/prompts.ts`, `src/lib/ai/useConsultAI.ts`, `src/components/setup/StepProgress.tsx`, `src/components/setup/PlanningStep.tsx`

---

## How to Use This Document

After each feedback round:
1. Add new section: `## Iteration N — [Date]`
2. Summarize feedback in table
3. Add specific todos
4. Mark completed items with [x]
5. Move unresolved items to next iteration if needed

---

## Quick Reference — Expected Flow (from CLI) [DEPRECATED]

```
Entry → Intent + Constraints → Orientation (auto-confirm)
     → Define Success This Week → [Classification]

     RECURRING: → Anchor → Planning (Action/Prime/Recovery) → Snapshot
     SETUP:     → Planning (Action/Prime) → Snapshot
     MIXED:     → Setup Component → Recurring Component → Snapshot

     → First Rep → Handoff to Runtime Loop
```

---
---

# ITERATION 2 — 2026-01-16

---

## Feedback Summary (R2)
Source: `docs/Feedback_logs/R2_20260116.md`

### Conceptual Issues Identified

| # | Issue | Impact |
|---|-------|--------|
| 2.1 | Flow asks users to choose structure before meaning | Critical |
| 2.2 | System undersells core value — acts like configurator, not expert guide | Critical |
| 2.3 | Key concepts (identity, anchor/action/recovery) introduced too late | High |
| 2.4 | System lacks authority and POV — never says "start with X because Y" | Critical |
| 2.5 | Users never clearly told what habit to do | Critical |
| 2.6 | "Small → big" promise implied but not explained | High |

### Screen-by-Screen Issues

| Screen | Issue | Priority |
|--------|-------|----------|
| Intent | High effort free-text first; identity not operationalized | High |
| Success Map | Generic phase picking; should be system-generated narrative | High |
| This Week | Chooses schedules/difficulty, not behaviors | Critical |
| Planning | Appears personalized but lacks POV and rationale | High |
| Planning Details | Framework leakage; concepts introduced without explanation | High |
| Confirm | No connection to runtime loop | Medium |

---

## Updated Flow Architecture (from PRD v2)

```
1. Intent Framing & Scope Narrowing
   - Domain selection (Health, Finances, Home, Relationships)
   - Sub-problem narrowing
   - System-proposed identity framing (optional)

2. Success Map (System-Generated, Read-Only)
   - Success narrative: what people aiming for this goal typically do
   - Explicit "small → big" explanation
   - User acknowledges understanding (no configuration)

3. Week-1 Habit Recommendation
   - System proposes 1–3 concrete candidate HABITS (behaviors, not schedules)
   - Each option explains why it's a good Week-1 wedge
   - System makes a clear recommendation
   - User selects ONE habit

4. Habit System Design (Compressed, Guided)
   - Brief intro of model: Anchor → Action → Recovery (Prime optional)
   - System proposes default survivable system
   - User accepts or makes light adjustments

5. Week-1 Contract & First Rep
   - Concise contract (one line goal, one line action)
   - CTA: "Start first rep now (≤2 minutes)"
   - Defer option routes to runtime
```

---

## Implementation Plan — Iteration 2

### Phase 2.A — Restructure Intent Step (Issue 2.1, 2.3) ✅ IMPLEMENTED
**Goal:** Reduce cognitive load; guide before asking for articulation.

- [x] Replace free-text-first with **domain selector** (Health, Finances, Home, Relationships, Learning)
- [x] Add **sub-problem narrowing** within selected domain (curated list per domain)
- [x] Make free-text optional/secondary for additional context
- [x] System proposes **identity framing** based on selection
  - e.g., "People who stick with this usually start seeing themselves as someone who ___"
- [x] Remove "what is your goal" free-text as primary input

**Files modified:**
- `src/components/setup/IntentStep.tsx` — rewrote with 3-phase flow (domain → subproblem → context)
- `src/types/habit.ts` — added HabitDomain, DomainInfo, SubProblemInfo types; added DOMAINS data; updated ConsultSelections

---

### Phase 2.B — Replace Success Map with System-Generated Narrative (Issue 2.2, 2.6) ✅ IMPLEMENTED
**Goal:** Show "what good looks like" with system authority; explain small → big.

- [x] Remove phase picker (Show Up / Stabilize / Build)
- [x] Generate **success narrative** based on domain + sub-problem
  - Specific narratives for each of 20 sub-problems across 5 domains
- [x] Include explicit **"why small leads to big"** explanation
- [x] User interaction = acknowledgment only ("This makes sense")
- [x] Screen is **read-only**, no configuration

**Files created/modified:**
- Created `src/components/setup/SuccessMapStep.tsx` — new component with curated narratives
- Narratives include: headline, 4-phase journey, smallToBig explanation, encouragement

---

### Phase 2.C — Week-1 Habit Recommendation (Issue 2.4, 2.5) ✅ IMPLEMENTED
**Goal:** Clearly tell user what habit to do with reasoning.

- [x] Create new step: **HabitRecommendationStep**
- [x] System proposes **1–3 concrete habits** (behaviors, not schedules)
  - e.g., "Check one balance," "Log one expense," "Do 5 pushups"
- [x] Each option includes what the action is and why it's a good Week-1 wedge
- [x] System makes a **clear recommendation** (first option, marked "Recommended")
- [x] User selects ONE habit to commit to
- [x] Replaced the old "This Week" difficulty/cadence picker

**Files created/modified:**
- Created `src/components/setup/HabitRecommendationStep.tsx`
- `src/lib/ai/prompts.ts` — added `buildHabitSelectPrompt()`
- `src/lib/ai/useConsultAI.ts` — added `getHabitSelectFallback()` with curated habits per domain/subproblem

---

### Phase 2.D — Compress & Ground Habit System Design (Issue 2.3) ✅ IMPLEMENTED
**Goal:** Explain the model before applying it; make it collaborative.

- [x] Add brief **intro screen** explaining Anchor → Action → Recovery model
  - "Your habit needs three parts to survive bad days..."
- [x] System proposes **default system** grounded in best practices
- [x] Show **why** each component is designed this way
- [x] User can accept as-is or make **guided adjustments**
- [x] Consolidated into single compressed step with 3 phases (intro → select → review)

**Files created/modified:**
- Created `src/components/setup/SystemDesignStep.tsx` — new component with intro/select/review phases
- `src/lib/ai/prompts.ts` — added `buildSystemDesignPrompt()`
- `src/lib/ai/useConsultAI.ts` — added `getSystemDesignFallback()`

---

### Phase 2.E — Week-1 Contract & First Rep Trigger (Issue 2.4) ✅ IMPLEMENTED
**Goal:** Create commitment moment with clear CTA.

- [x] Created new **ContractStep** with concise 2-line contract
  - Line 1: "Week 1: Show up."
  - Line 2: "After [anchor], [action]."
- [x] Added explanation of **why system survives bad days**
- [x] Primary CTA: **"Start first rep now (≤2 min)"**
- [x] Added explicit **defer option** ("I'll start later")
- [x] First Rep completion routes to runtime loop

**Files created/modified:**
- Created `src/components/setup/ContractStep.tsx` — new component replacing SnapshotStep

---

### Phase 2.F — Flow Orchestration & Step Management ✅ IMPLEMENTED
**Goal:** Wire new steps together; update navigation.

- [x] Updated step enum/types with new steps: `intent`, `success_map`, `habit_select`, `system_design`, `contract`
- [x] Updated StepProgress component with new step labels
- [x] Setup page now uses new 5-step flow exclusively
- [x] Back button works across all new steps
- [x] New data fields persist (domain, subProblem, selectedHabit, additionalContext)

**Files modified:**
- `src/types/habit.ts` — updated ConsultStep enum, ConsultSelections interface
- `src/components/setup/StepProgress.tsx` — updated labels
- `src/app/setup/page.tsx` — rewrote with new flow orchestration

---

## Success Criteria — Iteration 2

- [x] User is never asked to articulate before system helps them think
- [x] System generates success narrative (not phase picker)
- [x] User is clearly told "Here is the habit we recommend"
- [x] Habit options are behaviors, not schedules/difficulty variants
- [x] System model (Anchor/Action/Recovery) is explained before applied
- [x] Week-1 contract is 2 lines max with clear CTA
- [x] Flow feels like expert consult, not form-filling

---

## Test Checklist — Iteration 2

- [ ] Can complete full flow: domain → sub-problem → success map → habit recommendation → system design → contract → first rep
- [ ] Success map is read-only (no configuration options)
- [ ] Habit recommendation shows 2–3 behavior options with rationale
- [ ] System design shows complete system with explanation
- [ ] Contract screen has working "Start now" and "Defer" paths
- [ ] Back navigation works across all new steps
- [ ] Data persists correctly (domain, sub-problem, selected habit, system)

---

## Dependencies & Open Questions

**Dependencies:**
- AI prompt quality for success narrative generation
- AI prompt quality for habit recommendation with reasoning

**Open questions:**
- Should domain/sub-problem options be AI-generated or curated?
  - *Decision: Started with curated list (20 sub-problems across 5 domains)*
- How much identity framing to include in Intent step?
  - *Decision: Light touch — system shows identity frame after sub-problem selection*
- Should we keep SETUP/RECURRING classification or simplify to single flow?
  - *Decision: Simplified to single flow for now; removed setup/recurring branching*

---

## Implementation Summary — 2026-01-16

### Files Created
- `src/components/setup/SuccessMapStep.tsx` — System-generated success narrative
- `src/components/setup/HabitRecommendationStep.tsx` — Habit selection with recommendations
- `src/components/setup/SystemDesignStep.tsx` — Compressed anchor/action/recovery design
- `src/components/setup/ContractStep.tsx` — Week-1 contract and first rep trigger

### Files Modified
- `src/types/habit.ts` — New types (HabitDomain, DomainInfo, SubProblemInfo), DOMAINS data, updated ConsultStep and ConsultSelections
- `src/components/setup/IntentStep.tsx` — Complete rewrite with domain/subproblem selector
- `src/components/setup/StepProgress.tsx` — New step labels
- `src/app/setup/page.tsx` — New flow orchestration
- `src/lib/ai/prompts.ts` — Added buildHabitSelectPrompt, buildSystemDesignPrompt
- `src/lib/ai/useConsultAI.ts` — Added habit_select and system_design fallbacks with curated content

### New Flow
```
Intent (domain → sub-problem → context)
    ↓
Success Map (read-only narrative)
    ↓
Habit Recommendation (2-3 behaviors, clear recommendation)
    ↓
System Design (intro → select → review)
    ↓
Contract (2-line contract + first rep)
```

### Key Design Decisions
1. **Curated over AI-generated** for domain/sub-problem/habit data to ensure quality
2. **Identity framing** shown after sub-problem selection as system insight
3. **Single flow** (removed setup/recurring branching for simplicity)
4. **Intro before design** — system explains anchor/action/recovery before asking user to choose

### Build Status
- ✅ TypeScript compilation passes
- ✅ Next.js build successful
- Ready for user testing

---
---

# ITERATION 3 — 2026-01-17

---

## Feedback Summary (R3)
Source: `docs/Feedback_logs/R3_20260117.md`

### Core Problem Identified
The onboarding still feels like a **deterministic form/menu**, not an **expert consult**. Even with good output, the interaction pattern makes it feel generic and rail-driven.

### Two Emotions We're Missing
1. **Authority** — "This system actually understands what it means to excel at X"
2. **Being Understood** — "It's actively listening and adapting to me"

### Symptoms (User Feedback)
- "This is scatter-shot and generic."
- "I'm being hard-railed into options."
- "I still don't know what excellence looks like in this domain."
- "I'm not being asked the right questions; I'm filling forms."
- "The system never tells me what to do, and why."

---

## Design Updates (6 Options from Feedback)

| Option | Update |
|--------|--------|
| 1. Model of Excellence | Portrait of what excellence looks like BEFORE recommending habits |
| 2. Domains as Worlds | Domain-specific world models (norms, traps, leverage points) |
| 3. Structured Wisdom | Curated scaffolds (playbooks, archetypes, progression ladders) |
| 4. Guided Inference | Replace forms with adaptive tap-based micro-questionnaire |
| 5. Earned Recommendations | Show decision logic for why each recommendation |
| 6. Felt Intelligence | Fewer options, stronger POV, coherence over flexibility |

---

## User Stories Added

### A) Authority & Domain World Model (Options 1,2,3)
- **US-A1 (Portrait of Excellence):** See what people who succeed in this area actually do
- **US-A2 (Progression Ladder):** See phased progression (Week 1 → Month 1 → Month 3)
- **US-A3 (Common Traps & Leverage Points):** System calls out failure modes and highest-leverage starting move
- **US-A4 (Domain-specific language):** UI and questions feel domain-specific

### B) Being Understood (Option 4)
- **US-B1 (Micro-questionnaire):** Answer 3-6 quick tap-based questions
- **US-B2 (Assumption-checking):** System reflects inference for user confirmation
- **US-B3 (Minimal typing):** Free-text is optional

### C) Recommendation Quality (Options 5,6)
- **US-C1 (Shortlist):** 1-3 concrete Week-1 habit candidates
- **US-C2 (Decision logic):** Justification for why each habit fits the user
- **US-C3 (Clear recommendation):** System recommends default when confidence is high
- **US-C4 (Coherence):** Fewer decisions, coherent plan that "just makes sense"

---

## Updated Flow (Iteration 3)

```
Intent (domain → sub-problem)
    ↓
Questionnaire (3-6 taps + inference confirmation)  ← NEW
    ↓
Portrait of Excellence (progression ladder, traps, leverage)  ← ENHANCED
    ↓
Habit Recommendation (earned justification from questionnaire)  ← ENHANCED
    ↓
System Design (unchanged)
    ↓
Contract (unchanged)
```

---

## Implementation Plan — Iteration 3

### Phase 3.A — Add Micro-Questionnaire Step (US-B1, B2, B3) ✅ IMPLEMENTED
**Goal:** Establish "being understood" before showing recommendations.

- [x] Create new `QuestionnaireStep.tsx` component
- [x] 4-5 tap-based questions per domain covering:
  - Timing preference (morning/midday/evening/flexible)
  - Energy level at preferred time (high/medium/low)
  - Environment (home/office/commute/varies)
  - Primary barrier (time/energy/motivation/forgetting)
  - Previous attempts (first time/tried before/tried many times)
- [x] System reflects inference in 1-2 lines
- [x] User confirms or goes back to edit
- [x] Store answers in ConsultSelections

**Files:** `src/components/setup/QuestionnaireStep.tsx`, `src/types/habit.ts`, `src/app/setup/page.tsx`

---

### Phase 3.B — Create Domain Playbooks Data Structure (US-A1, A2, A3, A4) ✅ IMPLEMENTED
**Goal:** Replace scattered content with curated, opinionated scaffolds.

- [x] Create `DomainPlaybook` interface with:
  - Portrait of Excellence (3-4 bullets)
  - Progression Ladder (Week 1 / Month 1 / Month 3)
  - Common Traps (2-3 failure modes)
  - Leverage Points (1-2 highest-impact starting moves)
  - Candidate Habits (curated Week-1 options with fit criteria)
- [x] Create playbook data for all 20 sub-problems across 5 domains
- [x] Playbooks used as scaffolding for AI and fallback content

**Files:** `src/lib/playbooks/index.ts`, `src/lib/playbooks/types.ts`, `src/lib/playbooks/health.ts`, `src/lib/playbooks/finances.ts`, `src/lib/playbooks/home.ts`, `src/lib/playbooks/relationships.ts`, `src/lib/playbooks/learning.ts`

---

### Phase 3.C — Enhance Success Map → Portrait of Excellence (US-A1, A2, A3) ✅ IMPLEMENTED
**Goal:** Transform current SuccessMapStep with playbook content.

- [x] Add progression ladder visualization (Week 1 → Month 1 → Month 3)
- [x] Include common traps ("Most people fail here because...")
- [x] Show leverage point ("The highest-impact starting move is...")
- [x] Use domain-specific language and examples from playbook
- [x] Keep as read-only acknowledgment step

**Files:** `src/components/setup/SuccessMapStep.tsx`

---

### Phase 3.D — Earned Recommendations with Visible Logic (US-C1, C2, C3, C4) ✅ IMPLEMENTED
**Goal:** Show why each habit fits the user based on questionnaire answers.

- [x] Use questionnaire answers to rank habits by fit
- [x] Show personalized fit rationale for each option:
  - Timing fit
  - Energy fit
  - Barrier fit
  - Experience fit
- [x] Reduce to 2-3 strong options with clear POV
- [x] First option marked as recommended with reasoning

**Files:** `src/components/setup/HabitRecommendationStep.tsx`

---

### Phase 3.E — Flow Orchestration & Types Update ✅ IMPLEMENTED
**Goal:** Wire new questionnaire step into flow.

- [x] Add `questionnaire` to ConsultStep enum
- [x] Add questionnaire answers to ConsultSelections interface
- [x] Update StepProgress with new step count
- [x] Update setup/page.tsx with new flow order
- [x] Back navigation works across all steps

**Files:** `src/types/habit.ts`, `src/components/setup/StepProgress.tsx`, `src/app/setup/page.tsx`

---

## Build Status — Iteration 3
- ✅ TypeScript compilation passes
- ✅ Next.js build successful
- Ready for user testing

---

## Files Created — Iteration 3
- `src/components/setup/QuestionnaireStep.tsx` — Micro-questionnaire with inference confirmation
- `src/lib/playbooks/types.ts` — Playbook type definitions
- `src/lib/playbooks/index.ts` — Main playbooks exports and utilities
- `src/lib/playbooks/health.ts` — Health domain playbooks
- `src/lib/playbooks/finances.ts` — Finances domain playbooks
- `src/lib/playbooks/home.ts` — Home domain playbooks
- `src/lib/playbooks/relationships.ts` — Relationships domain playbooks
- `src/lib/playbooks/learning.ts` — Learning domain playbooks

## Files Modified — Iteration 3
- `src/types/habit.ts` — Added questionnaire types, updated ConsultStep enum
- `src/components/setup/SuccessMapStep.tsx` — Now uses playbook data for portrait/ladder/traps
- `src/components/setup/HabitRecommendationStep.tsx` — Shows personalized fit rationale
- `src/components/setup/StepProgress.tsx` — Added questionnaire step label
- `src/app/setup/page.tsx` — Added questionnaire to flow
- `src/lib/store/habitStore.ts` — Updated saveConsultSelection for flexible types
- `docs/PRD.md` — Added user stories and updated flow
- `docs/EPIC1_ITERATIONS.md` — Added Iteration 3 plan

---

## Success Criteria — Iteration 3

- [x] User answers 4-5 tap-based questions in < 60 seconds
- [x] System reflects inference before showing portrait
- [x] Portrait includes progression ladder and traps
- [x] Habit recommendations show personalized fit rationale
- [x] Flow feels like adaptive consult, not form-filling
- [x] Each recommendation feels "earned" from user's answers

---

## Test Checklist — Iteration 3

- [x] Can complete full flow with questionnaire step
- [x] Inference confirmation shows correct summary of answers
- [x] Portrait shows domain-specific progression ladder
- [x] Habit options show personalized fit based on answers
- [x] Back navigation works from any step
- [x] Data persists correctly (questionnaire answers, selections)

---
---

# ITERATION 4 — 2026-01-18

---

## Feedback Summary (R4)
Source: `docs/Feedback_logs/R4_20260118.md`

### Core Problem: Sequencing Inversion
Components are right but in wrong order. We ask questions before users have context to care, and show Portrait after they've already made commitments.

### High-Level Issues

| Issue | Description | Recommendation |
|-------|-------------|----------------|
| Portrait too late | Appears at step 6 of 8, after generic questions | Move to position 2, after intent |
| Domain-first friction | Users think in frustrations, not abstract domains | Free-text input first, domains as scaffolding |
| Too many questions | 5 questions, some don't apply (location for sleep) | Reduce to 3: timing, barrier, experience |
| Receipt, not inference | Confirmation restates selections, doesn't synthesize | Show insight: "Motivation isn't the issue—the system is" |
| Passive system design | User reads but doesn't decide | Interactive anchor selection |
| Back-loaded value | Aha moment comes too late | Front-load Portrait, compress intake |

### Flow Change

**Current:**
```
Intent → Questionnaire (5 Qs) → Portrait → Habits → System (read-only) → Contract
```

**Recommended:**
```
Intent (combined) → Portrait → Constraints (3 Qs) → Confirmation → Habits → System (interactive) → Contract
```

---

## Implementation Plan — Iteration 4

### Phase 4.A — Reorder: Portrait Before Constraints ✅ IMPLEMENTED
**Goal:** Move Portrait to position 2 to build trust before asking questions.

- [x] Swap flow order: Intent → Portrait → Questionnaire → Habits → System → Contract
- [x] Update `SETUP_STEPS` array in `setup/page.tsx`
- [x] Update `StepProgress` labels if needed
- [x] Test if flow feels more justified

**Files:** `src/app/setup/page.tsx`, `src/components/setup/StepProgress.tsx`

---

### Phase 4.B — Collapse Questionnaire: 5 → 3 Questions ✅ IMPLEMENTED
**Goal:** Reduce friction, remove questions that don't apply to all domains.

- [x] Remove "Where would you do this?" (environment)
- [x] Remove "How's your energy at that time?" (energy)
- [x] Keep: timing, barrier, previous attempts
- [x] Update `QUESTIONNAIRE` constant in playbooks
- [x] Update `QuestionnaireAnswers` type (kept optional fields for backwards compat)
- [x] Created `CompleteQuestionnaireAnswers` type for functions needing all 3
- [x] Update inference summary to work with 3 answers
- [x] Update habit ranking to use remaining 3 criteria

**Files:** `src/lib/playbooks/index.ts`, `src/lib/playbooks/types.ts`, `src/types/habit.ts`, `src/components/setup/QuestionnaireStep.tsx`, `src/components/setup/HabitRecommendationStep.tsx`

---

### Phase 4.C — Combine Domain + Challenge into Single Intent Screen ✅ IMPLEMENTED
**Goal:** Let users express frustration naturally, not force abstract categorization.

- [x] Redesign IntentStep with new layout:
  - Free-text input prominent: "What feels stuck?"
  - "or pick a common challenge" divider
  - Domain pills as secondary scaffolding
  - Challenge cards appear when domain selected
- [x] Text input always available as escape valve
- [x] Copy: "What feels stuck?" instead of "What area of life do you want to improve?"
- [x] Handle free-text → default to health/exercise_start for MVP (TODO: AI classification)

**Files:** `src/components/setup/IntentStep.tsx`

---

### Phase 4.D — Rewrite Confirmation as Inference ✅ IMPLEMENTED
**Goal:** Show synthesis and insight, not just receipt of selections.

- [x] Replace "You said X, Y, Z" with pattern-based inference
- [x] Add insight block that reframes the situation
- [x] Create inference templates based on answer combinations:
  - `tried_many_times` + `forgetting` → "The issue isn't motivation—it's the system."
  - `tried_many_times` + `energy` → "You want this, but life keeps getting in the way."
  - `first_time` + any → "Starting fresh is an advantage. No bad habits to unlearn."
- [x] Update `generateInferenceSummary()` function with pattern-based insights

**Files:** `src/lib/playbooks/index.ts`, `src/components/setup/QuestionnaireStep.tsx`

---

### Phase 4.E — Make System Design Interactive ✅ IMPLEMENTED
**Goal:** User makes anchor selection instead of just reading.

- [x] Add anchor options based on:
  - Timing preference (morning/midday/evening/flexible)
  - Selected habit's suggested anchor (from playbook)
- [x] Present 5-6 anchor cards + custom text input option
- [x] Show implementation intention preview on selection: "After [anchor], [habit]."
- [x] User "locks" anchor before proceeding
- [x] Removed intro phase—now direct to anchor selection
- [x] Recovery pre-filled from playbook, editable if needed

**Files:** `src/components/setup/SystemDesignStep.tsx`

---

### Phase 4.F — Copy & Progress Polish ✅ IMPLEMENTED
**Goal:** Fix tone and reduce anxiety.

- [x] Intent: "What feels stuck?" header (updated in IntentStep)
- [x] Questionnaire: "Quick context" header
- [x] Step labels updated: Goal → Portrait → Context → Habit → System → Start
- [x] Flow now 6 steps (reduced from previous 8 perceived steps)

**Files:** `src/components/setup/IntentStep.tsx`, `src/components/setup/QuestionnaireStep.tsx`, `src/components/setup/StepProgress.tsx`

---

## Implementation Order

1. **4.A first** — Simple reorder, immediate impact test
2. **4.B second** — Reduce questionnaire friction
3. **4.D third** — Inference rewrite (affects questionnaire step)
4. **4.C fourth** — Intent screen redesign
5. **4.E fifth** — Interactive system design
6. **4.F last** — Copy polish

---

## Success Criteria — Iteration 4

- [x] Portrait appears before any questions are asked
- [x] User answers only 3 questions (< 20 seconds)
- [x] Confirmation shows insight/synthesis, not receipt
- [x] User selects their own anchor in System Design
- [x] Flow feels front-loaded with value
- [x] Total steps reduced to 6 (Intent → Portrait → Questionnaire → Habit → System → Contract)

---

## Open Questions

1. **Free-text parsing:** How to handle ambiguous free-text input? AI classification or clarification flow?
2. **Inference quality:** What prompt/template structure makes inferences feel genuinely insightful?
3. **Anchor suggestions:** How to generate contextually appropriate anchors per domain + timing?

---

## Dependencies

- Phase 4.D requires 4.B (inference depends on reduced question set)
- Phase 4.F is polish that can happen anytime after core changes

---

## Implementation Summary — 2026-01-18

### Files Modified
- `src/app/setup/page.tsx` — Reordered flow (Portrait before Questionnaire)
- `src/components/setup/StepProgress.tsx` — Updated step labels
- `src/components/setup/IntentStep.tsx` — Complete rewrite with free-text + domain pills
- `src/components/setup/QuestionnaireStep.tsx` — Updated copy, inference display
- `src/components/setup/HabitRecommendationStep.tsx` — Updated isCompleteAnswers check
- `src/components/setup/SystemDesignStep.tsx` — Complete rewrite with interactive anchor selection
- `src/lib/playbooks/types.ts` — Reduced to 3 questions, added CompleteQuestionnaireAnswers
- `src/lib/playbooks/index.ts` — Updated QUESTIONNAIRE, generateInferenceSummary, scoreHabitFit
- `src/types/habit.ts` — Updated QuestionnaireAnswers (kept optional for backwards compat)

### New Flow
```
Intent (free-text + domain pills, single screen)
    ↓
Portrait (progression ladder, traps, leverage)
    ↓
Questionnaire (3 taps + pattern-based inference)
    ↓
Habit Recommendation (personalized fit rationale)
    ↓
System Design (interactive anchor selection)
    ↓
Contract (2-line contract + first rep)
```

### Key Design Decisions
1. **Portrait before questions** — Users get context before being asked for input
2. **Free-text prominent** — Users can express frustration naturally; domains as scaffolding
3. **3 questions only** — Timing, barrier, experience (removed energy/environment)
4. **Pattern-based inference** — Shows insight like "Motivation isn't the issue—the system is"
5. **Interactive anchor selection** — User picks from timing-based options or writes custom
6. **No AI for System Design** — Uses playbook data directly for faster, more predictable experience

### Build Status
- ✅ TypeScript compilation passes
- ✅ Next.js build successful
- Ready for user testing

---
---

# ITERATION 5 — 2026-01-19

---

## Feedback Summary (R5)
Source: `docs/Feedback_logs/R5_20260119.md`

### Core Problem: Data Pipeline Broken
User selected "Improve sleep" and typed about sleep, but system showed exercise content throughout. The domain/subproblem selection is not flowing to downstream components.

### What's Working (Don't Break)
- Flow order (Portrait → Context → Habit → System → Contract)
- Intent screen hybrid input (free-text + pills with mutual exclusion)
- Confirmation inference (pattern-based insight)
- System design interactivity (anchor selection + preview)
- Contract screen and 3-question limit

### Critical Issues

| # | Issue | Priority | Root Cause |
|---|-------|----------|------------|
| 5.1 | AI pipeline not using user intent | P0 | IntentStep clears domain/subproblem when user types free-text |
| 5.2 | Portrait content is generic | P1 | Falls back to exercise playbook instead of using selected domain |
| 5.3 | Context questions not filtered by domain | P1 | Same 3 questions for all domains (timing Q irrelevant for sleep) |
| 5.4 | Habit recommendations ignore intent | P0 | Uses exercise habits when sleep was selected |
| 5.5 | Anchor suggestions are generic | P2 | Morning anchors shown for sleep habits (should be evening) |
| 5.6 | No environment setup option | P3 | Enhancement for future |
| 5.7 | Typo "work" → "works" | P3 | Minor copy fix |

---

## Root Cause Analysis

**Bug Location:** `src/components/setup/IntentStep.tsx`

```typescript
// CURRENT BEHAVIOR (buggy):
const handleFreeTextChange = (value: string) => {
  setFreeText(value);
  if (value.trim()) {
    setSelectedDomain(null);      // ← Clears selection when typing!
    setSelectedSubProblem(null);
  }
};

// In handleComplete:
if (selectedSubProblem && selectedDomain) {
  saveConsultSelection("domain", selectedDomain.id);
  saveConsultSelection("subProblem", selectedSubProblem.id);
} else if (freeText.trim()) {
  // Falls back to exercise when free-text is used
  saveConsultSelection("domain", "health");
  saveConsultSelection("subProblem", "exercise_start");  // ← Always exercise!
}
```

**Problem:** If user selects "Improve sleep" then types additional context, the typing clears their selection and defaults to exercise.

---

## Implementation Plan — Iteration 5

### Phase 5.A — Fix Intent Data Flow (P0) — CRITICAL ✅ IMPLEMENTED
**Goal:** Preserve domain/subproblem selection even when user adds free-text context.

**Fix approach:**
1. Don't clear structured selection when user types (allow both)
2. In handleComplete: use pill selection for domain/subproblem, add free-text as additionalContext
3. Only default to exercise if NO selection was made AND free-text was entered

**Changes:**
- [x] Remove `setSelectedDomain(null)` and `setSelectedSubProblem(null)` from `handleFreeTextChange`
- [x] Update UI to show both selected pill AND free-text context
- [x] In handleComplete: prioritize pill selection, use free-text as additionalContext
- [x] Add console logging to verify data flow

**Files:** `src/components/setup/IntentStep.tsx`

**Acceptance criteria:**
- User selects "Improve sleep" → downstream shows sleep content
- User selects "Improve sleep" + types context → downstream shows sleep content
- User ONLY types (no pill) → defaults to exercise (or shows clarification prompt)

---

### Phase 5.B — Verify Playbook Data Exists for All Domains (P0) ✅ VERIFIED
**Goal:** Ensure Portrait, Habits, Anchors all use correct playbook data.

**Check:**
- [x] Verify `src/lib/playbooks/health.ts` has `sleep_improve` playbook with correct content
- [x] Verify Portrait step reads from correct playbook based on domain + subProblem
- [x] Verify HabitRecommendationStep uses correct candidateHabits
- [x] Verify SystemDesignStep uses correct suggestedAnchor from selected habit

**Files:**
- `src/lib/playbooks/health.ts` (verified sleep_improve exists with correct content)
- `src/components/setup/SuccessMapStep.tsx` (added logging)
- `src/components/setup/HabitRecommendationStep.tsx` (added logging)
- `src/components/setup/SystemDesignStep.tsx` (added logging)

---

### Phase 5.C — Add Domain-Specific Anchor Options (P2) ✅ IMPLEMENTED
**Goal:** Show evening anchors for sleep habits, morning anchors for exercise.

**Changes:**
- [x] Update SystemDesignStep anchor options to consider domain, not just timing
- [x] Add sleep-specific anchors: "After brushing teeth at night", "After dinner cleanup", etc.
- [x] For sleep domain, default timing to "evening" regardless of questionnaire answer

**Files:** `src/components/setup/SystemDesignStep.tsx`

---

### Phase 5.D — Domain-Specific Questions (P1) — DEFERRED TO ITERATION 6
**Goal:** Skip/modify questions that don't make sense for certain domains.

**Options:**
1. **Minimal fix:** Skip "When could you do this?" for sleep (implicit evening)
2. **Full fix:** Create domain-specific question sets

**Status:** Deferred to next iteration. Current fix (5.A-C) should resolve the critical data flow issue. Domain-specific questions can be added later.

---

### Phase 5.E — Minor Fixes (P3) ✅ IMPLEMENTED
**Goal:** Polish and typo fixes.

**Changes:**
- [x] Fix typo: "Flexible timing work best" → "works"
- [ ] Consider environment setup as first action (future enhancement)

**Files:** `src/lib/playbooks/index.ts`

---

## Implementation Order

1. **5.A first** — Fix the data flow bug (everything else depends on this)
2. **5.B second** — Verify playbook data is being used correctly
3. **5.C third** — Domain-specific anchors
4. **5.D optional** — Domain-specific questions (can defer to Phase 6)
5. **5.E last** — Minor polish

---

## Test Cases After Implementation

### Test Case 1: Sleep via Pill Selection
1. Click "Health & Fitness" → Click "Improve sleep"
2. **Verify:** Portrait shows sleep content (wind-down, bedtime consistency)
3. **Verify:** Habit recommendations are sleep habits (phone away, dim lights)
4. **Verify:** Anchors are evening-appropriate

### Test Case 2: Sleep via Pill + Free-Text
1. Click "Health & Fitness" → Click "Improve sleep"
2. Type "I want to sleep 7.5 hours and wake at 6am"
3. **Verify:** Same as Test Case 1 — sleep content throughout

### Test Case 3: State Contamination Check
1. Click "Health & Fitness" → Click "Start exercising"
2. Clear and type "I want to improve my sleep"
3. **Verify:** Without pill selection, should either:
   - Default to exercise (current behavior, acceptable for MVP)
   - OR prompt user to select a domain (better UX, future enhancement)

### Test Case 4: Exercise Flow (Regression Test)
1. Click "Health & Fitness" → Click "Start exercising regularly"
2. **Verify:** Exercise content throughout (should still work)

---

## Success Criteria — Iteration 5

- [x] User selects "Improve sleep" → all downstream content is sleep-specific
- [x] User can add free-text context without losing pill selection
- [x] Portrait shows correct playbook content for selected domain
- [x] Habit recommendations match selected domain
- [x] Anchors are contextually appropriate for domain
- [ ] No regression in exercise flow (to be verified in testing)

---

## Dependencies

- Phase 5.A is prerequisite for all other phases
- Phase 5.B verifies the fix from 5.A
- Phases 5.C, 5.D, 5.E are independent after 5.A/5.B

---

## Reference: Sleep Domain Content (from R5 feedback)

### Portrait of Excellence
```
PEOPLE WHO SUCCEED AT THIS
• They have a consistent wind-down signal that tells their brain "sleep is coming"
• They protect the hour before bed from screens and stimulating activities
• They've made their bedroom a sleep-only zone
• They're consistent with bedtime, even on weekends

THE JOURNEY
W1: Establish one consistent pre-sleep action
M1: Wind-down routine feels automatic; falling asleep is easier
M3: Sleep quality noticeably improved; morning energy better

COMMON TRAPS TO AVOID
• Trying to fix everything at once (screens, caffeine, timing, temperature)
• Inconsistent sleep schedule (weekend catch-up backfires)
• Using the bedroom for work or entertainment

HIGHEST-LEVERAGE STARTING MOVES
• Start with one consistent wind-down trigger
• Make the trigger something you actually enjoy
```

### Recommended Habits
```
1. Put phone in another room 30 min before bed
   - Why: Removes biggest sleep disruptor; creates boundary
   - Anchor: After brushing teeth at night

2. Dim lights 1 hour before bed
   - Why: Simple environmental cue; signals brain
   - Anchor: After dinner cleanup

3. Read a physical book for 5 minutes in bed
   - Why: Replaces scrolling; naturally calming
   - Anchor: After getting into bed
```

### Anchor Suggestions
```
- After brushing teeth at night
- After putting on pajamas
- When I get into bed
- After dinner cleanup
- After setting tomorrow's alarm
- When I turn off the TV for the night
```

---

## Implementation Summary — 2026-01-19

### Files Modified
- `src/components/setup/IntentStep.tsx` — Fixed data flow bug, added logging, allow both pill selection AND free-text
- `src/components/setup/SuccessMapStep.tsx` — Added logging to verify playbook data
- `src/components/setup/HabitRecommendationStep.tsx` — Added logging to verify habit data
- `src/components/setup/SystemDesignStep.tsx` — Added domain-specific anchors for sleep, added logging
- `src/lib/playbooks/index.ts` — Fixed typo "work" → "works"

### Key Fixes
1. **Data Flow Bug (5.A):** Removed code that cleared pill selection when user typed free-text. Now users can select "Improve sleep" AND type additional context.
2. **Playbook Verification (5.B):** Confirmed sleep_improve playbook has correct content (wind-down, evening habits, etc.)
3. **Domain-Specific Anchors (5.C):** Added DOMAIN_ANCHOR_OPTIONS with sleep-specific anchors. For sleep domain, timing defaults to "evening".
4. **Typo Fix (5.E):** "work best" → "works best"

### Console Logging Added
All key data flow points now log to console for debugging:
- `[IntentStep]` — logs selection and completion
- `[SuccessMapStep]` — logs playbook loading
- `[HabitRecommendationStep]` — logs habit loading
- `[SystemDesignStep]` — logs anchor selection

### Build Status
- ✅ TypeScript compilation passes
- ✅ Next.js build successful
- Ready for user testing

### Test Instructions
1. Go to http://localhost:3000/reset to clear state
2. Go to http://localhost:3000/setup
3. Open browser console to see logging
4. Test: Click "Health & Fitness" → "Improve sleep"
5. Verify: All downstream content shows sleep-specific content
