# Epic A — Agent-First Intake Implementation Plan

**Version:** 1.4
**Date:** 2026-01-25
**Milestone:** M1 Alpha

**Status:** V0.4 Complete (R8 Feedback Implemented)

---

## Overview

This document tracks the implementation of the conversational intake system, replacing the wizard-based setup with a two-agent architecture:

1. **Intake Agent** — Understands user's situation through conversation
2. **Recommendation Agent** — Generates personalized habit + system

**Primary thesis being tested:** Can a conversational AI agent make users feel more understood than a wizard, and does that translate to better habit recommendations?

**How we'll know:** After recommendations, ask: "How well did I understand your situation?" (1-5). Track whether users who feel understood (4-5) have higher first-week completion rates.

---

## Architecture Summary

```
┌──────────────────────────────────────────────────────────┐
│                     CHAT UI                               │
│  Messages + Text Input + Suggested Pills                  │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   INTAKE AGENT                            │
│                                                           │
│  Conversation State (simplified):                         │
│  - userGoal: string | null     (what they said they want) │
│  - realLeverage: string | null (agent's hypothesis)       │
│  - confidenceLevel: 'low' | 'medium' | 'high'             │
│  - messages: Message[]                                    │
│                                                           │
│  Exit when: Agent has high confidence in hypothesis       │
│             AND has reflected it back                     │
│             AND user confirmed/corrected                  │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│          RECOMMENDATION (in conversation)                 │
│                                                           │
│  Agent presents single best-fit recommendation:           │
│  "Based on what you've told me, here's what I think       │
│   will work for you: [habit + reasoning]"                 │
│                                                           │
│  User can: Accept | Ask for alternatives | Adjust         │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│          CONFIRMATION (in conversation)                   │
│                                                           │
│  "So here's your system: After [anchor], [action].        │
│   If you miss, [recovery]. Ready to try your first rep?"  │
│                                                           │
│  User taps "Let's do it" → straight to runtime            │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   RUNTIME LOOP                            │
│  Plan → Today → Done/Miss → Recovery                      │
└──────────────────────────────────────────────────────────┘
```

**Key change from v1.0:** Recommendations and confirmation happen *within* the conversation, not as separate card-selection screens. This maintains the co-design feeling throughout.

---

## Iteration Strategy

Tighter loops to validate sooner and kill bad ideas faster.

### V0.1 — Prompt Validation (No Code) ✅ COMPLETE
**Goal:** Validate conversation quality before any code.
**Scope:** Phase 1 only
**Method:** Test prompts directly in Claude. You play the user, paste into Claude, observe behavior.
**Exit criteria:** Agent demonstrates contextual follow-ups, accurate reflection, relevant insight.
**Outcome:** Found working system prompt through Claude testing. Agent shows good pattern recognition and personalized responses.

### V0.2 — Chat Intake Feel ✅ COMPLETE
**Goal:** Validate the feel of chat-based intake in actual UI.
**Scope:** Phases 2-4 + minimal UI
**Method:** Build chat UI + intake agent.
**Exit criteria:** Chat intake feels like co-design, not interrogation.
**Outcome:** Chat UI working with Claude Sonnet. R7 feedback implemented:
- Switched from OpenAI to Anthropic (Claude Sonnet) — better message quality
- Added message length guidance (2-3 sentences typical)
- Unified intake + recommendation into single agent (no separate recommendation agent)
- Added `habitRecommendation` structured object for confirmation screen

### V0.3 — End-to-End Flow ✅ COMPLETE
**Goal:** Validate complete flow including recommendation.
**Scope:** Phases 5-8
**Method:** Single agent handles discovery → reflection → recommendation → confirmation.
**Exit criteria:** Can go from "I want to sleep better" to first rep in <3 minutes.
**Outcome:** Full flow working:
- Chat → ConfirmationScreen (with HabitCard + FeltUnderstoodRating)
- Created `/today` page with Done/Missed actions
- Created `/recovery` page with recovery action
- State transitions verified: rep_done, miss, recovery_done, skip

### V0.4 — Commitment & Progressive Depth (R8 Feedback) ✅ COMPLETE
**Goal:** Transform confirmation from receipt → commitment moment; add progressive habit design.
**Scope:** Phases 9-14 (new phases from R8)
**Key changes (R8):**
1. **Confirmation screen redesign** — Hero statement with emoji, not a form receipt
2. **Photo evidence** — After marking done, prompt for photo proof
3. **Tune-up conversation** — Post-first-rep Haiku conversation for habit toolkit
4. **Your System screen** — Full habit system view (ritual + toolkit + recovery)
5. **Plan screen updates** — Conditional cards based on progress state

**Exit criteria:**
- Confirmation feels like a commitment moment, not form submission
- First rep includes optional photo capture
- Tune-up unlocks after first rep with photo
- User can view/edit their full habit system

