# Data Persistence Design Doc

**Status:** Current state audit (M1 Alpha)
**Date:** February 5, 2026
**Trigger:** Accidental data loss from a console command that overwrote localStorage

---

## Problem

All user data lives in a single `localStorage` key (`habit-stacker-data`). Any write — whether from the app, a console command, or a browser extension — replaces the entire blob. There is no versioning, no backup, no undo, and no validation on write.

This means:
- One bad `localStorage.setItem()` call can destroy weeks of check-in history
- Clearing browser data wipes everything
- No way to recover from corruption
- No cross-device access
- No audit trail of what changed or when

For an app whose core value proposition is "show up every day and we'll track your progress," this is a critical gap.

---

## Current Architecture

### Storage Mechanisms

| Store | Backend | Key | What's Stored |
|-------|---------|-----|---------------|
| `habitStore.ts` | localStorage | `habit-stacker-data` | All habit state, check-ins, system config, rep history |
| `conversationStore.ts` | localStorage | `habit-stacker-conversation` | Intake conversation (cleared after completion) |
| `photoStore.ts` | IndexedDB | `habit-stacker-photos` | Photo evidence (compressed JPEG blobs) |
| `intakeAnalytics.ts` | sessionStorage | `habit-stacker-analytics` | Ephemeral session telemetry |

### The Main Blob: `habit-stacker-data`

Everything lives in one JSON object under one key:

```
{
  state                    // State machine position
  currentConsultStep       // Wizard progress
  consultSelections        // All intake answers
  planDetails              // Legacy plan
  snapshot                 // 2-line contract
  system                   // Full HabitSystem (anchor, action, recovery, identity, setup...)
  intakeState              // Raw intake conversation state

  repsCount                // Running total
  lastDoneDate             // YYYY-MM-DD
  lastActiveDate           // For re-entry detection
  missedDate               // For recovery routing

  events[]                 // Legacy rep events
  repLogs[]                // Legacy rep logs with photos
  checkIns[]               // PRIMARY: daily check-in records (V0.6+)

  feltUnderstoodRating     // Intake feedback
  hasCompletedFirstRepWithPhoto

  createdAt / updatedAt    // Timestamps
}
```

### Write Pattern

Every mutation follows the same pattern:

```typescript
function updateHabitData(updates: Partial<HabitData>): HabitData {
  const current = loadHabitData();                          // Read entire blob
  const updated = { ...current, ...updates };               // Shallow merge
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); // Overwrite entire blob
  return updated;
}
```

No validation. No diffing. No history. No rollback.

### Read Pattern

```typescript
function loadHabitData(): HabitData {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : createInitialHabitData();
}
```

No schema validation on load. Trusts that whatever is in localStorage is valid `HabitData`.

---

## Risks

### Data Loss Scenarios

| Scenario | Impact | Likelihood |
|----------|--------|------------|
| Browser cache clear / "Clear site data" | Total loss | Medium |
| Console command overwrites key | Partial or total loss | Happened (Feb 5) |
| localStorage quota exceeded (~5-10MB) | Writes silently fail | Low (grows slowly) |
| Corrupt JSON in storage | App crashes on load, falls back to empty state | Low |
| User switches device/browser | Starts from scratch | High (no sync) |
| Multiple tabs open simultaneously | Last write wins (race condition) | Medium |
| Browser update clears storage | Total loss | Rare but possible |

### Integrity Risks

| Risk | Current Mitigation |
|------|-------------------|
| Partial writes (power loss mid-save) | None — `JSON.stringify` is atomic-ish but not guaranteed |
| Schema drift after code updates | Optional fields + backwards compat, no migration system |
| Array operations (checkIns) losing entries | Spread operator creates new array, but relies on correct `loadHabitData()` first |
| Concurrent writes from multiple functions | None — read-modify-write without locking |

---

## What Exists Today

