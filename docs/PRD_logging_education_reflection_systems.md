# Habit Stacker: Logging, Education & Reflection Systems

**Design Document v1.0**  
**Last updated:** January 29, 2026

---

## Overview

This document extends the core PRD to define three interconnected systems that sustain user engagement beyond the initial consultation:

1. **Logging System** — How users record what happened (not just "did you do it?")
2. **Education Layers** — Progressive disclosure of domain knowledge and personalized reasoning
3. **Reflection Cycles** — Periodic AI consultations that capture qualitative feedback and evolve the system

These three systems work together to maintain the consultation relationship established during intake, making the AI feel present throughout the habit journey rather than disappearing after setup.

---

## Part 1: Logging System

### Design Principles

1. **Check-in, not tracking** — The daily interaction is a brief conversation with your system, not homework submission
2. **Capture what happened, not just what you did** — Trigger occurrence is as important as behavioral response
3. **Adapt to habit type** — Reactive habits need different logging than daily routines
4. **Make all outcomes meaningful** — "Slept through" is data, not absence of data
5. **Never punish honesty** — Missing and logging the miss is better than not logging at all

### Habit Type Taxonomy

| Type | Definition | Trigger Predictability | Success Metric | Examples |
|------|------------|----------------------|----------------|----------|
| **Time-anchored** | Action at specific time | Fixed daily | Did the action | Meditate at 7am |
| **Event-anchored** | Action after existing behavior | Fixed daily | Did the action | Pushups after brushing teeth |
| **Reactive** | Response to unpredictable trigger | Variable | Correct response when triggered | Get out of bed when can't sleep |
| **Frequency** | X times per time period | Self-scheduled | Hit target | Exercise 3x/week |
| **Avoidance** | Not doing something | Fixed window | Maintained boundary | No phone after 9pm |

**M1 Scope:** Time-anchored, Event-anchored, and Reactive habits only.

---

### Data Model

```typescript
interface HabitDefinition {
  id: string;
  type: 'time_anchored' | 'event_anchored' | 'reactive' | 'frequency' | 'avoidance';
  
  // Core structure (from intake)
  anchor: string;              // "7am" or "after brushing teeth" or "when I can't sleep"
  action: string;              // "meditate for 2 minutes"
  then?: string;               // Optional follow-through
  recovery: string;            // What to do after a miss
  
  // Type-specific config
  anchorTime?: string;         // For time-anchored: "07:00"
  checkInTime?: string;        // For reactive: when to ask "how was last night?"
  frequencyTarget?: number;    // For frequency: 3
  frequencyPeriod?: string;    // For frequency: "week"
  avoidanceWindow?: {          // For avoidance: start/end times
    start: string;
    end: string;
  };
  
  // Generated during intake
  whyItFits: string[];
  identity?: string;
  setupChecklist?: SetupItem[];
}

interface CheckIn {
  id: string;
  habitId: string;
  date: string;                // YYYY-MM-DD
  checkedInAt: string;         // ISO timestamp
  
  // What happened
  triggerOccurred: boolean;    // Did the anchor/trigger happen?
  actionTaken: boolean;        // Did they do the behavior?
  
  // Reactive habit specifics
  triggerTime?: string;        // "02:30" - when did the trigger occur?
  outcomeSuccess?: boolean;    // Did the protocol work? (e.g., fell back asleep)
  
  // Context for pattern finding
  missReason?: string;         // Why they didn't act (if miss)
  contextTags?: string[];      // "weekend", "travel", "stressed", "sick"
  
  // Qualitative (optional)
  note?: string;               // Free-form user note
  difficultyRating?: 1 | 2 | 3 | 4 | 5;  // How hard was it today?
  
  // Recovery tracking
  recoveryOffered: boolean;
  recoveryAccepted?: boolean;
  recoveryCompleted?: boolean;
}

// Computed states for UI
type CheckInState = 
  | 'pending'           // Check-in window open, not yet logged
  | 'trigger_occurred'  // For reactive: they had the trigger
  | 'no_trigger'        // For reactive: slept through / no opportunity
  | 'completed'         // Action was taken
  | 'missed'            // Trigger occurred but action not taken
  | 'recovered';        // Miss + recovery action completed
```

### Outcome States by Habit Type