**Outcome:**
- Confirmation screen completely redesigned with hero statement + emoji
- Photo evidence flow with IndexedDB storage
- Tune-up conversation using Haiku model
- Your System screen with edit bottom sheets
- Plan screen with conditional cards based on progress state
- Data layer updated with RepLog, HabitSystem types

---

## Phase 1 — Agent Prompt Development (No UI) ✅ COMPLETE

**Goal:** Validate agent behavior before building UI. Test in Claude directly.

### 1.1 Write Intake Agent System Prompt
- [x] Create `src/lib/ai/prompts/intakeAgent.ts`
- [x] Define personality: calm, knowledgeable, non-judgmental
- [x] Define conversation principles:
  - Ask one question at a time
  - Probe based on what they say, not a checklist
  - Reflect understanding before recommending
  - Share insight to earn trust
- [x] Define output format (message + optional pills + phase + hypothesis + habitRecommendation)
- [x] Include domain frameworks as knowledge in system prompt

**Exit Criteria (Confidence-Based, Not Checklist):**
The agent exits when:
- Agent has a hypothesis about what will actually work for this person (`realLeverage`)
- Agent has reflected that hypothesis back
- User confirmed/corrected the reflection
- Agent feels confident the recommendation will address the *real* blocker (which may differ from stated blocker)

**NOT:** "Has goal + blocker + timing + history" — that's checkbox thinking.

**Acceptance Criteria:**
- Agent asks contextual follow-ups, not fixed checklist
- Agent can exit in 3 turns for articulate users, 6 for vague users
- Agent shares at least one relevant insight before recommending
- Agent's reflection shows pattern recognition, not just summary

### 1.2 Write Recommendation Agent System Prompt
**Decision:** Merged into intake agent. Single agent handles discovery → recommendation.
- [x] Recommendation logic integrated into `src/lib/ai/prompts/intakeAgent.ts`
- [x] `habitRecommendation` structured object added to response schema
- [x] Include habit generation principles in intake agent prompt

**Acceptance Criteria:** ✅ Met
- Recommendation addresses real leverage point, not just stated goal
- "Why it fits" references specific things user said
- Anchor matches timing constraints
- Recommendation feels personalized, not generic

### 1.3 Test Agent Prompts in Claude
- [x] Test Intake Agent with different user scenarios
- [x] Test with different user articulation levels
- [x] Iterate prompts until quality bar met
- [x] Working prompt documented in `src/lib/ai/prompts/intakeAgent.ts`

**Files Created:**
- `src/lib/ai/prompts/intakeAgent.ts` (includes recommendation logic)

---

## Phase 2 — Type Definitions & State Management ✅ COMPLETE

**Goal:** Define schemas and conversation state management.

### 2.1 Define Conversation State Types
- [x] Create/update `src/types/conversation.ts`:
  ```typescript
  interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    suggestedResponses?: string[];
    timestamp: string;
  }

  type ConfidenceLevel = 'low' | 'medium' | 'high';

  interface IntakeState {
    // What agent understands
    userGoal: string | null;           // What they said they want
    realLeverage: string | null;       // Agent's hypothesis about what will actually help

    // Conversation tracking
    confidenceLevel: ConfidenceLevel;  // How confident agent is in hypothesis
    turnCount: number;

    // Full conversation
    messages: Message[];

    // Recommendation (generated when confident)
    recommendation: HabitRecommendation | null;
    alternativesShown: boolean;
  }
  ```

**Note:** Removed `hasReflected`, `hasSharedInsight` — these were process artifacts. The agent decides internally when to reflect/share insight based on conversation flow, not checkboxes.

### 2.2 Define Recommendation Types
- [x] `HabitRecommendation` defined in `src/lib/ai/prompts/intakeAgent.ts`:
  ```typescript
  interface HabitRecommendation {
    anchor: string;
    action: string;
    followUp?: string;      // Optional follow-up action (was "prime")
    whyItFits: string[];    // Personalized reasons from conversation
    recovery: string;
  }
  ```

### 2.3 Create Conversation Store
- [x] Created `src/lib/store/conversationStore.ts`:
  - `startNewConversation()` — Create fresh IntakeState
  - `addUserMessage(content)` — Append user message
  - `addAssistantMessage(content, suggestedResponses?, habitRecommendation?)` — Append assistant message
  - `updatePhase(phase, hypothesis?)` — Update conversation phase
  - `completeConversation(rating?)` — Mark complete with understanding rating
  - `loadConversation()` / `saveConversation()` — localStorage persistence
  - `clearConversation()` — Reset for new conversation

### 2.4 Update HabitData Types
- [x] Updated `src/types/habit.ts`:
  - Added `intakeState?: unknown` field for full conversation storage
  - Existing fields preserved for backwards compatibility

**Files Created/Modified:**
- `src/types/conversation.ts` (new)
- `src/lib/store/conversationStore.ts` (new)
- `src/types/habit.ts` (modified)
- `src/lib/ai/prompts/intakeAgent.ts` (HabitRecommendation type)

