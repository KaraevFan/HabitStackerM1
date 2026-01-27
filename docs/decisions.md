# Decisions Log

This document tracks key architectural and design decisions made during development.

---

## 2026-01-17 — Iteration 3: Questionnaire + Playbooks Architecture

### Decision: Add micro-questionnaire step between Intent and Portrait

**Context:** Feedback indicated the onboarding felt like "form-filling" not an "expert consult". Users didn't feel understood before receiving recommendations.

**Decision:** Insert a tap-based questionnaire step that:
1. Asks 5 quick questions (timing, energy, environment, barrier, experience)
2. Reflects inference back to user for confirmation
3. Uses answers to personalize habit recommendations

**Rationale:**
- Establishes "being understood" before prescribing
- < 60 seconds of input keeps friction low
- Enables earned recommendations with visible logic

---

### Decision: Create Domain Playbooks data structure

**Context:** Content was scattered across components with inconsistent quality. Needed curated, opinionated scaffolds the system could reason over.

**Decision:** Create `DomainPlaybook` interface with:
- Portrait of Excellence (what successful people do)
- Progression Ladder (Week 1 → Month 1 → Month 3)
- Common Traps (failure modes to avoid)
- Leverage Points (highest-impact starting moves)
- Candidate Habits (with fit criteria for personalization)

**Rationale:**
- Curated content over AI-generated for quality control
- Enables consistent authority across all domains
- Supports habit ranking based on questionnaire answers

---

### Decision: Enhance ConsultSelections to store questionnaire answers

**Context:** Needed to persist questionnaire answers and make them available for habit ranking.

**Change:** Added `QuestionnaireAnswers` type and `questionnaire` field to `ConsultSelections`:
```typescript
export interface QuestionnaireAnswers {
  timing?: TimingPreference;
  energy?: EnergyLevel;
  environment?: Environment;
  barrier?: PrimaryBarrier;
  experience?: ExperienceLevel;
}
```

**Rationale:** Keeps all consult data in one place; enables re-ranking if user goes back and edits answers.

---

### Decision: Update saveConsultSelection to use generics

**Context:** Original function signature only accepted `string | string[]`, but we needed to store `QuestionnaireAnswers` object.

**Change:** Updated to use TypeScript generics:
```typescript
export function saveConsultSelection<K extends keyof HabitData["consultSelections"]>(
  step: K,
  value: HabitData["consultSelections"][K]
): HabitData
```

**Rationale:** Type-safe while supporting any ConsultSelections field type.

---

## Updated Flow (Iteration 3)

```
Intent (domain → sub-problem)
    ↓
Questionnaire (5 taps + inference confirmation)
    ↓
Portrait of Excellence (progression ladder, traps, leverage)
    ↓
Habit Recommendation (earned justification from questionnaire)
    ↓
System Design
    ↓
Contract
```

---

## 2026-01-27 — V0.5: Richer Post-Consultation Experience

### Decision: Add identity and setup checklist to habit system

**Context:** R9 feedback indicated the daily experience feels thin after consultation. Users risk forgetting "why I'm doing this" by Week 2.

**Decision:** Extend `HabitSystem` with:
- `identity?: string` — Who the user is becoming (e.g., "Someone who protects their sleep")
- `identityBehaviors?: string[]` — 3-5 observable behaviors of people with this identity
- `setupChecklist?: SetupItem[]` — 4-7 environment prep tasks (categorized as environment/mental/tech)

**Rationale:**
- Surfaces more of what users shared during intake
- Identity connects habit to larger transformation
- Setup checklist reduces friction before first rep

---

### Decision: Add SetupItem interface for interactive checklist

**Context:** Setup checklist needs to track completion and N/A states.

**Change:** Added new interface:
```typescript
interface SetupItem {
  id: string;
  category: 'environment' | 'mental' | 'tech';
  text: string;
  completed: boolean;
  notApplicable: boolean;
}
```

**Rationale:** Supports interactive toggling on PlanScreen and read-only preview on ConfirmationScreen.

---

### Decision: Tab navigation with inline expansion on PlanScreen

**Context:** Needed to organize richer content without full-page navigation.

**Decision:** Add System/Journey/Self tabs that expand content inline below tabs:
- **System tab:** Ritual summary, setup checklist
- **Journey tab:** 7-day dots, stats
- **Self tab:** Identity section, progression arc

**Rationale:**
- Keeps home screen as the hub
- Reduces navigation friction
- Progressive disclosure — content visible when user wants it

---

### Decision: SevenDayDots as rolling 7-day visual history

**Context:** Need visual feedback without streak framing.

**Decision:** Show 7 dots for last 7 days:
- `●` (filled) = completed rep
- `○` (outlined) = missed
- `·` (small dot) = no data/future
- Today highlighted with ring

**Rationale:**
- Creates anticipation for new users (first rep turns today's dot green)
- No streak language, just visual record
- Shows rolling history, not cumulative count

---

### Decision: Static 4-week progression arc

**Context:** Users need sense of journey without AI-generated content.

**Decision:** Hardcoded progression stages:
1. Week 1: Show Up (unlocks at 0 reps)
2. Week 2: Protect the Routine (unlocks at 7 reps)
3. Week 3: Add the Reward (unlocks at 14 reps)
4. Week 4: Reflect & Adjust (unlocks at 21 reps)

**Rationale:**
- Predictable, not personalized (reduces AI load)
- Gives users mental model for habit building phases
- Visual indicator of current stage with future stages dimmed

---

### Decision: Graceful fallbacks for migration

**Context:** Existing V0.4 users won't have new fields.

**Decision:** Components check for data availability:
- Hide sections if identity/setupChecklist is undefined
- 7-day dots work with existing repLogs
- No forced re-setup required

**Rationale:** Existing users aren't blocked; can re-run intake for new features if desired.

---

### Decision: Separate one-time setup from recurring ritual (R10 feedback)

**Context:** setupChecklist was mixing one-time tasks ("Download Meetup app") with recurring actions ("Add event to calendar after RSVPing").

**Decision:**
- `setupChecklist` = ONE-TIME tasks done before first rep only
- `followUp` / `then` = Recurring steps done AFTER each rep
- Changed `then` field from `string` to `string[]` to support multiple follow-up steps

**Changes:**
- `HabitSystem.then` now `string[]` (was `string`)
- `HabitRecommendation.followUp` now `string[]` (was `string`)
- Added `normalizeThenSteps()` migration helper for legacy string → array conversion
- Updated AI prompt with clear distinction:
  - ✓ setupChecklist: "Set up charging station" (one-time)
  - ✗ setupChecklist: "Add event to calendar" → put in followUp (recurring)
- Display: Single step inline, multiple steps as bullets or "A → B → C"

**Rationale:**
- Clearer mental model for users
- setupChecklist is for pre-launch prep, not ongoing ritual
- followUp completes the ritual loop and happens every time
