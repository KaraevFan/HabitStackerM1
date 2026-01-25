# Habit Stacker M1 Alpha — Build Plan

This document tracks the step-by-step implementation of the M1 Alpha milestone. Work is organized into **4 sequential epics** that follow the user journey.

**Target:** Solo-usable for 7 days with the full loop.

---

## Progress Overview

| Epic | Status | Description |
|------|--------|-------------|
| 1 | ✅ Complete | Setup Wizard (Initial Consult) |
| 2 | 🔲 Not Started | Runtime Loop (Daily Execution) |
| 3 | 🔲 Not Started | Miss Handling |
| 4 | 🔲 Not Started | Recovery & Re-entry |

---

## Epic 1: Setup Wizard (Initial Consult)

**Goal:** Translate vague intent into a survivable Week-1 contract and trigger the first rep.

**Exit Condition:** User has a confirmed plan snapshot and has completed (or deferred) their first rep.

### 1.1 Foundation & Data Model
- [x] Define TypeScript types for habit state machine (`Install → Designed → Active → Miss → Recover`)
- [x] Define types for plan artifact (anchor, action, prime, recovery, snapshot)
- [x] Define types for AI response schema (step, question, options, recommended_id, etc.)
- [x] Set up localStorage persistence layer for plan + state
- [x] Create event log structure (rep_done, miss, recovery_done, skip)

### 1.2 Setup Wizard Skeleton
- [x] Create `/setup` route with step-based navigation
- [x] Implement step progress indicator (non-intrusive)
- [x] Build reusable "consult step" component (question + 2-3 options + select)
- [x] Add "Locked ✓" visual feedback after each step confirmation

### 1.3 Step 1: Intent & Constraints
- [x] UI: Ask domain/goal + 1-3 constraints (free text)
- [x] UI: Show calm framing copy ("Week 1 = show up; we're not fixing everything")
- [ ] Wire up AI endpoint to generate initial context from user input
- [x] Store intent in local state

### 1.4 Step 2: Orientation (Read-only)
- [x] UI: Show phased map (show up → stabilize → build)
- [x] Auto-confirm behavior (no user action required beyond "Got it")
- [x] Explain "what good looks like" in simple terms

### 1.5 Step 3: Define Success This Week
- [x] Placeholder: Generate 2-3 bounded outcomes based on intent (hardcoded, AI later)
- [x] UI: Display options with "why this works" per option
- [x] UI: Highlight recommended option
- [x] Store selected outcome

### 1.6 Step 4: Planning (Compressed Proposal)
- [x] Placeholder: Generate complete plan proposal (hardcoded, AI later)
- [x] UI: Show proposal as single card with all 4 elements
- [x] UI: Allow light edits (optional text tweaks, not full reconfiguration)
- [ ] Validate time constraints (action ≤2m, prime ≤30s, recovery ≤30s)
- [x] Store approved plan

### 1.7 Step 5: Confirm Snapshot
- [x] UI: Show 2-line contract only
  - Line 1: "Week 1: [outcome]"
  - Line 2: "After [anchor], [action]"
- [x] One dominant CTA: "Start today (2 min)"
- [x] Brief "why it works" collapsible

### 1.8 Step 6: First Rep
- [x] Route to first rep execution screen
- [x] Show action with timer/guidance
- [x] "Done" button logs rep and transitions to Active state
- [x] "Not now" option with no shame copy
- [x] Update persistence: reps_count = 1, last_done = today

### 1.9 AI Integration
- [x] Set up API route for AI calls (`/api/consult`)
- [x] Implement prompt templates for each step (base + step-specific)
- [x] Add schema validation for AI responses
- [x] Handle AI errors gracefully (retry + fallback to hardcoded options)
- [x] Ensure forbidden language filter (streak, failure, discipline, lazy, shame)
- [x] Wire up SuccessWeekStep to use AI with loading state
- [x] Wire up PlanningStep to use AI with loading state

**Files created:**
- `src/lib/ai/client.ts` - OpenAI client with retry logic
- `src/lib/ai/prompts.ts` - Base + step-specific prompt builders
- `src/lib/ai/schema.ts` - Validation for responses + forbidden terms
- `src/lib/ai/useConsultAI.ts` - React hook with fallback support
- `src/app/api/consult/route.ts` - API route for AI calls

