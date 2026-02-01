# Habit Stacker PRD v3 — Agent-First Design

**Last updated:** Jan 27, 2026

---

## Problem Alignment

### Who is the customer

Habit Stacker is designed for busy professionals who recognize that certain life domains—health, finances, home, relationships—are neglected, but lack the time (and often the skill) to translate broad ambitions into sustainable behaviors. Many have tried habit trackers and churned when the tools became punishing, irrelevant, or too effortful.

### What problem are we solving

Most habit apps assume users already know what habit to do and just need tracking + reminders. In reality, users struggle with:

1. **Translating goals into actionable behaviors**
    
    Turning "get fit" into a specific behavior with a reliable cue (when/where/after what) is cognitively hard.
    
2. **Managing the habit lifecycle**
    
    Behavior change is derailed by travel, busy weeks, holidays, and mood. Traditional trackers don't distinguish: install vs stabilize vs maintain vs recover vs redesign.
    
3. **Avoiding the shame spiral**
    
    Punitive framing (especially streak loss) makes misses feel final and leads to abandonment.
    

### Value proposition

Habit Stacker is a **Habit Designer** (not a tracker): it consults users through conversation to co-design a survivable system, then guides daily execution and recovery without shame.

It:

- **Co-designs a tiny, reliable system** through conversational consultation that probes, reflects, and earns the right to recommend.
- **Treats misses as normal** with a deterministic Recovery action and a tiny rep that restores momentum.
- **Uses progressive disclosure**: advanced tuning (progression, knob changes) appears only after evidence (reps), not at setup.

---

## Product Thesis

### Primary thesis: AI-First Habit Designer

**The bet:** A conversational AI agent that probes, reflects, and synthesizes can make users feel more understood than any wizard—and that felt understanding translates to better habit recommendations and higher follow-through.

**What we're testing:**

1. Can the AI ask smart follow-up questions based on what the user says?
2. Can the AI demonstrate insight (not just collect data)?
3. Can the AI synthesize a personalized system that feels "made for me"?
4. Does this feel like co-design, not configuration?

**Promise:** Turn vague intent into a survivable, low-friction system through *conversation*, then make execution trivial.

**Primary moment:** Within a 2-3 minute conversation, the user feels genuinely understood, sees a personalized habit system that addresses their specific situation, and completes the first rep.

---

## The AI's Roles

Beyond the initial consultation, the AI serves multiple roles across the habit lifecycle:

| Role | What It Does | When Active |
| --- | --- | --- |
| **Designer** | Co-creates your system through conversation | Setup, Re-design |
| **Setup Guide** | Provides actionable checklist to prepare your environment | Post-design, before first rep |
| **Tracker** | Records evidence of your reps | Daily execution |
| **Pattern Finder** | Identifies what's working, what breaks, when you're strongest | After enough data (7+ reps) |
| **Recovery Coach** | Normalizes misses, guides you back without shame | After miss |
| **Reflection Partner** | Facilitates periodic "is this still right?" conversations | Weekly/monthly boundaries |
| **Progression Planner** | Shows the arc from Week 1 → mastery | After Week 1 stability |
| **Identity Narrator** | Reminds you who you're becoming and why | Throughout |

---

## User Mental Model

At any point, the user might be asking one of these questions. Each maps to a screen/section:

| User Question | Screen/Section | Available When |
| --- | --- | --- |
| "What should I do?" | **Today** | Always (primary) |
| "What's my system?" | **Your System** | After design |
| "How do I set up?" | **Setup Checklist** | After design |
| "Am I making progress?" | **Your Journey** | After 1+ rep |
| "What patterns do I see?" | **Patterns** | After 7+ reps |
| "I messed up" | **Recovery** | After miss |
| "Is this still right?" | **Reflection** | Weekly boundary |
| "What's next?" | **Progression** | After Week 1 |
| "Who am I becoming?" | **Identity** | Always (background) |
| "Why does this work?" | **The Science** | Always (hidden) |

---

