# Habit Stacker — Project Inventory

**Date:** 2026-02-01
**Version:** V0.5 (Post-R12 Fixes)
**Milestone:** M1 Alpha

---

## Executive Summary

Habit Stacker is a Habit Designer (not tracker) that uses conversational AI to co-design survivable habits, then supports daily execution with deterministic recovery from misses.

**Current State:** Core flow complete. V0.5 adds richer post-consultation experience with identity, progression, setup checklist, and improved check-in system.

---

## Part 1: PRD Requirements vs Implementation Status

### Product Laws

| Law | Status | Notes |
|-----|--------|-------|
| One active habit | ✅ Implemented | Single habit enforced |
| Miss is first-class | ✅ Implemented | Miss triggers recovery, never silent |
| No open loops | ⚠️ Partial | Entry intent exists; exit boundary (graduate) not implemented |
| No streak framing | ✅ Implemented | Uses "Reps / Last done" |
| One clear next step | ✅ Implemented | Single dominant CTA per screen |
| Conversation earns recommendation | ✅ Implemented | Agent demonstrates understanding before recommending |
| Progressive disclosure | ⚠️ Partial | Tune-up gated; some features still surfaced early |

---

### Key Flows

#### 1. Conversational Intake

| Requirement | Status | Notes |
|-------------|--------|-------|
| Open question start | ✅ Implemented | "What's something you've been meaning to work on?" |
| Contextual follow-ups | ✅ Implemented | Agent asks relevant questions based on user input |
| Reflection before recommendation | ✅ Implemented | Agent confirms understanding |
| Insight sharing | ✅ Implemented | Domain knowledge woven in |
| Short, scannable messages | ✅ Implemented | Mobile-optimized message length |
| Habit type detection | ✅ Implemented (R12) | time_anchored / event_anchored / reactive |

#### 2. System Confirmation (Post-Recommendation)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Multi-screen reveal flow | ✅ Implemented (R11) | Identity → Ritual → Setup → Ready |
| Hero statement | ✅ Implemented | "When I [anchor], I [action]." |
| Why this fits you | ✅ Implemented | Collapsible section |
| Week-1 contract visible | ✅ Implemented | "Week 1: Show up" |
| Start first rep CTA | ✅ Implemented | Timing-aware button |
| Felt understood rating | ⚠️ Moved | Now captured after setup, may need repositioning |

#### 3. Runtime Loop

| Requirement | Status | Notes |
|-------------|--------|-------|
| Today/Home screen | ✅ Implemented | PlanScreen with stats, CTA, tabs |
| Done action | ✅ Implemented | Routes through CheckInFlow |
| Missed action | ✅ Implemented | Captures reason, offers recovery |
| Recovery flow | ✅ Implemented | Logs recovery completion |
| 7-day dots | ✅ Implemented | SevenDayDots component on PlanScreen |
| Photo evidence | ✅ Implemented | Camera/library capture, stored in IndexedDB |

#### 4. Progressive Depth

| Requirement | Status | Notes |
|-------------|--------|-------|
| Tune-up after first rep | ✅ Implemented | Haiku conversation extracts toolkit |
| Toolkit (tiny version, env prime, friction) | ✅ Implemented | Stored in HabitSystem |
| Your System screen | ✅ Implemented | Shows ritual, toolkit, recovery, why it works |
| Edit capabilities | ✅ Implemented | Bottom sheets for each field |

#### 5. Weekly Reflection

| Requirement | Status | Notes |
|-------------|--------|-------|
| Weekly check-in | ❌ Not Implemented | Placeholder in PRD |
| Two-question format | ❌ Not Implemented | — |
| System adjustment recommendation | ❌ Not Implemented | — |

---

### AI Roles (from PRD)

| Role | Status | Implementation |
|------|--------|----------------|
| Designer | ✅ Implemented | Intake agent (Sonnet) |
| Setup Guide | ✅ Implemented | SetupChecklist component |
| Tracker | ✅ Implemented | logCheckIn() + checkIns array |
| Pattern Finder | ❌ Not Implemented | Requires 7+ reps data |
| Recovery Coach | ✅ Implemented | RecoveryOffer component |
| Reflection Partner | ❌ Not Implemented | Weekly reflection not built |
| Progression Planner | ✅ Implemented | ProgressionSection component |
| Identity Narrator | ✅ Implemented | IdentitySection component |

---

### Navigation Architecture (PRD Tab Structure)

