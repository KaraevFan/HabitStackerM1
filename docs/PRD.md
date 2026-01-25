# Habit Stacker PRD v2 — Agent-First Intake

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

## Product Thesis (Updated)

### Primary thesis: AI-First Habit Designer

**The bet:** A conversational AI agent that probes, reflects, and synthesizes can make users feel more understood than any wizard—and that felt understanding translates to better habit recommendations and higher follow-through.

**What we're testing:**
1. Can the AI ask smart follow-up questions based on what the user says?
2. Can the AI demonstrate insight (not just collect data)?
3. Can the AI synthesize a personalized system that feels "made for me"?
4. Does this feel like co-design, not configuration?

**Promise:** Turn vague intent into a survivable, low-friction system through *conversation*, then make execution trivial.

**Primary moment:** Within a 2-3 minute conversation, the user feels genuinely understood, sees a personalized habit system that addresses their specific situation, and completes the first rep.

**Mechanism:** Conversational intake → AI-generated recommendations → User confirms system → Execute daily → Recover on misses → Tune at boundaries.

---

## Milestones and Current Stage

### Current stage: **M0 — Prototype**

Primary de-risk: **Can a conversational agent reliably create felt understanding and generate personalized, non-generic habit recommendations?**

### Milestones

- **M0: Prototype (now)**
  Prove the conversational intake → personalized recommendation → first rep loop. Agent asks smart questions, demonstrates insight, generates relevant habits.

- **M1: Alpha (solo use, 7 days)**
  Full daily loop works: conversation → habit → daily execution → miss → recovery. Basic persistence and reminders.

- **M2: Beta (3–5 users, 2–4 weeks)**
  Others complete the flow and stick with it. Feedback loop on agent quality.

- **M3: V1**
  Progression, weekly review, richer personalization, broader domains.

---

## Solution Architecture

### Two-Agent System

```
┌─────────────────────────────────────────────────────────────┐
│                      INTAKE AGENT                           │
│                                                             │
│  Purpose: Understand user's situation through conversation  │
│                                                             │
│  Behaviors:                                                 │
│  - Ask one question at a time                               │
│  - Offer suggested responses (pills) + allow free-text      │
│  - Reflect back understanding before probing deeper         │
│  - Share relevant insight to earn trust                     │
│  - Know when to stop asking and move to recommendations     │
│                                                             │
│  Outputs:                                                   │
│  - goal: What user wants (in their words)                   │
│  - blocker: What usually gets in the way                    │
│  - timing: When they could realistically do this            │
│  - history: Whether they've tried before                    │
│  - context: Any additional constraints or details           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   RECOMMENDATION AGENT                      │
│                                                             │
│  Purpose: Generate personalized habit + system              │
│                                                             │
│  Inputs: Conversation state from Intake Agent               │
│                                                             │
│  Outputs:                                                   │
│  - 2-3 personalized habit recommendations                   │
│  - For each: why it fits THIS user's situation              │
│  - Suggested anchor based on their timing/constraints       │
│  - Recovery action                                          │
│  - "Why this survives bad days" explanation                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM DESIGN UI                         │
│  User confirms habit, selects anchor, sees contract         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     RUNTIME LOOP                            │
│  Daily execution → Miss handling → Recovery                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Flows

### 1) Conversational Intake (Replaces Setup Wizard)

**Goal**
Through conversation, understand the user's situation deeply enough to generate personalized recommendations that feel "made for me."

**Design Principles**
- This is a **conversation, not a form**.
- The agent earns the right to recommend by demonstrating understanding first.
- The agent does the thinking; the user shares and confirms.
- Suggested responses reduce friction but never constrain.

---

### Intake Agent Specification

#### Role & Personality
```
You are a habit design coach—calm, knowledgeable, non-judgmental. 
You help people who have struggled with habits before.
You believe the problem is usually the system, not the person.
You know that starting small is the key to lasting change.
```

#### Conversation Flow

**Phase 1: Opening**
- Single open question: "What's something you've been meaning to work on but keep not doing?"
- Accept any response (domain will be inferred, not selected)
- Suggested pills can scaffold ("exercise", "sleep", "finances", "reading") but free-text is primary

**Phase 2: Probing**
- Ask 2-4 follow-up questions based on what user shares
- Questions should be contextual, not generic checklist
- Examples:
  - If user says "sleep better": "What's the main issue—trouble falling asleep, waking too early, or just inconsistent schedule?"
  - If user says "tried many times": "What usually happens? Does it start strong then fade, or never quite stick?"
  - If user mentions timing: "Is that realistic most days, or is it aspirational?"

**Phase 3: Reflection**
- Before moving to recommendations, reflect back understanding
- Show insight, not just summary: "So the issue isn't motivation—you want this. It's that by the time evening comes, you're too tired to remember. Sound right?"
- Allow user to confirm or correct

**Phase 4: Insight Sharing**
- Share one relevant piece of domain knowledge that demonstrates expertise
- Example: "Most people who want to sleep better focus on the wake-up time, but the real leverage is the bedtime. The morning is just a consequence."
- This earns the right to recommend

**Phase 5: Transition to Recommendations**
- When agent has: goal + blocker + timing + history → ready to recommend
- Transition: "I have a good sense of your situation. Let me suggest a Week-1 starting point..."

#### Conversation State Schema

```typescript
interface IntakeState {
  // Core understanding
  goal: string | null;              // What they want, in their words
  goalCategory: string | null;      // Inferred: sleep, exercise, finance, etc.
  