---

## Phase 3 — Chat UI Component ✅ COMPLETE

**Goal:** Build minimal chat interface.

### 3.1 Create Chat Message Component
- [x] Created `src/components/chat/ChatMessage.tsx`:
  - User vs assistant messages with different styling
  - User messages: right-aligned, blue background
  - Assistant messages: left-aligned, gray background

### 3.2 Create Suggested Pills Component
- [x] Created `src/components/chat/SuggestedPills.tsx`:
  - Display pill buttons below assistant message
  - Click pill → sends message immediately
  - Pills are contextual to the question

### 3.3 Create Chat Input Component
- [x] Created `src/components/chat/ChatInput.tsx`:
  - Text input with send button
  - Submit on Enter
  - Disabled while agent is responding
  - Placeholder: "Type a message..."

### 3.4 Create Chat Container Component
- [x] Created `src/components/chat/ChatContainer.tsx`:
  - Scrollable message list
  - Auto-scroll to bottom on new messages
  - Pills below last assistant message
  - Input fixed at bottom
  - Escape hatch: "I think you understand" (after 3+ turns)

### 3.5 Style Chat Components
- [x] Consistent with existing design system (Tailwind)
- [x] Mobile-responsive
- [x] Clear visual distinction: user (right) vs assistant (left)
- [x] Created `src/components/chat/TypingIndicator.tsx` for loading state

**Files Created:**
- `src/components/chat/ChatMessage.tsx`
- `src/components/chat/SuggestedPills.tsx`
- `src/components/chat/ChatInput.tsx`
- `src/components/chat/ChatContainer.tsx`
- `src/components/chat/TypingIndicator.tsx`
- `src/components/chat/index.ts` (barrel export)

---

## Phase 4 — Intake Agent Integration ✅ COMPLETE

**Goal:** Wire chat UI to Intake Agent.

### 4.1 Create Intake Agent Client
- [x] Integrated into `src/lib/ai/useIntakeAgent.ts`
- [x] Handles API calls and response parsing
- [x] Error handling with retry logic

### 4.2 Create Intake API Route
- [x] Created `src/app/api/intake/route.ts`:
  - POST handler accepting messages array + optional forceRecommend flag
  - **Dual provider support:** Anthropic (preferred) → OpenAI (fallback)
  - Claude Sonnet model: `claude-sonnet-4-20250514`
  - Retry logic with exponential backoff
  - Response validation with `isValidIntakeResponse()`

### 4.3 Create Intake Agent Response Schema
- [x] Defined in `src/lib/ai/prompts/intakeAgent.ts`:
  ```typescript
  interface IntakeAgentResponse {
    message: string;
    suggestedResponses: string[] | null;
    phase: 'discovery' | 'reflection' | 'recommendation' | 'refinement' | 'ready_to_start';
    hypothesis: string | null;
    habitRecommendation: HabitRecommendation | null;
  }
  ```

### 4.4 Create useIntakeAgent Hook
- [x] Created `src/lib/ai/useIntakeAgent.ts`:
  - Manages conversation flow and state
  - `sendMessage(content)` — Send user message, get response
  - `forceRecommend()` — Trigger "I think you understand" flow
  - `reset()` — Start over
  - Handles loading, errors, phase transitions

**Files Created:**
- `src/app/api/intake/route.ts`
- `src/lib/ai/useIntakeAgent.ts`
- `src/lib/ai/prompts/intakeAgent.ts` (includes response schema)

---

## Phase 5 — Recommendation Generation ✅ COMPLETE (Simplified)

**Goal:** Generate personalized recommendation from intake.

**Decision:** Merged recommendation into intake agent. Single agent handles full conversation arc through `recommendation` and `ready_to_start` phases.

### Implementation
- [x] Recommendation logic integrated into intake agent prompt
- [x] Agent returns `habitRecommendation` object when in `recommendation` phase
- [x] No separate recommendation API needed
- [x] Agent validates recommendation quality before presenting

**Files Modified:**
- `src/lib/ai/prompts/intakeAgent.ts` (includes recommendation logic)

---

## Phase 6 — In-Conversation Recommendation & Confirmation ✅ COMPLETE

**Goal:** Present recommendation and get confirmation.

**Decision:** Recommendation shown in chat, then transitions to dedicated ConfirmationScreen for final acceptance with "felt understood" rating.

### 6.1 Confirmation Screen (Replaces In-Chat Confirmation)
- [x] Created `src/components/confirmation/ConfirmationScreen.tsx`:
  - Main container managing rating + CTA flow
  - Primary CTA: "Start my first rep now"
  - Secondary: "I'll start later"
  - Back button to return to chat

### 6.2 Habit Card Component
- [x] Created `src/components/confirmation/HabitCard.tsx`:
  - Displays anchor, action, followUp (optional)
  - Shows "Why this fits you" bullets
  - Shows recovery action
  - Clean card design

