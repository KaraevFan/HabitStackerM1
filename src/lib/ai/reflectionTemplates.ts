/**
 * Reflection Templates (R20)
 *
 * Each reflection milestone has a defined emotional arc and required content blocks.
 * The AI fills them conversationally, but the shape of the conversation is controlled.
 *
 * Same pattern as the intake flow: structured phases, conversational delivery.
 */

export interface ReflectionTemplate {
  milestone: string;
  emotionalTone: string;
  requiredBlocks: TemplateBlock[];
  optionalBlocks: TemplateBlock[];
}

interface TemplateBlock {
  type: string;
  description: string;
  guidance: string;
}

/**
 * Week 1 — Celebratory, warm, forward-looking
 */
const WEEK_1: ReflectionTemplate = {
  milestone: 'week_1',
  emotionalTone: 'celebratory, warm, forward-looking',
  requiredBlocks: [
    {
      type: 'celebration',
      description: 'Specific acknowledgment of Week 1 completion',
      guidance: `Open with ONE specific, celebratory observation. Reference their consistency AND connect it to their original goal. Do NOT open with multiple statistics.

GOOD: "8 days straight of facing your finances. For most people, the hardest part of building money awareness isn't the logging — it's confronting what they find. You've been showing up anyway."

BAD: "You logged 6 out of 7 days this week — 8 in a row now. The difficulty is hovering around 4.3/5."`,
    },
    {
      type: 'feeling_check',
      description: 'One subjective question about their experience',
      guidance: `Ask about their SUBJECTIVE experience, not data. "How does the habit actually feel now vs day 1?" or "Has anything surprised you about what you're noticing?"

Do NOT ask about data, numbers, or whether they want to change anything yet.`,
    },
    {
      type: 'domain_insight',
      description: 'One relevant piece of domain knowledge',
      guidance: `Based on their response, share ONE relevant piece of domain knowledge from the domain module. This is the education layer surfacing naturally — not lecturing, but connecting their experience to broader patterns.`,
    },
    {
      type: 'week_2_preview',
      description: 'Forward momentum with concrete micro-challenge',
      guidance: `Give them something concrete and slightly stretchy for the coming week. Frame it as building on their momentum, not adding burden. Offer exactly ONE micro-challenge.

GOOD: "This week you proved you can show up. For Week 2, try one thing: when you log, pick your biggest transaction and ask yourself 'was this worth it?' Just noticing, no judgment."

BAD: "Do you want to keep everything exactly as is?"`,
    },
  ],
  optionalBlocks: [
    {
      type: 'system_adjustment',
      description: 'Propose system change if needed',
      guidance: `Only propose changes if the user raises friction or if data suggests a problem. When proposing, be specific and present as an actionable card.`,
    },
    {
      type: 'difficulty_exploration',
      description: 'Explore if habit feels hard',
      guidance: `If user indicates the habit is hard, be curious not concerned. "What part takes the most effort?" not "That's concerning."`,
    },
  ],
};

/**
 * Week 2 — Grounded, observational, coaching
 */
const WEEK_2: ReflectionTemplate = {
  milestone: 'week_2',
  emotionalTone: 'grounded, observational, coaching',
  requiredBlocks: [
    {
      type: 'pattern_recognition',
      description: 'Surface one pattern from 2 weeks of data',
      guidance: `Lead with ONE specific pattern you noticed — a strong day, a weak day, a difficulty shift. Reference specific days or contexts, not just percentages.`,
    },
    {
      type: 'threat_identification',
      description: 'What\'s the biggest threat to this habit continuing?',
      guidance: `Collaboratively identify what could derail the habit. Not alarming — curious. "What's the thing that's most likely to make you skip this week?"`,
    },
    {
      type: 'toolkit_check',
      description: 'Is the environment supporting the habit?',
      guidance: `Check if their setup is helping. May suggest setup checklist additions or a tiny version for hard days.`,
    },
    {
      type: 'week_3_preview',
      description: 'Week 3 focus: connecting the habit to a reward/insight',
      guidance: `Preview what Week 3 looks like — this is where the habit starts paying off. Connect to domain-specific insights about what becomes visible with more data.`,
    },
  ],
  optionalBlocks: [
    {
      type: 'system_adjustment',
      description: 'Propose change if consistent friction identified',
      guidance: `Only if the same friction appeared multiple times. Be specific about what to change.`,
    },
    {
      type: 'progression_preview',
      description: 'Preview next level if user asks',
      guidance: `If user asks about leveling up or adding complexity, acknowledge the impulse but suggest waiting. "The instinct to do more is a great sign. Let's lock in the foundation first."`,
    },
  ],
};