**Time/Event-Anchored Habits:**
```
┌─────────────────────────────────────────────────────────────┐
│  Possible outcomes (daily):                                 │
│                                                             │
│  ✓  COMPLETED                                               │
│     triggerOccurred: true, actionTaken: true                │
│     "I did my pushups after brushing teeth"                 │
│                                                             │
│  ✗  MISSED                                                  │
│     triggerOccurred: true, actionTaken: false               │
│     "I brushed my teeth but skipped pushups"                │
│                                                             │
│  →  RECOVERED                                               │
│     Missed, but completed recovery action                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Reactive Habits:**
```
┌─────────────────────────────────────────────────────────────┐
│  Possible outcomes (per check-in period):                   │
│                                                             │
│  🌙  NO TRIGGER                                             │
│     triggerOccurred: false                                  │
│     "Slept through the night"                               │
│     → This is SUCCESS data, not missing data                │
│                                                             │
│  ✓  COMPLETED                                               │
│     triggerOccurred: true, actionTaken: true                │
│     "Woke up at 2am, used the protocol"                     │
│                                                             │
│  ✗  MISSED                                                  │
│     triggerOccurred: true, actionTaken: false               │
│     "Woke up but stayed in bed scrolling"                   │
│                                                             │
│  →  RECOVERED                                               │
│     Missed, but completed recovery action                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Check-In Flows

#### Flow 1: Time/Event-Anchored Habits

**Trigger:** User opens app, or push notification at anchor time

**Home Screen State (before check-in):**
```
┌────────────────────────────────────────────────────────────────┐
│  YOUR HABIT                                        Day 4 of 7  │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│                           🧘                                   │
│                                                                │
│      "After I brush my teeth in the morning,                   │
│              I meditate for 2 minutes."                        │
│                                                                │
│              ●  ●  ●  ○  ○  ○  ○                              │
│                    WEEK 1 PROGRESS                             │
│                                                                │
│         ┌─────────────────────────────┐                       │
│         │     Mark today's rep        │                       │
│         └─────────────────────────────┘                       │
│                                                                │
│         I did it earlier  ·  I can't today                    │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│         3 reps  ·  Last done yesterday                        │
└────────────────────────────────────────────────────────────────┘
```

**After tapping "Mark today's rep":**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                          ✓                                     │
│                                                                │
│                    Rep logged.                                 │
│                                                                │
│         That's 4 in a row. Showing up is the work.            │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│      How did it feel today?  (optional)                       │
│                                                                │
│      ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                 │
│      │ 😫  │ │ 😕  │ │ 😐  │ │ 🙂  │ │ 😊  │                 │
│      │Hard │ │     │ │ OK  │ │     │ │Easy │                 │
│      └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                 │
│                                                                │
│                      [ Skip ]                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**After tapping "I can't today":**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    That's okay.                                │
│                                                                │
│      Missing happens. What matters is what you do next.       │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│      What got in the way?  (helps me learn)                   │
│                                                                │
│      ┌─────────────────────────────────────────────────┐      │
│      │  Didn't have time                               │      │
│      └─────────────────────────────────────────────────┘      │
│      ┌─────────────────────────────────────────────────┐      │
│      │  Forgot in the moment                           │      │
│      └─────────────────────────────────────────────────┘      │
│      ┌─────────────────────────────────────────────────┐      │
│      │  Wasn't feeling up to it                        │      │
│      └─────────────────────────────────────────────────┘      │
│      ┌─────────────────────────────────────────────────┐      │
│      │  Something else came up                         │      │
│      └─────────────────────────────────────────────────┘      │
│                                                                │
│                   [ Skip this ]                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Recovery Offer (after logging miss):**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    Your recovery action:                       │
│                                                                │
│         "Do one deep breath right now—just one."              │
│                                                                │
│      This isn't a replacement. It's a signal to your          │
│      brain that you're still in the game.                     │
│                                                                │
│         ┌─────────────────────────────┐                       │
│         │       I'll do it now        │                       │
│         └─────────────────────────────┘                       │
│                                                                │
│                   [ Not right now ]                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

#### Flow 2: Reactive Habits

**Trigger:** Morning check-in (configurable time, default 7am)