### 6.3 Felt Understood Rating
- [x] Created `src/components/confirmation/FeltUnderstoodRating.tsx`:
  - 1-5 scale rating buttons
  - Question: "How well did I understand your situation?"
  - Rating stored in intakeState for thesis validation

### 6.4 Wire Into Setup Flow
- [x] Updated `src/app/setup/page.tsx`:
  - Chat UI until phase = `ready_to_start`
  - Transitions to ConfirmationScreen when recommendation accepted
  - Saves planDetails + intakeState to HabitData on completion
  - Routes to `/` after completion

**Files Created/Modified:**
- `src/components/confirmation/ConfirmationScreen.tsx`
- `src/components/confirmation/HabitCard.tsx`
- `src/components/confirmation/FeltUnderstoodRating.tsx`
- `src/components/confirmation/index.ts` (barrel export)
- `src/app/setup/page.tsx` (rewrite)

---

## Phase 7 — First Rep & Handoff ✅ COMPLETE

**Goal:** Complete first rep and transition to runtime.

### 7.1 Handle "Start my first rep now" Action
- [x] Saves to HabitData:
  - `planDetails` (anchor, action, prime, recovery)
  - `snapshot` (line1: "Week 1: Show up.", line2: "After [anchor], [action].")
  - `intakeState` (full conversation + feltUnderstoodRating)
  - `state` → "active"
  - `repsCount` → 1
  - `lastDoneDate` → today
- [x] Routes to `/` (plan screen)

### 7.2 Handle "I'll start later" Action
- [x] Saves same data but:
  - `state` → "designed" (not active)
  - `repsCount` stays 0
- [x] Routes to `/` (plan screen)
- [x] "Start today's rep" button available

### 7.3 Felt Understanding Metric
- [x] Rating collected on ConfirmationScreen before CTAs
- [x] Rating stored in `intakeState.feltUnderstoodRating`
- [x] Ready for thesis validation analysis

**Files Modified:**
- `src/app/setup/page.tsx`
- `src/types/conversation.ts` (extractPlanFromRecommendation helper)

---

## Phase 8 — Runtime Loop ✅ COMPLETE

**Goal:** Complete daily execution flow.

### 8.1 Verify/Create Runtime Screens
- [x] `/` — Shows plan (PlanScreen) or welcome (WelcomeScreen); redirects to `/recovery` if missed
- [x] `/today` — Created `src/app/today/page.tsx`:
  - Shows anchor, action, prime (optional)
  - "Done" button → `logEvent('rep_done')` → `/`
  - "I missed today" button → `logEvent('miss')` → `/`
  - "Back to plan" link
- [x] `/recovery` — Created `src/app/recovery/page.tsx`:
  - Shows recovery action
  - "Done — I'm back" button → `logEvent('recovery_done')` → `/`
  - "Skip for now" button → `logEvent('skip')` → `/`
  - Encouraging copy: "Missing happens. What matters is getting back on track quickly."

### 8.2 Implement State Transitions
- [x] `rep_done` → increment reps, update lastDoneDate, state = "active", clear missedDate
- [x] `miss` → state = "missed", record missedDate
- [x] `recovery_done` → increment reps (recovery counts!), update lastDoneDate, state = "active"
- [x] `skip` → keeps state = "missed", logs event

### 8.3 Test Full Loop
- [x] Build passes (`npm run build`)
- [x] State transitions verified in `src/lib/store/habitStore.ts`
- [x] Flow verified: `/` auto-redirects to `/recovery` when state = "missed"

**Files Created/Modified:**
- `src/app/today/page.tsx` (new)
- `src/app/recovery/page.tsx` (new)
- `src/app/page.tsx` (redirects to /recovery when missed)
- `src/lib/store/habitStore.ts` (logEvent handles all event types)

---

## Phase 9 — Confirmation Screen Redesign (R8) ✅ COMPLETE

**Goal:** Transform confirmation from form receipt → commitment moment.

**Source:** R8_20260125.md Part 1

### 9.1 Hero Statement Design
- [x] Condense habit to single memorable sentence: "When I [anchor], I [action]."
- [x] Large centered text (font-serif 24px)
- [x] Wrapped in quotation marks (feels like personal mantra)

### 9.2 Context Emoji
- [x] Add context-appropriate emoji above hero statement (48px)
- [x] Map based on habit domain:
  - Sleep: 🛏️ or 🌙
  - Exercise: 🏃 or 💪
  - Reading: 📖 or 🚃
  - Finance: 💰 or 📊
  - Default: ⚡
- [x] Derive domain from anchor/action keywords (`getHabitEmoji()`)

### 9.3 Single Supporting Paragraph
- [x] Combine "why it fits" + "if you miss" into flowing prose
- [x] Max 2-3 sentences
- [x] "If you miss" on own line, slightly lighter color

### 9.4 Rating Below CTA
- [x] Move "How well did I understand you?" below the primary CTA
- [x] Subtle divider above rating section
- [x] Still captured, doesn't compete with commitment

