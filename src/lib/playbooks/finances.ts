/**
 * Finances Domain Playbooks
 */

import type { DomainPlaybook } from "./types";

export const financesPlaybooks: Record<string, DomainPlaybook> = {
  track_spending: {
    domainId: "finances",
    subProblemId: "track_spending",

    portrait: [
      "They know their numbers without checking — awareness is automatic",
      "They track daily, not weekly, because small leaks add up",
      "They've made tracking as easy as checking social media",
      "They don't judge spending — they observe it first",
    ],

    progression: {
      week1: "Log one purchase daily to build the awareness muscle",
      month1: "Daily logging feels automatic; patterns start emerging",
      month3: "Complete picture of spending; natural adjustment to behavior",
    },

    traps: [
      "Starting with complex budgeting apps instead of simple tracking",
      "Trying to track everything perfectly from day one",
      "Letting guilt prevent honest tracking",
    ],

    leveragePoints: [
      "Track one purchase right after it happens, not at end of day",
      "Use the simplest possible method (notes app, paper, simple app)",
    ],

    smallToBig: "Logging one purchase takes 10 seconds. Do it daily for a week and you'll naturally start logging more. By month's end, you'll know exactly where your money goes.",

    candidateHabits: [
      {
        id: "log_one_expense",
        action: "Log your largest purchase of the day",
        whyWeek1: "Focuses on impact; builds the habit simply",
        bestTiming: ["evening", "flexible"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["time", "motivation", "forgetting"],
        suggestedAnchor: "After dinner",
        suggestedRecovery: "Note just the amount spent today",
      },
      {
        id: "receipt_photo",
        action: "Take a photo of one receipt",
        whyWeek1: "Zero mental effort; captures data for later",
        bestTiming: ["flexible"],
        bestEnergy: ["low", "medium", "high"],
        addressesBarrier: ["time", "energy", "forgetting"],
        suggestedAnchor: "Right after any purchase",
        suggestedRecovery: "Photograph just one receipt",
      },
      {
        id: "check_balance",
        action: "Check your main account balance",
        whyWeek1: "Builds awareness habit; takes 30 seconds",
        bestTiming: ["morning", "evening"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation", "forgetting"],
        suggestedAnchor: "With morning coffee",
        suggestedRecovery: "Open your banking app",
      },
    ],
  },

  build_savings: {
    domainId: "finances",
    subProblemId: "build_savings",

    portrait: [
      "They automate what they can but still stay engaged",
      "They celebrate small wins — $5 saved is still saving",
      "They've made saving feel like paying themselves first",
      "They know their 'why' — what the savings are actually for",
    ],

    progression: {
      week1: "Move any amount to savings — even $1 counts",
      month1: "Consistent small transfers; saving feels normal",
      month3: "Noticeable savings balance; habit is automatic",
    },

    traps: [
      "Waiting until you 'have more money' to start saving",
      "Setting amounts too high and then giving up",
      "Saving without a specific purpose (harder to maintain)",
    ],

    leveragePoints: [
      "Start with an amount so small it's impossible to fail",
      "Transfer on payday before you can spend it",
    ],

    smallToBig: "Moving $5 to savings feels insignificant. But $5 weekly becomes $260/year. And once the habit is locked, increasing the amount is easy.",

    candidateHabits: [
      {
        id: "transfer_small",
        action: "Transfer $1-5 to savings account",
        whyWeek1: "Amount is irrelevant; the action is everything",
        bestTiming: ["morning", "flexible"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation", "time"],
        suggestedAnchor: "After checking account balance",
        suggestedRecovery: "Open savings app and look at balance",
      },
      {
        id: "round_up",
        action: "Round up one purchase and save the difference",
        whyWeek1: "Painless; linked to spending you're already doing",
        bestTiming: ["flexible"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["motivation", "forgetting"],
        suggestedAnchor: "After any card purchase",
        suggestedRecovery: "Save just $0.50",
      },
      {
        id: "no_spend_note",
        action: "Note one thing you chose not to buy today",
        whyWeek1: "Builds awareness of avoided spending",
        bestTiming: ["evening"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["motivation"],
        suggestedAnchor: "Before bed",
        suggestedRecovery: "Think of one thing you didn't buy",
      },
    ],
  },

  reduce_spending: {
    domainId: "finances",
    subProblemId: "reduce_spending",

    portrait: [
      "They've identified their specific trigger purchases",
      "They pause before buying, not after",
      "They've found alternatives that satisfy the urge differently",
      "They track wins (money not spent) not just failures",
    ],

    progression: {
      week1: "Notice one impulse and pause before acting",
      month1: "Pausing is automatic; some impulses pass on their own",
      month3: "Impulse spending significantly reduced; savings increasing",
    },

    traps: [
      "Trying to eliminate all 'unnecessary' spending at once",
      "Using willpower instead of systems",
      "Feeling deprived instead of empowered",
    ],

    leveragePoints: [
      "Create a pause between impulse and action",
      "Understand what need the purchase is trying to meet",
    ],

    smallToBig: "Pausing for 10 seconds before one purchase is nothing. But that pause grows into a habit. Half your impulse purchases disappear when you simply wait.",

    candidateHabits: [
      {
        id: "pause_10",
        action: "Wait 10 seconds before any non-essential purchase",
        whyWeek1: "Creates space between impulse and action",
        bestTiming: ["flexible"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation"],
        suggestedAnchor: "Hand on wallet or about to click 'buy'",
        suggestedRecovery: "Take one breath before buying",
      },
      {
        id: "cart_wait",
        action: "Add to cart but wait 24 hours before buying online",
        whyWeek1: "Uses friction strategically; many purchases won't happen",
        bestTiming: ["flexible"],
        bestEnergy: ["low", "medium", "high"],
        addressesBarrier: ["motivation", "energy"],
        suggestedAnchor: "When about to click 'buy now'",
        suggestedRecovery: "Close the browser tab",
      },
      {
        id: "why_note",
        action: "Write one sentence: 'I want to buy X because...'",
        whyWeek1: "Surfaces the real need; often it's not about the item",
        bestTiming: ["flexible"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation"],
        suggestedAnchor: "Before any purchase over $20",
        suggestedRecovery: "Say the reason out loud",
      },
    ],
  },

  financial_review: {
    domainId: "finances",
    subProblemId: "financial_review",

    portrait: [
      "They review regularly but briefly — 5 minutes is enough",
      "They look at trends, not just balances",
      "They've made financial review a calm ritual, not a stressful chore",
      "They catch problems early because they're always watching",
    ],

    progression: {
      week1: "Look at one number that matters most to you",
      month1: "Weekly quick review feels natural",
      month3: "Complete financial awareness; no surprises",
    },

    traps: [
      "Avoiding finances because they cause anxiety",
      "Trying to review everything at once",
      "Reviewing only when something goes wrong",
    ],

    leveragePoints: [
      "Start with just one metric you care about",
      "Pair review with something pleasant (coffee, music)",
    ],

    smallToBig: "Checking one balance takes 30 seconds. After a week, you'll naturally expand. A month later, you have a complete financial picture in 5 minutes.",

    candidateHabits: [
      {
        id: "one_balance",
        action: "Check balance of your most-used account",
        whyWeek1: "Minimum viable awareness; builds the habit",
        bestTiming: ["morning", "evening"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["time", "motivation", "forgetting"],
        suggestedAnchor: "With morning coffee",
        suggestedRecovery: "Open your banking app",
      },
      {
        id: "upcoming_bills",
        action: "Note one upcoming bill this week",
        whyWeek1: "Prevents surprises; builds forward-looking habit",
        bestTiming: ["morning", "flexible"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["forgetting", "time"],
        suggestedAnchor: "Start of work day",
        suggestedRecovery: "Think of one bill due soon",
      },
      {
        id: "week_spending",
        action: "Estimate how much you spent yesterday",
        whyWeek1: "Builds mental tracking; no tools needed",
        bestTiming: ["morning"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation", "time"],
        suggestedAnchor: "While making breakfast",
        suggestedRecovery: "Guess one purchase amount",
      },
    ],
  },
};