**Check-In Screen:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  MORNING CHECK-IN                              Day 4 of 7      │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│                    How was last night?                         │
│                                                                │
│                                                                │
│      ┌─────────────────────────────────────────────────┐      │
│      │                                                 │      │
│      │  🌙  Slept through the night                    │      │
│      │      No waking, no action needed                │      │
│      │                                                 │      │
│      └─────────────────────────────────────────────────┘      │
│                                                                │
│      ┌─────────────────────────────────────────────────┐      │
│      │                                                 │      │
│      │  ✓  Woke up and used the protocol               │      │
│      │     Got out of bed, sat in dim light            │      │
│      │                                                 │      │
│      └─────────────────────────────────────────────────┘      │
│                                                                │
│      ┌─────────────────────────────────────────────────┐      │
│      │                                                 │      │
│      │  ✗  Woke up but stayed in bed                   │      │
│      │                                                 │      │
│      └─────────────────────────────────────────────────┘      │
│                                                                │
│                                                                │
│                     [ Skip for now ]                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Branch: "Slept through the night"**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                          🌙                                    │
│                                                                │
│                    Good night logged.                          │
│                                                                │
│      No trigger means no rep needed—but this is still         │
│      valuable data. I'm tracking your sleep-through           │
│      nights to help spot patterns.                            │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│      This week:  🌙 🌙 ✓ 🌙                                   │
│      3 restful nights, 1 successful protocol use              │
│                                                                │
│                    [ Continue → ]                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Branch: "Woke up and used the protocol"**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                          ✓                                     │
│                                                                │
│                    Rep logged.                                 │
│                                                                │
│      Getting out of bed at 2am takes real effort.             │
│      You're retraining your brain.                            │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│      Quick follow-up (optional):                              │
│                                                                │
│      Did it help you fall back asleep?                        │
│                                                                │
│      ┌──────────────┐  ┌───────────────┐  ┌────────┐         │
│      │ Yes, it did  │  │ Not this time │  │  Skip  │         │
│      └──────────────┘  └───────────────┘  └────────┘         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Branch: "Woke up but stayed in bed"**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    That's okay.                                │
│                                                                │
│      This is genuinely hard at 2am. Your brain wants          │
│      the easy thing, and right now the easy thing is          │
│      staying in bed.                                          │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│      What made it hard?  (helps me learn)                     │
│                                                                │
│      ┌─────────────────────────────────────────────────┐      │
│      │  Too tired to get up                            │      │
│      └─────────────────────────────────────────────────┘      │
│      ┌─────────────────────────────────────────────────┐      │
│      │  Forgot in the moment                           │      │
│      └─────────────────────────────────────────────────┘      │
│      ┌─────────────────────────────────────────────────┐      │
│      │  The other room was too cold/far                │      │
│      └─────────────────────────────────────────────────┘      │
│      ┌─────────────────────────────────────────────────┐      │
│      │  Told myself "just 5 more minutes"              │      │
│      └─────────────────────────────────────────────────┘      │
│                                                                │
│                     [ Skip this ]                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Home Screen Adaptations by State

The home screen should reflect the current check-in state:

**Before check-in (reactive habit):**
```
YOUR HABIT                                        Day 4 of 7
────────────────────────────────────────────────────────────
"When I can't fall back asleep, I get out of bed."

       [ Check in on last night → ]

         🌙  ✓  🌙                3 of 4 days logged
```

**After check-in (any type):**
```
YOUR HABIT                                        Day 4 of 7
────────────────────────────────────────────────────────────
"When I can't fall back asleep, I get out of bed."

         ✓  Logged for today

         🌙  ✓  🌙  🌙            4 of 4 days logged

────────────────────────────────────────────────────────────
YOUR RITUAL
Anchor: When you're awake in bed for 15-20 minutes...
```

---

### Journey Tab: Visualizing Mixed Outcomes

Traditional habit trackers show binary completion. For reactive habits, we need to show three states:

```
┌────────────────────────────────────────────────────────────────┐
│  YOUR JOURNEY                                                  │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  WEEK 1                                                        │
│                                                                │
│     Mon    Tue    Wed    Thu    Fri    Sat    Sun             │
│      🌙     ✓      🌙     ✓      ✗      🌙     —              │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  🌙 No trigger (3)   ✓ Applied protocol (2)   ✗ Missed (1)   │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  INSIGHTS                                                      │
│                                                                │
│  You responded correctly 2 out of 3 times when the            │
│  trigger occurred. That's 67% follow-through.                 │
│                                                                │
│  You also had 3 nights with no waking—that might mean         │
│  the habit is helping your overall sleep quality.             │
│                                                                │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  View patterns →                                         ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Education Layers

### Design Principles

1. **Depth is discoverable but never required** — Users can engage fully without reading any education content
2. **Relevance over comprehensiveness** — Surface education at moments it's useful, not as a content library
3. **Personalized over generic** — Reference the user's specific situation, not abstract principles
4. **Build competence, not dependency** — Goal is user understanding, not AI mystique

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  LAYER 1: Inline Whispers                                       │
│  ─────────────────────────────────────────────────────────────  │
│  Where: Inside conversation flow and check-in responses         │
│  Length: 1-2 sentences                                          │
│  Purpose: Micro-doses of insight that build trust               │
│  Example: "Getting out of bed at 2am takes real effort.         │
│           You're retraining your brain."                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LAYER 2: Expandable Rationale                                  │
│  ─────────────────────────────────────────────────────────────  │
│  Where: On System screen, below ritual components               │
│  Length: 2-4 sentences per component                            │
│  Purpose: Immediate "why" for curious users                     │
│  Trigger: User taps "Why this works →"                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LAYER 3: Coach's Notes / Deep Dive                             │
│  ─────────────────────────────────────────────────────────────  │
│  Where: Dedicated section, accessible from System tab           │
│  Length: Full page, multiple sections                           │
│  Purpose: Reference document for motivation dips                │
│  Content: Personalized synthesis + domain science               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Layer 1: Inline Whispers

These are already partially present in the intake flow. Extend to check-in responses:

**After first rep logged:**
```
First rep logged!

It might feel counterintuitive to get out of bed when you're 
tired. That's normal—you're retraining an association, not 
just changing a behavior.
```

**After multiple "slept through" nights:**
```
You've slept through 4 of the last 5 nights.

This could mean the habit is working. When your brain learns 
that bed is only for sleep, the waking episodes often decrease.
```

**After a miss with reason "too tired to get up":**
```
"Too tired" is the hardest barrier at 2am—your willpower is 
literally depleted. 