### 9.5 CTA Updates
- [x] Primary: "Start first rep tonight" / "Start first rep now" (timing-aware via `getCTAText()`)
- [x] Secondary: "I'll start later"
- [x] Remove Anchor/Action/Then labels — user remembers what to do

**Files Modified:**
- `src/components/confirmation/ConfirmationScreen.tsx` (major rewrite)
- `src/types/habit.ts` (added DOMAIN_EMOJI, getHabitEmoji)

---

## Phase 10 — Photo Evidence Flow (R8) ✅ COMPLETE

**Goal:** Add photo proof after marking done to build commitment and unlock tune-up.

**Source:** R8_20260125.md Part 2

### 10.1 Photo Prompt Screen
- [x] Create `src/components/photo/PhotoPromptScreen.tsx`:
  - Camera icon + "Nice work!"
  - "Snap a quick photo as proof of your rep."
  - "It's just for you—builds your habit journal."
  - Take photo button (device camera API)
  - Choose from library button
  - "Skip for now" text button
  - Privacy note: "Photos are stored locally and never shared."

### 10.2 Camera Integration
- [x] Use file input with capture attribute for camera
- [x] Fallback to file input for photo library
- [x] Image compression for storage efficiency

### 10.3 Photo Storage
- [x] Store photos locally (IndexedDB)
- [x] Create `src/lib/store/photoStore.ts`:
  - `savePhoto(id, dataUrl)` → stores photo
  - `loadPhoto(id)` → returns dataUrl
  - `deletePhoto(id)`
  - `capturePhoto()` → triggers camera
  - `pickPhoto()` → triggers library
  - `compressImage()` → reduces size

### 10.4 Data Model Updates
- [x] Add to `RepLog`: `photoUri?: string`, `photoSkipped?: boolean`
- [x] Add to `HabitData`: `hasCompletedFirstRepWithPhoto: boolean`
- [x] Create `logRep()` function with photo support

### 10.5 Flow Integration
- [x] After "Done" on `/today` → show PhotoPromptScreen
- [x] After photo captured/skipped → show celebration, return to plan
- [x] Track whether tune-up should be unlocked

**Files Created:**
- `src/components/photo/PhotoPromptScreen.tsx`
- `src/lib/store/photoStore.ts`

**Files Modified:**
- `src/types/habit.ts` (RepLog, HabitData, generateRepLogId)
- `src/app/today/page.tsx` (add photo flow with FlowState)
- `src/lib/store/habitStore.ts` (logRep, updateRepPhoto)

---

## Phase 11 — Tune-Up Conversation (R8) ✅ COMPLETE

**Goal:** Post-first-rep Haiku conversation to build habit toolkit.

**Source:** R8_20260125.md Part 2-3

### 11.1 Tune-Up Agent Prompt
- [x] Create `src/lib/ai/prompts/tuneUpAgent.ts`:
  - Model: Claude Haiku (cost-efficient)
  - Personality: warm, encouraging, practical, brief
  - 4-5 turns total
  - Questions:
    1. "What almost got in the way today?" → friction
    2. "What could you set up the night before?" → environment priming
    3. "On a really bad day, what's the tiniest version?" → tiny version
  - Output: message + suggestedResponses + phase + extractedData + isComplete

### 11.2 Tune-Up API Route
- [x] Create `src/app/api/tuneup/route.ts`:
  - Uses Haiku model (`claude-3-5-haiku-20241022`)
  - Accepts habitInfo + conversation history
  - Returns structured response with extractedData

### 11.3 Tune-Up Components
- [x] Create `src/components/tuneup/TuneUpScreen.tsx`:
  - Chat interface with messages
  - Suggested response pills
  - Auto-starts conversation
  - Auto-completes when isComplete=true

### 11.4 Tune-Up Hook
- [x] Create `src/lib/ai/useTuneUpAgent.ts`:
  - Manages conversation state
  - Tracks extractedData progressively
  - sendMessage, startConversation, reset

### 11.5 Tune-Up Page
- [x] Create `src/app/tuneup/page.tsx`:
  - Route from Plan screen "Tune your system" card
  - Gate: redirects if not eligible (pre-first-rep or needs photo)
  - On completion, saves toolkit via `updateSystemToolkit()`
  - Routes to /system when complete

### 11.6 Data Model Updates
- [x] Add `HabitSystem` type with toolkit fields
- [x] Add `updateSystemToolkit()` to habitStore

**Files Created:**
- `src/lib/ai/prompts/tuneUpAgent.ts`
- `src/lib/ai/useTuneUpAgent.ts`
- `src/app/api/tuneup/route.ts`
- `src/components/tuneup/TuneUpScreen.tsx`
- `src/app/tuneup/page.tsx`

**Files Modified:**
- `src/types/habit.ts` (HabitSystem type)
- `src/lib/store/habitStore.ts` (updateSystemToolkit)

