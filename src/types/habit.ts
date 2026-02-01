/**
 * Habit state machine states
 * Install → Designed → Active → Miss → Recover → (later: Review/Graduate)
 */
export type HabitState = "install" | "designed" | "active" | "missed" | "recovery";

/**
 * Habit type taxonomy (Logging System)
 * Determines check-in flow and outcome interpretation
 */
export type HabitType = 'time_anchored' | 'event_anchored' | 'reactive';

/**
 * Check-in state for a given day
 */
export type CheckInState =
  | 'pending'           // Check-in window open, not yet logged
  | 'no_trigger'        // For reactive: slept through / no opportunity
  | 'completed'         // Action was taken
  | 'missed'            // Trigger occurred but action not taken
  | 'recovered';        // Miss + recovery action completed

/**
 * Check-in record for the logging system
 * Captures what happened, not just "did you do it"
 */
export interface CheckIn {
  id: string;
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

  // Difficulty rating (1-5 scale)
  difficulty?: 1 | 2 | 3 | 4 | 5;

  // Conversation data (V0.6)
  conversation?: {
    messages: Array<{ role: 'ai' | 'user'; content: string }>;
    skipped: boolean;
    duration: number; // seconds
  };
}

/**
 * Generate a unique ID for check-ins
 */
export function generateCheckInId(): string {
  return `checkin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Compute check-in state from a CheckIn record
 */
export function getCheckInState(checkIn: CheckIn): CheckInState {
  // No trigger (for reactive habits) - this is valid data
  if (!checkIn.triggerOccurred) {
    return 'no_trigger';
  }

  // Trigger occurred but action not taken
  if (!checkIn.actionTaken) {
    // Check if recovery was completed
    if (checkIn.recoveryCompleted) {
      return 'recovered';
    }
    return 'missed';
  }

  // Action was taken
  return 'completed';
}

/**
 * Available domains for habit design
 */
export type HabitDomain = "health" | "finances" | "home" | "relationships" | "learning";

/**
 * Domain display info
 */
export interface DomainInfo {
  id: HabitDomain;
  label: string;
  description: string;
  subProblems: SubProblemInfo[];
}

/**
 * Sub-problem within a domain
 */
export interface SubProblemInfo {
  id: string;
  label: string;
  description: string;
  identityFrame: string; // System-proposed identity framing
}

/**
 * Consult wizard steps (Updated for Iteration 3)
 */
export type ConsultStep =
  | "intent"           // Domain + sub-problem selection
  | "questionnaire"    // Micro-questionnaire + inference confirmation (NEW in Iteration 3)
  | "success_map"      // Portrait of excellence + progression ladder
  | "habit_select"     // Week-1 habit recommendation with earned justification
  | "system_design"    // Compressed anchor/action/recovery design
  | "contract"         // Week-1 contract + first rep trigger
  // Legacy steps (kept for backwards compatibility)
  | "orientation"
  | "success_week"
  | "anchor"
  | "context"
  | "action"
  | "prime"
  | "recovery"
  | "snapshot";

/**
 * AI-generated option for a consult step
 */
export interface ConsultOption {
  id: string;
  title: string; // ≤6 words
  description: string; // ≤120 chars
  why: string; // ≤200 chars
}

/**
 * AI response schema for consult steps
 */
export interface ConsultStepResponse {
  step: ConsultStep;
  question: string;
  options: ConsultOption[];
  recommended_id: string;
  needs_free_text: boolean;
  free_text_prompt: string | null;
}

/**
 * Questionnaire answer types (Iteration 4: reduced to 3 questions)
 */
export type TimingPreference = "morning" | "midday" | "evening" | "flexible";
export type PrimaryBarrier = "time" | "energy" | "motivation" | "forgetting";
export type ExperienceLevel = "first_time" | "tried_before" | "tried_many_times";

// Deprecated types (kept for backwards compatibility)
export type EnergyLevel = "high" | "medium" | "low";
export type Environment = "home" | "office" | "commute" | "varies";

/**
 * User's questionnaire answers (Iteration 4: 3 questions)
 */
export interface QuestionnaireAnswers {
  timing?: TimingPreference;
  barrier?: PrimaryBarrier;
  experience?: ExperienceLevel;
  // Deprecated fields (kept for backwards compatibility)
  energy?: EnergyLevel;
  environment?: Environment;
}

/**
 * User's selections during the consult
 */
export interface ConsultSelections {
  // Iteration 2 fields
  domain?: HabitDomain;
  subProblem?: string;          // Sub-problem ID within domain
  additionalContext?: string;   // Optional user-provided constraints/context
  selectedHabitId?: string;     // ID of the habit selected in habit_select step
  selectedHabit?: string;       // Description of selected habit
  // Iteration 3 fields
  questionnaire?: QuestionnaireAnswers;  // Micro-questionnaire answers
  // Legacy fields (still supported)
  intent?: string;
  constraints?: string[];
  success_week?: string;
  anchor?: string;
  context?: string;
  action?: string;
  prime?: string;
  recovery?: string;
}

/**
 * The 2-line snapshot (Week 1 contract)
 */
export interface HabitSnapshot {
  line1: string; // e.g., "Week 1: Show up."
  line2: string; // e.g., "After [anchor], [2-min action]."
}

/**
 * Rep event log entry (legacy, kept for backwards compatibility)
 */
export interface RepEvent {
  type: "rep_done" | "miss" | "recovery_done" | "skip";
  timestamp: string; // ISO date string
  note?: string; // Optional friction note
}

/**
 * Rep log entry with photo support (R8)
 */
export interface RepLog {
  id: string;
  timestamp: string; // ISO date string
  type: "done" | "missed" | "recovery";
  photoUri?: string; // Local URI to stored photo
  photoSkipped?: boolean; // True if user explicitly skipped photo
  note?: string; // Optional reflection
}

/**
 * Setup checklist item (V0.5)
 */
export interface SetupItem {
  id: string;
  category: 'environment' | 'mental' | 'tech';
  text: string;
  completed: boolean;
  notApplicable: boolean;
}

/**
 * Habit system with toolkit (R8)
 * Combines core habit design with tune-up toolkit
 */
export interface HabitSystem {
  // Core (from intake agent)
  anchor: string;
  action: string;
  then?: string[]; // Recurring steps done AFTER each rep (from HabitRecommendation.followUp)
  recovery: string;
  whyItFits: string[]; // Personalized reasons from conversation

  // Habit type (Logging System)
  habitType?: HabitType; // 'time_anchored' | 'event_anchored' | 'reactive'
  anchorTime?: string;   // For time-anchored: "07:00"
  checkInTime?: string;  // For reactive: when to ask "how was last night?" (default: "07:00")

  // Education content (Layer 2 - Expandable Rationale)
  principle?: string;    // The science behind this habit (1-2 sentences)
  expectations?: string; // What to expect week by week

  // Identity (V0.5 - generated during intake)
  identity?: string; // "Someone who protects their sleep"
  identityBehaviors?: string[]; // ["Has a clear shutdown signal", ...]

  // Setup checklist (V0.5)
  setupChecklist?: SetupItem[];

  // Toolkit (from tune-up conversation)
  tinyVersion?: string; // 30-second fallback for bad days
  environmentPrime?: string; // What to set up the night before
  frictionReduced?: string; // What barriers were removed

  // Metadata
  tunedAt?: string; // ISO date when tune-up completed
  tuneCount?: number; // How many times user has re-tuned
}

/**
 * Domain emoji mapping for confirmation screen (R8)
 */
export const DOMAIN_EMOJI: Record<string, string> = {
  // Sleep-related
  sleep: "🛏️",
  bed: "🛏️",
  night: "🌙",
  morning: "☀️",
  wake: "⏰",

  // Exercise-related
  exercise: "🏃",
  workout: "💪",
  gym: "🏋️",
  run: "🏃",
  walk: "🚶",
  yoga: "🧘",

  // Reading-related
  read: "📖",
  book: "📚",
  train: "🚃",
  commute: "🚃",

  // Finance-related
  money: "💰",
  save: "💰",
  budget: "📊",
  spend: "💳",
  finance: "📊",

  // Home-related
  clean: "🧹",
  tidy: "✨",
  home: "🏠",
  cook: "🍳",
  meal: "🍽️",

  // Learning-related
  learn: "📚",
  study: "📝",
  journal: "📓",
  write: "✍️",

  // Relationships
  call: "📞",
  text: "💬",
  family: "👨‍👩‍👧",
  friend: "🤝",

  // Health
  water: "💧",
  meditat: "🧘",
  breath: "🌬️",

  // Default
  default: "⚡",
};

/**
 * Get emoji for a habit based on anchor/action keywords
 */
export function getHabitEmoji(anchor: string, action: string): string {
  const text = `${anchor} ${action}`.toLowerCase();

  for (const [keyword, emoji] of Object.entries(DOMAIN_EMOJI)) {
    if (keyword !== "default" && text.includes(keyword)) {
      return emoji;
    }
  }

  return DOMAIN_EMOJI.default;
}

/**
 * Complete habit data persisted to storage
 */
export interface HabitData {
  state: HabitState;
  currentConsultStep: ConsultStep | null; // Track wizard progress
  consultSelections: ConsultSelections;
  planDetails: PlanDetails | null; // Full plan with timing constraints (legacy)
  snapshot: HabitSnapshot | null;
  repsCount: number;
  lastDoneDate: string | null; // ISO date string
  lastActiveDate: string | null; // For re-entry detection
  missedDate: string | null; // Track when miss occurred
  events: RepEvent[]; // Legacy events array
  createdAt: string;
  updatedAt: string;

  // Agent-first intake state (R7+)
  intakeState?: unknown; // IntakeState from conversation

  // R8 additions
  system?: HabitSystem; // Full habit system with toolkit
  repLogs?: RepLog[]; // Enhanced rep logs with photos
  feltUnderstoodRating?: number; // 1-5 rating from confirmation
  hasCompletedFirstRepWithPhoto?: boolean; // Unlocks tune-up

  // Logging System additions
  checkIns?: CheckIn[]; // New check-in records
}

/**
 * Full plan details including timing constraints
 */
export interface PlanDetails {
  anchor: string;
  action: string; // ≤2 min
  prime: string | null; // ≤30s, optional
  recovery: string; // ≤30s
}

/**
 * Initial empty habit data
 */
export function createInitialHabitData(): HabitData {
  const now = new Date().toISOString();
  return {
    state: "install",
    currentConsultStep: "intent",
    consultSelections: {},
    planDetails: null,
    snapshot: null,
    repsCount: 0,
    lastDoneDate: null,
    lastActiveDate: null,
    missedDate: null,
    events: [],
    createdAt: now,
    updatedAt: now,
    // R8 additions
    repLogs: [],
    hasCompletedFirstRepWithPhoto: false,
    // Logging System
    checkIns: [],
  };
}

/**
 * Generate a unique ID for rep logs
 */
export function generateRepLogId(): string {
  return `rep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert PlanDetails to HabitSystem (migration helper)
 */
export function planDetailsToSystem(
  planDetails: PlanDetails,
  whyItFits: string[] = []
): HabitSystem {
  return {
    anchor: planDetails.anchor,
    action: planDetails.action,
    then: planDetails.prime ? [planDetails.prime] : undefined,
    recovery: planDetails.recovery,
    whyItFits,
  };
}

/**
 * Normalize then field from string | string[] | undefined to string[]
 * Migration helper for existing data that may have string format
 */
export function normalizeThenSteps(then: string | string[] | undefined): string[] {
  if (!then) return [];
  if (Array.isArray(then)) return then;
  // Legacy string format — split by common delimiters or wrap as single item
  if (then.includes(',')) {
    return then.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [then];
}

/**
 * Get plan screen state based on habit data (R8)
 */
export type PlanScreenState =
  | "pre_first_rep"
  | "tune_up_available"
  | "needs_photo_for_tuneup"
  | "tuned";

export function getPlanScreenState(habit: HabitData): PlanScreenState {
  const reps = habit.repLogs?.filter((r) => r.type === "done").length ?? habit.repsCount;
  const hasPhoto = habit.repLogs?.some((r) => r.photoUri) ?? false;
  const hasTuned = habit.system?.tunedAt != null;

  if (reps === 0) {
    return "pre_first_rep";
  }

  if (reps >= 1 && !hasTuned && hasPhoto) {
    return "tune_up_available";
  }

  if (reps >= 1 && !hasTuned && !hasPhoto) {
    return "needs_photo_for_tuneup";
  }

  return "tuned";
}

/**
 * Domain data with sub-problems and identity framings
 */
export const DOMAINS: DomainInfo[] = [
  {
    id: "health",
    label: "Health & Fitness",
    description: "Physical wellbeing, exercise, nutrition, sleep",
    subProblems: [
      {
        id: "exercise_start",
        label: "Start exercising regularly",
        description: "Build a sustainable movement practice",
        identityFrame: "someone who moves their body regularly",
      },
      {
        id: "eat_better",
        label: "Eat better",
        description: "Make healthier food choices consistently",
        identityFrame: "someone who nourishes their body well",
      },
      {
        id: "sleep_improve",
        label: "Improve sleep",
        description: "Build better sleep habits and routines",
        identityFrame: "someone who prioritizes rest",
      },
      {
        id: "hydration",
        label: "Drink more water",
        description: "Stay consistently hydrated throughout the day",
        identityFrame: "someone who takes care of their body",
      },
    ],
  },
  {
    id: "finances",
    label: "Finances",
    description: "Budgeting, saving, spending awareness",
    subProblems: [
      {
        id: "track_spending",
        label: "Track my spending",
        description: "Know where your money goes",
        identityFrame: "someone who knows their numbers",
      },
      {
        id: "build_savings",
        label: "Build savings",
        description: "Consistently set money aside",
        identityFrame: "someone who pays themselves first",
      },
      {
        id: "reduce_spending",
        label: "Spend less on impulse purchases",
        description: "Make more intentional spending decisions",
        identityFrame: "someone who spends intentionally",
      },
      {
        id: "financial_review",
        label: "Review finances regularly",
        description: "Stay on top of your financial picture",
        identityFrame: "someone who manages their money actively",
      },
    ],
  },
  {
    id: "home",
    label: "Home & Environment",
    description: "Organization, tidiness, living space",
    subProblems: [
      {
        id: "keep_tidy",
        label: "Keep my space tidy",
        description: "Maintain a clean and organized environment",
        identityFrame: "someone who maintains their space",
      },
      {
        id: "declutter",
        label: "Declutter and simplify",
        description: "Reduce possessions and clear space",
        identityFrame: "someone who values simplicity",
      },
      {
        id: "daily_cleaning",
        label: "Stay on top of cleaning",
        description: "Prevent mess from accumulating",
        identityFrame: "someone who cleans as they go",
      },
      {
        id: "meal_prep",
        label: "Prepare meals at home",
        description: "Cook more and eat out less",
        identityFrame: "someone who prepares their own food",
      },
    ],
  },
  {
    id: "relationships",
    label: "Relationships",
    description: "Family, friends, social connection",
    subProblems: [
      {
        id: "stay_connected",
        label: "Stay connected with people",
        description: "Maintain relationships that matter",
        identityFrame: "someone who nurtures relationships",
      },
      {
        id: "be_present",
        label: "Be more present with family",
        description: "Give quality attention to loved ones",
        identityFrame: "someone who is fully present",
      },
      {
        id: "express_gratitude",
        label: "Express appreciation more",
        description: "Show gratitude to people in your life",
        identityFrame: "someone who expresses gratitude",
      },
      {
        id: "listen_better",
        label: "Be a better listener",
        description: "Give others your full attention",
        identityFrame: "someone who truly listens",
      },
    ],
  },
  {
    id: "learning",
    label: "Learning & Growth",
    description: "Reading, skills, personal development",
    subProblems: [
      {
        id: "read_more",
        label: "Read more books",
        description: "Build a consistent reading habit",
        identityFrame: "someone who reads regularly",
      },
      {
        id: "learn_skill",
        label: "Learn a new skill",
        description: "Develop expertise in something new",
        identityFrame: "someone who is always learning",
      },
      {
        id: "journal",
        label: "Journal or reflect regularly",
        description: "Process thoughts through writing",
        identityFrame: "someone who reflects on their life",
      },
      {
        id: "reduce_screens",
        label: "Reduce screen time",
        description: "Spend less time on devices",
        identityFrame: "someone who uses technology intentionally",
      },
    ],
  },
];

/**
 * Get domain info by ID
 */
export function getDomainById(id: HabitDomain): DomainInfo | undefined {
  return DOMAINS.find(d => d.id === id);
}

/**
 * Get sub-problem info by domain and sub-problem ID
 */
export function getSubProblemById(domainId: HabitDomain, subProblemId: string): SubProblemInfo | undefined {
  const domain = getDomainById(domainId);
  return domain?.subProblems.find(sp => sp.id === subProblemId);
}

/**
 * Get setup checklist progress (V0.5)
 */
export function getSetupProgress(items: SetupItem[] | undefined): { completed: number; total: number } {
  if (!items || items.length === 0) {
    return { completed: 0, total: 0 };
  }
  // Exclude N/A items from total
  const applicableItems = items.filter(item => !item.notApplicable);
  const completedItems = applicableItems.filter(item => item.completed);
  return { completed: completedItems.length, total: applicableItems.length };
}