### Epic 1 Acceptance Criteria
- [ ] Can complete setup in < 3 minutes
- [ ] AI generates 2-3 plausible options per step
- [ ] Snapshot is exactly 2 lines + one CTA
- [ ] First rep is logged with correct state transition
- [ ] No streak language anywhere

---

## Epic 2: Runtime Loop (Daily Execution)

**Goal:** Make execution trivial without re-deciding the habit.

**Exit Condition:** User can open app, see their plan, do today's rep, and have it logged with continuity framing.

### 2.1 Intent (Plan) Screen
- [x] Create home/dashboard route that shows plan snapshot
- [x] Display 2-line contract prominently
- [x] Show "why this works" (collapsible)
- [x] Show continuity stats: "Reps: X | Last done: [date]"
- [x] One dominant CTA: "Start today's rep"
- [x] Handle first-time vs returning user routing

### 2.2 Today Screen
- [ ] Show single "Next step" card with action (≤2m)
- [ ] Optional: show prime if user hasn't done it
- [ ] Timer or simple guidance for the action
- [ ] Two buttons: "Done" / "Missed"
- [ ] Clear, calm design focused on the one action

### 2.3 Completion Screen
- [ ] Log rep to event history
- [ ] Update reps_count and last_done
- [ ] Show confirmation without streak language
- [ ] Display updated stats: "Reps: X | Last done: today"
- [ ] Optional: 1-line friction note input ("What got in the way?")
- [ ] CTA: "Back to Plan"

### 2.4 State & Persistence
- [ ] Implement state machine transitions (Active → Active on completion)
- [ ] Ensure event log captures: timestamp, event_type, notes
- [ ] Sync to localStorage reliably
- [ ] Handle edge case: multiple completions same day

### 2.5 Continuity Framing
- [ ] Never use "streak" anywhere
- [ ] Calculate and display: total reps, days since last rep
- [ ] Use language: "Continuity preserved" on completion

### Epic 2 Acceptance Criteria
- [ ] Can complete daily rep in < 30 seconds (after opening app)
- [ ] Stats update correctly after each completion
- [ ] No streak language anywhere
- [ ] State persists across browser sessions

---

## Epic 3: Miss Handling

**Goal:** Treat misses as normal and route deterministically to recovery.

**Exit Condition:** User can mark a day as "Missed" and be routed to Recovery action on next app open.

### 3.1 Miss Event Path
- [ ] "Missed" button on Today screen triggers Miss state
- [ ] Log miss event to event history
- [ ] Set current_state = "Missed"
- [ ] Store missed_date for tracking

### 3.2 Miss Screen
- [ ] UI: Normalize the miss with calm copy
- [ ] Show: "Misses happen. Here's how to get back on track."
- [ ] Display recovery action (≤30s)
- [ ] Two options: "Do recovery now" / "Skip for now"
- [ ] No shame language, no stats shaming

### 3.3 Immediate Recovery Path
- [ ] If user chooses "Do recovery now":
  - Execute recovery action flow
  - Log recovery_done event
  - Transition to Active state
  - Show completion confirmation

### 3.4 Skip Path
- [ ] If user chooses "Skip for now":
  - Log skip event
  - Keep state as Missed
  - Return to Intent screen
  - Next open will still route to Recovery

### 3.5 Next Open Routing
- [ ] On app open, check if current_state === "Missed"
- [ ] If Missed: route directly to Recovery action (forced next step)
- [ ] Recovery screen shows the ≤30s action
- [ ] Cannot proceed to normal Today until recovery addressed

### 3.6 Copy & Tone
- [ ] Write all miss-related copy with normalization
- [ ] Examples: "One miss doesn't reset anything" / "Recovery takes 30 seconds"
- [ ] Avoid: any implication that progress is lost

### Epic 3 Acceptance Criteria
- [ ] Miss → next open forces Recovery action
- [ ] Recovery completion restores Active state
- [ ] Skip preserves miss state (next open still shows Recovery)
- [ ] No shame copy anywhere in miss flow
- [ ] Event log captures miss, recovery_done, and skip correctly

---

## Epic 4: Recovery & Re-entry

