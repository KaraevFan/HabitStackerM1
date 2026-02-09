/**
 * Domain Knowledge Modules (R20)
 *
 * Provides domain-specific coaching knowledge to AI agents.
 * Each module contains week-by-week insights, common challenges,
 * micro-challenges, and obstacle responses for a specific habit domain.
 *
 * Used by: Reflection Partner, Recovery Coach, Progression Planner.
 */

export interface DomainKnowledgeModule {
  domain: string;
  label: string;
  weeklyInsights: Record<number, string>;   // Week number → coaching insights
  microChallenges: Record<number, string[]>; // Week number → list of micro-challenges
  obstacles: Record<string, string>;         // Common objection → coach response
  psychologyNotes: string;                   // Key psychological principles
}

/**
 * Financial Awareness domain module
 */
const FINANCIAL_AWARENESS: DomainKnowledgeModule = {
  domain: 'financial_awareness',
  label: 'Financial Awareness / Money Management',
  weeklyInsights: {
    1: `Week 1 of money logging often surfaces discomfort with spending patterns. This is normal and actually a sign the habit is working. Some days logging feels tedious, especially weekends with fewer transactions. The feeling of control just from observing is common and should be reinforced.`,
    2: `Week 2 challenge: novelty wears off — "I already know what I spend on." Weekend logging often drops. Users start wanting to DO something about what they see (premature optimization). The antidote is connecting the data to a meaningful insight, not action yet.`,
    3: `Week 3-4 is where patterns become visible — weekly spending rhythms, emotional spending triggers. Users naturally start making small adjustments. The habit starts feeling less like a chore and more like a tool. This is the insight payoff moment.`,
    4: `By Week 4, the habit of observation is solidifying. The real value emerges: users can make informed decisions rather than reacting to anxiety. Financial awareness habits benefit from gradual depth — first just log, then categorize, then analyze.`,
  },
  microChallenges: {
    2: [
      'Categorize your transactions (food, transport, subscriptions, etc.)',
      'Identify your single largest daily expense each day',
      'Notice one "surprise" expense you didn\'t remember making',
      'Try logging BEFORE spending (just once) — does awareness change behavior?',
    ],
    3: [
      'At the end of the week, identify your top 3 spending categories',
      'Pick one purchase from the week and ask: "Was this worth it?"',
      'Notice if there\'s a day of the week where you spend more',
    ],
    4: [
      'Compare this week\'s total to last week\'s — just notice, no judgment',
      'Identify one spending pattern you\'d like to adjust',
      'Try a "no-spend" period for one category for a day',
    ],
  },
  obstacles: {
    'already_know': '"Knowing and tracking are different. Tracking surfaces the patterns you can\'t see from memory."',
    'feels_pointless': '"The insight usually clicks around Week 3. Right now you\'re building the data that makes insight possible."',
    'missed_day': '"If it\'s easy, fill it in. If it feels like homework, skip it. Consistency beats completeness."',
    'too_tedious': '"Try just logging the total amount spent today — one number. You can add detail when it feels natural."',
    'uncomfortable': '"That discomfort is actually the habit working. You\'re building financial awareness, and awareness starts with seeing clearly."',
  },
  psychologyNotes: `Financial avoidance is emotional, not logical — awareness is the first intervention. The "ostrich effect" (ignoring financial information) decreases with consistent, low-stakes exposure. Logging without judgment is critical early on — premature optimization kills the awareness habit.`,
};

/**
 * Sleep / Wind-down domain module
 */
const SLEEP: DomainKnowledgeModule = {
  domain: 'sleep',
  label: 'Sleep / Wind-down',
  weeklyInsights: {
    1: `Week 1 of a sleep habit is about establishing the trigger, not perfecting the routine. Many people notice resistance at bedtime — the urge to stay up "just a little longer." This is normal. The habit is about creating a clear signal that the day is over.`,
    2: `Week 2 challenge: weekends disrupt the pattern. Social events, late dinners, or the "it's Friday" mindset break the routine. The key insight: the wind-down isn't about the exact time — it's about the transition ritual itself.`,
    3: `By Week 3, users often report falling asleep faster or feeling more rested. The body is learning the cue. If not, it's worth exploring whether the wind-down activity is truly calming or secretly stimulating.`,
    4: `Week 4: the habit should feel like "what I do before bed" not "a thing I have to do." If it still feels forced, the action might need simplification.`,
  },
  microChallenges: {
    2: [
      'Notice what you\'re doing in the 30 minutes before your wind-down starts',
      'Try your wind-down 15 minutes earlier one night this week',
      'Put your phone in another room during wind-down (just once)',
    ],
    3: [
      'Rate your sleep quality in the morning — notice if wind-down nights are different',
      'Identify your biggest bedtime procrastination trigger',
    ],
  },
  obstacles: {
    'too_wired': '"That wired feeling is exactly what the wind-down is designed to address. It gets easier as your body learns the cue."',
    'partner_disrupts': '"Can you start your wind-down before your partner\'s routine? Even 5 minutes of solo transition helps."',
    'weekends': '"Weekends don\'t need the exact same time — just the same ritual. The cue matters more than the clock."',
  },
  psychologyNotes: `Sleep onset is heavily influenced by conditioned cues. A consistent pre-sleep ritual creates a Pavlovian association between the activity and drowsiness. The ritual itself matters more than the specific time. Blue light avoidance gets overemphasized — the psychological transition is more important than screen management.`,
};

