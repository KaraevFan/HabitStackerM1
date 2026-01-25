# Stage Requirements — Habit Stacker (Living Doc) — UPDATED (Jan 2026)

Purpose

This document defines milestone-specific requirements for Habit Stacker. It is the “execution checklist” that evolves quickly. The PRD remains stable and links here.

---

## Global UX Laws (apply to all stages)

1. **One active sprint.** Exactly one active install/sprint habit at a time; others go to backlog.
2. **One decision per consult step.** AI proposes 2–3 options; user approves one; then proceed.
3. **One clear next step.** Every screen has one dominant CTA.
4. **Never miss twice (state-based).** Miss triggers a **Recovery action** (≤30s) as the next forced step; completing returns to Active. *(Recovery is not a separate “day” UX concept; it’s a first-class state + next action.)*
5. **No streak framing.** Use “Reps / Last done / Continuity,” never “streak.”
6. **Progressive disclosure.** Complexity appears only after evidence (reps/misses), not at setup.
7. **Reps-first.** No system edits until 3 reps (except emergency “make it easier”).

---

## Milestones Overview

- **M0 Prototype:** A CLI tool wired to real AI from OpenAI. Prove stepwise consult + real AI option quality + Setup→First rep + Runtime (Today/Miss/Recovery).
- **M1 Alpha (solo, 7 days):** A Web App with UI wired to real AI. You can use it reliably for a week; reminders; basic re-entry; minimal safe tuning after evidence.
- **M2 Beta (3–5 users, 2–4 weeks):** A Web App + Mobile App with UI wired to real AI. Others can use it end-to-end; weekly reflection is light-but-real; stability + feedback + guardrails.
- **M3 V1:** A Web App + Mobile App with UI wired to real AI. Progression/weekly review polish, deeper personalization, broader scope, analytics.

---

# M0 — Prototype Requirements (AI feasibility + loop integrity)

## Scope (what this stage proves)

- A sequential “catch-ball” **Setup Wizard** that feels consultative and responsive.
- AI generates non-generic options step-by-step under a strict schema.
- You can complete end-to-end: **Setup → Confirm Snapshot → First Rep → Runtime (Intent/Today) → Miss → Recovery → Active**.
- Orientation / “what good looks like” is present (even if lightweight).

## Must-have UX flows

### F1: Setup Wizard (one-time consult)

**Goal:** translate vague intent into a survivable Week-1 contract and trigger the first rep immediately.

Minimum steps (M0):

1. **Intent + Constraints (framing)**
- Ask: domain/goal + 1–3 constraints
- Provide: calm framing (“Week 1 = show up; we’re not fixing everything”)
1. **Orientation / Success Map (read-only; auto-confirm)**
- Provide: simple phased map (show up → stabilize → build)
1. **Define Success This Week (bounded outcomes)**
- Ask: choose 1 of 2–3 outcomes (e.g., show up / same time / no pressure)
- Provide: “why this works” per option
1. **Planning (compressed proposal + approval)**
- Provide a proposed plan: **Anchor + Action (≤2m) + Prime (≤30s, optional) + Recovery (≤30s if recurring)**
- Ask: accept or lightly edit
1. **Confirm Snapshot (2-line Aha) + CTA**
- Show only:
    - Line 1: “Week 1: Show up.”
    - Line 2: “After [anchor], [2-min action].”
    - One CTA: “Start today (2 min)”
1. **First Rep**
- Log rep; route into Runtime.

> Note: If you prefer to keep the original stepwise “anchor/context/action/prime” breakdown for AI de-risking, that’s allowed in M0, but the UI must still present it as a short consult (not 7 form pages).
> 

---

### F2: Runtime Loop (daily execution)

Minimum screens (M0):

- **Intent (Plan)**
    - Show snapshot + 1-line “why”
    - CTA: Start today’s rep
- **Today**
    - Show one “Next step” card (action ≤2m) + optional prime
    - Buttons: Done / Missed
- **Completion**
    - Rep logged (no streak language)
    - Optional 1-line friction note
- **Miss**
    - Normalize miss
    - Offer Recovery action (≤30s)
    - Buttons: Do recovery now / Skip

