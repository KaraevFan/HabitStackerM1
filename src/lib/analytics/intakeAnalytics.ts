/**
 * Intake Analytics
 *
 * Simple event logging for intake flow analysis.
 * Currently logs to console and localStorage for review.
 * Can be extended to send to analytics service later.
 */

const ANALYTICS_KEY = 'habit-stacker-analytics';

interface IntakeEvent {
  type: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

interface IntakeSession {
  sessionId: string;
  startedAt: string;
  events: IntakeEvent[];
}

/**
 * Generate a simple session ID
 */
function generateSessionId(): string {
  return `intake-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create current session
 */
function getSession(): IntakeSession {
  if (typeof window === 'undefined') {
    return { sessionId: 'server', startedAt: new Date().toISOString(), events: [] };
  }

  try {
    const stored = sessionStorage.getItem(ANALYTICS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }

  const session: IntakeSession = {
    sessionId: generateSessionId(),
    startedAt: new Date().toISOString(),
    events: [],
  };
  saveSession(session);
  return session;
}

/**
 * Save session to storage
 */
function saveSession(session: IntakeSession): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(ANALYTICS_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Log an analytics event
 */
export function logIntakeEvent(
  type: string,
  data?: Record<string, unknown>
): void {
  const session = getSession();
  const event: IntakeEvent = {
    type,
    timestamp: new Date().toISOString(),
    data,
  };

  session.events.push(event);
  saveSession(session);

  // Console logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[IntakeAnalytics] ${type}`, data || '');
  }
}

/**
 * Pre-defined event loggers
 */
export const IntakeAnalytics = {
  /** Conversation started */
  conversationStarted: () => {
    logIntakeEvent('conversation_started');
  },

  /** Phase changed */
  phaseChanged: (
    fromPhase: string | null,
    toPhase: string,
    turnCount: number
  ) => {
    logIntakeEvent('phase_changed', {
      fromPhase,
      toPhase,
      turnCount,
    });
  },

  /** Recommendation shown */
  recommendationShown: (turnCount: number, hypothesis: string | null) => {
    logIntakeEvent('recommendation_shown', {
      turnCount,
      hypothesis,
    });
  },

  /** User accepted recommendation */
  recommendationAccepted: (turnCount: number) => {
    logIntakeEvent('recommendation_accepted', {
      turnCount,
    });
  },

  /** User used escape hatch */
  escapeHatchUsed: (turnCount: number) => {
    logIntakeEvent('escape_hatch_used', {
      turnCount,
    });
  },

  /** Felt understood rating submitted */
  feltUnderstoodRated: (rating: number, turnCount: number) => {
    logIntakeEvent('felt_understood_rated', {
      rating,
      turnCount,
    });
  },

  /** First rep started */
  firstRepStarted: (feltUnderstoodRating: number | null, turnCount: number) => {
    logIntakeEvent('first_rep_started', {
      feltUnderstoodRating,
      turnCount,
    });
  },

  /** First rep deferred */
  firstRepDeferred: (feltUnderstoodRating: number | null, turnCount: number) => {
    logIntakeEvent('first_rep_deferred', {
      feltUnderstoodRating,
      turnCount,
    });
  },

  /** Error occurred */
  errorOccurred: (error: string, context: string) => {
    logIntakeEvent('error_occurred', {
      error,
      context,
    });
  },

  /** Get session summary (for debugging) */
  getSessionSummary: (): IntakeSession => {
    return getSession();
  },
};

export default IntakeAnalytics;
