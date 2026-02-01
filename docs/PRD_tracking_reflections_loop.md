# PRD: Tracking & Reflection Loop

**Version:** 1.0  
**Date:** 2026-02-01  
**Status:** Ready for Implementation  
**Estimated Effort:** 1 day (half-day each: Daily Logging + Patterns, Weekly Reflection)

---

## Executive Summary

This PRD specifies the tracking and reflection loop that transforms Habit Stacker from a "button logger" into a continuous coaching experience. The core insight: **every touchpoint should feel like returning to the coach**, not just recording data.

Three interconnected systems:

1. **Daily Check-in Conversation** — Post-logging micro-reflection that captures context
2. **Patterns System** — AI-generated insights + one actionable suggestion (after 7+ check-ins)
3. **Weekly Reflection** — Structured "is this still right?" conversation with system adjustment

---

## Part 1: Daily Check-in Conversation

### Problem

Current flow: Tap CTA → Select outcome → Difficulty rating → Done.

This reduces the AI to a button. The user never re-engages with the coach after intake. The rich conversational relationship established during consultation evaporates into transactional logging.

### Solution

After logging outcome + difficulty, the user enters a **brief conversational interface** with the AI. This creates micro-reflections that:
- Maintain the "coach checking back in" feeling
- Capture contextual data that feeds Patterns
- Provide immediate positive reinforcement or gentle guidance
- Keep conversation as the hero (per design brief)

### Flow Specification

```
User taps "Mark today's rep"
    │
    ▼
CheckInOptions (existing)
    │ Select outcome: Done / Can't today / (reactive variants)
    │
    ▼
Outcome recorded
    │
    ▼
DifficultyRating (existing)
    │ How hard was that? 1-5
    │
    ▼
Difficulty recorded
    │
    ▼
┌─────────────────────────────────────────────┐
│  NEW: CheckInConversation                   │
│                                             │
│  Chat interface with AI                     │
│  - 1-2 exchanges max                        │
│  - Context-aware opening based on outcome   │
│  - User can respond or skip                 │
│  - Ends with affirmation + optional nudge   │
│                                             │
│  [Skip for now] button always visible       │
└─────────────────────────────────────────────┘
    │
    ▼
CheckInComplete
    │ Summary + navigation back to home
```

### AI Opening Messages (Context-Aware)

The AI's opening message varies based on:
- **Outcome** (success vs miss)
- **Difficulty** (1-2 easy, 3 moderate, 4-5 hard)
- **Recent history** (streak, recent misses, patterns)

#### Success + Easy (difficulty 1-2)

```
"Nice work! Anything click today that made it easier?"
```

```
"Smooth one today. Was there something about your setup that helped?"
```

```
"That looked effortless. What's working well right now?"
```

#### Success + Moderate (difficulty 3)

```
"You did it. What made today a 3 instead of easier?"
```

```
"Got it done! Anything feel like it almost got in the way?"
```

#### Success + Hard (difficulty 4-5)

```
"That took real effort today. What made it tough?"
```

```
"You pushed through something hard. What was fighting against you?"
```

```
"Respect — that wasn't easy. What almost stopped you?"
```

#### Miss (any difficulty)

```
"No worries — misses happen. What got in the way today?"
```

```
"That's okay. What would have needed to be different for this to work?"
```

#### After Recovery Completion

```
"Good — you're back. How did that recovery action feel?"
```

#### Streak Context (7+ consecutive successes)

```
"That's [N] in a row. What's making this stick?"
```

### AI Response Logic

After user responds to opening, AI provides:

1. **Acknowledgment** — Brief reflection of what user shared
2. **Insight or Affirmation** — Connect to identity or pattern
3. **Optional Nudge** — Only if response suggests adjustment needed

**Response Templates:**

For positive/neutral responses:
```
"[Acknowledgment]. That's the kind of thing that compounds — you're building the identity of someone who [identity statement]."
```

For responses indicating friction:
```
"[Acknowledgment]. That's useful to know. If [friction] keeps showing up, we might want to adjust [anchor/timing/environment]. For now, you showed up — that's what matters in Week 1."
```

For responses indicating potential system issue:
```
"[Acknowledgment]. That sounds like a pattern worth watching. If this happens again, let's talk about tweaking your system. The goal is survivable, not heroic."
```

### Skip Behavior

- "Skip for now" button visible throughout conversation
- Skipping logs `conversationSkipped: true` in check-in
- No penalty or guilt — button text is neutral
- Skip rate tracked for patterns analysis

### Data Captured

Each check-in conversation captures:

```typescript
interface CheckInConversation {
  messages: ConversationMessage[];  // User + AI exchanges
  skipped: boolean;
  duration: number;                 // Seconds from open to close
  userResponseLength: number;       // Character count (proxy for engagement)
}
```

This feeds into the Patterns system.

### UI Specifications

**Layout:** Same chat interface as intake, but shorter context window

**Styling:** Per design brief
- Warm cream background (`--bg-primary`)
- AI messages: `--ai-message-bg` with subtle border
- User messages: `--user-message-bg` (teal)
- Input area with send button
- "Skip for now" as subtle text button below input

**Animation:** Messages animate in with `message-enter` keyframes

**Mobile:** Full-screen takeover. Input at bottom with safe area padding.

**Timeout:** If user doesn't respond within 30 seconds, show gentle prompt:
```
"Take your time, or skip for now — either is fine."
```

### Implementation Notes

- Reuse existing chat components from intake (`ChatInterface`, `Message`, etc.)
- AI responses generated via same pattern as intake (Sonnet or Haiku — test both)
- Conversation stored in `checkIn.conversation` field
- Keep context minimal: current check-in + recent 3 check-ins + system summary

---

## Part 2: Patterns System

### Purpose

Surface AI-generated insights from accumulated check-in data. Make the logging feel *meaningful* — your data goes somewhere visible and useful.

### Trigger

- **Appears after:** 7+ check-ins logged
- **Updates:** Weekly (not real-time)
- **Location:** Journey tab, "Patterns" card

### Placeholder State (< 7 check-ins)

```
PATTERNS

Insights will appear here after 7 check-ins.

You have [N] so far. Keep going!

[Visual: 7 dots, [N] filled, (7-N) empty]
```

### Active State (≥ 7 check-ins)

```
WHAT I'M NOTICING

Based on your last [N] check-ins:

✓ Strong days: [insight]
⚠ Watch out: [insight]
→ Suggestion: [one actionable recommendation]

[Generated [date] · Updates weekly]
```

### Insight Categories

The AI analyzes check-in data across these dimensions:

| Category | Data Source | Example Insight |
|----------|-------------|-----------------|
| Day-of-week patterns | Check-in timestamps | "Weekdays are strong (8/10), weekends struggle (2/5)" |
| Time-of-day patterns | Check-in timestamps | "You typically complete around 9:15pm — right on target" |
| Difficulty trends | Difficulty ratings | "Average difficulty is dropping (3.2 → 2.4) — the habit is settling in" |
| Miss patterns | Outcome + conversation | "Both misses happened on days you mentioned being tired" |
| Conversation themes | NLP on conversation text | "Energy level comes up often — might be worth tracking" |
| Skip rate | `conversationSkipped` | "You've been skipping reflections — the quick data still helps!" |
| Recovery success | Recovery completions | "You've recovered from all 3 misses — that's rare and important" |

### AI Prompt for Pattern Generation

```
You are the Pattern Finder for a habit tracking app. Analyze the user's check-in history and generate 2-3 insights plus one specific suggestion.

USER'S HABIT SYSTEM:
{habitSystem}

CHECK-IN HISTORY (last 14 days):
{checkIns}

RULES:
1. Always lead with something positive (a "Strong days" insight)
2. Be specific — reference actual days, times, or patterns you see
3. Never be punitive or shame-inducing
4. The suggestion should be ONE specific, actionable adjustment
5. If data is too sparse for real patterns, acknowledge that honestly
6. Keep total output under 100 words

OUTPUT FORMAT:
{
  "strongDays": "string — what's working",
  "watchOut": "string — what to monitor (can be null if nothing concerning)",
  "suggestion": "string — one specific action",
  "confidence": "high" | "medium" | "low",
  "generatedAt": "ISO date"
}
```

### Suggestion Types

The suggestion should map to a concrete system adjustment:

| Pattern Detected | Suggestion | Action |
|-----------------|------------|--------|
| Weekend drops | "Consider a different anchor for weekends" | Links to system edit |
| High difficulty persists | "Your tiny version might need to be tinier" | Links to tune-up |
| Time drift (completing later) | "Your anchor might be fighting your energy" | Links to system edit |
| Miss after late nights | "A 'tired mode' backup could help" | Suggests recovery adjustment |
| Conversation themes | "You mentioned [X] often — worth exploring in weekly reflection" | Flags for reflection |

### UI Specifications

**Card in Journey Tab:**