---

## Phase 12 — Plan Screen Updates (R8) ✅ COMPLETE

**Goal:** Show conditional cards based on user progress state.

**Source:** R8_20260125.md Part 3

### 12.1 Plan State Logic
- [x] Implement `getPlanScreenState(habit)` in types/habit.ts:
  - `pre_first_rep` — no reps yet
  - `tune_up_available` — 1+ reps with photo, not tuned
  - `needs_photo_for_tuneup` — 1+ reps, no photo
  - `tuned` — tune-up complete

### 12.2 Pre-First-Rep View
- [x] Hero habit statement with emoji
- [x] Stats: "Reps: 0 • Last done: —"
- [x] CTA: "Mark today's rep"

### 12.3 Tune-Up Available View
- [x] Same as above plus:
- [x] Celebration card: "🎉 You did your first rep!"
- [x] "Let's set up your system so it keeps going."
- [x] "Tune your system →" link to /tuneup

### 12.4 Needs Photo View
- [x] Subtle nudge: "Add a photo to unlock tuning"

### 12.5 Tuned View
- [x] Stats row includes "View system →" link to /system
- [x] Clean, minimal — system is set

**Files Modified:**
- `src/components/runtime/PlanScreen.tsx` (major rewrite)
- `src/types/habit.ts` (getPlanScreenState)

---

## Phase 13 — Your System Screen (R8) ✅ COMPLETE

**Goal:** Full habit system view with ritual, toolkit, and recovery.

**Source:** R8_20260125.md Part 4

### 13.1 Page Structure
- [x] Create `src/app/system/page.tsx`:
  - Back link to Plan
  - Title: "Your System"
  - All sections integrated in YourSystemScreen component

### 13.2 The Ritual Card (Hero)
- [x] Implemented in `YourSystemScreen.tsx`:
  - Visual flow: Anchor → Action → Then
  - Icon boxes with connecting lines
  - "Edit ritual →" link

### 13.3 Your Toolkit Section
- [x] Implemented in `YourSystemScreen.tsx`:
  - Three sub-cards (conditionally rendered):
    - ⚡ Tiny version — "For days when everything's against you."
    - 🌙 Environment prime — "Set yourself up so the right choice is easy."
    - 🔓 Friction reduced — "Removed barriers between you and the habit."
  - Each has "Edit →" link

