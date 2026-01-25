/**
 * Home & Environment Domain Playbooks
 */

import type { DomainPlaybook } from "./types";

export const homePlaybooks: Record<string, DomainPlaybook> = {
  keep_tidy: {
    domainId: "home",
    subProblemId: "keep_tidy",

    portrait: [
      "They clean as they go rather than in big sessions",
      "They have a 'home' for every item — putting away is automatic",
      "They maintain rather than rescue — small efforts prevent big cleanups",
      "They notice mess earlier because their baseline is tidier",
    ],

    progression: {
      week1: "Reset one small area each day",
      month1: "Daily reset feels automatic; space stays cleaner",
      month3: "Home maintains itself with minimal effort; clutter rare",
    },

    traps: [
      "Waiting for motivation to do a 'big clean'",
      "Trying to organize everything at once",
      "Perfectionism — if it can't be perfect, why bother?",
    ],

    leveragePoints: [
      "Choose one small area and reset it daily",
      "Link tidying to a transition moment (leaving room, before bed)",
    ],

    smallToBig: "Resetting your desk takes 2 minutes. A week later, you naturally start resetting more areas. A tidy space becomes your new normal.",

    candidateHabits: [
      {
        id: "desk_reset",
        action: "Clear and reset your desk or main surface",
        whyWeek1: "High visibility; you see it constantly",
        bestTiming: ["evening", "morning"],
        bestEnergy: ["medium", "low"],
        addressesBarrier: ["time", "motivation", "forgetting"],
        suggestedAnchor: "Before leaving work area",
        suggestedRecovery: "Put one item in its place",
      },
      {
        id: "kitchen_sink",
        action: "Clear the kitchen sink before bed",
        whyWeek1: "Morning starts better; simple to verify",
        bestTiming: ["evening"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["motivation", "energy"],
        suggestedAnchor: "After dinner",
        suggestedRecovery: "Put one dish in dishwasher",
      },
      {
        id: "one_surface",
        action: "Pick one surface and clear it completely",
        whyWeek1: "Visible progress; builds momentum",
        bestTiming: ["morning", "evening"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation", "time"],
        suggestedAnchor: "When you first enter the room",
        suggestedRecovery: "Remove one item from the surface",
      },
    ],
  },

  declutter: {
    domainId: "home",
    subProblemId: "declutter",

    portrait: [
      "They let go of items without guilt — gratitude then release",
      "They focus on one small area at a time, not the whole house",
      "They've stopped the inflow, not just managed the outflow",
      "They value space more than stuff",
    ],

    progression: {
      week1: "Remove one item per day",
      month1: "Letting go feels easier; you notice what you don't need",
      month3: "Significant reduction; space feels lighter; new items scrutinized",
    },

    traps: [
      "Starting with sentimental items (hardest category)",
      "Trying to declutter an entire room in one session",
      "'Maybe I'll need it someday' thinking",
    ],

    leveragePoints: [
      "Start with obvious trash and duplicates",
      "One item out per day is sustainable and compounds",
    ],

    smallToBig: "Removing one item takes 30 seconds. After 30 days, you've removed 30 items. After 90 days, your space is transformed.",

    candidateHabits: [
      {
        id: "one_item_out",
        action: "Find one item to donate or discard",
        whyWeek1: "Tiny effort; compounds over time",
        bestTiming: ["morning", "evening"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation", "time"],
        suggestedAnchor: "When tidying any area",
        suggestedRecovery: "Touch one item and decide: keep or go?",
      },
      {
        id: "drawer_scan",
        action: "Open one drawer and remove one thing",
        whyWeek1: "Hidden clutter often largest; quick win",
        bestTiming: ["morning", "flexible"],
        bestEnergy: ["medium"],
        addressesBarrier: ["motivation", "forgetting"],
        suggestedAnchor: "While getting ready",
        suggestedRecovery: "Open a drawer and look",
      },
      {
        id: "bag_by_door",
        action: "Add one item to a donation bag by the door",
        whyWeek1: "Bag makes donation visible and easy",
        bestTiming: ["flexible"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["motivation", "energy"],
        suggestedAnchor: "When you notice something unused",
        suggestedRecovery: "Look at the donation bag",
      },
    ],
  },

  daily_cleaning: {
    domainId: "home",
    subProblemId: "daily_cleaning",

    portrait: [
      "They clean a little every day rather than a lot occasionally",
      "They've made cleaning tools visible and accessible",
      "They clean during transitions, not in dedicated 'cleaning time'",
      "They focus on maintenance, not deep cleaning (that's separate)",
    ],

    progression: {
      week1: "Do one tiny cleaning task daily",
      month1: "Cleaning feels automatic; home stays cleaner",
      month3: "Daily maintenance prevents need for big cleaning sessions",
    },

    traps: [
      "Only cleaning when it's 'bad enough'",
      "Making cleaning tools hard to access",
      "Thinking cleaning has to take a long time",
    ],

    leveragePoints: [
      "Keep cleaning supplies where you need them",
      "Link cleaning to waiting moments (microwave, kettle)",
    ],

    smallToBig: "Wiping one counter takes 30 seconds. Do it daily and your kitchen stays clean. Add one more surface and your whole home transforms.",

    candidateHabits: [
      {
        id: "wipe_counter",
        action: "Wipe down the kitchen counter",
        whyWeek1: "High visibility; immediate satisfaction",
        bestTiming: ["morning", "evening"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["time", "motivation"],
        suggestedAnchor: "After making coffee or after dinner",
        suggestedRecovery: "Wipe one spot",
      },
      {
        id: "quick_bathroom",
        action: "Quick wipe of bathroom sink and mirror",
        whyWeek1: "Prevents buildup; takes 1 minute",
        bestTiming: ["morning", "evening"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["time", "energy"],
        suggestedAnchor: "After brushing teeth",
        suggestedRecovery: "Wipe just the sink",
      },
      {
        id: "floor_spot",
        action: "Spot clean one visible floor area",
        whyWeek1: "Prevents dirt accumulation; quick win",
        bestTiming: ["morning", "evening"],
        bestEnergy: ["medium"],
        addressesBarrier: ["time", "forgetting"],
        suggestedAnchor: "When you notice something on floor",
        suggestedRecovery: "Pick up one thing from the floor",
      },
    ],
  },

  meal_prep: {
    domainId: "home",
    subProblemId: "meal_prep",

    portrait: [
      "They don't prep everything — just the friction points",
      "They've made cooking easier than ordering",
      "They prep ingredients, not full meals (more flexible)",
      "They cook simple meals well rather than complex meals rarely",
    ],

    progression: {
      week1: "Prep one ingredient or component in advance",
      month1: "Prep is automatic; cooking feels easier",
      month3: "Full meal prep system; eating at home is the default",
    },

    traps: [
      "Elaborate meal prep that takes all Sunday",
      "Prepping too much and wasting food",
      "All-or-nothing: if you can't prep everything, you prep nothing",
    ],

    leveragePoints: [
      "Prep the thing that makes cooking hardest (chopping, washing)",
      "Start with just one meal or one ingredient",
    ],

    smallToBig: "Washing and prepping vegetables for one meal takes 10 minutes. Once that's routine, you naturally prep more. Cooking becomes the easy choice.",

    candidateHabits: [
      {
        id: "prep_one_veggie",
        action: "Wash and prep one vegetable for tomorrow",
        whyWeek1: "Removes friction from healthy cooking",
        bestTiming: ["evening"],
        bestEnergy: ["medium", "low"],
        addressesBarrier: ["time", "energy"],
        suggestedAnchor: "While cleaning up dinner",
        suggestedRecovery: "Rinse one vegetable",
      },
      {
        id: "lunch_tonight",
        action: "Set aside tomorrow's lunch while making dinner",
        whyWeek1: "Uses existing cooking momentum",
        bestTiming: ["evening"],
        bestEnergy: ["medium"],
        addressesBarrier: ["time", "motivation"],
        suggestedAnchor: "While plating dinner",
        suggestedRecovery: "Put a container next to your plate",
      },
      {
        id: "breakfast_setup",
        action: "Set out breakfast items the night before",
        whyWeek1: "Morning is easier; removes decisions",
        bestTiming: ["evening"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["time", "forgetting"],
        suggestedAnchor: "Before bed",
        suggestedRecovery: "Set out one breakfast item",
      },
    ],
  },
};
