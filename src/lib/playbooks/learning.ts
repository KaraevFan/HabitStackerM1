/**
 * Learning & Growth Domain Playbooks
 */

import type { DomainPlaybook } from "./types";

export const learningPlaybooks: Record<string, DomainPlaybook> = {
  read_more: {
    domainId: "learning",
    subProblemId: "read_more",

    portrait: [
      "They read every day, even if just for minutes",
      "They always have a book accessible (bag, nightstand, phone)",
      "They've replaced some screen time with reading",
      "They don't finish books they're not enjoying — they start new ones",
    ],

    progression: {
      week1: "Read one page per day — the habit matters, not the amount",
      month1: "Reading feels natural; you're finishing books",
      month3: "Consistent reader identity; multiple books completed",
    },

    traps: [
      "Setting ambitious 'pages per day' goals that become burdens",
      "Only reading when you have 'enough time'",
      "Feeling obligated to finish every book",
    ],

    leveragePoints: [
      "Make your book more accessible than your phone",
      "Link reading to an existing moment (bed, coffee, commute)",
    ],

    smallToBig: "One page takes 2 minutes. That's 365 pages a year — 2-3 books. Add a few more pages and you're reading 12+ books a year.",

    candidateHabits: [
      {
        id: "one_page",
        action: "Read one page of a book",
        whyWeek1: "Impossibly small; builds identity as reader",
        bestTiming: ["morning", "evening"],
        bestEnergy: ["low", "medium", "high"],
        addressesBarrier: ["time", "energy", "motivation"],
        suggestedAnchor: "When getting into bed",
        suggestedRecovery: "Read one paragraph",
      },
      {
        id: "book_not_phone",
        action: "Pick up book instead of phone for 5 minutes",
        whyWeek1: "Substitutes screen time; builds new default",
        bestTiming: ["morning", "evening"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["motivation", "energy"],
        suggestedAnchor: "When you reach for your phone to scroll",
        suggestedRecovery: "Put book next to phone",
      },
      {
        id: "read_with_coffee",
        action: "Read during morning coffee/tea",
        whyWeek1: "Uses existing ritual; pleasant association",
        bestTiming: ["morning"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["forgetting", "time"],
        suggestedAnchor: "When sitting down with coffee",
        suggestedRecovery: "Open the book while kettle boils",
      },
    ],
  },

  learn_skill: {
    domainId: "learning",
    subProblemId: "learn_skill",

    portrait: [
      "They practice a little every day, not a lot occasionally",
      "They focus on fundamentals before advanced techniques",
      "They're comfortable being a beginner — they embrace the awkward phase",
      "They learn by doing, not just consuming content",
    ],

    progression: {
      week1: "Practice the most basic element for a few minutes",
      month1: "Daily practice feels normal; visible progress",
      month3: "Real competence building; past the beginner plateau",
    },

    traps: [
      "Consuming tutorials instead of practicing",
      "Trying to learn too many things at once",
      "Expecting fast progress (skill takes time)",
    ],

    leveragePoints: [
      "Practice the same small thing until it's automatic",
      "Schedule practice like an appointment",
    ],

    smallToBig: "Five minutes of practice daily beats two hours weekly. Consistency builds neural pathways. A year of daily practice makes you surprisingly good.",

    candidateHabits: [
      {
        id: "practice_5min",
        action: "Practice the skill for 5 minutes",
        whyWeek1: "Short enough to do daily; builds muscle memory",
        bestTiming: ["morning", "evening"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["time", "motivation"],
        suggestedAnchor: "After morning routine",
        suggestedRecovery: "Touch the equipment/materials",
      },
      {
        id: "one_exercise",
        action: "Complete one practice exercise or drill",
        whyWeek1: "Concrete, completable; shows progress",
        bestTiming: ["morning", "midday", "evening"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation", "time"],
        suggestedAnchor: "At your practice space",
        suggestedRecovery: "Set up for practice",
      },
      {
        id: "review_yesterday",
        action: "Review what you practiced yesterday for 2 minutes",
        whyWeek1: "Reinforces learning; spaced repetition",
        bestTiming: ["morning"],
        bestEnergy: ["medium"],
        addressesBarrier: ["forgetting"],
        suggestedAnchor: "With morning coffee",
        suggestedRecovery: "Think about yesterday's practice",
      },
    ],
  },

  journal: {
    domainId: "learning",
    subProblemId: "journal",

    portrait: [
      "They write to think, not to produce content",
      "They have a simple, consistent format",
      "They don't wait for 'something to write about'",
      "They journal at the same time each day",
    ],

    progression: {
      week1: "Write one sentence about your day",
      month1: "Journaling feels natural; writing flows easier",
      month3: "Regular reflection habit; clearer thinking; record of growth",
    },

    traps: [
      "Feeling like entries need to be profound",
      "Inconsistent timing (no anchor)",
      "Perfectionism about writing quality",
    ],

    leveragePoints: [
      "Start with just one sentence — lower the bar completely",
      "Use prompts if blank page is intimidating",
    ],

    smallToBig: "One sentence takes 30 seconds. That's 365 entries a year — a complete record of your life. Entries naturally get longer as the habit builds.",

    candidateHabits: [
      {
        id: "one_sentence",
        action: "Write one sentence about today",
        whyWeek1: "Impossibly easy; removes perfectionism",
        bestTiming: ["evening", "morning"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["time", "motivation", "energy"],
        suggestedAnchor: "Before bed",
        suggestedRecovery: "Open your journal/notes app",
      },
      {
        id: "gratitude_3",
        action: "Write 3 things you're grateful for today",
        whyWeek1: "Structured prompt; shifts perspective",
        bestTiming: ["morning", "evening"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["motivation"],
        suggestedAnchor: "Morning coffee or before bed",
        suggestedRecovery: "Think of one thing you're grateful for",
      },
      {
        id: "morning_page",
        action: "Write whatever comes to mind for 2 minutes",
        whyWeek1: "Clears mental fog; no judgment",
        bestTiming: ["morning"],
        bestEnergy: ["medium"],
        addressesBarrier: ["motivation", "forgetting"],
        suggestedAnchor: "First thing after waking",
        suggestedRecovery: "Write one word",
      },
    ],
  },

  reduce_screens: {
    domainId: "learning",
    subProblemId: "reduce_screens",

    portrait: [
      "They've created friction between themselves and devices",
      "They have phone-free zones and times",
      "They've replaced scrolling with specific alternatives",
      "They use technology intentionally, not reactively",
    ],

    progression: {
      week1: "Create one phone-free moment each day",
      month1: "Phone-free time feels normal; urge to check decreases",
      month3: "Significantly less screen time; reclaimed hours for life",
    },

    traps: [
      "Trying to quit cold turkey",
      "Relying on willpower instead of environment design",
      "No replacement activity (boredom triggers phone use)",
    ],

    leveragePoints: [
      "Make the phone physically harder to access during key times",
      "Replace scrolling with a specific alternative activity",
    ],

    smallToBig: "One phone-free hour becomes two. Then certain times become automatically phone-free. You reclaim hours of life each week.",

    candidateHabits: [
      {
        id: "phone_other_room",
        action: "Put phone in another room for 1 hour",
        whyWeek1: "Physical barrier works better than willpower",
        bestTiming: ["evening", "morning"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["motivation"],
        suggestedAnchor: "After dinner or when you wake up",
        suggestedRecovery: "Put phone face-down for 10 minutes",
      },
      {
        id: "no_phone_bed",
        action: "Charge phone outside the bedroom",
        whyWeek1: "Protects sleep; removes morning scrolling",
        bestTiming: ["evening"],
        bestEnergy: ["low"],
        addressesBarrier: ["forgetting", "motivation"],
        suggestedAnchor: "Part of bedtime routine",
        suggestedRecovery: "Move phone to nightstand (not bed)",
      },
      {
        id: "app_delete",
        action: "Delete one social app and reinstall only when needed",
        whyWeek1: "Adds friction to mindless scrolling",
        bestTiming: ["flexible"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation"],
        suggestedAnchor: "When you notice yourself scrolling",
        suggestedRecovery: "Move app off home screen",
      },
    ],
  },
};