```
┌─────────────────────────────────────────┐
│  WHAT I'M NOTICING                      │
│                                         │
│  ✓ Strong days: Weekdays are solid      │
│    (8/10 completed)                     │
│                                         │
│  ⚠ Watch out: Saturday has been         │
│    tricky (1/2 this month)              │
│                                         │
│  → Your anchor is "after dinner" but    │
│    weekends dinner is less consistent.  │
│    Consider a time-based anchor for     │
│    Saturdays?                           │
│                                         │
│  [Adjust anchor]  [Dismiss for now]     │
│                                         │
│  ─────────────────────────────────────  │
│  Generated Jan 30 · Updates weekly      │
└─────────────────────────────────────────┘
```

**Styling:**
- Card background: `--bg-secondary`
- Checkmark: `--success` (muted green)
- Warning triangle: `--warning` (warm amber)
- Arrow: `--accent-primary` (teal)
- Suggestion text: Slightly emphasized, not shouty
- Meta text (generated date): `--text-tertiary`, small

**Interactions:**
- "Adjust anchor" → Opens system edit bottom sheet
- "Dismiss for now" → Hides card until next weekly refresh
- Tapping card → Expands to show full reasoning (optional, can defer)

### Data Model

```typescript
interface PatternAnalysis {
  id: string;
  generatedAt: string;           // ISO date
  checkInsAnalyzed: number;      // Count of check-ins in analysis
  strongDays: string;
  watchOut: string | null;
  suggestion: string;
  suggestionType: 'anchor' | 'tiny_version' | 'recovery' | 'timing' | 'general';
  suggestionActionable: boolean; // Can we link to a specific edit?
  confidence: 'high' | 'medium' | 'low';
  dismissed: boolean;
  dismissedAt?: string;
}

// Add to HabitData
interface HabitData {
  // ... existing fields
  patterns?: PatternAnalysis[];  // Historical pattern analyses
  latestPattern?: PatternAnalysis;
}
```

### Refresh Logic

- Patterns regenerate weekly (every 7 days from first generation)
- Also regenerate after significant events:
  - 3+ consecutive misses
  - User completes weekly reflection
  - User makes system adjustment
- Store historical patterns for longitudinal analysis (future feature)

---

## Part 3: Weekly Reflection

### Purpose

Create a structured "is this still right?" moment that:
- Prevents silent drift from the system
- Captures qualitative feedback
- Results in one specific adjustment recommendation
- Reinforces the coaching relationship

### Trigger

- **Appears:** 7 days after system creation, then every 7 days
- **Location:** Prompt on home screen + dedicated flow
- **Persistence:** Banner remains until completed or dismissed

### Home Screen Prompt

```
┌─────────────────────────────────────────┐
│  ☀️  WEEKLY CHECK-IN                     │
│                                         │
│  It's been a week. Let's see how your   │
│  system is holding up.                  │
│                                         │
│  [Start check-in]       [Remind me later]│
└─────────────────────────────────────────┘
```

**Behavior:**
- "Start check-in" → Opens WeeklyReflectionFlow
- "Remind me later" → Dismisses for 24 hours, then returns
- Auto-dismiss after 3 days if not completed (with note in history)

### Reflection Flow

```
WeeklyReflectionFlow
    │
    ▼
Screen 1: Week Summary
    │ Visual summary of the week
    │ (Reps, difficulty trend, any misses)
    │
    ▼
Screen 2: Sustainability Question
    │ "Did this habit feel sustainable this week?"
    │ [Yes] [Mostly] [No]
    │
    ▼
Screen 3: Friction Question
    │ "What got in the way, if anything?"
    │ [Free text input]
    │ [Nothing — it worked great] (skip option)
    │
    ▼
Screen 4: AI Recommendation
    │ One specific suggestion based on inputs
    │ [Accept] [Not now]
    │
    ▼
Screen 5: Reflection Complete
    │ Affirmation + plan for next week
```

### Screen Specifications

#### Screen 1: Week Summary

```
YOUR WEEK

[7-day dots visualization]

Completed: 5 of 7
Difficulty trend: Getting easier (3.4 → 2.8)
Longest run: 4 days

[Continue]
```

**Logic:**
- Pull from check-in data
- Calculate difficulty trend (average of first half vs second half)
- Note if all 7 completed (celebrate!)
- Note if 0 completed (gentle, not punitive)

#### Screen 2: Sustainability Question

```
QUICK CHECK

Did this habit feel sustainable this week?

[Yes — I could keep doing this]

[Mostly — a few tough moments]

[No — this was a struggle]
```

**Styling:**
- Three large tappable buttons
- Ample spacing
- Current selection highlighted with accent color

#### Screen 3: Friction Question

