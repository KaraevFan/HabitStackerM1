# Supabase Migration & User Testing Readiness Plan

**Date:** 2026-02-09
**Context:** Habit Stacker M1 Alpha is feature-complete on localStorage. Before migrating to Supabase and deploying for 3-5 user trials, this document identifies critical risks and a phased plan to address them.

**Strategy:** Migrate to Supabase first, then deploy with real persistence for user testing.

---

## Risk Assessment

Six risk areas identified from a full codebase + docs audit (DESIGN_DOC, PRD, R1-R20 feedback logs).

### Risk 1: Schema-Storage Mismatch (HIGH — Migration Blocker)

`HabitData` in `src/types/habit.ts` is a single monolithic blob designed for localStorage's `JSON.stringify(everything)` pattern. Unbounded arrays (`checkIns[]`, `dayMemories[]`, `reflections[]`), deeply nested objects (`system.coachNotes`), and legacy fields all live inline.

Supabase is Postgres. The blob must decompose into normalized tables with foreign keys. But every component currently calls `loadHabitData()` and gets the full blob, or `updateHabitData()` with a partial merge. The migration is a data layer rewrite, not a storage swap.

### Risk 2: Auth Is Completely Absent (HIGH — Migration Blocker)

No concept of a "user" exists. All 7 API routes are open — no auth checks, no user ID. `habitStore.ts` reads/writes a single global localStorage key. Supabase requires auth for Row Level Security, data scoping, and multi-device support. Auth is a foundation, not a feature — every table needs `user_id`, every route needs a session check.

### Risk 3: The "Open Loop" Problem (MEDIUM-HIGH — User Testing Risk)

R18 identified: data flows in but never flows back. Check-ins feed patterns, patterns surface insights, reflections collect feedback — but almost nothing mutates the HabitSystem.

`applySystemUpdate()` exists and weekly reflections CAN propose changes, but: daily reflections don't propose system changes, pattern suggestions aren't actionable in the UI, recovery coach proposals are stored but not applied. If testers say "mornings don't work" three times and nothing changes, they'll lose trust.

### Risk 4: AI Cost and Latency (MEDIUM — User Testing Risk)

Nearly every agent runs on Sonnet 4.5. Daily check-in with reflection = 2 Sonnet calls + 1 Haiku call per day per user. 5 users = 150+ Sonnet calls/month minimum.

More critically: `/api/reflection/stream` and `/api/recovery/stream` don't actually stream despite the path. Users see a 3-5 second spinner in what should feel like texting.

### Risk 5: Date/Time Handling (MEDIUM — Data Integrity Risk)

R19 flagged UTC vs. local time silently corrupting data. `localDate.ts` was added but the fix is partial. Check-in IDs use `YYYY-MM-DD` — timezone-sensitive. `getTodayCheckIn()` compares with `toLocaleDateString()` but stored dates may use different logic. In Supabase, timestamps are UTC by default. "Did I check in today?" giving the wrong answer breaks the entire daily loop.

### Risk 6: No Tests + No Error Boundaries (MEDIUM — Migration Safety Risk)

Zero automated tests (DESIGN_DOC confirms). No React error boundaries. Swapping the entire persistence layer without a regression net means any bad query crashes the app silently. The manual smoke checklist doesn't cover edge cases: empty state, mid-conversation reload, network failure during AI call.

---

## Phased Plan

### Phase 1: Pre-Migration Prep (on localStorage)

Goal: De-risk the migration itself. Everything here is done before touching Supabase.

#### Step 1: Date/Time Standardization

**Why first:** Schema design depends on this. Mixed date formats baked into Postgres are permanent.

- Audit every date creation/comparison in `habitStore.ts`, `localDate.ts`, and `useUserState.ts`
- Standardize: generate all dates as ISO 8601 UTC, store user timezone separately, convert at display layer
- Fix any existing localStorage data with mixed formats
- Decision: check-in "date" is the user's local calendar date (YYYY-MM-DD), timestamps are UTC

