# Implementation Plan: Logging, Education & Reflection Systems (V0.6 Revised)

**Based on:** `docs/PRD_logging_education_reflection_systems.md`
**Date:** 2026-02-01
**Target:** M1 Alpha completion

---

## Core Insight

The PRD describes three interconnected systems, but one is foundational:

> **The Daily Check-in Conversation** — a brief chat interface after every log where the AI checks back in, acknowledges patterns, and captures micro-reflections.

This is NOT "smarter success screens" or "better whispers." It's an actual conversational exchange — the same chat UI as intake, reused for daily touchpoints.

**Why this matters:** The consultation creates a relationship. Without conversational daily touchpoints, that relationship dies the moment intake ends.

---

## Priority Order

| Priority | System | Rationale |
|----------|--------|-----------|
| **P0** | Pattern Finder | Enables intelligent conversation responses |
| **P1** | Daily Check-in Conversation | Core daily experience — actual chat interface |
| **P2** | Patterns Display + Suggestion | Makes logging feel meaningful, drives action |
| **P3** | Weekly Reflection | Structured engagement at 7-day boundary |

---

## Current State Analysis

### What Exists
- `CheckInFlow` orchestrating different habit types
- `CheckInOptions` for reactive habits (3 options)
- `CheckInOptionsTimeEvent` for time/event habits
- `CheckInSuccess` with static whisper + difficulty rating
- `CheckInMiss` with reason capture
- `RecoveryOffer` component
- `logCheckIn()` store function
- Basic whispers (static, not pattern-aware)

### What's Missing
- Pattern detection from check-in history
- Chat interface after logging (reusing intake components)
- Contextual AI responses based on outcome + difficulty + patterns
- Patterns display with actionable suggestion

---

## Phase 1: Pattern Finder Foundation
**Effort:** 4-5 hours
**Priority:** P0 — Enables intelligent conversation

Pattern detection must come first because the Daily Check-in Conversation depends on it.

### 1.1 Pattern Analysis Core

**New File:** `src/lib/patterns/patternFinder.ts`