## Navigation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PRIMARY                               │
│                                                              │
│  /today (HOME)                                               │
│  - Today's action (dominant CTA)                             │
│  - Quick stats (reps, streak-free framing)                   │
│  - Quick access to secondary screens                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  YOUR SYSTEM  │    │  YOUR JOURNEY │    │   YOUR SELF   │
│               │    │               │    │               │
│  The Ritual   │    │  Timeline     │    │  Identity     │
│  The Toolkit  │    │  Patterns     │    │  Progression  │
│  Setup List   │    │  Photo Log    │    │  Reflection   │
│  Recovery     │    │               │    │               │
│  The Science  │    │               │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
```

### Tab Breakdown

**Your System** — *"What I do and how"*

- The Ritual: Anchor → Action → Then
- The Toolkit: Tiny version, env prime, friction reduced
- Setup Checklist: Environment prep tasks (interactive)
- When I Miss: Recovery action
- Why This Works: Collapsible science/reasoning

**Your Journey** — *"How I'm doing"*

- Timeline: Visual history (dots, calendar, or list)
- Patterns: AI-generated insights ("You're strongest on weekdays")
- Photo Log: Evidence gallery (if photos collected)

**Your Self** — *"Who I'm becoming"*

- Identity: "You're becoming someone who protects their sleep"
- Progression: Week 1 → Week 2 → Week 3 → ... with current stage highlighted
- Reflection: Periodic check-in (available on-demand, prompted at boundaries)

---

## Progressive Disclosure Rules

| Section | Available | Surfaced (Prompted) |
| --- | --- | --- |
| The Ritual | After design | Always on home |
| Setup Checklist | After design | Before first rep |
| The Toolkit | After tune-up | After tune-up unlocks |
| Timeline | After 1 rep | After 3 reps |
| Patterns | After 7 reps | After pattern detected |
| Identity | After design | After first rep |
| Progression | After Week 1 | After Week 1 complete |
| Reflection | Always | At weekly boundary |
| Photo Log | After 1 photo | After 3 photos |
| Why This Works | Always | Never (user-initiated) |

**Key principle:** Everything is *available* (user can dig), but only *surfaced* when there's enough evidence to make it meaningful.

---

## Key Flows

### 1) Conversational Intake (Replaces Setup Wizard)

**Goal:** Through conversation, understand the user's situation deeply enough to generate personalized recommendations that feel "made for me."

**Design Principles:**

- This is a **conversation, not a form**.
- The agent earns the right to recommend by demonstrating understanding first.
- The agent does the thinking; the user shares and confirms.
- Suggested responses reduce friction but never constrain.

**Phases:**

1. **Opening** — Single open question: "What's something you've been meaning to work on?"
2. **Probing** — 2-4 contextual follow-up questions based on what user shares
3. **Reflection** — Reflect back understanding before probing deeper
4. **Insight Sharing** — Share one relevant piece of domain knowledge
5. **Transition** — Move to recommendations when goal + blocker + timing + history understood

### 2) System Confirmation (Post-Recommendation)

**Goal:** User confirms their chosen habit and anchor, creating ownership.

**Flow:**

1. User sees habit recommendation with "Why this fits you"
2. User confirms or adjusts anchor from suggestions
3. User sees complete system: Anchor → Action → Recovery
4. User sees Week-1 contract
5. CTA: Start first rep now

### 3) Runtime Loop (Daily Execution)

**Goal:** Make execution trivial, misses safe, and recovery deterministic.

**Screens:**

1. **Today (Home)** — Shows action + Done/Missed + navigation to tabs
2. **Completion** — Rep logged, no streak framing, photo prompt
3. **Miss → Recovery** — Normalizes miss, offers Recovery action

### 4) Weekly Reflection (Later Milestone)

**Goal:** Introduce tuning only after evidence.

**Flow:**

- Two questions: "Did this reduce load?" / "What broke?"
- System recommends exactly one adjustment
- Plan snapshot regenerated

---

## New Section Specs

### Setup Checklist

**Purpose:** Bridge between "I have a system" and "I'm actually ready to execute"

**Generated from:** Intake conversation + tune-up + domain knowledge

**Example for sleep habit:**

```
YOUR SETUP CHECKLIST

Before your first rep, set yourself up for success:

Environment
□ Phone charging station set up outside bedroom
□ Book or magazine placed on pillow/nightstand
□ "Wind down" alarm created for 9pm

Mental
□ Told partner/roommate about new routine
□ Identified backup plan for travel nights

Tech
□ Do Not Disturb scheduled for 9pm-7am
□ Removed social apps from home screen (optional)

[2 of 7 complete]
```

**Behavior:**

- Items persist across sessions
- Checking an item is satisfying (animation)
- Can mark items "Not applicable"
- AI can add items based on tune-up conversation

### Identity Section

**Purpose:** Connect daily action to larger transformation

**Generated from:** Goal + domain knowledge

**Example:**

```
WHO YOU'RE BECOMING

You're building the identity of someone who 
protects their sleep.

People with this identity typically:
• Have a clear "shutdown" signal each night
• Keep phones out of the bedroom
• Prioritize rest over "one more episode"
• Wake naturally without multiple alarms

You're not just building a habit—you're 
becoming a different kind of person.
```

### Progression Section

**Purpose:** Show the arc from tiny start to sustainable system

**Generated from:** Domain knowledge + current stage

**Example:**

```
YOUR PROGRESSION

Week 1: SHOW UP ← You are here
Just do the action. Don't optimize.
Success = doing it, regardless of quality.

Week 2: PROTECT THE STREAK
Now that it's automatic, notice what threatens it.
Success = recovering quickly from misses.

Week 3: ADD THE REWARD
Link the habit to something you enjoy.
Success = looking forward to the routine.