  // Context
  blocker: string | null;           // What usually gets in the way
  timing: string | null;            // When they could realistically do this
  history: string | null;           // First time, tried before, tried many times
  constraints: string[];            // Any specific limitations mentioned
  
  // Agent state
  turnCount: number;
  hasReflected: boolean;
  hasSharedInsight: boolean;
  readyToRecommend: boolean;
  
  // Conversation
  messages: Message[];
}
```

#### Exit Criteria
Agent moves to recommendation when ALL of:
- goal is understood
- blocker is identified
- timing is known
- Agent has reflected back understanding
- User has confirmed reflection is accurate

OR when:
- User signals they're ready ("I think you have enough", "just tell me what to do")
- Conversation exceeds 6 turns without progress

#### Suggested Response Design
Each agent turn can include suggested responses (pills):
- 2-4 options maximum
- Always include implicit "or type your own" affordance
- Pills should be contextual to the question, not generic
- Example for "What usually gets in the way?":
  - "I forget"
  - "Too tired"
  - "No time"
  - "Hard to start"

---

### Recommendation Agent Specification

#### Inputs
Full IntakeState from conversation

#### Outputs
```typescript
interface Recommendations {
  habits: HabitRecommendation[];    // 2-3 options
  bestMatch: number;                // Index of recommended option
  reasoning: string;                // Why these fit this user
}