#### Step 2: Data Access Layer (DAL) Interface

**Why:** Creates a seam between components and storage. Components call the interface; the implementation swaps from localStorage to Supabase later without touching components.

Extract from `habitStore.ts`:

```typescript
// Read operations
getHabit(): Promise<HabitData | null>
getTodayCheckIn(timezone: string): Promise<CheckIn | null>
getCheckIns(dateRange: { from: string, to: string }): Promise<CheckIn[]>
getDayMemories(limit: number): Promise<DayMemory[]>
getReflections(): Promise<WeeklyReflection[]>
getLatestPatternSnapshot(): Promise<PatternSnapshot | null>
getCoachNotes(): Promise<CoachNotes | null>

// Write operations
saveHabit(data: Partial<HabitData>): Promise<void>
saveCheckIn(checkIn: CheckIn): Promise<void>
updateCheckIn(id: string, updates: Partial<CheckIn>): Promise<void>
saveDayMemory(memory: DayMemory): Promise<void>
saveReflection(reflection: WeeklyReflection): Promise<void>
savePatternSnapshot(snapshot: PatternSnapshot): Promise<void>
applySystemUpdate(field: string, value: unknown): Promise<void>
```

First implementation: wraps the existing localStorage blob. No behavior change.

#### Step 3: Critical Path Tests

**Why:** Safety net for the persistence swap. Test the DAL interface, not components — tests survive the migration.

Cover the core loop:
- Create habit from intake recommendation -> verify persisted state
- Check in (done) -> verify check-in saved with correct date
- Check in (miss) -> verify state transitions to recovery
- Recovery accepted -> verify state restored to active
- Reload -> verify all state survives
- Weekly reflection with system change -> verify mutation applied

Add React error boundaries around:
- `PlanScreen` (main runtime)
- `CheckInFlow` (daily action)
- Reflection/recovery conversation components

#### Step 4: Stream Reflection & Recovery Endpoints

**Why:** Decoupled from migration but critical for the "texting" feel before user testing.

- Convert `/api/reflection/stream` from full-response to SSE (match `/api/intake/stream` pattern)
- Convert `/api/recovery/stream` from full-response to SSE
- Convert `/api/weekly-reflection` to SSE

---

### Phase 2: Supabase Migration

Goal: Replace localStorage with Supabase. Auth first, schema second, swap third.

#### Step 5: Auth Setup

**Why step 0:** Every table needs `user_id`. Every route needs a session. Can't design schema without this.

- Supabase Auth with magic link (lowest friction for test users)
- Auth middleware on all API routes (check session, extract user_id)
- Minimal sign-in screen: one email input, one button, existing design system
- `users` profile row with `timezone` (detected from browser, editable)

#### Step 6: Schema Design

Decompose the blob into Postgres tables:

```sql
-- Core
users (id, timezone, created_at)
habits (id, user_id, state, domain, system jsonb, snapshot jsonb, identity_text,
        reps_count, last_done_date, created_at, updated_at)

-- Intake (queried rarely, stored as blob)
intake_conversations (id, habit_id, messages jsonb, phase, is_complete,
                      felt_understood_rating)

-- Daily loop (hot tables, queried by date)
check_ins (id, habit_id, date date, trigger_occurred, action_taken,
           difficulty_rating, miss_reason, context_tags jsonb,
           conversation jsonb, reflection_summary jsonb,
           recovery_offered, recovery_accepted, recovery_completed,
           system_change_proposed jsonb)

day_memories (id, habit_id, date date, outcome, user_shared, friction_note,
             win_note, coach_observation, emotional_tone)

-- Weekly
reflections (id, habit_id, week_number, type, sustainability_rating,
            friction text, recommendation jsonb, created_at)

-- Cached AI output
pattern_snapshots (id, habit_id, generated_at, insights jsonb, suggestion jsonb)
coach_notes (id, habit_id, content jsonb, updated_at)
```