```typescript
import { CheckIn, HabitType } from '@/types/habit';

export interface CheckInPatterns {
  // Counts
  totalCheckIns: number;
  completedCount: number;
  missedCount: number;
  noTriggerCount: number;
  recoveredCount: number;

  // Rates
  triggerOccurrenceRate: number;
  responseRateWhenTriggered: number;
  recoveryRate: number;
  outcomeSuccessRate: number;

  // Streaks
  currentStreak: number;
  currentNoTriggerStreak: number;
  longestStreak: number;

  // Day-of-week
  dayOfWeekStats: Record<string, { completed: number; missed: number; total: number }>;
  strongDays: string[];
  weakDays: string[];

  // Miss patterns
  missReasonCounts: Record<string, number>;
  repeatedMissReason: string | null;

  // Difficulty
  averageDifficulty: number;
  difficultyTrend: 'decreasing' | 'stable' | 'increasing';

  // Trends (last 7 vs previous 7)
  trends: {
    responseRateImproving: boolean;
    triggerOccurrenceDecreasing: boolean;
    difficultyDecreasing: boolean;
  };

  // Milestone flags
  isFirstRep: boolean;
  isFirstMiss: boolean;
  isFirstRecovery: boolean;
  justCompletedWeek1: boolean;
}

export function analyzePatterns(
  checkIns: CheckIn[],
  habitType: HabitType
): CheckInPatterns {
  // Sort by date descending (most recent first)
  const sorted = [...checkIns].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Basic counts
  const completedCount = sorted.filter(c => c.triggerOccurred && c.actionTaken).length;
  const missedCount = sorted.filter(c => c.triggerOccurred && !c.actionTaken).length;
  const noTriggerCount = sorted.filter(c => !c.triggerOccurred).length;
  const recoveredCount = sorted.filter(c => c.recoveryCompleted).length;

  // Rates
  const triggerOccurrenceRate = sorted.length > 0
    ? sorted.filter(c => c.triggerOccurred).length / sorted.length
    : 0;

  const triggeredCheckIns = sorted.filter(c => c.triggerOccurred);
  const responseRateWhenTriggered = triggeredCheckIns.length > 0
    ? triggeredCheckIns.filter(c => c.actionTaken).length / triggeredCheckIns.length
    : 0;

  // Current streak
  let currentStreak = 0;
  for (const checkIn of sorted) {
    if (checkIn.triggerOccurred && checkIn.actionTaken) {
      currentStreak++;
    } else if (checkIn.triggerOccurred && !checkIn.actionTaken) {
      break;
    }
    // No-trigger doesn't break streak for reactive habits
    if (habitType !== 'reactive' && !checkIn.triggerOccurred) {
      break;
    }
  }

  // No-trigger streak (for reactive habits)
  let currentNoTriggerStreak = 0;
  for (const checkIn of sorted) {
    if (!checkIn.triggerOccurred) {
      currentNoTriggerStreak++;
    } else {
      break;
    }
  }

  // Day of week analysis
  const dayOfWeekStats = analyzeDayOfWeek(sorted);
  const { strongDays, weakDays } = identifyStrongWeakDays(dayOfWeekStats);

  // Miss reason patterns
  const missReasonCounts = countMissReasons(sorted);
  const repeatedMissReason = findRepeatedReason(missReasonCounts);

  // Difficulty analysis
  const difficulties = sorted.filter(c => c.difficulty).map(c => c.difficulty!);
  const averageDifficulty = difficulties.length > 0
    ? difficulties.reduce((a, b) => a + b, 0) / difficulties.length
    : 3;
  const difficultyTrend = calculateDifficultyTrend(sorted);

  // Trends
  const trends = analyzeTrends(sorted);

  // Milestones
  const isFirstRep = completedCount === 1;
  const isFirstMiss = missedCount === 1;
  const isFirstRecovery = recoveredCount === 1;
  const justCompletedWeek1 = sorted.length === 7;

  return {
    totalCheckIns: sorted.length,
    completedCount,
    missedCount,
    noTriggerCount,
    recoveredCount,
    triggerOccurrenceRate,
    responseRateWhenTriggered,
    recoveryRate: missedCount > 0 ? recoveredCount / missedCount : 0,
    outcomeSuccessRate: calculateOutcomeSuccessRate(sorted),
    currentStreak,
    currentNoTriggerStreak,
    longestStreak: calculateLongestStreak(sorted, habitType),
    dayOfWeekStats,
    strongDays,
    weakDays,
    missReasonCounts,
    repeatedMissReason,
    averageDifficulty,
    difficultyTrend,
    trends,
    isFirstRep,
    isFirstMiss,
    isFirstRecovery,
    justCompletedWeek1,
  };
}

// Helper function stubs - implement based on actual data structure
function analyzeDayOfWeek(checkIns: CheckIn[]): Record<string, any> { /* ... */ }
function identifyStrongWeakDays(stats: Record<string, any>): { strongDays: string[]; weakDays: string[] } { /* ... */ }
function countMissReasons(checkIns: CheckIn[]): Record<string, number> { /* ... */ }
function findRepeatedReason(counts: Record<string, number>): string | null { /* ... */ }
function calculateDifficultyTrend(checkIns: CheckIn[]): 'decreasing' | 'stable' | 'increasing' { /* ... */ }
function analyzeTrends(checkIns: CheckIn[]): any { /* ... */ }
function calculateOutcomeSuccessRate(checkIns: CheckIn[]): number { /* ... */ }
function calculateLongestStreak(checkIns: CheckIn[], habitType: HabitType): number { /* ... */ }
```

### 1.2 Pattern Hook

**New File:** `src/hooks/useCheckInPatterns.ts`

```typescript
import { useMemo } from 'react';
import { HabitData } from '@/types/habit';
import { analyzePatterns, CheckInPatterns } from '@/lib/patterns/patternFinder';

export function useCheckInPatterns(habitData: HabitData | null): CheckInPatterns | null {
  return useMemo(() => {
    if (!habitData?.checkIns || habitData.checkIns.length === 0) {
      return null;
    }

    const habitType = habitData.system?.habitType || 'time_anchored';
    return analyzePatterns(habitData.checkIns, habitType);
  }, [habitData?.checkIns, habitData?.system?.habitType]);
}
```

---

## Phase 2: Daily Check-in Conversation
**Effort:** 6-8 hours
**Priority:** P1 — Core daily experience

This is the main feature. After logging outcome + difficulty, the user enters a **brief chat interface** with the AI. This is NOT just a smarter success screen — it's an actual conversation that:
- Maintains the "coach checking back in" feeling from intake
- Captures qualitative micro-reflections that feed Patterns
- Provides immediate reinforcement or gentle guidance
- Is skippable but encouraged