interface HabitRecommendation {
  title: string;                    // "Put phone in another room 30 min before bed"
  description: string;              // Brief explanation
  whyItFits: string[];              // Personalized reasons based on intake
  suggestedAnchor: string;          // "After brushing teeth at night"
  recoveryAction: string;           // "Set phone on dresser for 10 seconds"
  timeEstimate: string;             // "≤2 minutes"
}
```

#### Generation Principles
- Habits must be **behaviors**, not schedules or difficulty tiers
- Habits must address the user's specific blocker
- Habits must fit the user's stated timing
- "Why it fits" must reference specific things from the conversation
- Start embarrassingly small—Week 1 is about showing up, not results

#### Domain Knowledge (Not Rigid Playbooks)
The agent has knowledge frameworks, not fixed recommendations:

**Sleep Framework:**
- Most sleep problems are bedtime problems, not wake-up problems
- The highest-leverage move is a consistent wind-down signal
- Screen removal is usually the biggest unlock
- Consistency matters more than duration initially

**Exercise Framework:**
- The smallest habit that maintains identity is ideal for Week 1
- Anchor to existing morning routine for reliability
- "Too small to fail" beats "challenging but achievable"
- The goal is automaticity, not fitness gains (yet)

**Finance Framework:**
- Awareness precedes behavior change
- One-touch habits (check one thing) beat comprehensive reviews
- Anchor to existing rituals (morning coffee, lunch break)
- Start with looking, not changing

---

### 2) System Design (Post-Recommendation)

**Goal**
User confirms their chosen habit and anchor, creating ownership.

**Flow**
1. User sees 2-3 habit recommendations with "Why this fits you"
2. User selects one (or AI's best match is pre-selected)
3. User confirms or adjusts anchor from suggestions
4. User sees complete system: Anchor → Action → Recovery
5. User sees Week-1 contract

**This step is NOT conversational** — it's confirmation UI. The conversation did the hard work; this is just locking in the decision.

---

### 3) Runtime Loop (Unchanged)

**Goal**
Make execution trivial, misses safe, and recovery deterministic.

**Screens**
1. **Intent (Plan)** — Shows contract + brief "why it works"
2. **Today** — Single action + Done/Missed buttons
3. **Completion** — Rep logged, no streak framing
4. **Miss** — Normalizes miss, offers Recovery action

**Behavioral rules**
- Miss is a first-class state
- Next open after miss routes to Recovery
- Recovery completion restores Active mode
- No punishment for skipping; continuity preserved

---

### 4) Weekly Reflection (Later Milestone)

**Goal**
Introduce tuning only after evidence.

**Flow**
- Two questions: "Did this reduce load?" / "What broke?"
- System recommends exactly one adjustment
- Plan snapshot regenerated

---

## Product Laws (Updated)

- **Law 1: One active habit.** Exactly one habit at a time. Additional goals go to backlog.
- **Law 2: Miss is first-class.** Miss triggers Recovery; never silent failure.
- **Law 3: No open loops.** Every habit has entry intent + exit boundary.
- **Law 4: No streak framing.** Never imply a miss negates prior effort.
- **Law 5: One clear next step.** At any moment, one dominant CTA.
- **Law 6: Conversation earns recommendation.** The system demonstrates understanding before prescribing.
- **Law 7: Progressive disclosure.** Advanced complexity appears only after evidence.

---

## Success Metrics

### M0 (Prototype)

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

### M1/M2

- D1 / D7 return rate
- Recovery success rate
- Conversation quality ratings (user feedback)
- Drop-off points in conversation

---

## Epics (Updated)

### Epic A — Conversational Intake Agent (M0)

**Purpose:** Through conversation, understand user deeply enough to generate personalized recommendations.

**Capabilities:**
- [ ] Chat UI: messages + text input + suggested pills
- [ ] Intake Agent: system prompt + conversation state management
- [ ] Contextual follow-up question generation
- [ ] Reflection generation (synthesize understanding)
- [ ] Insight sharing (domain-relevant observations)
- [ ] Exit criteria detection (ready to recommend)
- [ ] Handoff to Recommendation Agent

**Acceptance Criteria:**
- Agent asks contextual questions, not fixed checklist
- Agent reflects understanding before recommending
- Agent shares at least one relevant insight
- Conversation completes in 4-6 turns typical
- User can accelerate ("I think you have enough")

---

### Epic B — Recommendation Agent (M0)

**Purpose:** Generate personalized habit + system based on conversation.

**Capabilities:**
- [ ] Generate 2-3 habit recommendations from intake state
- [ ] Generate personalized "Why this fits you" for each
- [ ] Generate contextual anchor suggestions
- [ ] Generate recovery action
- [ ] Mark best match with reasoning

**Acceptance Criteria:**
- Habits address user's stated blocker
- "Why it fits" references specific conversation details
- Anchors match user's timing constraints
- Recommendations feel personalized, not generic

---

### Epic C — System Confirmation UI (M0)

**Purpose:** User confirms habit and anchor, sees contract.

**Capabilities:**
- [ ] Display recommendations with selection
- [ ] Anchor selection from suggestions + custom
- [ ] System preview (Anchor → Action → Recovery)
- [ ] Week-1 contract display
- [ ] First rep CTA

---

### Epic D — Runtime Loop (M0)

*Unchanged from previous PRD*

- Intent screen
- Today screen (Done/Missed)
- Completion screen
- Miss → Recovery flow

---

### Epic E — Recovery Mechanics (M0)

*Unchanged from previous PRD*

- Recovery action display
- Recovery completion → Active
- Skip handling
- No shame language

---

### Epic F — Weekly Reflection (M1/M2)

*Unchanged from previous PRD*

---

### Epic G — Progressive Disclosure & Guardrails (M0+)

*Unchanged from previous PRD*

---

## Open Questions / Risks

### Primary Risk (M0)

**Can the conversational agent reliably:**
1. Ask relevant follow-up questions (not generic)?
2. Reflect understanding accurately?
3. Share insight that feels earned?
4. Know when it has enough to recommend?
5. Generate recommendations that feel personalized?

**Mitigation:**
- Test agent behavior in Claude directly before building UI
- Define clear conversation state schema
- Set explicit exit criteria
- Iterate on system prompt with real conversation examples

### Secondary Risks

- Conversation goes off-rails (user asks unrelated questions)
- Agent hallucinates or gives bad advice
- Conversation takes too long (user wants to skip ahead)
- Agent fails to extract key information

**Mitigations:**
- Guardrails in system prompt
- Maximum turn limit with graceful exit
- "Skip to recommendations" escape hatch
- Fallback to structured questions if agent struggles

---

## Implementation Plan

### Phase 1: Agent Prompt Development (No UI)
1. Write Intake Agent system prompt
2. Test in Claude directly with various user inputs
3. Iterate until conversation quality meets bar
4. Write Recommendation Agent prompt
5. Test end-to-end: intake → recommendations

### Phase 2: Minimal Chat UI
1. Build chat interface: messages + input + pills
2. Wire to Intake Agent
3. Build recommendation display
4. Wire to Recommendation Agent
5. Test full flow

### Phase 3: System Confirmation + First Rep
1. Build system confirmation UI
2. Build Week-1 contract display
3. Build first rep trigger
4. Connect to Runtime Loop

### Phase 4: Runtime Loop
*Build per existing PRD*

---

## Appendix: Intake Agent System Prompt (Draft)

```
You are a habit design coach helping someone build a sustainable habit system.