Design choices:
- `system` stays as JSONB on `habits` — deeply nested, read/written as a unit
- `conversation` on `check_ins` stays as JSONB — message arrays don't need relational modeling
- `check_ins` and `day_memories` are separate tables with proper `date` columns for range queries
- RLS policy on every table: `user_id = auth.uid()`

#### Step 7: DAL Swap

Replace each DAL function (from step 2) with Supabase queries, one at a time.

Order:
1. Reads first: `getHabit()`, `getTodayCheckIn()`, `getCheckIns(range)` — verify data loads
2. Writes second: `saveCheckIn()`, `saveDayMemory()`, `applySystemUpdate()` — verify data persists
3. Run critical path tests (from step 3) after each swap
4. Last: remove localStorage code entirely

#### Step 8: Data Migration Script (Optional)

If existing localStorage test data needs to survive:
- On first authenticated load, check for localStorage `habit-stacker-data`
- If found, decompose blob into new tables under the authenticated user_id
- Clear localStorage after successful migration
- Skip if starting fresh for user testing is acceptable

---

### Phase 3: Pre-User-Testing Polish

Goal: Close gaps that testers will hit. Done after migration, before handing to real users.

#### Step 9: Wire Up the Open Loop

The "AI that adapts" promise must be real before testers arrive.

- Recovery coach: `systemChangeProposed` -> surface as accept/decline card on PlanScreen -> `applySystemUpdate()` on accept
- Pattern analysis: `suggestion` with `actionType` + `appliesTo` -> surface as actionable recommendation card -> `applySystemUpdate()` on accept
- Daily reflection: if `frictionNote` recurs 3+ times on the same topic, flag it as a suggested system change

#### Step 10: Sonnet vs. Haiku Audit

Reduce cost and latency before scaling to 5 users.

| Agent | Current | Recommended | Rationale |
|-------|---------|-------------|-----------|
| Intake | Sonnet 4.5 | Sonnet 4.5 | Quality matters — this builds trust |
| Daily Reflection | Sonnet 4.5 | **Haiku** | Short post-rep chat, not deep coaching |
| Recovery Coach | Sonnet 4.5 | **Haiku** | Normalize + suggest, structured flow |
| Weekly Reflection | Sonnet 4.5 | Sonnet 4.5 | Deep coaching, milestone conversation |
| Pattern Analysis | Sonnet 4.5 | Sonnet 4.5 | Complex reasoning over data |
| Coach Notes | Sonnet 4.5 | **Haiku** | Structured generation, template-driven |
| Memory Extraction | Haiku | Haiku | Already optimized |

Estimated impact: ~60% fewer Sonnet calls, meaningful latency reduction on daily interactions.

---

## Dependencies

```
Step 1 (dates) ─────┐
                     ├──> Step 6 (schema design)
Step 5 (auth) ──────┘
                          │
Step 2 (DAL) ────────────>├──> Step 7 (DAL swap)
                          │
Step 3 (tests) ──────────>├──> verify after each swap
                          │
Step 4 (streaming) ───────┘    (independent, do anytime in Phase 1-2)

Step 7 (DAL swap) ──> Step 9 (open loop) ──> Step 10 (model audit)
```

## Open Questions

1. **Fresh start vs. migration script (Step 8)?** If no one has meaningful test data, skip the migration script and start clean.
2. **Magic link vs. Google OAuth (Step 5)?** Magic link is simpler but adds email delivery dependency. Google OAuth is one-click but requires Google Cloud Console setup.
3. **Haiku quality threshold (Step 10)?** Need to test Haiku on daily reflection prompts before committing. If quality drops noticeably, keep Sonnet and optimize prompt length instead.
4. **Multi-habit support?** Current schema assumes one active habit. The `habits` table supports multiple rows, but the DAL and UI assume singular. Defer until post-graduation flow is validated?