### 13.4 When You Miss Section
- [x] Implemented in `YourSystemScreen.tsx`:
  - Recovery action in quotes
  - Wisdom line: "Missing once is an accident. Missing twice is a new habit forming."
  - Light warm peach background (#FDF8F4)

### 13.5 Why This Works Section
- [x] Implemented in `YourSystemScreen.tsx`:
  - Collapsible (expand/collapse with state)
  - Bulleted list from system.whyItFits

### 13.6 Edit Bottom Sheet
- [x] Create `src/components/system/EditBottomSheet.tsx`:
  - Slide-up sheet with animation
  - Title, description, textarea, Save/Cancel
  - Keyboard handling (Enter to save, Escape to close)
  - Persists edits to habit store via callback

### 13.7 Re-Tune CTA
- [x] "Re-tune your system" button at bottom
- [x] Routes to `/tuneup` page

**Files Created:**
- `src/app/system/page.tsx`
- `src/components/system/YourSystemScreen.tsx` (all sections combined)
- `src/components/system/EditBottomSheet.tsx`

---

## Phase 14 — Data Layer Updates (R8) ✅ COMPLETE

**Goal:** Update types and persistence for new features.

**Source:** R8_20260125.md Part 5

### 14.1 RepLog Updates
- [x] Added RepLog interface with photo support
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

### 14.2 HabitSystem Type
- [x] Added HabitSystem interface with toolkit
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

### 14.3 HabitData Updates
- [x] Added new fields to HabitData:
  - `system?: HabitSystem`
  - `repLogs?: RepLog[]`
  - `feltUnderstoodRating?: number`
  - `hasCompletedFirstRepWithPhoto?: boolean`

### 14.4 Helper Functions
- [x] `generateRepLogId()` — unique ID generation
- [x] `getHabitEmoji()` — emoji from anchor/action
- [x] `getPlanScreenState()` — determine plan screen state
- [x] `planDetailsToSystem()` — migration helper

### 14.5 Store Updates
- [x] `logRep()` — log rep with optional photo
- [x] `updateRepPhoto()` — add photo to existing rep
- [x] `saveHabitSystem()` — save system from intake
- [x] `updateSystemToolkit()` — update toolkit from tune-up
- [x] `saveFeltUnderstoodRating()` — save rating

**Files Modified:**
- `src/types/habit.ts` (types, DOMAIN_EMOJI, helpers)
- `src/lib/store/habitStore.ts` (new store functions)

---

## Phase 15 — Cleanup & Migration (moved from old Phase 9)

**Goal:** Remove old wizard code, update types.

### 15.1 Archive Old Wizard Components
- [ ] Move old step components to `src/components/setup-legacy/` (or delete)
- [ ] Remove old `ConsultStep` type references
- [ ] Remove playbook dependencies from setup flow
- [ ] Extract playbook domain knowledge into AI system prompts

### 15.2 Update Type System
- [ ] Remove wizard-specific fields from ConsultSelections
- [ ] Ensure HabitData works with new flow
- [ ] Update any type guards

### 15.3 Clean Up AI Code
- [ ] Remove old step-based prompt builders (or archive)
- [ ] Remove old fallback system
- [ ] Consolidate AI client code

### 15.4 Update Tests
- [ ] Remove/update tests for old wizard flow
- [ ] Add tests for new conversation flow
- [ ] Add tests for recommendation generation

---

## Error States & Edge Cases

Explicit handling for situations that could break the flow.

### User States

| State | Handling |
|-------|----------|
| **User clearly not ready** ("I'm just exploring") | Agent acknowledges, doesn't push to recommendations. Offers to save conversation for later. |
| **User changes mind mid-conversation** (sleep → exercise) | Agent adapts. State resets relevant fields. "Let's talk about exercise instead." |
| **User is vague and unresponsive** | After 3 low-signal turns, agent offers summary of what it knows and asks if it should proceed. |
| **User wants to skip ahead** | "I think you understand" button. Agent proceeds with current hypothesis, acknowledges uncertainty if confidence is low. |
| **Repeat user (abandoned before)** | Detect existing incomplete intakeState. Offer: "Want to pick up where we left off, or start fresh?" |

### Technical States

| State | Handling |
|-------|----------|
| **API error during conversation** | Show error inline. Offer retry. Don't lose conversation state. |
| **API error during recommendation** | "I'm having trouble generating a recommendation. Let me try again." Retry with backoff. Fallback to simpler prompt if repeated failure. |
| **User goes off-topic** | Agent redirects gently: "That's interesting — let's come back to [topic]. You mentioned [last relevant thing]..." |
| **User gives very long response** | Agent extracts key info, confirms: "I'm hearing [X] and [Y]. Is that the core of it?" |
| **Agent gives bad/generic recommendation** | "Show me alternatives" path. If all alternatives feel generic, allow free-form adjustment. |

### Recovery States

| State | Handling |
|-------|----------|
| **Page refresh during conversation** | Conversation persists in localStorage. Resume on return. |
| **Page refresh during recommendation** | If recommendation was generated, show it. Otherwise, regenerate. |
| **First rep deferred, never started** | Plan screen shows "Ready to start?" CTA. After 24h, gentle nudge. |

---

## Success Criteria — M0 Prototype

### Thesis Validation (Primary)
- [ ] **"Felt understood" score:** Average ≥4.0 out of 5
- [ ] Correlation: Users with score ≥4 have higher first-week completion rate

### Intake Quality
- [ ] Conversation feels like co-design, not interrogation
- [ ] Agent asks contextual follow-ups (not fixed checklist)
- [ ] Reflection shows pattern recognition: "So the issue isn't X, it's Y"
- [ ] Agent shares domain insight that feels earned

### Recommendation Quality
- [ ] Recommendation addresses real leverage (agent's hypothesis), not just stated goal
- [ ] "Why it fits you" references specific things from conversation
- [ ] Recommendation feels personalized, not generic

### Flow Metrics
- [ ] Time from start to first rep: <3 minutes (typical)
- [ ] Articulate users can finish in 3-4 turns
- [ ] Vague users get appropriate probing (5-6 turns)
- [ ] "Show alternatives" used <20% of time (means primary recommendation is usually good)

---

## Test Checklist

### Intake Agent Tests
- [ ] Sleep + phone scrolling → identifies phone as real blocker
- [ ] Exercise + never started → probes for anchor opportunities
- [ ] Exercise + tried many times → identifies system issue, not motivation
- [ ] Finance + wants to save → probes for awareness vs action
- [ ] Articulate user → exits in 3-4 turns
- [ ] Vague user → probes appropriately, 5-6 turns
- [ ] User says "I think you understand" → exits gracefully with current hypothesis

### Recommendation Tests
- [ ] Sleep + phone blocker → phone-removal habit recommendation
- [ ] Exercise + forgetting → anchor-focused recommendation
- [ ] Exercise + no time → tiny habit, not ambitious routine
- [ ] "Why it fits" mentions specific things from conversation
- [ ] Anchor matches stated timing

### Edge Case Tests
- [ ] User goes off-topic → agent redirects gently
- [ ] User gives one-word answers → agent probes deeper
- [ ] User changes topic mid-conversation → agent adapts
- [ ] API error → graceful handling, no data loss
- [ ] Page refresh → conversation resumes

### Full Flow Tests
- [ ] Complete flow: chat → recommendation → confirmation → first rep
- [ ] "Show alternatives" → select → confirmation works
- [ ] "I'll start later" → lands on plan screen correctly
- [ ] Data persists across page refresh
- [ ] Felt understanding prompt appears, rating stored

---

## Dependencies

### External
- Claude API for agent responses
- Existing UI component library (Button, Card)

### Internal
- `src/lib/store/habitStore.ts` — for persistence pattern
- `src/types/habit.ts` — for HabitData schema

---

## Open Questions (Resolved)

1. **Structured output vs free-form?**
   Should agent responses use JSON mode for reliable parsing, or free-form with parsing?
   - **Decision:** JSON embedded in response. Claude returns JSON object, parsed with regex match for `{...}`. Works reliably with Claude Sonnet.

2. **How to handle very low confidence?**
   If agent reaches turn 6 with low confidence, what happens?
   - **Decision:** "I think you understand" escape hatch. Agent proceeds with current hypothesis. User can refine in chat.

3. **Persist conversation after completion?**
   Store full conversation even after first rep?
   - **Decision:** Yes. Full `intakeState` stored in `HabitData.intakeState` including:
     - All messages
     - Final recommendation
     - feltUnderstoodRating
     - Completion timestamp

4. **What if recommendation is rejected?**
   User rejects all alternatives?
   - **Decision:** User stays in chat, can ask for adjustments. Agent refines recommendation based on feedback.

5. **OpenAI vs Claude?** (Added)
   - **Decision:** Claude Sonnet preferred (better conversation quality). OpenAI as fallback. Model: `claude-sonnet-4-20250514`

---

## Implementation Notes

### AI Provider Configuration
**Primary:** Claude Sonnet (`claude-sonnet-4-20250514`) via Anthropic API
**Fallback:** GPT-4o via OpenAI API

Configuration in `.env.local`:
```
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-sonnet-4-20250514
OPENAI_API_KEY=your_key_here  # fallback
OPENAI_MODEL=gpt-4o  # fallback
```

Provider selection: Anthropic preferred if `ANTHROPIC_API_KEY` is set.

### Key Architecture Decisions
1. **Single agent** — Intake + recommendation in one agent (not two separate agents)
2. **Phase-based flow** — `discovery → reflection → recommendation → refinement → ready_to_start`
3. **Separate confirmation screen** — Chat handles conversation, ConfirmationScreen handles final acceptance
4. **HabitRecommendation object** — Structured recommendation for ConfirmationScreen display

### Preserving Playbook Knowledge
Domain knowledge extracted into intake agent system prompt rather than separate playbook files.

---

## V0.4 Test Checklist (R8)

### Confirmation Screen
- [ ] Hero statement displays habit in one memorable sentence
- [ ] Context emoji matches habit domain
- [ ] Supporting paragraph flows naturally (why + if you miss)
- [ ] Rating appears below CTA, not competing with commitment
- [ ] CTA includes timing hint ("tonight" / "now")

### Photo Evidence
- [ ] Camera capture works on mobile
- [ ] Photo library picker works
- [ ] "Skip for now" allows completion without photo
- [ ] Photo stored locally (check IndexedDB/localStorage)
- [ ] Tune-up locked without photo, shows nudge

### Tune-Up Flow
- [ ] Appears only after 1st rep with photo
- [ ] Conversation asks about friction, priming, tiny version
- [ ] Extracted data saves to HabitSystem
- [ ] Can re-trigger tune-up later
- [ ] Uses Haiku model, not Sonnet

### Your System Screen
- [ ] All sections render correctly
- [ ] Ritual flow visualization works
- [ ] Toolkit cards show user content
- [ ] Edit bottom sheets work for each field
- [ ] Expand/collapse works for "Why This Works"
- [ ] Edits persist to habit store

### Plan Screen States
- [ ] Pre-first-rep: basic view, no tune-up card
- [ ] After 1st rep with photo: tune-up card appears
- [ ] After 1st rep without photo: nudge to add photo
- [ ] After tune-up: "View your system" link appears

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-21 | 1.0 | Initial plan based on R6 feedback and PRD v2 |
| 2026-01-21 | 1.1 | Updated based on feedback: confidence-based exit criteria, simplified state schema, in-conversation recommendations, added iteration strategy, error states, felt understanding metric |
| 2026-01-24 | 1.2 | V0.3 complete. Marked phases 1-8 as done. Updated decisions: single agent approach, Claude Sonnet preferred, separate ConfirmationScreen, habitRecommendation object. Added implementation details for all completed components. |
| 2026-01-25 | 1.3 | V0.4 planned (R8 feedback). Added Phases 9-15: confirmation redesign, photo evidence, tune-up conversation, plan screen updates, Your System screen, data layer updates. Renumbered cleanup phase to 15. |
| 2026-01-25 | 1.4 | V0.4 complete. Implemented all R8 feedback: hero statement confirmation, photo evidence with IndexedDB, Haiku tune-up conversation, Your System screen with edit sheets, plan screen conditional cards. All phases 9-14 marked done. |