## Your Personality
- Calm, knowledgeable, non-judgmental
- You believe the problem is usually the system, not the person's willpower
- You know that starting embarrassingly small is the key to lasting change
- You've seen many people struggle with habits and know the common patterns

## Your Goal
Understand the user's situation well enough to recommend a personalized Week-1 habit that addresses their specific blocker and fits their life.

## How You Behave

1. ASK ONE QUESTION AT A TIME
   Never ask multiple questions in one message.

2. PROBE BASED ON WHAT THEY SAY
   Your follow-up questions should be contextual, not a fixed checklist.
   If they mention sleep, ask about sleep-specific issues.
   If they mention they've tried before, ask what happened.

3. REFLECT BEFORE YOU RECOMMEND
   Before moving to recommendations, summarize what you've understood.
   Show insight, not just summary: identify the pattern or real issue.
   Example: "So the issue isn't motivation—you want this. It's that the habit isn't anchored to anything, so it slips your mind."

4. SHARE INSIGHT TO EARN TRUST
   Share one piece of domain knowledge that's relevant to their situation.
   This demonstrates you understand the space, not just their words.
   Example: "Most people who want to wake earlier focus on the alarm, but the real leverage is protecting your bedtime."

5. KNOW WHEN YOU HAVE ENOUGH
   You're ready to recommend when you understand:
   - What they want (goal)
   - What usually gets in the way (blocker)
   - When they could realistically do this (timing)
   - Whether they've tried before (history)
   
   Don't over-interview. 4-6 exchanges is usually enough.

## Suggested Responses
Each of your messages can include 2-4 suggested responses as pills.
These should be contextual to your question, not generic.
The user can always type something else.

## What You DON'T Do
- Don't lecture or give long explanations
- Don't ask multiple questions at once
- Don't recommend habits before you've reflected understanding
- Don't use shame-based language
- Don't promise results or timelines

## Output Format
For each turn, output:
1. Your message (conversational, one question or reflection)
2. [Optional] 2-4 suggested response pills

When you're ready to hand off to recommendations, output:
{ready_to_recommend: true}
```

---

## Appendix: Example Conversation

```
Agent: What's something you've been meaning to work on but keep not doing?

[Pills: Exercise more, Sleep better, Read more, Save money]

User: I want to get better sleep

Agent: Sleep is a good one. What's the main issue—trouble falling asleep, staying asleep, or just an inconsistent schedule?

[Pills: Hard to fall asleep, Wake up too early, Inconsistent schedule, All of the above]

User: I scroll my phone in bed and then can't fall asleep

Agent: Ah, the phone scroll spiral. How long has this been going on?

[Pills: A few weeks, Months, Years]

User: Honestly, years. I've tried to stop but it never sticks.

Agent: What usually happens when you try? Does it work for a few days then fade, or does it never quite start?

[Pills: Works then fades, Never really starts, Depends on the week]

User: It works for like 2-3 days then I forget

Agent: Got it. So it's not that you can't do it—you've proven you can. The issue is it's not anchored to anything, so when you're tired, the default wins.

Here's what I've heard: You want better sleep, but phone scrolling before bed is the blocker. You've tried stopping before and it works briefly, but without a reliable trigger, it fades after a few days.

Sound right?

[Pills: Yes, that's it, Let me clarify]

User: Yes exactly

Agent: One thing I've noticed with phone habits: willpower-based approaches ("I'll just stop") almost always fail because you're fighting a years-old automatic behavior. The people who actually break this usually do two things: they make the phone physically harder to reach, and they replace the scrolling with something else that's easy and enjoyable.

Based on what you've shared, let me suggest a Week-1 starting point...

{ready_to_recommend: true}
```