---

### F3: Miss → Recovery (never miss twice)

- Miss is a **first-class state**.
- After a miss, the **next open** routes to Recovery action (≤30s) as the forced “next step.”
- Completing Recovery returns to Active (continuity preserved).
- Skipping does not punish; returns to Intent.

---

## Must-have AI behavior

### AI per-step response schema (required)

AI returns JSON:

- `step`: one of`intent | orientation | success_week | anchor | context | action | prime | recovery | snapshot`
- `question`: string
- `options`: array of 2–3 objects: `{id, title, description, why}`
- `recommended_id`: one of option ids
- `needs_free_text`: boolean
- `free_text_prompt`: string|null

### AI constraints (hard rules)

- Always 2–3 options (never 1, never 10).
- Each option: title ≤ 6 words; description ≤ 120 chars; why ≤ 200 chars.
- Must not use forbidden terms: “streak”, “failure”, “discipline” (configurable list).
- Must respect time budgets:
    - action ≤ 2 minutes
    - prime ≤ 30 seconds
    - recovery ≤ 30 seconds
- Must not invent user facts; only build from provided state.
- Tone: calm, practical, non-cheerleading.

### AI quality bar (human eval)

Across 3 personas (runner, home upkeep, spend control):

- At least 2/3 options feel plausible and specific (not generic).
- “Why” feels grounded (cue, friction, simplicity), not therapy talk.
- Options respect constraints (time-poor, shame-prone, inconsistent schedule).

---

## Persistence (minimum)

- Local persistence OK (localStorage / JSON).
- Store:
    - selected choices by step
    - assembled plan snapshot
    - reps count, last done date
    - event log (rep_done, miss, recovery_done, skip)
    - current mode/state: Active | Missed | Recovery
    - missed flag or last_missed_date (if needed)

## Instrumentation (minimum)

- Log consult step completion + drop-off point
- Log rep completion (standard/tiny) + missed events
- Log recovery completion rate
- Log time-to-first-rep (start consult → first rep)

## Acceptance tests (prototype)

- Can run end-to-end in < 3 minutes.
- Simulate miss → next open forces Recovery action → recovery completion returns to Active.
- AI schema validation passes on every step (basic validator).
- Snapshot is exactly 2 lines + one CTA (no extra text).

## Out of scope (explicit)

- Weekly reflection intelligence (stub allowed)
- Progression ladder (locked placeholder only)
- Knob edits (locked placeholder only)
- Backlog UX (optional placeholder)
- Multi-habit support
- Deep analytics, social/community
- Offline-first, sync

---

# M1 — Alpha Requirements (solo use, 7 days) — UPDATED

## Scope (what this stage proves)

- You can use it daily for **7 consecutive days**.
- Miss → Recovery works reliably with real behavior (not only simulated).
- Reminders exist and don’t annoy.
- Re-entry after inactivity works without shame.
- Minimal tuning is unlocked safely **after evidence** (3 reps), without breaking the state machine.

---

## Must-have additions

### A1: Reminders (simple, non-annoying)

- One daily reminder time (single).
- Snooze once.
- Quiet hours optional.
- Reminder copy must avoid shame (“Ready for today’s 2 min?” not “You missed yesterday”).

### A2: Re-entry after inactivity (anti-shame)

If inactive ≥ 7 days:

- “Welcome back” screen (no stats shaming).
- Default to **tiny-only** mode for 3 days OR route to Recovery action (your choice; keep deterministic).
- Option to “Re-design” (shortened Setup Wizard) with guardrails:
    - keep Intent + Success This Week + Planning + Snapshot
    - avoid full reconfiguration by default

### A3: Unlock exactly one knob after 3 reps (safe tuning)

After 3 reps:

- Allow adjusting exactly one:
    - **action size** (2 min → 1 min) OR
    - **anchor** OR
    - **time window/context**
- No multi-knob changes in one session.
- No full reconfiguration until a boundary (weekly review later).

### A4: Plan tab as an artifact (stable reference)

