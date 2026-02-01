# Implementation Plan: Logging, Education & Reflection Systems

Based on `docs/logging_education_reflection_systems.md`

---

## Scope: M1 Alpha (This Implementation)

### Must Have
1. `triggerOccurred` field in data model
2. Three-option check-in for reactive habits
3. Habit-type-aware home screen CTA
4. Basic inline whispers (first rep, first miss)
5. "Why this works" expandable on System screen

### Nice to Have
6. Optional difficulty rating after logging
7. Miss reason capture

---

## Implementation Phases

### Phase 1: Type System Updates

**Files to modify:**
- `src/types/habit.ts`

**Changes:**

1. Add `HabitType` enum:
```typescript
type HabitType = 'time_anchored' | 'event_anchored' | 'reactive';
```

2. Add `CheckIn` interface:
```typescript
interface CheckIn {
  id: string;
  date: string;                // YYYY-MM-DD
  checkedInAt: string;         // ISO timestamp

  // What happened
  triggerOccurred: boolean;    // Did the anchor/trigger happen?
  actionTaken: boolean;        // Did they do the behavior?

  // Reactive habit specifics
  triggerTime?: string;        // "02:30"
  outcomeSuccess?: boolean;    // Did the protocol work?

  // Context
  missReason?: string;
  difficultyRating?: 1 | 2 | 3 | 4 | 5;
  note?: string;

  // Recovery tracking
  recoveryOffered: boolean;
  recoveryAccepted?: boolean;
  recoveryCompleted?: boolean;
}
```

3. Add `CheckInState` type:
```typescript
type CheckInState =
  | 'pending'           // Not yet logged
  | 'no_trigger'        // For reactive: slept through
  | 'completed'         // Action was taken
  | 'missed'            // Trigger but no action
  | 'recovered';        // Miss + recovery done
```

4. Extend `HabitSystem` with:
```typescript
habitType?: HabitType;
anchorTime?: string;         // For time-anchored: "07:00"
checkInTime?: string;        // For reactive: when to ask
```

5. Extend `HabitData` with:
```typescript
checkIns?: CheckIn[];
todayCheckInState?: CheckInState;
```

---

### Phase 2: Check-In Flow Components

**Files to create:**
- `src/components/checkin/CheckInFlow.tsx` — Main flow controller
- `src/components/checkin/CheckInOptions.tsx` — Three-option selector for reactive
- `src/components/checkin/CheckInSuccess.tsx` — Success confirmation with whisper
- `src/components/checkin/CheckInMiss.tsx` — Miss flow with reason capture
- `src/components/checkin/RecoveryOffer.tsx` — Recovery action prompt
- `src/components/checkin/DifficultyRating.tsx` — Optional difficulty selector

**Flow logic:**

For Time/Event-Anchored:
```
Home → "Mark today's rep" → Success screen (with optional difficulty)
     → "I can't today" → Miss reason → Recovery offer → Done
```

For Reactive:
```
Home → "Check in" → Three options:
  → "Slept through" → No-trigger success screen
  → "Used protocol" → Success screen (with optional outcome question)
  → "Stayed in bed" → Miss reason → Recovery offer → Done
```

---

### Phase 3: Store Updates

**Files to modify:**
- `src/lib/store/habitStore.ts`

**Add functions:**
```typescript
function logCheckIn(checkIn: Omit<CheckIn, 'id' | 'checkedInAt'>): HabitData
function getTodayCheckIn(): CheckIn | null
function getTodayCheckInState(): CheckInState
function getWeekCheckIns(): CheckIn[]
function acceptRecovery(): HabitData
function completeRecovery(): HabitData
```

---

### Phase 4: Inline Whispers (Education Layer 1)

**Files to create:**
- `src/lib/education/whispers.ts` — Whisper content generation

**Whisper triggers:**
| Trigger | Whisper Content |
|---------|-----------------|
| First rep logged | "You're retraining an association, not just changing a behavior." |
| First miss | "Missing happens. What matters is what you do next." |
| Multiple "no trigger" | "This could mean the habit is working." |
| Same miss reason 2x | Specific friction tip |
| After recovery | "You're still in the game." |

**Implementation:**
```typescript
interface Whisper {
  content: string;
  type: 'encouragement' | 'insight' | 'tip';
}

function getWhisperForCheckIn(
  checkIn: CheckIn,
  allCheckIns: CheckIn[],
  habitSystem: HabitSystem
): Whisper | null
```