One thing that helps: make the path easier. Slippers by the 
bed, robe within reach, destination already set up.
```

**Implementation note:** These whispers should be generated based on:
- Check-in history (first rep? repeated pattern?)
- Miss reasons (if provided)
- Time since last interaction
- Current stage (Week 1 vs Week 3)

### Layer 2: Expandable Rationale

**Location:** System screen, below each component

```
┌────────────────────────────────────────────────────────────────┐
│  YOUR RITUAL                                                   │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  Anchor                                                        │
│  When you're awake in bed for 15-20 minutes and can't         │
│  fall back asleep                                              │
│                                                                │
│  Action                                                        │
│  Get out of bed and go to another room                        │
│                                                                │
│  Then                                                          │
│  • Sit in dim light                                            │
│  • Do something genuinely boring (no screens)                  │
│  • Return to bed only when sleepy                              │
│                                                                │
│                                                                │
│  Why this works →                                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Expanded state:**
```
┌────────────────────────────────────────────────────────────────┐
│  YOUR RITUAL                                                   │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  [Ritual content as above...]                                  │
│                                                                │
│  Why this works ↓                                              │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  THE PRINCIPLE                                                 │
│  This is called "stimulus control"—one of the most            │
│  evidence-backed techniques for insomnia. Your brain          │
│  forms strong associations between places and activities.     │
│  Right now, your brain has learned that bed can mean          │
│  "awake and scrolling."                                       │
│                                                                │
│  WHY IT FITS YOU                                               │
│  You mentioned staying in bed for 2-4 hours when you          │
│  wake up, often reaching for your phone. Each time this       │
│  happens, the association strengthens. By getting out of      │
│  bed, you're breaking the pattern and retraining the link     │
│  between bed and sleep.                                       │
│                                                                │
│  WHAT TO EXPECT                                                │
│  Week 1 will feel counterintuitive. Week 2, you'll start      │
│  doing it automatically. By Week 3-4, many people notice      │
│  fewer waking episodes overall.                               │
│                                                                │
│  Read more in Coach's Notes →                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Layer 3: Coach's Notes

**Location:** Accessible from System tab, in "Your System" section

**Purpose:** A personalized reference document that:
- Explains why this specific habit was recommended
- Provides the science in accessible language
- Gives the user language to explain their system to others
- Serves as motivation when commitment wavers

```
┌────────────────────────────────────────────────────────────────┐
│  ← Back to System                                              │
│                                                                │
│  COACH'S NOTES                                                 │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  Based on our conversation on January 27, here's my           │
│  understanding of your situation and why I recommended        │
│  this approach.                                                │
│                                                                │
│                                                                │
│  THE PATTERN I NOTICED                                         │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  You're not struggling to fall asleep initially—you're        │
│  struggling to return to sleep after waking around 2-3am.     │
│                                                                │
│  When you wake, you stay in bed and often reach for your      │
│  phone or iPad. You mentioned being awake for 2-4 hours       │
│  some nights. This creates a cycle: waking → screens in       │
│  bed → alertness → can't sleep → more screens.                │
│                                                                │
│                                                                │
│  WHY THIS HABIT (NOT ANOTHER)                                  │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  I could have recommended:                                     │
│  • A wind-down routine → But you fall asleep fine initially   │
│  • Phone-free bedroom → Addresses a symptom, not the cause    │
│  • Earlier bedtime → Might actually make waking worse         │
│                                                                │
│  The stimulus control approach directly targets your core     │
│  issue: the learned association between bed and wakefulness.  │
│  It's also one of the most researched interventions for       │
│  sleep maintenance insomnia.                                  │
│                                                                │
│                                                                │
│  THE SCIENCE IN 60 SECONDS                                     │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  Your brain is an association machine. When you repeatedly    │
│  do something in a specific context, the context starts to    │
│  trigger the behavior automatically. This works for you       │
│  (coffee → alertness) and against you (bed → scrolling).     │
│                                                                │
│  Stimulus control therapy, developed in the 1970s, uses       │
│  this principle deliberately. The rules are simple:           │
│                                                                │
│  1. Only use bed for sleep (and sex)                          │
│  2. Go to bed only when sleepy                                │
│  3. If you can't sleep after 15-20 min, get up                │
│  4. Return only when sleepy again                             │
│  5. Wake at the same time daily regardless                    │
│                                                                │
│  We're focusing on rule #3—it's the highest-leverage          │
│  change for your specific pattern.                            │
│                                                                │
│                                                                │
│  WHAT DOES SUCCESS LOOK LIKE?                                  │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  Week 1-2: You're building the habit of getting up.           │
│  Success = doing it, even if you don't fall back asleep       │
│  faster yet.                                                  │
│                                                                │
│  Week 3-4: The association starts to shift. You might         │
│  notice falling back asleep becomes easier.                   │
│                                                                │
│  Month 2+: Many people experience fewer waking episodes       │
│  overall. The brain learns that bed = sleep.                  │
│                                                                │
│                                                                │
│  THINGS THAT MIGHT GET IN THE WAY                              │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  "It's too cold to get up"                                    │
│  → Keep slippers and a robe right by the bed                  │
│                                                                │
│  "I'll just scroll for a few minutes first"                   │
│  → Phone charging outside the bedroom eliminates this         │
│                                                                │
│  "I'm too tired to move"                                      │
│  → That's exactly when it matters most. Tired + in bed +      │
│    awake = strengthening the wrong association.               │
│                                                                │
│  "This isn't working"                                          │
│  → Give it 2-3 weeks. The first week often feels worse        │
│    before it gets better.                                     │
│                                                                │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│  Last updated based on our conversation Jan 27, 2026          │
│  This will update after your weekly reflection.               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Education Surfacing Rules

| Trigger | Education Surfaced | Layer |
|---------|-------------------|-------|
| First rep logged | "You're retraining an association" | 1 (Whisper) |
| First miss logged | Contextual encouragement | 1 (Whisper) |
| Same miss reason 2+ times | Specific toolkit suggestion | 1 (Whisper) |
| User taps "Why this works" | Expandable rationale | 2 (Rationale) |
| User navigates to Coach's Notes | Full personalized document | 3 (Deep Dive) |
| Weekly reflection | Reference to relevant science | 1-2 |
| Pattern detected | Insight + optional "learn more" | 1 + link to 2 |

---

## Part 3: Reflection Cycles

### Design Principles