**Goal:** Handle recovery completion and support re-entry after inactivity.

**Exit Condition:** Full loop works: Active → Miss → Recovery → Active. Re-entry after 7+ days is calm.

### 4.1 Recovery Completion
- [ ] Recovery action screen with ≤30s action
- [ ] "Done" logs recovery_done event
- [ ] Transition state: Missed → Active
- [ ] Show confirmation: "You're back. Continuity preserved."
- [ ] Return to Intent/Plan screen

### 4.2 Re-entry Detection
- [ ] Calculate days since last activity
- [ ] If inactive ≥ 7 days: trigger re-entry flow
- [ ] Store last_active_date for calculation

### 4.3 Re-entry Screen (A2)
- [ ] "Welcome back" screen with no stats shaming
- [ ] Calm copy: "Life happens. Let's pick up where you left off."
- [ ] Default action: route to tiny-only mode for 3 days OR Recovery action
- [ ] Keep it simple: one clear next step
- [ ] Optional: "Re-design habit" link (shortened wizard)

### 4.4 Tiny-Only Mode (optional)
- [ ] If implementing tiny mode: reduce action to recovery-sized (≤30s) for 3 days
- [ ] After 3 days, prompt to return to full action
- [ ] Or simply route to Recovery action on re-entry

### 4.5 Basic Reminders (A1)
- [ ] Settings: single daily reminder time
- [ ] Reminder copy: "Ready for today's 2 min?" (no shame)
- [ ] Simple snooze option
- [ ] Optional: quiet hours toggle
- [ ] Use browser notifications (or note for future mobile)

### 4.6 Safe Tuning After Evidence (A3)
- [ ] Track reps_count
- [ ] After 3 reps: unlock one knob edit
- [ ] Allowed edits: action size OR anchor OR time/context
- [ ] UI: show "Adjust" option only after 3 reps
- [ ] Only one change per session
- [ ] Update plan snapshot after change

### 4.7 Plan Tab as Artifact (A4)
- [ ] Snapshot visible at all times on Plan screen
- [ ] "Why this works" visible but collapsible
- [ ] Recovery section appears after first miss
- [ ] Progression remains locked (placeholder)
- [ ] Backlog can show as placeholder

### 4.8 Trust Basics (A5)
- [ ] "Reset data" option in settings
- [ ] "Clear all data" with confirmation
- [ ] "Send feedback" link (mailto or form)
- [ ] Basic privacy note (data stored locally)

### Epic 4 Acceptance Criteria
- [ ] Full loop: Active → Miss → Recovery → Active works reliably
- [ ] Re-entry after ≥7 days is calm and leads to rep within 60 seconds
- [ ] After 3 reps, can adjust one knob without breaking state
- [ ] Reminders work and use non-shame copy
- [ ] Can reset/delete data

---

## Cross-Cutting Concerns

### Persistence Layer
- [ ] localStorage wrapper with error handling
- [ ] Data schema versioning for migrations
- [ ] Backup/restore capability (optional)

### State Machine
- [ ] Clear state transitions documented
- [ ] No invalid state combinations possible
- [ ] State changes logged to event history

### Copy & Language
- [ ] All copy reviewed for forbidden terms
- [ ] Calm, practical, non-cheerleading tone
- [ ] Normalization of misses explicit

### Error Handling
- [ ] AI call failures show friendly fallback
- [ ] localStorage failures handled gracefully
- [ ] Network errors don't break the loop

---

## Testing Checklist (Smoke Test)

- [ ] Consult completion → snapshot renders correctly
- [ ] Done → logs updated (reps count, last_done)
- [ ] Miss → recovery forced on next open
- [ ] Recovery completion → Active state restored
- [ ] 7-day self-run with ≥2 misses and ≥2 recoveries
- [ ] Re-entry after ≥7 days is calm

---

## Tech Stack Notes

- **Framework:** Next.js (App Router)
- **Styling:** TBD (Tailwind recommended)
- **State:** React state + localStorage persistence
- **AI:** API route calling OpenAI (or Anthropic)
- **Testing:** Manual smoke tests for M1

---

## Decision Log Reference

See `docs/decisions.md` for architectural decisions and state/schema changes.