---

### Phase 5: "Why This Works" Expandable

**Files to modify:**
- `src/components/system/YourSystemScreen.tsx`

**Add expandable section with:**
1. THE PRINCIPLE — General science (1-2 sentences)
2. WHY IT FITS YOU — Personalized reasoning (references their situation)
3. WHAT TO EXPECT — Week-by-week expectations

**Content source:**
- `system.whyItFits[]` — Already captured during intake
- Extend intake prompt to generate `principle` and `expectations` fields

**UI:**
```
[Ritual section]

Why this works →

[Expanded state:]
─────────────────
THE PRINCIPLE
This is called "habit stacking"—attaching a new behavior...

WHY IT FITS YOU
You mentioned wanting to meditate but forgetting...

WHAT TO EXPECT
Week 1: Just show up. Week 2: Protect the routine...
─────────────────
```

---

### Phase 6: Home Screen Adaptations

**Files to modify:**
- `src/components/runtime/PlanScreen.tsx`

**Changes:**

1. Detect habit type and show appropriate CTA:
   - Time/Event-anchored: "Mark today's rep" | "I can't today"
   - Reactive: "Check in on last night"

2. Update week progress visualization:
   - Show three states: ✓ (completed), ✗ (missed), 🌙 (no trigger)
   - Show correct count: "4 of 5 days logged" (not "reps")

3. Update stats:
   - For reactive: "X protocol uses • Y restful nights"
   - For daily: "X reps • Last done [date]"

4. Show check-in state:
   - Before check-in: Show CTA
   - After check-in: "✓ Logged for today" + summary

---

### Phase 7: Today Page Updates

**Files to modify:**
- `src/app/today/page.tsx`

**Changes:**

1. Integrate CheckInFlow component
2. Handle different entry points:
   - Default: Full check-in flow
   - `?early=true`: Mark as done (backdated)
   - `?miss=true`: Go directly to miss flow

---

## File Creation Order

1. `src/types/habit.ts` — Type updates
2. `src/lib/store/habitStore.ts` — Store functions
3. `src/lib/education/whispers.ts` — Whisper logic
4. `src/components/checkin/DifficultyRating.tsx`
5. `src/components/checkin/CheckInSuccess.tsx`
6. `src/components/checkin/CheckInMiss.tsx`
7. `src/components/checkin/RecoveryOffer.tsx`
8. `src/components/checkin/CheckInOptions.tsx`
9. `src/components/checkin/CheckInFlow.tsx`
10. `src/components/checkin/index.ts`
11. `src/components/system/YourSystemScreen.tsx` — Why This Works
12. `src/components/runtime/PlanScreen.tsx` — Home adaptations
13. `src/app/today/page.tsx` — Flow integration

---

## Verification Checklist

### Check-In Flow
- [ ] Time-anchored habit: Can mark rep
- [ ] Time-anchored habit: Can log miss with reason
- [ ] Reactive habit: Shows three options
- [ ] Reactive habit: "No trigger" logs correctly
- [ ] Recovery offered after miss
- [ ] Recovery completion tracked

### Education
- [ ] Whisper appears after first rep
- [ ] Whisper appears after first miss
- [ ] "Why this works" expandable works
- [ ] Content is personalized (references user's situation)

### Home Screen
- [ ] CTA adapts to habit type
- [ ] Week progress shows mixed states (✓ ✗ 🌙)
- [ ] State changes after check-in
- [ ] Stats show appropriate metrics for habit type

### Data Persistence
- [ ] Check-ins persist across refresh
- [ ] CheckInState computed correctly
- [ ] Week view shows correct history

---

## Migration Notes

For existing users with V0.5 habits:
- Default `habitType` to `'event_anchored'` (most common)
- Existing `repLogs` map to check-ins with `triggerOccurred: true, actionTaken: true`
- No breaking changes to existing data

---

## Estimated Effort

| Phase | Complexity | Components |
|-------|------------|------------|
| 1. Types | Low | 1 file |
| 2. Check-In Components | High | 6 new components |
| 3. Store Updates | Medium | 1 file |
| 4. Whispers | Medium | 1 new file |
| 5. Why This Works | Medium | 1 file modification |
| 6. Home Screen | Medium | 1 file modification |
| 7. Today Page | Low | 1 file modification |

Total: ~12 files, mix of new and modifications