### 2.1 Check-in Conversation Flow

The conversation appears AFTER outcome + difficulty are logged:

```
User taps "Mark today's rep"
    │
    ▼
CheckInOptions (existing) — Select outcome
    │
    ▼
DifficultyRating (existing) — How hard? 1-5
    │
    ▼
┌─────────────────────────────────────────────┐
│  NEW: CheckInConversation                   │
│                                             │
│  Same chat UI as intake (reuse components)  │
│  - AI sends context-aware opening           │
│  - User can type OR tap suggested reply     │
│  - AI responds with affirmation + insight   │
│  - 1-2 exchanges max, then auto-close       │
│                                             │
│  [Skip for now] always visible              │
└─────────────────────────────────────────────┘
    │
    ▼
Return to home
```

### 2.2 AI Opening Messages

The AI's opening varies based on outcome + difficulty + patterns:

**Success + Easy (difficulty 1-2):**
```
"Nice work! Anything click today that made it easier?"
```
Suggested replies: `["Setup was ready", "Good timing", "Just felt natural", "Not sure"]`

**Success + Hard (difficulty 4-5):**
```
"That took real effort today. What made it tough?"
```
Suggested replies: `["Low energy", "Bad timing", "Almost skipped", "Something else"]`

**Success + Streak (3+ in a row):**
```
"That's [N] in a row. What's making this stick?"
```
Suggested replies: `["The anchor works", "Getting easier", "Don't want to break it", "Honestly not sure"]`

**Miss (any):**
```
"No worries — misses happen. What got in the way?"
```
Suggested replies: `["Too tired", "Forgot", "Didn't have time", "Something else"]`

**No-trigger (reactive habits):**
```
"Good night logged. How are you feeling about the system overall?"
```
Suggested replies: `["It's working", "Too early to tell", "Something feels off"]`

### 2.3 AI Response Logic

After user responds, AI provides a brief acknowledgment + optional insight:

**Example exchanges:**

User: "Setup was ready"
→ AI: "That's the system working. When the path is clear, showing up gets easier. You're building the identity of someone who [identity]."

User: "Low energy"
→ AI: "Noted. If energy keeps coming up, we might look at timing. For now — you showed up anyway. That's Week 1 done right."

User: "Too tired"
→ AI: "That's useful to know. If tiredness shows up again, let's talk about your environment setup. The goal is survivable, not heroic."

### 2.4 CheckInConversation Component

**New File:** `src/components/checkin/CheckInConversation.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { CheckIn, HabitSystem } from '@/types/habit';
import { CheckInPatterns } from '@/lib/patterns/patternFinder';
import { 
  generateConversationOpener, 
  generateConversationResponse 
} from '@/lib/checkin/conversationGenerator';

interface CheckInConversationProps {
  checkIn: CheckIn;
  patterns: CheckInPatterns | null;
  system: HabitSystem;
  onComplete: (conversation: ConversationData) => void;
  onSkip: () => void;
}

interface ConversationData {
  messages: Array<{ role: 'ai' | 'user'; content: string }>;
  skipped: boolean;
  duration: number;
}

export default function CheckInConversation({
  checkIn,
  patterns,
  system,
  onComplete,
  onSkip,
}: CheckInConversationProps) {
  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; content: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [startTime] = useState(Date.now());

  // Generate opening message on mount
  useEffect(() => {
    const opener = generateConversationOpener(checkIn, patterns, system);
    setMessages([{ role: 'ai', content: opener.message }]);
    setSuggestedReplies(opener.suggestedReplies);
  }, []);

  const handleUserMessage = async (content: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content }]);
    setSuggestedReplies([]);
    setIsTyping(true);

    // Generate AI response (rule-based for MVP, can upgrade to AI later)
    const response = await generateConversationResponse(
      content,
      checkIn,
      patterns,
      system,
      exchangeCount
    );

    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'ai', content: response.message }]);
    setExchangeCount(prev => prev + 1);

    // Close after 1-2 exchanges or if AI indicates completion
    if (response.shouldClose || exchangeCount >= 1) {
      setTimeout(() => {
        onComplete({
          messages: [...messages, { role: 'user', content }, { role: 'ai', content: response.message }],
          skipped: false,
          duration: Math.round((Date.now() - startTime) / 1000),
        });
      }, 2000); // Brief pause to read final message
    } else if (response.suggestedReplies) {
      setSuggestedReplies(response.suggestedReplies);
    }
  };

  const handleSkip = () => {
    onComplete({
      messages,
      skipped: true,
      duration: Math.round((Date.now() - startTime) / 1000),
    });
  };

  return (
    <div className="check-in-conversation">
      <div className="conversation-container">
        {messages.map((msg, i) => (
          <div key={i} className={`message message-${msg.role}`}>
            <p>{msg.content}</p>
          </div>
        ))}

        {isTyping && (
          <div className="typing-indicator">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        )}
      </div>

      {suggestedReplies.length > 0 && (
        <div className="suggested-replies">
          {suggestedReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => handleUserMessage(reply)}
              className="btn-pill"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      <div className="input-area">
        <input
          type="text"
          className="chat-input"
          placeholder="Or type your own..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              handleUserMessage(e.currentTarget.value.trim());
              e.currentTarget.value = '';
            }
          }}
          disabled={isTyping}
        />
      </div>

      <button onClick={handleSkip} className="skip-button">
        Skip for now
      </button>
    </div>
  );
}
```