| Section | Status | Notes |
|---------|--------|-------|
| **Your System** | ✅ Implemented | /system page + System tab |
| — The Ritual | ✅ Implemented | Visual flow with edit |
| — The Toolkit | ✅ Implemented | From tune-up |
| — Setup Checklist | ✅ Implemented | Interactive with persistence |
| — When I Miss | ✅ Implemented | Recovery action |
| — Why This Works | ✅ Implemented | Collapsible |
| **Your Journey** | ⚠️ Partial | Tab exists |
| — Timeline (7-day dots) | ✅ Implemented | On PlanScreen |
| — Patterns | ❌ Not Implemented | Needs 7+ reps |
| — Photo Log | ❌ Not Implemented | Photos stored but no gallery |
| **Your Self** | ✅ Implemented | Tab with sections |
| — Identity | ✅ Implemented | Generated during intake |
| — Progression | ✅ Implemented | Static 4-week arc |
| — Reflection | ❌ Not Implemented | — |

---

### Progressive Disclosure (PRD Rules)

| Section | Available | Surfaced | Status |
|---------|-----------|----------|--------|
| The Ritual | After design | Always | ✅ Correct |
| Setup Checklist | After design | Before first rep | ✅ Correct |
| The Toolkit | After tune-up | After tune-up | ✅ Correct |
| Timeline (7-day dots) | After 1 rep | After 3 reps | ⚠️ Shows immediately |
| Patterns | After 7 reps | After pattern detected | ❌ Not built |
| Identity | After design | After first rep | ⚠️ Shows immediately |
| Progression | After design | After Week 1 | ⚠️ Shows immediately |
| Reflection | Always | At weekly boundary | ❌ Not built |
| Photo Log | After 1 photo | After 3 photos | ❌ Not built |
| Why This Works | Always | Never (user-initiated) | ✅ Correct |

---

### Data Model (PRD vs Actual)

| Field | PRD Spec | Implemented | Notes |
|-------|----------|-------------|-------|
| HabitSystem.anchor | ✅ | ✅ | — |
| HabitSystem.action | ✅ | ✅ | — |
| HabitSystem.then | ✅ | ✅ | Normalized to array |
| HabitSystem.recovery | ✅ | ✅ | — |
| HabitSystem.whyItFits | ✅ | ✅ | — |
| HabitSystem.identity | ✅ | ✅ | V0.5 |
| HabitSystem.identityBehaviors | ✅ | ✅ | V0.5 |
| HabitSystem.setupChecklist | ✅ | ✅ | V0.5 |
| HabitSystem.habitType | ✅ | ✅ | R12 |
| HabitSystem.principle | ✅ | ✅ | R12 |
| HabitSystem.expectations | ✅ | ✅ | R12 |
| HabitSystem.tinyVersion | ✅ | ✅ | From tune-up |
| HabitSystem.environmentPrime | ✅ | ✅ | From tune-up |
| HabitSystem.frictionReduced | ✅ | ✅ | From tune-up |
| ProgressionStage interface | ✅ | ⚠️ Hardcoded | Static templates, not dynamic |
| SetupItem interface | ✅ | ✅ | — |
| CheckIn interface | ✅ | ✅ | R12 |

---

## Part 2: Current Architecture

### Route Structure

```
/                  → PlanScreen (home) or WelcomeScreen (new user)
/setup             → Chat intake + OnboardingFlow
/today             → CheckInFlow (mark rep)
/recovery          → Recovery action page
/tuneup            → Haiku tune-up conversation
/system            → Full system view with edit
/reset             → Dev reset page
```

### State-Based Routing (Home Page)

```typescript
type UserState =
  | 'new_user'           // → WelcomeScreen
  | 'mid_conversation'   // → Redirect to /setup
  | 'system_designed'    // → PlanScreen with "Ready to start"
  | 'active_today'       // → PlanScreen
  | 'completed_today'    // → PlanScreen (already done)
  | 'missed_yesterday'   // → Redirect to /recovery
  | 'needs_tuneup'       // → PlanScreen with tune-up card
```

### Data Flow

```
Intake Agent (Sonnet)
    │
    ├── Generates: HabitRecommendation
    │   ├── anchor, action, followUp, recovery, whyItFits
    │   ├── identity, identityBehaviors
    │   ├── setupChecklist
    │   ├── habitType, anchorTime/checkInTime
    │   └── principle, expectations
    │
    ▼
OnboardingFlow
    │
    ├── Identity Reveal → Ritual Reveal → Setup → Ready
    │
    ▼
HabitData (localStorage)
    │
    ├── system: HabitSystem
    ├── checkIns: CheckIn[]
    ├── repLogs: RepLog[] (deprecated)
    └── state, repsCount, lastDoneDate, etc.
    │
    ▼
PlanScreen / CheckInFlow
    │
    └── logCheckIn() → updates checkIns array
```