1. **Continuation of consultation, not interrogation** — Same conversational quality as intake
2. **Qualitative over quantitative** — "What's working?" matters more than completion %
3. **Bounded and purposeful** — Clear reason for reflection, clear outcome
4. **System evolution, not judgment** — Reflection leads to adjustment, not guilt

### Reflection Types

| Type | Trigger | Purpose | Outcome |
|------|---------|---------|---------|
| **Micro-reflection** | After 7 days | Quick pulse check | Minor adjustments or encouragement |
| **Weekly reflection** | Every 7 days | What's working, what's hard | Toolkit adjustments, setup checklist updates |
| **Stage transition** | After Week 1, 2, 4 | Milestone acknowledgment + next phase prep | Progression update, new focus |
| **Recovery reflection** | After 3+ consecutive misses | Understanding blockers | System redesign or pause |
| **On-demand reflection** | User-initiated | "Is this still right for me?" | Major pivot or recommitment |

### Micro-Reflection (Day 7)

**Trigger:** 7 days since habit started, user opens app

**Purpose:** Quick emotional check-in, surface any friction

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  WEEK 1 CHECK-IN                                               │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  You've been at this for a week. Quick pulse check:           │
│                                                                │
│                                                                │
│  How is the habit feeling overall?                            │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🟢  Good — it's becoming automatic                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🟡  Okay — some days harder than others                │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🔴  Hard — I'm struggling to stick with it             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│                                                                │
│                      [ Skip for now ]                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Branch: "Good"**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                          Nice.                                 │
│                                                                │
│      Week 1 is about showing up. You did that.                │
│                                                                │
│      Week 2 is about noticing what threatens the habit—       │
│      travel, busy days, mood. Stay alert.                     │
│                                                                │
│                   [ Continue → ]                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Branch: "Okay" or "Hard" → leads to conversational reflection**

---

### Weekly Reflection (Conversational)

**Trigger:** User selects "Okay" or "Hard" in micro-reflection, or taps "Reflect" from menu

**Purpose:** Understand qualitative experience, identify specific friction, adjust system

**Flow:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  WEEKLY REFLECTION                                             │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  Let's dig into what's happening.                             │
│                                                                │
│  You logged 4 times this week:                                │
│  🌙 🌙 ✓ 🌙 ✗ ✓ 🌙                                            │
│                                                                │
│  Looks like you had one miss on Friday. Before we get         │
│  into that—what's been the hardest part of this habit?       │
│                                                                │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Remembering to do it in the moment                     │  │  
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Actually getting out of bed                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Having a good place to go / something to do            │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Something else                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│  │ Type your own answer...                            ➤ │  │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Conversation continues based on selection:**

```
User: Actually getting out of bed

AI: That's the hardest part for most people. At 2am, your 
    willpower is literally at its lowest.

    What specifically makes it hard?
    
    • The bed is too comfortable
    • The other room is cold
    • I tell myself "just 5 more minutes"
    • I'm too groggy to think straight
    
    [Type your own...]
```

```
User: The other room is cold

AI: That's a real barrier. Cold = friction = staying in bed.

    A few things that help others:
    
    1. Keep a warm robe right by the bed
    2. Set a small heater on timer in the other room
    3. Have a heated blanket on the chair you'll sit in
    
    Would any of these work for you?
    
    [Yes, the robe idea]  [Yes, heater]  [No, different issue]
```

```
User: Yes, the robe idea

AI: Great. I'll add that to your setup checklist.

    One more question: Is the habit itself feeling right? 
    Or does something about the system need to change?
    
    [Habit is right, just need to remove friction]
    [I'm not sure this is the right habit for me]
```

**Reflection Outcome:**

After the conversation, the system generates:

1. **Updated Setup Checklist** (if friction items identified)
2. **Updated Toolkit** (if tiny version or environment prime needed)
3. **Coach's Notes addendum** (if new insights about what's hard)
4. **Confirmation screen:**

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  REFLECTION COMPLETE                                           │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  Based on our conversation, I've updated your system:         │
│                                                                │
│  ✓ Added to Setup Checklist:                                  │
│    "Put warm robe within arm's reach of bed"                  │
│                                                                │
│  Your focus for Week 2:                                       │
│  Make the path easier. The behavior is right—the              │
│  environment needs to support it better.                      │
│                                                                │
│                                                                │
│               [ Back to home ]                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Stage Transition Reflection

