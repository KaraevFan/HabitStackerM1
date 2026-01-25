/**
 * Relationships Domain Playbooks
 */

import type { DomainPlaybook } from "./types";

export const relationshipsPlaybooks: Record<string, DomainPlaybook> = {
  stay_connected: {
    domainId: "relationships",
    subProblemId: "stay_connected",

    portrait: [
      "They reach out proactively, not just reactively",
      "They have simple rituals that keep connections warm",
      "They prioritize consistency over intensity — brief regular contact beats rare long calls",
      "They've made connection a habit, not a todo item",
    ],

    progression: {
      week1: "Reach out to one person you've been meaning to contact",
      month1: "Weekly outreach feels natural; relationships warming up",
      month3: "Strong connection habits; relationships feel maintained",
    },

    traps: [
      "Waiting until you have 'enough time' for a proper catch-up",
      "Feeling like you need a reason to reach out",
      "All-or-nothing: a 2-minute text is 'not worth it'",
    ],

    leveragePoints: [
      "A quick message counts — it doesn't need to be a long call",
      "Link outreach to a daily moment you already have",
    ],

    smallToBig: "Sending one text takes 30 seconds. Do it weekly and you've maintained a relationship. Add more people and your whole network stays warm.",

    candidateHabits: [
      {
        id: "one_message",
        action: "Send a quick message to someone you're thinking of",
        whyWeek1: "Low barrier; high impact on relationship",
        bestTiming: ["morning", "evening", "flexible"],
        bestEnergy: ["low", "medium", "high"],
        addressesBarrier: ["time", "motivation", "forgetting"],
        suggestedAnchor: "During morning coffee",
        suggestedRecovery: "Think of one person you haven't talked to",
      },
      {
        id: "share_something",
        action: "Share an article, photo, or thought with one person",
        whyWeek1: "Natural conversation starter; shows you're thinking of them",
        bestTiming: ["flexible"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation"],
        suggestedAnchor: "When you see something interesting",
        suggestedRecovery: "Screenshot something to share later",
      },
      {
        id: "schedule_call",
        action: "Text one person to schedule a call this week",
        whyWeek1: "Commitment device; makes call actually happen",
        bestTiming: ["morning", "midday"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation", "time"],
        suggestedAnchor: "Start of week",
        suggestedRecovery: "Add the person to a 'to call' list",
      },
    ],
  },

  be_present: {
    domainId: "relationships",
    subProblemId: "be_present",

    portrait: [
      "They create phone-free moments with family",
      "They give full attention during conversations, not half-attention",
      "They have rituals for connection (dinner, walks, bedtime)",
      "They prioritize quality of time over quantity",
    ],

    progression: {
      week1: "Create one fully present moment each day",
      month1: "Presence feels more natural; family notices",
      month3: "Deep connection habits; relationships significantly stronger",
    },

    traps: [
      "Trying to be present 'all the time' (exhausting, unsustainable)",
      "Phone within reach during family time",
      "Multitasking during conversations",
    ],

    leveragePoints: [
      "Start with one protected moment per day",
      "Make the phone physically inaccessible during that time",
    ],

    smallToBig: "Five minutes of full attention during dinner compounds. Your family starts expecting and valuing that time. Connection deepens naturally.",

    candidateHabits: [
      {
        id: "phone_away_dinner",
        action: "Put phone in another room during dinner",
        whyWeek1: "Clear boundary; protects family time",
        bestTiming: ["evening"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["motivation", "forgetting"],
        suggestedAnchor: "When sitting down for dinner",
        suggestedRecovery: "Turn phone face-down",
      },
      {
        id: "eye_contact",
        action: "Make eye contact when family member speaks to you",
        whyWeek1: "Simple; shows you're really listening",
        bestTiming: ["flexible"],
        bestEnergy: ["low", "medium", "high"],
        addressesBarrier: ["forgetting", "motivation"],
        suggestedAnchor: "When someone starts talking to you",
        suggestedRecovery: "Look up from what you're doing",
      },
      {
        id: "bedtime_ritual",
        action: "Spend 5 minutes with child/partner at bedtime without devices",
        whyWeek1: "Protected, predictable quality time",
        bestTiming: ["evening"],
        bestEnergy: ["low"],
        addressesBarrier: ["time", "energy"],
        suggestedAnchor: "Bedtime routine",
        suggestedRecovery: "Say goodnight face-to-face",
      },
    ],
  },

  express_gratitude: {
    domainId: "relationships",
    subProblemId: "express_gratitude",

    portrait: [
      "They notice small things and mention them",
      "They express appreciation in the moment, not just on special occasions",
      "They've made gratitude specific, not generic ('thanks for X' not just 'thanks')",
      "They write notes, not just say words",
    ],

    progression: {
      week1: "Express one specific appreciation daily",
      month1: "Noticing good things becomes automatic",
      month3: "Relationships feel warmer; gratitude is a natural habit",
    },

    traps: [
      "Generic gratitude ('thanks for everything') doesn't land",
      "Only expressing gratitude for big things",
      "Feeling awkward about expressing appreciation directly",
    ],

    leveragePoints: [
      "Be specific: what exactly and why it mattered",
      "Express in writing occasionally — it lands differently",
    ],

    smallToBig: "Saying 'I noticed X and appreciated it' takes 10 seconds. Do it daily and watch relationships transform. People feel seen and valued.",

    candidateHabits: [
      {
        id: "specific_thanks",
        action: "Tell someone one specific thing you appreciate about them",
        whyWeek1: "High impact; strengthens bonds immediately",
        bestTiming: ["evening", "flexible"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation", "forgetting"],
        suggestedAnchor: "At dinner or end of day",
        suggestedRecovery: "Think of one thing someone did today",
      },
      {
        id: "thank_you_text",
        action: "Send a quick thank you message to someone",
        whyWeek1: "Written appreciation lasts; can be reread",
        bestTiming: ["morning", "flexible"],
        bestEnergy: ["medium"],
        addressesBarrier: ["motivation", "time"],
        suggestedAnchor: "Morning commute or coffee",
        suggestedRecovery: "Draft but don't send",
      },
      {
        id: "notice_effort",
        action: "Notice one effort someone made and acknowledge it",
        whyWeek1: "Builds awareness muscle; shows you're paying attention",
        bestTiming: ["flexible"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["forgetting", "motivation"],
        suggestedAnchor: "When someone does something for you",
        suggestedRecovery: "Think of one person who helped today",
      },
    ],
  },

  listen_better: {
    domainId: "relationships",
    subProblemId: "listen_better",

    portrait: [
      "They listen to understand, not to respond",
      "They ask follow-up questions instead of shifting to their own story",
      "They're comfortable with silence — they don't rush to fill it",
      "They summarize what they heard to show understanding",
    ],

    progression: {
      week1: "Practice one listening technique in one conversation",
      month1: "Better listening feels more natural",
      month3: "Known as a good listener; conversations go deeper",
    },

    traps: [
      "Preparing your response while the other person talks",
      "Relating everything back to your own experience",
      "Interrupting or finishing sentences",
    ],

    leveragePoints: [
      "Focus on asking one good follow-up question",
      "Practice with one person first, then expand",
    ],

    smallToBig: "Asking one follow-up question changes a conversation. Do it consistently and people start opening up more. Your relationships deepen naturally.",

    candidateHabits: [
      {
        id: "ask_followup",
        action: "Ask one follow-up question before sharing your own story",
        whyWeek1: "Simple technique; immediate impact",
        bestTiming: ["flexible"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation", "forgetting"],
        suggestedAnchor: "When someone shares something with you",
        suggestedRecovery: "Notice when you want to interrupt",
      },
      {
        id: "pause_respond",
        action: "Pause for 2 seconds before responding",
        whyWeek1: "Creates space; shows you're thinking about what they said",
        bestTiming: ["flexible"],
        bestEnergy: ["medium"],
        addressesBarrier: ["motivation"],
        suggestedAnchor: "When conversation partner finishes speaking",
        suggestedRecovery: "Take one breath before responding",
      },
      {
        id: "reflect_back",
        action: "Summarize what you heard: 'So you're saying...'",
        whyWeek1: "Shows understanding; catches misunderstandings early",
        bestTiming: ["flexible"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation"],
        suggestedAnchor: "After someone shares something important",
        suggestedRecovery: "Nod to show you're listening",
      },
    ],
  },
};