- Snapshot visible at all times.
- “Why this works” visible but collapsible.
- Recovery section appears after first miss (explains Recovery action in neutral language).
- Progression remains locked.
- Backlog can remain a placeholder.

### A5: Trust basics

- Reset data
- Delete local data / clear history
- Basic “send feedback” link (can be a mailto or form)

---

## Acceptance tests (Alpha)

- Complete 7-day self-run with **≥2 misses** and **≥2 recoveries**.
- No screen forces long typing; consult remains short.
- After 3 reps, knob edit works and does not break state transitions.
- Re-entry after ≥7 days is calm and gets you to a rep within 60 seconds.

## Out of scope (M1)

- Weekly reflection intelligence (can remain stub/simple)
- Goldilocks progression ladder
- Backlog sophistication
- Multi-device sync

---

# M2 — Beta Requirements (3–5 users, 2–4 weeks) — UPDATED

## Scope (what this stage proves)

- Others can complete onboarding without coaching.
- Loop integrity holds under varied schedules.
- Weekly reflection is **light but real** and recommends exactly one change.
- Product is stable enough for small external testing (basic resilience, AI failures handled).

---

## Must-have additions

### B1: Onboarding clarity + affordances

- Clear explanation of:
    - “one decision per step”
    - “Week 1 = show up”
    - “miss → recovery is normal”
- “Why” collapse/expand works and is helpful.
- Clear “Not now” path that doesn’t break the loop (e.g., defer first rep without losing plan).

### B2: Weekly reflection (light but real)

- 3–5 minute review.
- Shows:
    - reps, misses
    - recovery completions
    - (optional) common “what broke” snippets
- Recommends **exactly one** change (one knob) and regenerates snapshot.

### B3: Basic progression gate (very small)

After 7 reps:

- Offer one of:
    - Keep as-is
    - Slightly harder (e.g., 2 min → 3–5 min, or add a tiny consistency constraint)
- No complex ladders.
- Must keep “one clear next step.”

### B4: Feedback + bug capture

- In-app feedback form.
- Auto-attach context:
    - current state (Active/Missed/Recovery)
    - plan snapshot
    - last 5 events
    - consult step if applicable
- Option to “report AI suggestion quality” (thumbs up/down is enough).

### B5: Reliability + guardrails for AI failure

- Error handling for AI failure:
    - retry
    - fallback options with disclosure (“Here are safe defaults while AI retries.”)
- Rate limit / latency handling (loading + cancel)
- Basic privacy note (what’s stored, where)

---

## Acceptance tests (Beta)

- 3–5 users can complete consult + first rep in <5 minutes.
- At least 60% complete ≥4 reps in week 1 (placeholder target).
- Recovery completion rate > 50% after a miss (placeholder target).
- Weekly review completion rate > 40% at week boundary (placeholder target).
- AI failure path is non-blocking and does not crash the loop.

---

# M3 — V1 Requirements (polish + depth) [unchanged shell]

## Scope

- Durable multi-week product with meaningful retention.
- More domains, richer personalization, strong weekly review, progression, and analytics.

Additions (examples)

- Goldilocks progression ladder (tuned)
- More robust “fit” personalization
- Backlog / sprint planning (optional)
- Cross-device sync
- Export
- Offline-first (if truly needed)
- Better instrumentation and dashboards

---

## Appendix: Persona Test Cases (for AI eval)

1. Runner beginner: “become a runner,” time-poor, shame-prone, morning unreliable.
2. Home upkeep: “keep apartment tidy,” hates big cleaning, needs 2-min resets.
3. Spend control: “stop impulse buys,” needs cue interruption + friction design.

---

## Appendix: Forbidden language list (initial)

- streak
- failure
- discipline
- lazy
- shame

---

## Appendix: Step definitions (short)

- Intent: define what we’re building + constraints.
- Orientation: “what good looks like” phases (read-only).
- Success this week: bounded definition of progress for Week 1.
- Anchor: attach to existing routine (habit stacking).
- Context: time window + location (optional in compressed planning).
- Action: ≤2-min gateway rep.
- Prime: ≤30s environment setup.
- Recovery: ≤30s rep used after miss.
- Snapshot: 2-line contract + one CTA.