```
WHAT GOT IN THE WAY?

If anything made this harder than it needed to be,
I'd like to know.

[Text input area]

[Nothing — it worked great]
```

**Behavior:**
- Text input expands as user types
- "Nothing" button skips to next screen
- Capture verbatim for AI analysis

#### Screen 4: AI Recommendation

```
HERE'S WHAT I'D SUGGEST

Based on your week:

[AI-generated recommendation]

This would mean:
• [Specific change 1]
• [Specific change 2 if applicable]

[Accept and update]    [Not now]
```

**AI Prompt for Recommendation:**

```
You are the Reflection Partner for a habit tracking app. Based on the user's weekly reflection, generate ONE specific recommendation.

HABIT SYSTEM:
{habitSystem}

WEEK'S CHECK-INS:
{checkIns}

USER'S SUSTAINABILITY ANSWER: {sustainability}
USER'S FRICTION RESPONSE: {friction}

RULES:
1. If sustainability = "Yes" and friction = null, affirm and suggest no changes
2. If sustainability = "Mostly", suggest a minor tweak
3. If sustainability = "No", suggest a significant adjustment or tiny version
4. Be specific — reference their actual system components
5. The recommendation should be immediately actionable
6. Never suggest adding more habits
7. Never suggest increasing difficulty

OUTPUT FORMAT:
{
  "recommendation": "string — the suggestion",
  "changes": ["string array — specific changes this would make"],
  "appliesTo": "anchor" | "action" | "tiny_version" | "recovery" | "timing" | "none",
  "requiresSystemUpdate": boolean
}
```

**Recommendation Types:**

| Scenario | Example Recommendation |
|----------|----------------------|
| Sustainable + no friction | "Your system is dialed in. No changes needed — just keep showing up." |
| Sustainable + minor friction | "You mentioned mornings are rushed. What if we shifted your anchor 30 minutes earlier?" |
| Mostly + timing friction | "The 9pm anchor seems to compete with evening wind-down. Consider moving to right after dinner instead." |
| Not sustainable + energy friction | "This might be too ambitious for Week 1. What if we dropped to your tiny version for the next week?" |
| Not sustainable + motivation | "The habit might not be connected to something you care about. Let's revisit why you wanted this." |

**"Accept and update" Behavior:**
- If `requiresSystemUpdate: true`, apply changes directly to HabitSystem
- Show confirmation of what changed
- Log the adjustment in reflection history

**"Not now" Behavior:**
- Stores recommendation in reflection history (user can revisit)
- Does not apply changes
- No guilt or follow-up pressure

#### Screen 5: Reflection Complete

```
WEEK 2 STARTS NOW

You reflected. You adjusted. You're still here.

That's how habits actually get built — not through
perfection, but through iteration.

[See your updated system]    [Back to home]
```

**Variation if no changes made:**

```
WEEK 2 STARTS NOW

Your system is working. Protect it.

The goal this week: same actions, same anchor,
same you showing up.

[Back to home]
```

### Data Model

```typescript
interface WeeklyReflection {
  id: string;
  weekNumber: number;           // Week 1, Week 2, etc.
  completedAt: string;          // ISO date
  sustainability: 'yes' | 'mostly' | 'no';
  friction: string | null;      // User's free text
  recommendation: {
    text: string;
    changes: string[];
    appliesTo: string;
    accepted: boolean;
    appliedAt?: string;
  };
  checkInsSummary: {
    completed: number;
    total: number;
    avgDifficulty: number;
    difficultyTrend: 'easier' | 'stable' | 'harder';
  };
}

// Add to HabitData
interface HabitData {
  // ... existing fields
  reflections?: WeeklyReflection[];
  nextReflectionDue?: string;   // ISO date
}
```

### UI Specifications

**General:**
- Full-screen flow (not modal)
- Progress indicator showing current step (dots or bar)
- Back button on each screen
- Calm transitions between screens

**Typography:**
- Screen titles: Fraunces, 24px (--text-2xl)
- Body: Outfit, 16px (--text-base)
- Buttons: Outfit medium, 14px (--text-sm)

**Animation:**
- Screens slide in from right
- Selections animate with subtle scale

---

## Part 4: Integration & Data Flow

### How Systems Connect

```
Daily Check-in
    │
    ├── Logs outcome + difficulty
    ├── Captures conversation (or skip)
    │
    ▼
Check-in Data Accumulates
    │
    │ After 7+ check-ins
    ▼
Patterns System
    │
    ├── Generates insights weekly
    ├── Suggests ONE adjustment
    │
    │ Every 7 days
    ▼
Weekly Reflection
    │
    ├── Structured sustainability check
    ├── Captures friction qualitatively
    ├── AI recommends adjustment
    ├── User accepts or defers
    │
    ▼
System Updated (if accepted)
    │
    └── Patterns recalculate
```