**Trigger:** Completing Week 1, Week 2, Week 4 (milestone boundaries)

**Purpose:** Acknowledge progress, shift focus to next phase

**Week 1 → Week 2 Transition:**

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  WEEK 1 COMPLETE                                               │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  You've finished your first week.                             │
│                                                                │
│  The numbers:                                                  │
│  • 4 nights with no waking (no trigger)                       │
│  • 2 nights where you used the protocol (reps)                │
│  • 1 night where you stayed in bed (miss → recovered)         │
│                                                                │
│  That's 2/3 follow-through when the trigger occurred.         │
│  For Week 1, that's solid.                                    │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  WEEK 2: PROTECT THE HABIT                                     │
│                                                                │
│  Now that you're showing up, the goal shifts: notice what     │
│  threatens the habit. Travel, busy days, mood swings.         │
│                                                                │
│  When you see a threat coming, you can prepare for it         │
│  instead of getting ambushed.                                 │
│                                                                │
│               [ Start Week 2 → ]                               │
│                                                                │
│                                                                │
│         [ I want to reflect on Week 1 first ]                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Recovery Reflection

**Trigger:** 3+ consecutive misses (or 3+ misses in a week)

**Purpose:** Understand blockers without shame, decide whether to adjust or pause

**Tone:** Compassionate, curious, non-judgmental

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  LET'S TALK                                                    │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  I noticed you've had a few tough days with this habit.       │
│  That's not failure—it's information.                         │
│                                                                │
│  Before we figure out next steps, I'm curious:               │
│  What's been going on?                                        │
│                                                                │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Life got busy/stressful                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  The habit doesn't feel right for me                    │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  I keep forgetting / it's not sticking                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Something changed (travel, schedule, etc.)             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│  │ Tell me what's happening...                        ➤ │  │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Possible outcomes:**
- **Adjust system:** Modify anchor, simplify action, add toolkit items
- **Pause habit:** Put on hold with clear re-entry plan
- **Redesign:** Go back to intake to explore a different habit
- **Recommit:** Acknowledge the rough patch, continue with encouragement

---

### On-Demand Reflection

**Location:** Accessible from System tab menu (⋮)

**Purpose:** User-initiated "is this still right?" check-in

```
⋮ Menu
─────────────
Redesign habit
Pause for now
Talk to coach →
Delete and start over
```

**"Talk to coach" triggers:**

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  WHAT'S ON YOUR MIND?                                          │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  I want to make the habit easier                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  I want to make the habit harder/more ambitious         │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  I'm not sure this is the right habit                   │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Something else                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Reflection Data Model

```typescript
interface Reflection {
  id: string;
  habitId: string;
  type: 'micro' | 'weekly' | 'stage_transition' | 'recovery' | 'on_demand';
  triggeredAt: string;
  completedAt?: string;
  
  // Trigger context
  triggerReason: string;       // "day_7", "3_consecutive_misses", "user_initiated"
  stageAtTrigger?: string;     // "week_1", "week_2", etc.
  
  // User responses
  overallFeeling?: 'good' | 'okay' | 'hard';
  primaryFriction?: string;    // What's the hardest part?
  frictionDetails?: string;    // Specific barrier
  
  // Conversation log
  messages: ReflectionMessage[];
  
  // Outcomes
  systemChanges?: {
    setupChecklistAdded?: string[];
    setupChecklistRemoved?: string[];
    toolkitUpdated?: boolean;
    anchorChanged?: boolean;
    actionChanged?: boolean;
  };
  
  nextFocus?: string;          // "Make the path easier"
  coachNotesUpdated: boolean;
}

interface ReflectionMessage {
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
  selectedOption?: string;     // If user chose from options
}
```

---

