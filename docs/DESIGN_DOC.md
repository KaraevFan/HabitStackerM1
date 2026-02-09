# Habit Stacker: Design Document

> Generated Feb 9, 2026 — snapshot of the project at commit `350f38b` (R18)

---

## Table of Contents

1. [What This Project Is](#1-what-this-project-is)
2. [Architecture Overview](#2-architecture-overview)
3. [Feature Inventory vs. PRD Requirements](#3-feature-inventory-vs-prd-requirements)
4. [How the System Works (End to End)](#4-how-the-system-works-end-to-end)
5. [Lessons Learned Building with Claude](#5-lessons-learned-building-with-claude)
6. [Assessment: Should You Push Further?](#6-assessment-should-you-push-further)
7. [What's Remaining and Next Steps](#7-whats-remaining-and-next-steps)

---

## 1. What This Project Is

Habit Stacker is a **habit designer** (not tracker) that uses conversational AI to help people build survivable habits. The core thesis: a short AI conversation that probes, reflects, and synthesizes creates *felt understanding* — and that understanding translates to better habit recommendations and higher follow-through.

**Product Laws (non-negotiable):**

| # | Law | Implementation Status |
|---|-----|----------------------|
| 1 | One active habit at a time | Enforced in data model |
| 2 | Miss is first-class (triggers recovery, not punishment) | Built. Recovery coach conversation after miss |
| 3 | No streak framing — use "Reps / Last done" | Enforced. Forbidden words list in prompts |
| 4 | One clear next step per screen | Mostly followed. Some screens have competing CTAs |
| 5 | Chat feels like texting — short messages | Enforced via prompt: "1-3 sentences max" |

**Forbidden words (enforced in AI prompts):** streak, failure, discipline, lazy, shame

**Tech Stack:**
- Next.js 16.1.1 / React 19 / TypeScript 5
- Tailwind CSS 4 with CSS custom properties
- LocalStorage + IndexedDB (photos) — no backend database
- Claude Sonnet (intake, reflections) + Haiku (daily check-ins, tune-ups)
- SSE streaming for all AI conversations
- Vitest for testing

**Scale of build:** 11 commits, 61 components, 7 API routes, 8 AI prompt files, ~15,000 lines of application code.

---

## 2. Architecture Overview

### 2.1 High-Level Flow

```
Landing → Chat Intake (Sonnet) → Onboarding Reveal → Daily Runtime Loop
                                                        ├── Check-in (done/miss/no-trigger)
                                                        ├── Reflection conversation (Haiku)
                                                        ├── Recovery coach (Haiku)
                                                        ├── Weekly reflection (Sonnet)
                                                        └── Pattern analysis (Sonnet)
```

### 2.2 Pages / Routes

| Route | Purpose | Key Component |
|-------|---------|---------------|
| `/` | Home — routes based on user state | `WelcomeScreen` or `PlanScreen` |
| `/setup` | Chat intake + onboarding flow | `ChatContainer` → `OnboardingFlow` |
| `/today` | Daily check-in | `CheckInFlow` |
| `/tuneup` | Post-first-rep toolkit extraction | Haiku conversation |
| `/system` | Your System detail screen | Ritual, toolkit, recovery display |
| `/reflect` | Weekly reflection conversation | `WeeklyReflectionConversation` |
| `/recovery` | Recovery flow after miss | Recovery coach conversation |
| `/reset` | Data reset | Confirmation + `resetHabitData()` |

### 2.3 State Management

**No Redux/Zustand.** State lives in LocalStorage with a simple read-modify-write pattern:

```
localStorage("habit-stacker-data")     → HabitData (habit, check-ins, reflections, patterns)
localStorage("habit-stacker-conversation") → IntakeState (chat messages, phase, recommendation)
IndexedDB("habit-stacker-photos")      → Photo evidence blobs
```

Key functions in `src/lib/store/habitStore.ts`:
- `loadHabitData()` / `saveHabitData()` / `updateHabitData()` — CRUD
- `logCheckIn()` — atomic read-modify-write (prevents race conditions)
- `saveReflection()` — weekly reflection persistence
- `graduateHabit()` / `pauseHabit()` — lifecycle transitions

User state routing is handled by `getUserState(habitData)` in `src/hooks/useUserState.ts`, which returns one of: `new_user | mid_conversation | system_designed | active_today | completed_today | missed_yesterday | needs_tuneup`.

### 2.4 AI Integration

**7 API routes,** all streaming via SSE:

| Route | Model | Purpose |
|-------|-------|---------|
| `/api/intake/stream` | Sonnet | Conversational habit design (7-12 turns) |
| `/api/tuneup` | Haiku | Toolkit extraction after first rep |
| `/api/recovery/stream` | Haiku | Recovery coach after miss |
| `/api/reflection/stream` | Haiku | Daily post-check-in reflection |
| `/api/weekly-reflection` | Sonnet | Weekly sustainability check |
| `/api/patterns` | Sonnet | AI-generated pattern analysis |
| `/api/coach-notes` | Sonnet | Personalized reference document |

The intake agent prompt (`src/lib/ai/prompts/intakeAgent.ts`, ~250 lines) is the most complex. It defines:
- A 5-phase conversation arc: Discovery → Reflection → Recommendation → Refinement → Ready
- Structured JSON output: `HabitRecommendation` object with 12+ fields
- Habit type detection (time_anchored / event_anchored / reactive)
- Identity, setup checklist, and rationale generation
- Suggested response pills for each turn

**Dual provider support:** Both Anthropic and OpenAI APIs are supported, switchable via `AI_PROVIDER` env var. Default is Anthropic/Sonnet.

### 2.5 Design System

"Warm Minimalism" — think Hobonichi meets Linear.

| Token | Value | Rule |
|-------|-------|------|
| Background | `#FDFBF7` (warm cream) | Never pure white |
| Text | `#1A1816` (warm near-black) | Never pure black |
| Accent | `#2D6A5D` (deep teal) | Use sparingly |
| Heading font | Fraunces | Warm serif |
| Body font | Outfit | Clean sans |
| Data font | JetBrains Mono | For metrics |

Design tokens are CSS custom properties in `globals.css`, referenced everywhere as `var(--bg-primary)`, etc. Dark mode is opt-in via `.dark` class (not automatic). Mobile-first with a 480px app frame centered on desktop.

### 2.6 Core Data Model

```typescript
// Simplified — see src/types/habit.ts (792 lines) for full definitions

HabitData {
  state: "install" | "designed" | "active" | "missed" | "maintained" | "paused" | "archived"
  system: HabitSystem          // The designed habit (anchor, action, identity, toolkit, etc.)
  checkIns: CheckIn[]          // Daily logs with difficulty, conversation, reflection
  reflections: WeeklyReflection[]  // Weekly sustainability checks
  patternHistory: PatternSnapshot[]  // Cached AI insights
  snapshot: { line1, line2 }   // The 2-line contract
  repsCount: number            // Total completed reps
  // ... 30+ fields total
}

HabitSystem {
  anchor, action, ritualStatement  // Core habit design
  habitType: "time_anchored" | "event_anchored" | "reactive"
  identity, identityBehaviors      // Who you're becoming
  setupChecklist: SetupItem[]      // One-time environment prep
  tinyVersion, environmentPrime    // Toolkit (from tune-up)
  recovery: string                 // What to do after a miss
  rationale: { principle, whyItFitsYou, whatToExpect }
  coachNotes: CoachNotes           // AI-generated reference doc
}

CheckIn {
  date, triggerOccurred, actionTaken, difficultyRating
  conversation: { messages[], skipped, duration }
  reflection: { summary, sentiment, frictionNote }
  missReason?, recoveryAccepted?, recoveryCompleted?
}
```

---

## 3. Feature Inventory vs. PRD Requirements

### 3.1 M0 Prototype Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| Setup Wizard → Snapshot | Built (exceeded) | Replaced wizard with conversational AI intake |
| Runtime Loop (Done/Miss/Recovery) | Built | Full check-in flow with type-specific options |
| AI schema validation | Built | Structured JSON output with fallback handling |
| End-to-end in <3 min | Met | Chat intake averages 7-12 turns |
| Miss → Recovery forced next open | Built | State machine enforces `missed → recovery` |
| Snapshot exactly 2 lines + CTA | Built | `line1: "Week 1: Show up."`, `line2: ritualStatement` |

**M0 Verdict: Complete.** All acceptance criteria met.

### 3.2 M1 Alpha Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| Solo 7-day use | Partially testable | All daily flows exist; needs real 7-day run |
| Reminders | Data model only | `reminderTime` and `reminderLabel` captured but no push notifications |
| Re-entry after 7+ day inactivity | Built | `needsReentry()` check, calm welcome-back flow |
| Unlock one knob after 3 reps | Built | Tune-up conversation extracts toolkit |
| Plan tab artifact (snapshot visible) | Built | PlanScreen with System/Journey/Self tabs |
| Reset data | Built | `/reset` page with confirmation |
| Feedback link | Not built | No in-app feedback mechanism |

**M1 Additional work completed (ahead of PRD):**

| Feature | Status | PRD Milestone |
|---------|--------|---------------|
| Identity framing | Built | M2 (pulled forward) |
| Setup checklist (interactive) | Built | Not in original PRD |
| 4-state calendar (done/recovered/skipped/missed) | Built | M2 |
| Recovery coach conversation | Built | M2 |
| Daily reflection conversation | Built | M2 |
| Pattern analysis (rule-based + AI) | Built | M2 |
| Weekly reflection | Built (R18) | M2 |
| Coach's Notes | Built (R18) | M3 |
| Stage transitions (7/14/21 day) | Built (R18) | M2 |
| Graduation detection | Built (R18) | M3 |
| System mutation from reflections | Built (R18) | M2 |

**M1 Verdict: Substantially complete, with significant M2/M3 work pulled forward.** The main gaps are: no real push notifications (only data model), no in-app feedback capture, and no real 7-day validation run.

### 3.3 M2 Beta Requirements (for reference)

| Requirement | Current Status |
|-------------|----------------|
| Onboarding clarity for 3-5 users | Partially built (multi-screen reveal exists) |
| Weekly reflection (light, real) | Built (R18) — conversational, not form-based |
| Progression gate after 7 reps | Built — stage transitions at day 7/14/21 |
| Feedback + bug capture | Not built |
| Error handling / retry / fallback | Built — streaming fallbacks, JSON recovery |
| 60% complete 4+ reps week 1 | Untested — no user data |
| Recovery completion >50% | Untested |
| Weekly review >40% at boundary | Untested |

**M2 Verdict: Architecture is largely ready.** The blockers are real user testing and the feedback capture mechanism, not missing features.

---

## 4. How the System Works (End to End)

### 4.1 New User Journey

**Step 1: Landing (`/`)**
`getUserState()` returns `new_user` → renders `WelcomeScreen` with a single CTA: "Design your first habit."

**Step 2: Chat Intake (`/setup`)**
The `useIntakeAgent()` hook manages a conversation with Claude Sonnet. The agent follows a scripted arc:

1. **Discovery** (2-4 turns) — "What's something you've been meaning to work on?" → follow-up questions about context, timing, barriers
2. **Reflection** (1-2 turns) — Agent reflects back its understanding: "So the real blocker is X, not Y. Sound right?"
3. **Recommendation** (1 turn) — Short chat message + structured `HabitRecommendation` JSON object
4. **Refinement** (0-2 turns) — Optional back-and-forth if user wants tweaks
5. **Ready to Start** — Auto-transition to onboarding

The chat UI includes:
- Streaming message display (SSE)
- Suggested response pills (tappable)
- Escape hatch button (force recommendation after 8+ turns)
- Debug panel (development only)

**Step 3: Onboarding Reveal (`OnboardingFlow`)**
A multi-screen animated reveal:
1. **Identity** — "You're becoming someone who [identity]" + behavior list
2. **Ritual** — "When [anchor], I [action]" hero statement + why it fits
3. **Setup Checklist** — Interactive environment prep tasks
4. **Ready** — "Start your first rep now" or "I'll start later"

On completion: `updateHabitData()` saves the full `HabitSystem`, fires async `coach-notes` generation, navigates to `/`.

**Step 4: Daily Runtime (`/` → PlanScreen)**
The home screen adapts based on state:
- **Pre-first-rep** (`designed` state) — "Ready for your first rep?" CTA
- **Active** — "Mark today's rep" CTA + stats (reps count, last done)
- **Missed** — Recovery prompt with recovery action
- **Completed today** — "Done for today" with reflection option

Three tabs provide depth:
- **System** — Your ritual, toolkit, recovery action, setup progress
- **Journey** — Month calendar (4-state dots), narrative header (momentum ring), day detail sheets, patterns section
- **Self** — Identity framing, progression arc (4 weeks), toolkit summary

**Step 5: Check-In (`/today`)**
`CheckInFlow` orchestrates the experience based on `habitType`:

For time/event habits:
1. "Did you do it?" → Done / Can't today
2. If done → Success screen with whisper + difficulty rating (1-5)
3. Optional → Brief AI reflection conversation (Haiku, 1-2 exchanges)
4. `logCheckIn()` saves everything atomically

For reactive habits:
1. Three options: Trigger happened + used protocol / Trigger happened + didn't / No trigger today
2. Same downstream flow

For misses:
1. Recovery coach conversation (Haiku) — normalizes, understands context, offers recovery
2. Recovery action offered → if accepted + completed → state returns to `active`

**Step 6: Weekly Reflection (every 7 days)**
`useReflectionTrigger()` shows a banner on PlanScreen. Tapping starts a conversational reflection (Sonnet) that:
- Reviews the week's data (completion %, difficulty trend)
- Asks about sustainability
- Generates ONE specific system adjustment recommendation
- If accepted → `applySystemUpdate()` modifies the `HabitSystem`

### 4.2 State Machine

```
install → designed → active ⟷ missed
                       ↓
                   maintained → paused → archived
```

Key transitions:
- `logCheckIn(actionTaken: true)` → keeps `active`
- `logCheckIn(actionTaken: false)` → sets `missed`
- `completeRecovery()` → returns to `active`
- `graduateHabit()` → moves to `maintained`
- `pauseHabit(reason)` → moves to `paused`

### 4.3 Data Persistence Flow

```
User action → habitStore function → loadHabitData() [read from localStorage]
                                   → mutate in memory
                                   → saveHabitData() [write to localStorage]
                                   → return updated HabitData
```

Race condition protection: `logCheckIn()` uses an atomic read-modify-write pattern instead of the two-step `updateHabitData()` to prevent stale check-in arrays from overwriting newer data.

---

## 5. Lessons Learned Building with Claude

These are synthesized from 18 feedback rounds (R1–R18, Jan 15 – Feb 8, 2026) and the git commit history.

### 5.1 Product/Architecture Lessons

**1. Conversation beats forms — every time.**
The single biggest recurring lesson across R1-R18. Every time the feedback elevated conversational AI over static forms, the product got better: intake wizard → chat intake (R6), static miss form → recovery coach conversation (R16), reflection form → reflection conversation (R18). When you have an LLM, conversation is your primary product surface.

**2. Data must flow in both directions.**
The R18 audit identified the critical "open loop" problem: check-ins fed patterns, but patterns fed nothing back into the system. AI collected rich data but the habit system was frozen from the moment of confirmation. The fix (`applySystemUpdate()` + reflection → mutation pipeline) was the single highest-leverage architectural change. Lesson: AI products need bidirectional data flow. This isn't polish — it's foundational.

**3. Progressive disclosure prevents cognitive overload.**
Early versions showed everything immediately. Subsequent feedback (R8, R10, R11) gated features behind evidence thresholds: setup checklist pre-first-rep only, tune-up after first rep, patterns after 7 check-ins, progression after Week 1. With rich AI outputs, *when* you show something is as important as *what* you show.

**4. Model selection is a UX decision, not just cost/latency.**
Switching from GPT 5.2 to Claude Sonnet (R7) wasn't about capability — it was about tone. GPT produced verbose, clinical responses. Sonnet + message length guidance in the prompt produced warm, conversational text. Adding "1-3 sentences max" to the system prompt was easier and more reliable than post-processing truncation.

**5. The "thin daily experience" risk is real.**
Rounds 8-13 kept returning to: intake is rich, but the daily loop feels thin. Generic reflection responses, static miss forms, barren journey screens — each individually minor, but collectively they devalue the entire coaching relationship. A single point of friction (like "Thanks for sharing...") undoes the trust built during intake.

**6. Tone is a design system element.**
The product laws, design brief, and forbidden words list function as tone tokens. Feedback rounds consistently flagged tone drift (clinical language, patronizing encouragement, generic acknowledgments) just as they'd flag a wrong color. In conversational products, tone consistency requires the same rigor as visual consistency.

### 5.2 Building-with-Claude-Code Lessons

**7. User intent must flow through all downstream AI calls.**
R5 found a critical bug: user selected "sleep" but the AI generated exercise content throughout. The domain wasn't being passed to downstream calls. Lesson: AI systems need explicit data pipeline contracts; implicit assumptions break. Log what you pass to the AI at each step.

**8. JSON output from LLMs needs defensive parsing.**
The intake agent sometimes returned plain text instead of JSON, breaking the flow (fixed in commit `bc58bf1`). The fix added: validation with specific error messages, salvage logic for partial responses, plain-text wrapping as valid discovery messages, and stronger JSON reminders in the system prompt. Always assume LLM output will occasionally be malformed.

**9. One mutation path, multiple entry points.**
R18 unified pattern suggestions, reflection recommendations, and on-demand coaching into one `applySystemUpdate()` function. Three independent features all needed the same backend logic. Refactor early when you see this pattern across AI response paths.

**10. Feedback with reproducible test cases lands with force.**
R5 included a specific test case ("select sleep via pill, then sleep via free text") that immediately exposed the data pipeline break. R13 included an actual user reflection that showed the generic AI response. Abstract critiques are less useful than executable scenarios.

**11. The build cadence that worked: write → use → critique → revise.**
The 18 rounds followed a natural pattern:
- **R1-3** (conceptual critique before extensive coding)
- **R4-10** (execution feedback on what's built; data pipeline issues surface)
- **R11-18** (polish and strategic gap-filling)
Each round was ~1-2 days apart, allowing time for implementation. The deepest architectural insights (like the closed feedback loop) only emerged after surface issues were addressed.

**12. Commit messages as documentation.**
Each commit in this project tells a story. R18's commit message is 12 lines describing 6 phases. This was essential for maintaining context across sessions. When building with an AI assistant, the commit log is your team's shared memory.

---

## 6. Assessment: Should You Push Further?

### 6.1 What You've Actually Built

This is **not** a toy prototype. In 11 commits over ~3 weeks, you've built:

- A **conversational AI intake** that genuinely feels like talking to a coach (not filling out a form)
- A **complete daily runtime loop** with type-specific check-ins, recovery flows, and reflection conversations
- A **4-state tracking system** (done/recovered/skipped/missed) with calendar visualization
- An **adaptive feedback loop** where AI insights can mutate the habit system
- A **graduation architecture** for habit lifecycle management
- A **warm, cohesive design system** that doesn't look like default Tailwind

The architecture is sound. The data model is rich (792-line type file). The AI integration is sophisticated (7 streaming endpoints, 8 prompt files). This is substantially beyond M1 Alpha scope.

### 6.2 Honest Gaps

| Gap | Severity | Effort to Fix |
|-----|----------|--------------|
| **No real user testing** | High | 1-2 weeks (recruit 3-5 users, run 7-day trial) |
| **No push notifications** | Medium | 1-2 days (service worker + Web Push API) |
| **No backend/auth** | Medium-High (for multi-user) | 3-5 days (Supabase or similar) |
| **No feedback capture** | Medium | 0.5 day |
| **LocalStorage-only persistence** | Medium (data loss risk) | 2-3 days (migrate to backend) |
| **No automated tests** | Low-Medium | 2-3 days (smoke tests for critical flows) |
| **Progressive disclosure not fully enforced** | Low | 0.5 day (gate identity/progression/dots) |
| **Some M1 acceptance criteria untested** | Medium | Requires 7-day self-run |

### 6.3 The Real Question

The question isn't "is the code good enough?" — it is. The question is: **does the core thesis hold?**

> Does conversational AI intake create "felt understanding" that translates to higher habit follow-through than static forms?

You cannot answer this without **real user data.** The architecture supports testing this thesis. The features are built. But you have zero users and zero 7-day completion data.

### 6.4 Recommendation

**Push forward — but redirect effort from features to validation.**

You've over-built relative to your learning. The codebase has R18-level sophistication (graduation, coach's notes, AI patterns) but zero R0-level validation (did anyone actually use it for a week?). The highest-leverage next step is not more code — it's putting this in front of 3-5 people.

---

## 7. What's Remaining and Next Steps

### 7.1 Immediate (This Week): Validate

1. **Self-run the 7-day trial.** Use the app daily for a real habit. Document friction.
2. **Fix anything that blocks the daily loop.** If you can't complete a 7-day run, nothing else matters.
3. **Deploy somewhere accessible.** Vercel is free and takes 5 minutes.

### 7.2 Short-Term (Next 2 Weeks): Get Users

4. **Add feedback capture.** Simple in-app form, auto-attach state context.
5. **Add push notifications.** Even basic ones increase daily return rate dramatically.
6. **Recruit 3-5 testers.** Friends, colleagues — people who will actually use it daily and give honest feedback.
7. **Run M2 acceptance criteria:**
   - Do 3-5 users complete consult + first rep in <5 min?
   - Do 60%+ complete 4+ reps in week 1?
   - Is recovery completion >50%?
   - Does weekly reflection completion >40%?

### 7.3 Medium-Term (If Validation Passes): Harden

8. **Backend + auth.** Move from LocalStorage to Supabase/Postgres. Multi-device support.
9. **Instrumentation.** Track funnel (intake → first rep → day 3 → day 7 → week 2).
10. **Retention analysis.** Where do users drop off? What patterns predict continued use?

### 7.4 What NOT to Build Yet

- More AI features (patterns v2, deeper coach's notes, multi-habit)
- Cross-device sync
- Export functionality
- Photo gallery improvements
- Navigation restructuring
- Additional habit types (frequency, avoidance)

These are all good ideas. None of them matter until you know whether a single user will complete a single week.

---

## Appendix: File Map

```
src/
├── app/
│   ├── page.tsx                    # Home routing (WelcomeScreen or PlanScreen)
│   ├── setup/page.tsx              # Chat intake + onboarding
│   ├── today/page.tsx              # Daily check-in
│   ├── tuneup/page.tsx             # Post-first-rep toolkit
│   ├── system/page.tsx             # Your System detail
│   ├── reflect/page.tsx            # Weekly reflection
│   ├── recovery/page.tsx           # Recovery flow
│   ├── reset/page.tsx              # Data reset
│   ├── globals.css                 # Design tokens + animations
│   ├── layout.tsx                  # App shell (fonts, metadata)
│   └── api/
│       ├── intake/stream/route.ts  # Sonnet intake streaming
│       ├── tuneup/route.ts         # Haiku tune-up
│       ├── recovery/stream/route.ts # Haiku recovery coach
│       ├── reflection/stream/route.ts # Haiku daily reflection
│       ├── weekly-reflection/route.ts # Sonnet weekly reflection
│       ├── patterns/route.ts       # Sonnet pattern analysis
│       └── coach-notes/route.ts    # Sonnet coach notes
├── components/                     # 61 components
│   ├── chat/                       # ChatContainer, ChatMessage, ChatInput, SuggestedPills, TypingIndicator
│   ├── checkin/                    # CheckInFlow, CheckInOptions, CheckInSuccess, CheckInMiss, RecoveryOffer, CheckInConversation
│   ├── common/                     # ConfirmationSheet, MenuSheet, Button
│   ├── journey/                    # MonthCalendar, DayTimeline, DayDetailSheet, NarrativeHeader, PatternsSection
│   ├── onboarding/                 # OnboardingFlow (identity → ritual → setup → ready)
│   ├── runtime/                    # PlanScreen, WelcomeScreen, StageTransitionScreen
│   ├── self/                       # IdentitySection, ProgressionSection, ToolkitSection
│   ├── system/                     # SetupChecklist, SystemDetail
│   └── ui/                         # Button (design system)
├── hooks/
│   ├── useUserState.ts             # State machine → route mapping
│   └── useReflectionTrigger.ts     # 7-day reflection banner logic
├── lib/
│   ├── ai/
│   │   ├── useIntakeAgent.ts       # React hook for chat intake
│   │   ├── streaming.ts            # SSE streaming utilities
│   │   └── prompts/                # 8 AI prompt files
│   ├── store/
│   │   ├── habitStore.ts           # LocalStorage CRUD (690 lines)
│   │   ├── conversationStore.ts    # Intake state persistence
│   │   └── systemUpdater.ts        # applySystemUpdate() — unified mutation path
│   ├── analytics/                  # Intake analytics tracking
│   ├── education/                  # Whispers (micro-motivations)
│   ├── patterns/                   # patternFinder, insightGenerator, aiPatternGenerator
│   ├── progression/                # stageDetector, graduationDetector
│   ├── format.ts                   # Ritual statement formatter
│   └── utils.ts                    # cn() class merger
├── types/
│   ├── habit.ts                    # Core data model (792 lines)
│   └── conversation.ts            # Intake conversation types
docs/
├── PRD_overall.md                  # Core product vision
├── PRD_logging_education_reflection_systems.md  # Education layers
├── PRD_tracking_reflections_loop.md # Check-in conversation + patterns
├── design_brief.md                 # Design system spec
├── decisions.md                    # Architecture decision log
├── stage-requirements.md           # M0-M3 milestone requirements
├── PROJECT_INVENTORY.md            # Feature audit
└── Feedback_logs/                  # R1-R18 feedback rounds
```