### Shared Data Sources

| Data | Used By | Purpose |
|------|---------|---------|
| Check-in timestamps | Patterns | Day/time analysis |
| Difficulty ratings | Patterns, Reflection | Trend detection |
| Conversation text | Patterns | Theme extraction |
| Sustainability answer | Reflection AI | Recommendation calibration |
| Friction text | Reflection AI, Patterns | Qualitative context |
| System adjustments | Patterns | Before/after comparison |

### State Management

Add to `habitStore.ts`:

```typescript
// New actions
logCheckInConversation(checkInId: string, conversation: CheckInConversation): void;
generatePatterns(): Promise<PatternAnalysis>;
dismissPattern(patternId: string): void;
startWeeklyReflection(): void;
completeWeeklyReflection(reflection: WeeklyReflection): void;
applyReflectionRecommendation(reflectionId: string): void;

// New selectors
getLatestPattern(): PatternAnalysis | null;
getReflectionsDue(): boolean;
getWeekNumber(): number;
```

---

## Part 5: Implementation Priorities

### Phase A: Daily Check-in Conversation (2-3 hours)

1. Create `CheckInConversation.tsx` component
2. Integrate after difficulty rating in `CheckInFlow.tsx`
3. Wire up AI response generation (test Haiku first for speed)
4. Add skip functionality
5. Store conversation in check-in data

### Phase B: Patterns System (2-3 hours)

1. Create `PatternAnalysis` generation function
2. Create `PatternsCard.tsx` component
3. Add to Journey tab
4. Implement placeholder state for < 7 check-ins
5. Wire up suggestion actions (link to system edit)

### Phase C: Weekly Reflection (3-4 hours)

1. Create `WeeklyReflectionFlow.tsx` with 5 screens
2. Create week summary calculation logic
3. Wire up AI recommendation generation
4. Implement "Accept and update" system mutation
5. Add home screen prompt/banner
6. Implement reminder logic (24-hour snooze)

### Testing Checklist

- [ ] Fresh user: No patterns card, no reflection prompt
- [ ] After 7 check-ins: Patterns card appears with insights
- [ ] Pattern suggestion links to correct system edit
- [ ] After 7 days: Reflection prompt appears on home
- [ ] "Remind me later" hides prompt for 24 hours
- [ ] Reflection captures sustainability + friction
- [ ] AI recommendation is specific and actionable
- [ ] "Accept" updates system correctly
- [ ] Reflection history persists
- [ ] Skip conversation in daily check-in works

---

## Appendix: Copy Bank

### Daily Check-in Conversation Openers

**Success variants:**
- "Nice work! Anything click today that made it easier?"
- "That's another one. What's making this stick?"
- "Smooth. Was your setup working for you?"
- "You showed up. That's the whole game in Week 1."
- "[N] in a row. What's your secret?"

**Struggle variants:**
- "That took effort. What made today harder?"
- "You pushed through. What almost stopped you?"
- "Respect — that wasn't easy. What were you fighting?"

**Miss variants:**
- "No worries — misses happen. What got in the way?"
- "That's data, not failure. What would've helped?"
- "Okay. What needed to be different today?"

### Patterns Insights

**Positive:**
- "Weekdays are your strength — [X] of [Y] completed"
- "Your difficulty is dropping — the habit is settling in"
- "You've recovered from every miss — that's the real skill"
- "Consistency is building — 3 days in a row twice now"

**Watchful:**
- "Weekends have been tricky — only [X] of [Y]"
- "Difficulty is staying high — might be worth simplifying"
- "You've skipped reflections lately — the quick data still helps"
- "Late-night check-ins might signal a timing issue"

### Weekly Reflection Affirmations

- "Your system is working. Protect it."
- "You reflected. You adjusted. That's how habits get built."
- "Week [N] starts now. Same you, same commitment."
- "Not perfect. Not heroic. Sustainable. That's the goal."

---

## Open Questions (Resolve During Build)

1. **AI model for daily conversation:** Haiku (faster, cheaper) vs Sonnet (higher quality)? Test both.

2. **Conversation timeout:** 30 seconds before gentle prompt, or longer?

3. **Pattern refresh trigger:** Pure weekly, or also after significant events?

4. **Reflection timing:** Morning (start of week) or evening (end of week)? Currently spec'd as 7-day rolling.

5. **Skip rate threshold:** At what point do we surface "you've been skipping reflections" in Patterns?