## Integration: How the Three Systems Connect

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                         INTAKE CONVERSATION                         │
│                               ↓                                     │
│    ┌─────────────────────────────────────────────────────────────┐ │
│    │  Generates:                                                  │ │
│    │  • Habit system (anchor, action, recovery)                  │ │
│    │  • Identity framing                                         │ │
│    │  • Setup checklist                                          │ │
│    │  • Coach's Notes (Layer 3 education)                        │ │
│    │  • "Why it fits you" rationale (Layer 2 education)          │ │
│    └─────────────────────────────────────────────────────────────┘ │
│                               ↓                                     │
│                         DAILY CHECK-INS                             │
│                               ↓                                     │
│    ┌─────────────────────────────────────────────────────────────┐ │
│    │  Captures:                                                   │ │
│    │  • Trigger occurrence (yes/no)                              │ │
│    │  • Action taken (yes/no)                                    │ │
│    │  • Outcome success (optional)                               │ │
│    │  • Miss reason (if applicable)                              │ │
│    │  • Difficulty rating (optional)                             │ │
│    │                                                              │ │
│    │  Surfaces (Layer 1 education):                              │ │
│    │  • Contextual whispers based on state                       │ │
│    │  • Encouragement or friction-specific tips                  │ │
│    └─────────────────────────────────────────────────────────────┘ │
│                               ↓                                     │
│                        PATTERN FINDER                               │
│                               ↓                                     │
│    ┌─────────────────────────────────────────────────────────────┐ │
│    │  Analyzes:                                                   │ │
│    │  • Trigger occurrence patterns                              │ │
│    │  • Response rate when triggered                             │ │
│    │  • Miss reasons over time                                   │ │
│    │  • Day-of-week patterns                                     │ │
│    │  • Outcome success trends                                   │ │
│    │                                                              │ │
│    │  Outputs:                                                    │ │
│    │  • "Patterns" section content                               │ │
│    │  • Reflection conversation primers                          │ │
│    └─────────────────────────────────────────────────────────────┘ │
│                               ↓                                     │
│                     REFLECTION CYCLES                               │
│                               ↓                                     │
│    ┌─────────────────────────────────────────────────────────────┐ │
│    │  Captures (qualitative):                                     │ │
│    │  • What's working / what's hard                             │ │
│    │  • Specific friction points                                 │ │
│    │  • Life context changes                                     │ │
│    │  • Commitment level                                         │ │
│    │                                                              │ │
│    │  Updates:                                                    │ │
│    │  • Setup checklist (new items)                              │ │
│    │  • Toolkit (tiny version, env prime)                        │ │
│    │  • Coach's Notes (new insights)                             │ │
│    │  • Progression stage                                        │ │
│    │  • Habit system (if redesigned)                             │ │
│    └─────────────────────────────────────────────────────────────┘ │
│                               ↓                                     │
│                    CYCLE CONTINUES...                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Priority

### M1 (Alpha - This Week)

**Must have:**
- [ ] `triggerOccurred` field in data model
- [ ] Three-option check-in for reactive habits
- [ ] Habit-type-aware home screen CTA
- [ ] Basic inline whispers (first rep, first miss)
- [ ] "Why this works" expandable on System screen

**Nice to have:**
- [ ] Optional difficulty rating after logging
- [ ] Miss reason capture

### M1.5 (Alpha Extension)

- [ ] Micro-reflection at Day 7
- [ ] Coach's Notes full document
- [ ] Weekly reflection conversation flow
- [ ] Journey tab with mixed-outcome visualization

### M2 (Beta)

- [ ] Stage transition reflections
- [ ] Recovery reflection (triggered by miss patterns)
- [ ] Pattern Finder integration
- [ ] On-demand reflection
- [ ] Coach's Notes auto-updates from reflections

---

## Open Questions

1. **Reflection frequency:** Is weekly too often? Too rare? Should it be based on activity (every N check-ins) rather than time?

2. **Notification strategy:** How do we prompt reflection without being annoying? Silent badge? Push notification? Only on app open?

3. **Multi-habit future:** When users have multiple habits, do they reflect on each separately or holistically?

4. **Coach's Notes generation:** Should this be AI-generated post-intake, or templated with variable insertion? Tradeoffs: quality vs. consistency vs. cost.

5. **Reflection depth vs. friction:** How do we keep reflections lightweight enough that users complete them, but deep enough to surface real insights?

---

## Success Metrics

| Metric | Target | Measured By |
|--------|--------|-------------|
| Check-in completion rate | >80% of days | CheckIns logged / days since start |
| Reflection completion rate | >60% when triggered | Reflections completed / triggered |
| System adjustment rate | >30% make at least one change | Users with setup or toolkit updates |
| Education engagement | >20% tap "Why this works" | Rationale expansion events |
| Coach's Notes views | >40% view at least once | Page view events |
| Pattern engagement | >50% view Patterns after unlock | Pattern section views / eligible users |