/**
 * Recovery — Compassionate, curious, zero judgment
 */
const RECOVERY: ReflectionTemplate = {
  milestone: 'recovery',
  emotionalTone: 'compassionate, curious, zero judgment',
  requiredBlocks: [
    {
      type: 'normalization',
      description: 'This happens. It\'s information, not failure.',
      guidance: `Normalize without being dismissive. "This happens" is better than "it's okay." Never use shame language. Frame misses as data about the system, not about the person.`,
    },
    {
      type: 'context_gathering',
      description: 'What\'s been going on? Life change? Motivation shift?',
      guidance: `Genuine curiosity, not interrogation. "What's been going on?" is open-ended. Don't list possible reasons — let them share.`,
    },
    {
      type: 'decision_support',
      description: 'Help user choose: adjust, pause, redesign, or recommit',
      guidance: `Present ALL FOUR options as equally valid:
1. Adjust the system (timing, anchor, action)
2. Pause the habit (life is too full right now)
3. Redesign (maybe this isn't the right habit)
4. Recommit as-is (the system is fine, life got in the way)

Never push toward one option. The user knows what they need.`,
    },
  ],
  optionalBlocks: [
    {
      type: 'system_redesign',
      description: 'If user wants to change the habit itself',
      guidance: `If the user wants fundamental change, support it. "Let's think about what would actually work for your life right now."`,
    },
  ],
};

/**
 * Generic week template (Week 3+)
 */
const GENERIC_WEEK: ReflectionTemplate = {
  milestone: 'generic',
  emotionalTone: 'steady, coaching, growth-oriented',
  requiredBlocks: [
    {
      type: 'progress_acknowledgment',
      description: 'Acknowledge sustained effort',
      guidance: `Lead with one specific observation about their journey. Connect to their broader goal. Show you've been paying attention across weeks.`,
    },
    {
      type: 'experience_check',
      description: 'How is the habit feeling?',
      guidance: `Ask about their subjective experience. Is it getting easier? More automatic? Still requiring effort?`,
    },
    {
      type: 'forward_look',
      description: 'What\'s next',
      guidance: `Based on their response, either reinforce what's working or suggest one small adjustment. Always end with energy.`,
    },
  ],
  optionalBlocks: [
    {
      type: 'system_adjustment',
      description: 'Propose change if warranted',
      guidance: `By Week 3+, you have enough data to make informed suggestions. Be specific.`,
    },
  ],
};

/**
 * Get the appropriate reflection template for a given week and type
 */
export function getReflectionTemplate(
  weekNumber: number,
  reflectionType: 'weekly' | 'recovery' | 'on_demand'
): ReflectionTemplate {
  if (reflectionType === 'recovery') return RECOVERY;
  if (weekNumber <= 1) return WEEK_1;
  if (weekNumber <= 2) return WEEK_2;
  return GENERIC_WEEK;
}

/**
 * Build template guidance block for injection into AI prompts
 */
export function buildTemplateGuidanceBlock(template: ReflectionTemplate): string {
  let block = `## Conversation Template: ${template.milestone}
Emotional tone: ${template.emotionalTone}

### Required conversation blocks (follow this arc)
`;

  template.requiredBlocks.forEach((b, i) => {
    block += `
${i + 1}. **${b.type.toUpperCase()}** — ${b.description}
${b.guidance}
`;
  });

  if (template.optionalBlocks.length > 0) {
    block += `
### Optional blocks (include only if triggered)
`;
    template.optionalBlocks.forEach(b => {
      block += `- **${b.type}**: ${b.description} — ${b.guidance}\n`;
    });
  }

  return block;
}