Week 4: REFLECT & ADJUST
Is this the right habit? Time to tune.
Success = honest assessment, one adjustment.

Month 2+: EXPAND OR STACK
Ready for the next habit? Or make this one richer?
```

### Patterns Section

**Purpose:** Surface AI-generated insights from tracking data

**Generated from:** Rep logs, timing, miss patterns

**Example:**

```
WHAT I'M NOTICING

Based on your first 10 days:

✓ Strong days: Weekdays (8/8 completed)
⚠ Weak days: Weekends (1/2 completed)

Your typical completion time: 9:15pm
(Your anchor is 9pm — right on track)

Insight: Weekend routines are different. 
Consider a backup anchor for Saturdays.

[Generated Jan 27 • Will update after 7 more reps]
```

**Behavior:**

- Only appears after threshold (7+ reps)
- Updates weekly, not daily
- AI-generated, but bounded (not chatty)
- Suggests ONE action if pattern is concerning

---

## Product Laws

- **Law 1: One active habit.** Exactly one habit at a time. Additional goals go to backlog.
- **Law 2: Miss is first-class.** Miss triggers Recovery; never silent failure.
- **Law 3: No open loops.** Every habit has entry intent + exit boundary.
- **Law 4: No streak framing.** Never imply a miss negates prior effort.
- **Law 5: One clear next step.** At any moment, one dominant CTA.
- **Law 6: Conversation earns recommendation.** The system demonstrates understanding before prescribing.
- **Law 7: Progressive disclosure.** Advanced complexity appears only after evidence.

---

## Milestones

- **M0: Prototype (done)**
    
    Conversational intake → personalized recommendation → first rep loop.
    
- **M1: Alpha (current — solo use, 7 days)**
    
    Full daily loop: conversation → habit → daily execution → miss → recovery.
    
    Basic persistence and reminders.
    
- **M2: Beta (3–5 users, 2–4 weeks)**
    
    Others complete the flow and stick with it. Feedback loop on agent quality.
    
- **M3: V1**
    
    Progression, weekly review, richer personalization, broader domains.
    

---

## Success Metrics

### M0/M1 (Prototype/Alpha)

**Intake Quality**

- Does conversation feel natural, not interrogative?
- Does agent ask relevant follow-ups (not generic checklist)?
- Does reflection accurately capture user's situation?
- Does insight feel earned and relevant?

**Recommendation Quality**

- Do habits address the user's stated blocker?
- Does "Why it fits you" reference specific conversation details?
- Does the recommended habit feel "made for me"?

**Completion**

- % completing conversation → seeing recommendations
- % selecting a habit → completing first rep
- Time from start to first rep (target: <3 minutes)

### M2/M3

- D1 / D7 return rate
- Recovery success rate
- Conversation quality ratings (user feedback)
- Drop-off points in conversation
- Pattern engagement rate

---

## Data Model Updates

### HabitSystem (expanded)

```tsx
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

  // Identity (generated from intake)
  identity?: string;           // "Someone who protects their sleep"
  identityBehaviors?: string[]; // What people with this identity do

  // Progression (generated from domain knowledge)
  currentStage?: string;        // "week_1", "week_2", etc.
  progressionPlan?: ProgressionStage[];

  // Setup (generated from intake + tune-up)
  setupChecklist?: SetupItem[];

  // Metadata
  tunedAt?: string;
  tuneCount?: number;
}

interface SetupItem {
  id: string;
  category: 'environment' | 'mental' | 'tech';
  text: string;
  completed: boolean;
  notApplicable: boolean;
}

interface ProgressionStage {
  id: string;
  name: string;
  description: string;
  successCriteria: string;
  unlockAfter: string; // "7_reps", "14_days", etc.
}
```

---

## Open Questions / Risks

### Primary Risk (M1)

**Can the day-to-day experience sustain engagement beyond the initial consultation?**

- Risk: Rich intake but thin daily experience → users don't return
- Mitigation: Setup Checklist, Identity, Progression give users something to engage with between reps

### Secondary Risks

- Patterns section could surface discouraging insights ("You failed 50% of the time")
- Identity framing could feel preachy or presumptuous
- Progression plan could create pressure vs. encouragement

**Mitigations:**

- Patterns language always constructive, never punitive
- Identity is optional/hideable
- Progression emphasizes "you're on track" not "you're behind"

---

## Implementation Priority (Week 4)

**Do now (before daily use starts):**

1. Simple 7-day dots on home screen — visual feedback
2. Identity framing — generate during intake, show on /system

**Do during self-use (if friction emerges):**

1. Setup Checklist — derived from env prime, interactive
2. Progression plan — if Week 1 → Week 2 transition feels unclear

**Defer to Week 5-6:**

1. Patterns section — needs real data to be meaningful
2. Photo journal view — nice-to-have, not core to thesis
3. Reflection phase — needs real miss data