### Strengths
- Simple, predictable read/write pattern
- ISO timestamps on all records
- TypeScript types enforce structure at compile time
- Separate IndexedDB for large blobs (photos)
- `updatedAt` auto-set on every write

### Missing
- No data export/import
- No backup mechanism
- No schema versioning
- No write validation
- No change history or audit log
- No undo capability
- No cloud sync
- No cross-device access
- No data integrity checks on load

---

## Store Functions Inventory

### habitStore.ts — Write Functions

| Function | What It Writes | How |
|----------|---------------|-----|
| `logCheckIn()` | New CheckIn to `checkIns[]` + state/count updates | Append to array, update state fields |
| `updateTodayCheckIn()` | Fields on today's CheckIn (difficulty, note, missReason, systemChangeProposed) | Find by date, merge fields |
| `updateTodayConversation()` | Conversation + reflection on today's CheckIn | Find by date, merge conversation object |
| `acceptRecovery()` | `recoveryAccepted: true` on today's CheckIn | Find by date, set field |
| `completeRecovery()` | `recoveryCompleted: true` + state='active' + repsCount++ | Find by date, update state |
| `saveHabitSystem()` | Full `HabitSystem` object | Overwrite `system` field |
| `updateSystemToolkit()` | Toolkit fields + tunedAt/tuneCount | Merge into existing system |
| `completeConsult()` | planDetails, snapshot, state='designed' | Overwrite fields |
| `saveConsultSelection()` | Single field in `consultSelections` | Merge into selections object |
| `resetHabitData()` | Everything (returns to initial state) | Overwrite entire blob |
| `toggleSetupItem()` | Single checklist item completion | Map over array, toggle field |
| `logEvent()` | Legacy RepEvent | Append to events[] |

### habitStore.ts — Read Functions

| Function | What It Reads | Returns |
|----------|--------------|---------|
| `loadHabitData()` | Entire blob | `HabitData` |
| `getTodayCheckIn()` | `checkIns[]` filtered by today | `CheckIn \| null` |
| `getTodayCheckInState()` | Today's check-in | `CheckInState` |
| `getRecentCheckIns(days)` | `checkIns[]` filtered by date range | `CheckIn[]` |
| `getCheckInStats(days)` | Aggregates from recent check-ins | `{ completed, missed, noTrigger, recovered, total }` |
| `needsReentry()` | `lastActiveDate` | `boolean` (>7 days inactive) |
| `needsRecovery()` | `state` | `boolean` (state === 'missed') |

### conversationStore.ts — Write Functions

| Function | What It Writes |
|----------|---------------|
| `saveConversation()` | Full `IntakeState` to `habit-stacker-conversation` |
| `clearConversation()` | Removes key entirely |
| `addUserMessage()` | Appends message to state, saves |
| `addAssistantMessage()` | Appends message + phase/recommendation, saves |
| `completeConversation()` | Sets `isComplete: true`, saves |

---

## Data Lifecycle

```
INTAKE (conversationStore)
  User goes through intake wizard
  Each message saved to localStorage
  On completion: data copied to habitStore, conversation cleared

DAILY USE (habitStore)
  Each check-in: new CheckIn appended to checkIns[]
  Conversations, reflections, difficulty stored on CheckIn
  State machine transitions on each action

  checkIns[] grows by ~1 record/day (~0.5KB each)
  At 1 year: ~365 records, ~180KB

PHOTOS (photoStore)
  Stored separately in IndexedDB
  ~500KB per photo (compressed)
  Referenced by repLog ID

RESET
  resetHabitData() → everything gone
  No confirmation, no export, no backup
```

---

## Summary

The persistence layer was designed for "minimal persistence, reliable for solo daily use" (per project goals). It achieves reliability for the happy path but has no safety net for the unhappy path. A single bad write — whether from app code, developer tooling, or browser behavior — can destroy the user's entire history with no recovery path.

For M1 Alpha with a single test user, this is a known tradeoff. Before expanding to more users, the gaps documented above need to be addressed.