### Check-In Flow (R12 Architecture)

```
All Habits → CheckInFlow
    │
    ├── Reactive habits:
    │   └── CheckInOptions → "Slept through" / "Used protocol" / "Stayed in bed"
    │
    └── Time/Event habits:
        └── CheckInOptionsTimeEvent → "Done" / "Can't today"
    │
    ▼
On completion:
    ├── → CheckInSuccess (whisper + difficulty rating)
    │
On miss:
    ├── → CheckInMiss (capture reason)
    └── → RecoveryOffer (accept/decline)
```

---

## Part 3: Backlog (Unimplemented Ideas from Feedback)

### Critical / High Priority

| ID | Source | Description | Effort |
|----|--------|-------------|--------|
| B1 | R10 | **Patterns section** — AI-generated insights after 7+ reps | Large |
| B2 | R9 | **Weekly reflection cycles** — Periodic "is this still right?" prompts | Medium |
| B3 | R10 | **Photo journal view** — Gallery of evidence photos | Medium |
| B4 | R10 | **Progressive disclosure enforcement** — Hide identity/progression until earned | Small |

### UX Improvements

| ID | Source | Description | Effort |
|----|--------|-------------|--------|
| B5 | R10 | **Tab styling** — Better visual distinction for selected tab | Small |
| B6 | R10 | **7-day dots today indicator** — More visible current day marker | Small |
| B7 | R10 | **Frequency support** — Handle weekly habits differently | Medium |
| B8 | R11 | **Responsive desktop frame** — Centered mobile frame on desktop | Small |
| B9 | R11 | **Ritual flow visualization** — Visual anchor → action → then | Medium |

### Onboarding & Confirmation

| ID | Source | Description | Effort |
|----|--------|-------------|--------|
| B10 | R11 | **Felt understood rating repositioning** — Move to post-first-rep | Small |
| B11 | R10 | **Confirmation screen CTA visibility** — Ensure CTA not below fold | Small |

### Data & Analytics

| ID | Source | Description | Effort |
|----|--------|-------------|--------|
| B12 | R8 | **Thesis validation analysis** — Correlate "felt understood" with completion rates | Medium |
| B13 | Progress Summary | **Error boundaries** — Better error handling | Medium |
| B14 | Progress Summary | **Loading skeletons** — Improved loading states | Small |
| B15 | Progress Summary | **Accessibility audit** — Full ARIA compliance | Medium |

### Technical Debt

| ID | Source | Description | Effort |
|----|--------|-------------|--------|
| B16 | Progress Summary | **Test coverage** — Add unit/integration tests | Large |
| B17 | Progress Summary | **Legacy wizard cleanup** — Remove old wizard components | Small |
| B18 | R12 | **repLogs migration** — Fully deprecate in favor of checkIns | Small |

### Future Features (M2/M3)

| ID | Source | Description | Effort |
|----|--------|-------------|--------|
| B19 | PRD | **Notifications/reminders** — Push notifications for anchors | Large |
| B20 | PRD | **Offline support** — Service worker/PWA | Large |
| B21 | PRD | **Multiple habit drafts** — Explore before committing | Medium |
| B22 | PRD | **Habit stacking** — Add second habit after Week 4 | Medium |
| B23 | R10 | **Self section depth** — Milestones toward identity | Medium |
| B24 | R10 | **Progression branching** — Locked "What's next" options | Medium |

---

## Part 4: PRD Items Not Currently Reflected

### M1 Scope Gaps

1. **Patterns Section** (PRD: After 7+ reps)
   - AI-generated insights: "You're strongest on weekdays"
   - Suggests ONE action if pattern concerning
   - Updates weekly, not daily

