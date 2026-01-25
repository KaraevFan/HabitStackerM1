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