### 2.5 Conversation Generator

**New File:** `src/lib/checkin/conversationGenerator.ts`

```typescript
import { CheckIn, HabitSystem } from '@/types/habit';
import { CheckInPatterns } from '@/lib/patterns/patternFinder';

interface ConversationOpener {
  message: string;
  suggestedReplies: string[];
}

interface ConversationResponse {
  message: string;
  suggestedReplies?: string[];
  shouldClose: boolean;
}

export function generateConversationOpener(
  checkIn: CheckIn,
  patterns: CheckInPatterns | null,
  system: HabitSystem
): ConversationOpener {
  const difficulty = checkIn.difficulty || 3;
  const isSuccess = checkIn.actionTaken;
  const isMiss = checkIn.triggerOccurred && !checkIn.actionTaken;
  const isNoTrigger = !checkIn.triggerOccurred;
  const streak = patterns?.currentStreak || 0;

  // Success + Streak (3+)
  if (isSuccess && streak >= 3) {
    return {
      message: `That's ${streak} in a row. What's making this stick?`,
      suggestedReplies: ["The anchor works", "Getting easier", "Don't want to break it", "Honestly not sure"],
    };
  }

  // First rep
  if (isSuccess && patterns?.isFirstRep) {
    return {
      message: "First one done. That's the hardest part. How did it feel?",
      suggestedReplies: ["Good", "Awkward but okay", "Harder than expected", "Not sure yet"],
    };
  }

  // Success + Easy
  if (isSuccess && difficulty <= 2) {
    return {
      message: "Nice work! Anything click today that made it easier?",
      suggestedReplies: ["Setup was ready", "Good timing", "Just felt natural", "Not sure"],
    };
  }

  // Success + Hard
  if (isSuccess && difficulty >= 4) {
    return {
      message: "That took real effort today. What made it tough?",
      suggestedReplies: ["Low energy", "Bad timing", "Almost skipped", "Something else"],
    };
  }

  // Success + Normal
  if (isSuccess) {
    return {
      message: "Rep logged. How did that feel?",
      suggestedReplies: ["Good", "Fine", "Harder than expected", "Easier than expected"],
    };
  }

  // Miss
  if (isMiss) {
    // Check for repeated miss reason
    if (patterns?.repeatedMissReason) {
      return {
        message: `I noticed "${patterns.repeatedMissReason}" has come up before. Same thing today, or something different?`,
        suggestedReplies: ["Same thing", "Different this time", "Not sure"],
      };
    }
    return {
      message: "No worries — misses happen. What got in the way?",
      suggestedReplies: ["Too tired", "Forgot", "Didn't have time", "Something else"],
    };
  }

  // No trigger (reactive habits)
  if (isNoTrigger) {
    const noTriggerStreak = patterns?.currentNoTriggerStreak || 1;
    if (noTriggerStreak >= 3) {
      return {
        message: `${noTriggerStreak} good nights in a row. How are you feeling about the system?`,
        suggestedReplies: ["It's working", "Might be coincidence", "Feeling good", "Too early to tell"],
      };
    }
    return {
      message: "Good night — no trigger needed. Anything on your mind about the habit?",
      suggestedReplies: ["All good", "Have a question", "Something feels off", "Nope"],
    };
  }

  // Fallback
  return {
    message: "Logged. Anything you want to note?",
    suggestedReplies: ["All good", "Something to mention", "Skip"],
  };
}

export function generateConversationResponse(
  userMessage: string,
  checkIn: CheckIn,
  patterns: CheckInPatterns | null,
  system: HabitSystem,
  exchangeCount: number
): ConversationResponse {
  const lowerMessage = userMessage.toLowerCase();
  const identity = system.identity || "someone who shows up";

  // Positive responses about setup/system
  if (lowerMessage.includes("setup") || lowerMessage.includes("ready") || lowerMessage.includes("natural")) {
    return {
      message: `That's the system working. When the path is clear, showing up gets easier. You're building the identity of ${identity}.`,
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("anchor") || lowerMessage.includes("timing works")) {
    return {
      message: `Good anchors make habits automatic. Yours seems to be working.`,
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("easier") || lowerMessage.includes("working") || lowerMessage.includes("good")) {
    return {
      message: `That's the goal — sustainable, not heroic. Keep protecting what's working.`,
      shouldClose: true,
    };
  }

  // Struggle responses
  if (lowerMessage.includes("tired") || lowerMessage.includes("energy")) {
    return {
      message: `Noted. If energy keeps coming up, we might look at timing or your tiny version. For now — you showed up anyway. That's what matters.`,
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("forgot")) {
    return {
      message: `Forgetting usually means the anchor isn't strong enough yet. We can work on that in your weekly reflection.`,
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("time") || lowerMessage.includes("busy")) {
    return {
      message: `When time is tight, that's what your tiny version is for. Even a minimal rep keeps the chain going.`,
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("hard") || lowerMessage.includes("struggled") || lowerMessage.includes("almost")) {
    return {
      message: `Hard days happen. The fact that you did it anyway is the skill you're building. It won't always feel like this.`,
      shouldClose: true,
    };
  }

  // Question or concern — allow one more exchange
  if (lowerMessage.includes("question") || lowerMessage.includes("off") || lowerMessage.includes("wrong")) {
    return {
      message: `I'm listening. What's on your mind?`,
      suggestedReplies: ["The timing feels wrong", "Not sure this is the right habit", "Need to adjust something", "Actually, never mind"],
      shouldClose: false,
    };
  }

  // Same miss reason repeated
  if (lowerMessage.includes("same thing") || lowerMessage.includes("same")) {
    const tip = getTipForMissReason(patterns?.repeatedMissReason || '', system);
    return {
      message: tip || `That's a pattern worth addressing. Let's tackle it in your weekly reflection.`,
      shouldClose: true,
    };
  }

  // Neutral/skip responses
  if (lowerMessage.includes("skip") || lowerMessage.includes("nope") || lowerMessage.includes("all good") || lowerMessage.includes("fine")) {
    return {
      message: `Got it. See you tomorrow.`,
      shouldClose: true,
    };
  }

  // Default acknowledgment
  return {
    message: `Thanks for sharing. That's useful context. See you tomorrow.`,
    shouldClose: true,
  };
}

function getTipForMissReason(reason: string, system: HabitSystem): string | null {
  const tips: Record<string, string> = {
    "too tired": "Make the path easier: slippers by the bed, robe within reach, destination already set up.",
    "forgot": "Try a physical cue — something you'll see when the trigger happens.",
    "time": "Consider: is the action too big? Your tiny version is there for busy days.",
    "busy": "On packed days, use your tiny version. Something is always better than nothing.",
  };

  for (const [key, tip] of Object.entries(tips)) {
    if (reason.toLowerCase().includes(key)) {
      return tip;
    }
  }
  return null;
}
```

### 2.6 Update CheckInFlow

**File:** `src/components/checkin/CheckInFlow.tsx`

Add conversation step after difficulty rating:

```tsx
// Add 'conversation' to step types
type CheckInStep = 'options' | 'success' | 'difficulty' | 'conversation' | 'miss' | 'recovery' | 'complete';

// After difficulty is logged:
const handleDifficultyComplete = (difficulty: number) => {
  const updatedCheckIn = { ...checkInData, difficulty };
  setCheckInData(updatedCheckIn);
  
  // Save check-in to store
  logCheckIn(updatedCheckIn);
  
  // Move to conversation
  setStep('conversation');
};

// Handle conversation completion
const handleConversationComplete = (conversation: ConversationData) => {
  // Store conversation with check-in
  updateCheckInConversation(checkInData.id, conversation);
  onComplete();
};

// In render:
{step === 'conversation' && (
  <CheckInConversation
    checkIn={checkInData as CheckIn}
    patterns={patterns}
    system={system}
    onComplete={handleConversationComplete}
    onSkip={() => {
      updateCheckInConversation(checkInData.id, { skipped: true });
      onComplete();
    }}
  />
)}
```

### 2.7 Data Model Update

**File:** `src/types/habit.ts`

```typescript
interface CheckIn {
  // ... existing fields
  
  conversation?: {
    messages: Array<{ role: 'ai' | 'user'; content: string }>;
    skipped: boolean;
    duration: number;  // seconds
  };
}
```

### 2.8 Styling

The conversation UI should match intake chat (per Design Brief):
- Warm cream background (`--bg-primary`)
- AI messages: `--ai-message-bg` with border-radius `16px 16px 16px 4px`
- User messages: `--user-message-bg` (teal) with border-radius `16px 16px 4px 16px`
- Suggested replies: `btn-pill` style
- Skip button: subtle text link, `--text-tertiary`
- Animation: `message-enter` keyframes

---

## Phase 3: Patterns Display + Actionable Suggestion
**Effort:** 4-5 hours
**Priority:** P2 — Makes logging meaningful

### 3.1 Insight Generation with Suggestion

**New File:** `src/lib/patterns/insightGenerator.ts`

```typescript
import { CheckInPatterns } from './patternFinder';
import { HabitSystem, HabitType } from '@/types/habit';

export interface PatternInsight {
  id: string;
  type: 'positive' | 'neutral' | 'warning';
  icon: string;  // ✓ ⚠ →
  content: string;
}

export interface PatternSuggestion {
  id: string;
  content: string;
  actionType: 'anchor' | 'tiny_version' | 'environment' | 'timing' | 'general';
  actionLabel: string;  // "Adjust anchor" / "Update tiny version"
}

export interface PatternAnalysisResult {
  insights: PatternInsight[];
  suggestion: PatternSuggestion | null;
  generatedAt: string;
}

export function generatePatternAnalysis(
  patterns: CheckInPatterns,
  system: HabitSystem,
  habitType: HabitType
): PatternAnalysisResult {
  const insights: PatternInsight[] = [];
  let suggestion: PatternSuggestion | null = null;

  // Positive: High response rate
  if (patterns.totalCheckIns >= 5 && patterns.responseRateWhenTriggered >= 0.8) {
    insights.push({
      id: 'high_response',
      type: 'positive',
      icon: '✓',
      content: `${Math.round(patterns.responseRateWhenTriggered * 100)}% follow-through when triggered. Strong consistency.`,
    });
  }

  // Positive: Streak
  if (patterns.currentStreak >= 3) {
    insights.push({
      id: 'streak',
      type: 'positive',
      icon: '✓',
      content: `${patterns.currentStreak} in a row. The habit is taking hold.`,
    });
  }

  // Positive: No-trigger trend (reactive)
  if (habitType === 'reactive' && patterns.currentNoTriggerStreak >= 3) {
    insights.push({
      id: 'no_trigger_streak',
      type: 'positive',
      icon: '✓',
      content: `${patterns.currentNoTriggerStreak} nights with no trigger. The habit may be improving your baseline.`,
    });
  }

  // Positive: Difficulty decreasing
  if (patterns.difficultyTrend === 'decreasing') {
    insights.push({
      id: 'easier',
      type: 'positive',
      icon: '✓',
      content: `Getting easier over time. The habit is settling in.`,
    });
  }

  // Warning: Weak days
  if (patterns.weakDays.length > 0) {
    insights.push({
      id: 'weak_days',
      type: 'warning',
      icon: '⚠',
      content: `${patterns.weakDays.join(' and ')} tend to be harder.`,
    });

    // Generate suggestion for weak days
    if (!suggestion) {
      suggestion = {
        id: 'weak_days_suggestion',
        content: `Your ${patterns.weakDays[0]} anchor might need adjustment. Consider a different trigger for these days.`,
        actionType: 'anchor',
        actionLabel: 'Adjust anchor',
      };
    }
  }

  // Warning: Repeated miss reason
  if (patterns.repeatedMissReason) {
    insights.push({
      id: 'repeated_miss',
      type: 'warning',
      icon: '⚠',
      content: `"${patterns.repeatedMissReason}" has come up ${patterns.missReasonCounts[patterns.repeatedMissReason]} times.`,
    });

    // Generate suggestion for repeated miss
    if (!suggestion) {
      suggestion = generateSuggestionForMissReason(patterns.repeatedMissReason, system);
    }
  }

  // Warning: High difficulty persisting
  if (patterns.averageDifficulty >= 4 && patterns.totalCheckIns >= 5) {
    insights.push({
      id: 'high_difficulty',
      type: 'warning',
      icon: '⚠',
      content: `Average difficulty is ${patterns.averageDifficulty.toFixed(1)}. This might not be sustainable.`,
    });

    if (!suggestion) {
      suggestion = {
        id: 'difficulty_suggestion',
        content: `Consider dropping to your tiny version for a week. Sustainable beats ambitious.`,
        actionType: 'tiny_version',
        actionLabel: 'Use tiny version',
      };
    }
  }

  return {
    insights: insights.slice(0, 3),  // Max 3 insights
    suggestion,
    generatedAt: new Date().toISOString(),
  };
}

function generateSuggestionForMissReason(reason: string, system: HabitSystem): PatternSuggestion {
  const lower = reason.toLowerCase();

  if (lower.includes('tired') || lower.includes('energy')) {
    return {
      id: 'tired_suggestion',
      content: `Tiredness keeps showing up. Consider: is the anchor fighting your energy levels?`,
      actionType: 'timing',
      actionLabel: 'Adjust timing',
    };
  }

  if (lower.includes('forgot')) {
    return {
      id: 'forgot_suggestion',
      content: `Forgetting suggests the anchor isn't visible enough. Add a physical cue to your environment.`,
      actionType: 'environment',
      actionLabel: 'Update setup',
    };
  }

  if (lower.includes('time') || lower.includes('busy')) {
    return {
      id: 'time_suggestion',
      content: `When time is tight, your tiny version should kick in automatically. Is it small enough?`,
      actionType: 'tiny_version',
      actionLabel: 'Shrink tiny version',
    };
  }

  return {
    id: 'general_suggestion',
    content: `This barrier keeps appearing. Let's address it in your weekly reflection.`,
    actionType: 'general',
    actionLabel: 'Start reflection',
  };
}
```

### 3.2 Patterns Section Component

**New File:** `src/components/journey/PatternsSection.tsx`

```tsx
import { CheckInPatterns } from '@/lib/patterns/patternFinder';
import { generatePatternAnalysis, PatternAnalysisResult } from '@/lib/patterns/insightGenerator';
import { HabitSystem, HabitType } from '@/types/habit';

interface PatternsSectionProps {
  patterns: CheckInPatterns;
  system: HabitSystem;
  habitType: HabitType;
  onAction: (actionType: string) => void;
  onDismiss: () => void;
}

export default function PatternsSection({
  patterns,
  system,
  habitType,
  onAction,
  onDismiss,
}: PatternsSectionProps) {
  // Require 7 check-ins
  if (patterns.totalCheckIns < 7) {
    return (
      <div className="patterns-section locked">
        <h3>Patterns</h3>
        <p className="locked-message">
          Insights will appear after 7 check-ins.
        </p>
        <div className="progress-dots">
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className={`dot ${i < patterns.totalCheckIns ? 'filled' : ''}`}
            />
          ))}
        </div>
        <p className="progress-count">{patterns.totalCheckIns} of 7</p>
      </div>
    );
  }

  const analysis = generatePatternAnalysis(patterns, system, habitType);

  return (
    <div className="patterns-section">
      <h3>What I'm Noticing</h3>
      <p className="meta">Based on your last {patterns.totalCheckIns} check-ins</p>

      <div className="insights">
        {analysis.insights.map((insight) => (
          <div key={insight.id} className={`insight ${insight.type}`}>
            <span className="icon">{insight.icon}</span>
            <span className="content">{insight.content}</span>
          </div>
        ))}
      </div>

      {analysis.suggestion && (
        <div className="suggestion-card">
          <p className="suggestion-content">
            <span className="icon">→</span>
            {analysis.suggestion.content}
          </p>
          <div className="suggestion-actions">
            <button
              onClick={() => onAction(analysis.suggestion!.actionType)}
              className="btn-primary"
            >
              {analysis.suggestion.actionLabel}
            </button>
            <button onClick={onDismiss} className="btn-text">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <p className="generated-at">
        Generated {new Date(analysis.generatedAt).toLocaleDateString()} · Updates weekly
      </p>
    </div>
  );
}
```

### 3.3 Enhanced SevenDayDots

**File:** `src/components/journey/SevenDayDots.tsx`

Show mixed outcomes with symbols for reactive habits:

```tsx
function getDotSymbol(state: string, isReactive: boolean): string {
  if (!isReactive) {
    // Time/event habits: simple dots
    if (state === 'completed' || state === 'recovered') return '●';
    if (state === 'missed') return '○';
    return '·';
  }

  // Reactive habits: distinct symbols
  switch (state) {
    case 'no_trigger': return '🌙';
    case 'completed': return '✓';
    case 'recovered': return '→';
    case 'missed': return '✗';
    default: return '·';
  }
}
```

---

## Phase 4: Weekly Reflection
**Effort:** 6-8 hours
**Priority:** P3 — Scheduled engagement at Day 7+

### 4.1 Reflection Trigger

**New File:** `src/hooks/useReflectionTrigger.ts`

```typescript
export function useReflectionTrigger(habitData: HabitData | null): {
  shouldShowReflection: boolean;
  reflectionType: 'weekly' | 'recovery' | null;
  dismiss: () => void;
} {
  // Check if 7+ days since creation and hasn't reflected this week
  // Check if 3+ consecutive misses (recovery reflection)
  // ...
}
```

### 4.2 Weekly Reflection Flow

**New File:** `src/app/reflect/page.tsx`

Five-screen flow:
1. Week Summary (visual stats)
2. Sustainability Question ("Did this feel sustainable?")
3. Friction Question (free text)
4. AI Recommendation (one suggestion)
5. Reflection Complete

See original PRD for full specification.

---

## File Summary

### New Files (Priority Order)

| Phase | File | Purpose |
|-------|------|---------|
| 1 | `src/lib/patterns/patternFinder.ts` | Pattern analysis |
| 1 | `src/hooks/useCheckInPatterns.ts` | Pattern hook |
| 2 | `src/components/checkin/CheckInConversation.tsx` | **Chat interface after logging** |
| 2 | `src/lib/checkin/conversationGenerator.ts` | Conversation logic |
| 3 | `src/lib/patterns/insightGenerator.ts` | Insights + suggestions |
| 3 | `src/components/journey/PatternsSection.tsx` | Patterns display |
| 4 | `src/hooks/useReflectionTrigger.ts` | Reflection triggers |
| 4 | `src/app/reflect/page.tsx` | Weekly reflection |

### Files to Modify

| Phase | File | Changes |
|-------|------|---------|
| 2 | `src/components/checkin/CheckInFlow.tsx` | Add conversation step |
| 2 | `src/types/habit.ts` | Add conversation to CheckIn |
| 3 | `src/components/journey/SevenDayDots.tsx` | Mixed outcome symbols |

---

## Verification Checklist

### Phase 1: Pattern Finder
- [ ] `analyzePatterns()` returns correct counts
- [ ] Streak detection works (no-trigger doesn't break streak for reactive)
- [ ] Day-of-week patterns identified
- [ ] Repeated miss reason detected

### Phase 2: Daily Check-in Conversation
- [ ] Chat UI appears after difficulty rating
- [ ] AI opening varies by outcome + difficulty + patterns
- [ ] Suggested replies work
- [ ] Free text input works
- [ ] AI response acknowledges user's message
- [ ] Skip button works
- [ ] Conversation stored with check-in

### Phase 3: Patterns Display
- [ ] Locked state shows until 7 check-ins
- [ ] Insights display with correct icons
- [ ] Suggestion appears when patterns warrant
- [ ] Action button links to correct screen
- [ ] Dismiss hides until next refresh

### Phase 4: Weekly Reflection
- [ ] Triggers at Day 7
- [ ] Five-screen flow works
- [ ] AI recommendation based on inputs
- [ ] System updates when accepted

---

## Summary

**The Core Feature:** A chat interface after every check-in where the AI responds based on patterns and captures micro-reflections.

**Not:** Smarter static screens with better copy.

**Dependency Chain:**
1. Pattern Finder → enables intelligent conversation
2. CheckInConversation → the actual chat interface
3. Patterns Display → visualizes what the system knows
4. Weekly Reflection → deeper scheduled engagement