2. **Weekly Reflection** (PRD: Key Flow #4)
   - Two questions: "Did this reduce load?" / "What broke?"
   - System recommends exactly one adjustment
   - Plan snapshot regenerated

3. **Photo Log Gallery** (PRD: Your Journey)
   - Evidence gallery view
   - Surfaced after 3 photos

4. **Progressive Disclosure Enforcement**
   - Identity should surface after first rep (currently immediate)
   - Progression should surface after Week 1 (currently immediate)
   - 7-day dots should surface after 3 reps (currently immediate)

5. **Review/Graduate States** (PRD: State machine)
   - State placeholders exist but flow not implemented
   - Graduate flow for completed habits

### Data Model Gaps

1. **ProgressionStage Interface**
   - PRD specifies: `{ id, name, description, successCriteria, unlockAfter }`
   - Current: Hardcoded static array in ProgressionSection
   - Not stored in HabitSystem as PRD suggests

2. **currentStage Field**
   - PRD: `HabitSystem.currentStage?: string`
   - Current: Calculated dynamically, not persisted

### Success Metrics Not Tracked

| Metric | Status |
|--------|--------|
| Conversation feel natural | ❌ No measurement |
| Relevant follow-ups | ❌ No measurement |
| Reflection accuracy | ❌ No measurement |
| "Made for me" feeling | ⚠️ feltUnderstoodRating collected |
| % completing conversation | ❌ No funnel tracking |
| % first rep | ❌ No funnel tracking |
| Time to first rep | ❌ No measurement |
| D1/D7 return rate | ❌ No measurement |
| Recovery success rate | ⚠️ Data exists but not surfaced |

---

## Part 5: Implementation Verification Checklist

### Fresh Start Flow

- [x] Start new consultation
- [x] AI generates habitType based on conversation
- [x] AI generates identity, identityBehaviors, setupChecklist
- [x] Multi-screen onboarding: Identity → Ritual → Setup → Ready
- [x] Land on home with 7-day dots, tabs

### Daily Use (Time/Event Habit)

- [x] PlanScreen shows "Mark today's rep" CTA
- [x] Tap CTA → CheckInOptionsTimeEvent → "Did you do it?"
- [x] "Done" → CheckInSuccess with whisper + difficulty rating
- [x] "Can't today" → CheckInMiss → reason capture → RecoveryOffer
- [x] Check-in data saved to checkIns array

### Daily Use (Reactive Habit)

- [x] PlanScreen shows "How was last night?" CTA
- [x] Tap CTA → CheckInOptions → 3 options
- [x] "Slept through" → success (triggerOccurred: false)
- [x] "Used protocol" → success with outcome question
- [x] "Stayed in bed" → miss flow

### Setup Checklist

- [x] Items displayed during onboarding
- [x] Interactive on PlanScreen (System tab)
- [x] Check items → persists on refresh
- [x] Mark N/A → strikethrough, excluded from count
- [x] Progress counter accurate

### Progression Section

- [x] Shows 4-week arc
- [x] Week 1 highlighted (accent bg)
- [x] Future weeks dimmed

---

## Part 6: Files Reference

### Core Pages

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Home routing logic |
| `src/app/setup/page.tsx` | Chat intake + onboarding |
| `src/app/today/page.tsx` | CheckInFlow wrapper |
| `src/app/recovery/page.tsx` | Recovery action |
| `src/app/system/page.tsx` | Full system view |
| `src/app/tuneup/page.tsx` | Haiku tune-up |

### Key Components

| File | Purpose |
|------|---------|
| `src/components/runtime/PlanScreen.tsx` | Main home screen |
| `src/components/checkin/CheckInFlow.tsx` | Check-in orchestrator |
| `src/components/onboarding/OnboardingFlow.tsx` | Post-confirmation reveal |
| `src/components/self/IdentitySection.tsx` | Identity display |
| `src/components/self/ProgressionSection.tsx` | Week arc display |
| `src/components/system/SetupChecklist.tsx` | Interactive checklist |
| `src/components/journey/SevenDayDots.tsx` | Visual history |

### AI & Store

| File | Purpose |
|------|---------|
| `src/lib/ai/prompts/intakeAgent.ts` | Sonnet intake prompt |
| `src/lib/ai/prompts/tuneUpAgent.ts` | Haiku tune-up prompt |
| `src/lib/store/habitStore.ts` | HabitData persistence |
| `src/lib/education/whispers.ts` | Contextual education content |

### Types

| File | Purpose |
|------|---------|
| `src/types/habit.ts` | HabitData, HabitSystem, CheckIn, etc. |
| `src/types/conversation.ts` | IntakeState, Message types |

---

## Summary

**Implemented:** Core intake → onboarding → runtime loop with V0.5 enhancements (identity, progression, setup checklist, improved check-in system).

**Major Gaps:**
1. Patterns section (needs 7+ reps)
2. Weekly reflection cycles
3. Photo journal view
4. Progressive disclosure timing enforcement
5. Review/Graduate states
6. Funnel metrics tracking

**Ready For:**
- Solo alpha testing
- First-week completion data collection
- Thesis validation (felt understood → completion correlation)

**Not Ready For:**
- Production (needs error handling, tests)
- Scale (localStorage only)
- Long-term use (no notifications, no multi-habit)