/**
 * Exercise / Movement domain module
 */
const EXERCISE: DomainKnowledgeModule = {
  domain: 'exercise',
  label: 'Exercise / Movement',
  weeklyInsights: {
    1: `Week 1 of an exercise habit is fragile. The biggest risk isn't physical difficulty — it's motivation fade after the initial enthusiasm. Keep the bar absurdly low. A 5-minute walk counts. Getting to the gym counts even if you leave after 10 minutes.`,
    2: `Week 2 is where "I don't feel like it" shows up. This is the critical moment. The response isn't motivation — it's reducing the decision to something automatic. Put on shoes → go. That's it.`,
    3: `By Week 3, identity starts shifting. "I'm someone who moves" feels possible rather than aspirational. If it doesn't, the habit might be too ambitious for this stage.`,
    4: `Week 4: this is where users either solidify or plateau. If it's feeling easy, that's perfect — don't increase yet. Protect the consistency before adding intensity.`,
  },
  microChallenges: {
    2: [
      'On your hardest day this week, do just 5 minutes — then decide if you want to continue',
      'Notice how you feel 30 minutes after exercise vs. days you skip',
    ],
    3: [
      'Try exercising at a different time — morning if you usually do evening, or vice versa',
      'Add one thing you enjoy to the routine (music, podcast, walking route)',
    ],
  },
  obstacles: {
    'too_tired': '"Tired before exercise is normal. Most people feel better 10 minutes in. Try the \'5-minute rule\' — start, and if you still want to stop after 5 minutes, stop."',
    'no_time': '"Time is usually a priority issue, not a capacity issue. Can you attach it to something you already do? Walk to lunch instead of driving?"',
    'not_seeing_results': '"Physical changes take 4-6 weeks minimum. But the real result right now is the habit itself — you\'re building the pattern that makes future results possible."',
  },
  psychologyNotes: `Exercise habits fail most often in Week 2-3 when motivation normalizes. The solution is never "more willpower" — it's reducing friction and protecting the minimum viable action. Identity-based framing ("I'm a mover") outperforms goal-based framing ("I want to lose weight") for long-term adherence.`,
};

/**
 * Reading domain module
 */
const READING: DomainKnowledgeModule = {
  domain: 'reading',
  label: 'Reading',
  weeklyInsights: {
    1: `Week 1: the goal is just opening the book. Page count doesn't matter. Many people rediscover that they actually enjoy reading — they just forgot because screens are always closer.`,
    2: `Week 2: "I don't have time to read" usually means "reading hasn't become the default yet." The fix is pairing it with an existing habit (coffee, commute, bedtime) so it stops competing for attention.`,
    3: `Week 3: users often report reading more than their minimum. This is the habit taking hold — don't formalize the increase. Let it stay organic.`,
    4: `Week 4: if the current book isn't compelling, the habit suffers. Permission to abandon books is an underrated retention strategy.`,
  },
  microChallenges: {
    2: [
      'Read one page before checking your phone in the morning',
      'Carry your book/kindle with you and read during one wait time',
    ],
    3: [
      'Share one thing you read with someone this week',
      'Try reading at a different time than usual',
    ],
  },
  obstacles: {
    'no_time': '"Two pages is reading. The habit is about opening the book, not finishing it."',
    'boring_book': '"Life\'s too short for boring books. Give yourself permission to quit and pick something you\'re genuinely curious about."',
    'phone_wins': '"Put the book where your phone usually lives. Physical proximity wins."',
  },
  psychologyNotes: `Reading habits compete directly with phone habits for the same time slots. The key intervention is physical: make the book more accessible than the phone. Reading before bed has compound benefits (better sleep, screen displacement). Minimum viable reading (1-2 pages) maintains the habit through low-motivation periods.`,
};

/**
 * Generic fallback for unknown domains
 */
const GENERIC: DomainKnowledgeModule = {
  domain: 'generic',
  label: 'General Habit Building',
  weeklyInsights: {
    1: `Week 1 is about proving you can show up. Consistency matters more than quality or quantity. The habit is fragile — protect it by keeping the bar low.`,
    2: `Week 2 is where the novelty fades and resistance appears. This is normal. The solution is making the habit so small it's impossible to skip.`,
    3: `Week 3: you're past the hardest part. The neural pathway is forming. If something isn't working, now is the right time to adjust — you have enough data.`,
    4: `Week 4: the habit should start feeling more automatic. If it still requires significant willpower, the action might be too ambitious for this stage.`,
  },
  microChallenges: {
    2: [
      'Notice what makes today\'s version of the habit easier or harder than yesterday\'s',
      'Try doing the habit at a slightly different time or in a different context',
    ],
    3: [
      'Ask yourself: "What\'s the smallest version of this I\'d do on my worst day?"',
      'Identify the one thing that, if removed, would make the habit effortless',
    ],
  },
  obstacles: {
    'forgot': '"Forgetting usually means the anchor isn\'t strong enough. Can you tie it to something you never skip?"',
    'not_motivated': '"Motivation is unreliable fuel. The habit should run on cues and environment, not willpower."',
    'too_busy': '"If you\'re too busy for the full version, do the tiny version. Showing up for 30 seconds still counts."',
  },
  psychologyNotes: `Habit formation follows a predictable arc: enthusiasm (Week 1), resistance (Week 2), normalization (Week 3-4), automaticity (Week 5+). The critical intervention is reducing the habit to its minimum viable action during the resistance phase.`,
};

/**
 * All registered domain modules
 */
const DOMAIN_MODULES: Record<string, DomainKnowledgeModule> = {
  financial_awareness: FINANCIAL_AWARENESS,
  money: FINANCIAL_AWARENESS,
  finance: FINANCIAL_AWARENESS,
  spending: FINANCIAL_AWARENESS,
  sleep: SLEEP,
  wind_down: SLEEP,
  bedtime: SLEEP,
  exercise: EXERCISE,
  movement: EXERCISE,
  fitness: EXERCISE,
  workout: EXERCISE,
  reading: READING,
  read: READING,
  book: READING,
  generic: GENERIC,
};

/**
 * Detect domain from habit system fields.
 * Checks explicit domain field first, then infers from anchor/action keywords.
 */
export function detectDomain(system: { domain?: string; anchor: string; action: string }): string {
  // Explicit domain set
  if (system.domain && DOMAIN_MODULES[system.domain]) {
    return system.domain;
  }

  // Keyword inference from anchor + action
  const text = `${system.anchor} ${system.action}`.toLowerCase();

  if (/money|spend|transact|budget|financ|bank|saving/.test(text)) return 'financial_awareness';
  if (/sleep|bed|wind.?down|night|pillow|melatonin/.test(text)) return 'sleep';
  if (/exercise|gym|walk|run|workout|yoga|stretch|move|push.?up|squat/.test(text)) return 'exercise';
  if (/read|book|kindle|page|chapter/.test(text)) return 'reading';

  return 'generic';
}

/**
 * Get domain knowledge module for a given domain key.
 */
export function getDomainModule(domainKey: string): DomainKnowledgeModule {
  return DOMAIN_MODULES[domainKey] || GENERIC;
}

/**
 * Build a domain knowledge context block for injection into AI prompts.
 */
export function buildDomainKnowledgeBlock(
  system: { domain?: string; anchor: string; action: string },
  weekNumber: number
): string {
  const domainKey = detectDomain(system);
  const module = getDomainModule(domainKey);

  // Get insights for the current week (or closest available)
  const weekInsight = module.weeklyInsights[weekNumber]
    || module.weeklyInsights[Math.min(weekNumber, 4)]
    || module.weeklyInsights[1];

  // Get micro-challenges for next week
  const nextWeekChallenges = module.microChallenges[weekNumber + 1]
    || module.microChallenges[weekNumber]
    || [];

  let block = `## Domain Knowledge: ${module.label}

### What's normal for Week ${weekNumber}
${weekInsight}

### Key Psychology
${module.psychologyNotes}
`;

  if (nextWeekChallenges.length > 0) {
    block += `
### Micro-challenges you can offer for next week (pick ONE)
${nextWeekChallenges.map(c => `- ${c}`).join('\n')}
`;
  }

  // Add obstacle responses
  const obstacleEntries = Object.entries(module.obstacles);
  if (obstacleEntries.length > 0) {
    block += `
### If the user says...
${obstacleEntries.map(([key, response]) => `- "${key.replace(/_/g, ' ')}": ${response}`).join('\n')}
`;
  }

  return block;
}
