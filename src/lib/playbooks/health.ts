/**
 * Health & Fitness Domain Playbooks
 */

import type { DomainPlaybook } from "./types";

export const healthPlaybooks: Record<string, DomainPlaybook> = {
  exercise_start: {
    domainId: "health",
    subProblemId: "exercise_start",

    portrait: [
      "They don't rely on motivation — they have a routine that runs on autopilot",
      "They started embarrassingly small and built from there",
      "They treat movement as non-negotiable, like brushing teeth",
      "They recover from breaks quickly because the habit is simple to restart",
    ],

    progression: {
      week1: "Show up and move for 2 minutes, no matter what",
      month1: "Consistent movement 4-5 days/week, even if brief",
      month3: "Natural urge to move; workouts feel like a reward, not a chore",
    },

    traps: [
      "Starting too ambitious (hour-long workouts that become unsustainable)",
      "All-or-nothing thinking (skipping entirely if you can't do the 'full' workout)",
      "Waiting for motivation instead of building a trigger",
    ],

    leveragePoints: [
      "Anchor movement to something you already do every day",
      "Make the starting action so small it feels almost silly",
    ],

    smallToBig: "A 2-minute daily habit becomes a 20-minute habit in weeks, not because you push harder, but because showing up becomes automatic and you naturally want more.",

    candidateHabits: [
      {
        id: "pushups_5",
        action: "Do 5 pushups (or wall pushups)",
        whyWeek1: "Tiny enough to do anywhere, builds the 'I exercise' identity",
        bestTiming: ["morning", "flexible"],
        bestEnergy: ["high", "medium", "low"],
        addressesBarrier: ["time", "motivation", "forgetting"],
        suggestedAnchor: "After getting out of bed",
        suggestedRecovery: "1 pushup or 10 seconds of stretching",
      },
      {
        id: "walk_block",
        action: "Walk around the block once",
        whyWeek1: "Zero equipment, easy to start, builds outdoor habit",
        bestTiming: ["morning", "evening", "midday"],
        bestEnergy: ["medium", "low"],
        addressesBarrier: ["motivation", "energy"],
        suggestedAnchor: "After morning coffee",
        suggestedRecovery: "Step outside for 30 seconds",
      },
      {
        id: "stretch_2min",
        action: "2-minute morning stretch",
        whyWeek1: "Gentle start, wakes up the body, no equipment needed",
        bestTiming: ["morning"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["energy", "motivation"],
        suggestedAnchor: "After getting out of bed",
        suggestedRecovery: "Touch your toes once",
      },
    ],
  },

  eat_better: {
    domainId: "health",
    subProblemId: "eat_better",

    portrait: [
      "They plan one healthy choice at a time, not entire meal plans",
      "They've made healthy options the easy default (visible, prepped, accessible)",
      "They don't aim for perfection — they aim for 'better than yesterday'",
      "They've learned their personal triggers for poor choices",
    ],

    progression: {
      week1: "Add one intentional healthy element to your day",
      month1: "Healthy choice is automatic at one meal",
      month3: "Multiple meals improved; cravings reduced; energy more stable",
    },

    traps: [
      "Overhauling your entire diet at once (unsustainable)",
      "Focusing on restriction instead of addition",
      "Relying on willpower instead of environment design",
    ],

    leveragePoints: [
      "Add something healthy rather than removing something unhealthy",
      "Make the healthy choice visible and the first thing you see",
    ],

    smallToBig: "Adding one vegetable to one meal becomes automatic. Then you add another. Small additions compound into a completely different diet over months.",

    candidateHabits: [
      {
        id: "fruit_breakfast",
        action: "Eat one piece of fruit with breakfast",
        whyWeek1: "Addition, not restriction; easy to remember",
        bestTiming: ["morning"],
        bestEnergy: ["high", "medium", "low"],
        addressesBarrier: ["motivation", "forgetting"],
        suggestedAnchor: "When you start making breakfast",
        suggestedRecovery: "Take one bite of any fruit",
      },
      {
        id: "water_first",
        action: "Drink a glass of water before your first meal",
        whyWeek1: "Simple, immediate, builds hydration habit",
        bestTiming: ["morning"],
        bestEnergy: ["low", "medium", "high"],
        addressesBarrier: ["forgetting", "motivation"],
        suggestedAnchor: "When you wake up",
        suggestedRecovery: "Take one sip of water",
      },
      {
        id: "veggie_lunch",
        action: "Add one serving of vegetables to lunch",
        whyWeek1: "Midday addition; visible progress",
        bestTiming: ["midday"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["motivation", "time"],
        suggestedAnchor: "When you sit down for lunch",
        suggestedRecovery: "Eat one bite of any vegetable",
      },
    ],
  },

  sleep_improve: {
    domainId: "health",
    subProblemId: "sleep_improve",

    portrait: [
      "They have a wind-down signal that tells their brain 'sleep is coming'",
      "They protect the hour before bed from stimulating activities",
      "They've made their bedroom a sleep-only zone",
      "They're consistent with bedtime, even on weekends",
    ],

    progression: {
      week1: "Establish one consistent pre-sleep action",
      month1: "Wind-down routine feels automatic; falling asleep is easier",
      month3: "Sleep quality noticeably improved; morning energy better",
    },

    traps: [
      "Trying to fix everything at once (screens, caffeine, timing, temperature)",
      "Inconsistent sleep schedule (weekend catch-up backfires)",
      "Using the bedroom for work or entertainment",
    ],

    leveragePoints: [
      "Start with one consistent wind-down trigger",
      "Make the trigger something you actually enjoy",
    ],

    smallToBig: "One calming action before bed becomes a ritual. That ritual signals your brain to prepare for sleep. Over weeks, falling asleep becomes noticeably easier.",

    candidateHabits: [
      {
        id: "phone_away",
        action: "Put phone in another room 30 min before bed",
        whyWeek1: "Removes biggest sleep disruptor; creates boundary",
        bestTiming: ["evening"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["motivation", "forgetting"],
        suggestedAnchor: "After brushing teeth at night",
        suggestedRecovery: "Put phone face-down for 5 minutes",
      },
      {
        id: "reading_5min",
        action: "Read a physical book for 5 minutes in bed",
        whyWeek1: "Replaces phone scrolling; naturally calming",
        bestTiming: ["evening"],
        bestEnergy: ["low"],
        addressesBarrier: ["motivation", "energy"],
        suggestedAnchor: "After getting into bed",
        suggestedRecovery: "Read one page",
      },
      {
        id: "lights_dim",
        action: "Dim lights 1 hour before bed",
        whyWeek1: "Simple environmental cue; signals brain",
        bestTiming: ["evening"],
        bestEnergy: ["low", "medium"],
        addressesBarrier: ["forgetting"],
        suggestedAnchor: "After dinner cleanup",
        suggestedRecovery: "Turn off one bright light",
      },
    ],
  },

  hydration: {
    domainId: "health",
    subProblemId: "hydration",

    portrait: [
      "They keep water visible and within arm's reach all day",
      "They've linked water to existing habits (coffee, meals, breaks)",
      "They don't rely on thirst — they drink on schedule",
      "They notice how much better they feel when hydrated",
    ],

    progression: {
      week1: "Drink water at one consistent trigger point",
      month1: "Multiple water triggers throughout the day",
      month3: "Hydration is automatic; you feel off when you miss it",
    },

    traps: [
      "Relying on thirst (by then you're already dehydrated)",
      "Setting unrealistic 'gallon a day' goals",
      "Keeping water out of sight",
    ],

    leveragePoints: [
      "Link water to something you already do multiple times daily",
      "Keep water visible on your desk, counter, or nightstand",
    ],

    smallToBig: "Drinking water after coffee becomes automatic. Then you add another trigger. Soon you're hydrated all day without thinking about it.",

    candidateHabits: [
      {
        id: "water_morning",
        action: "Drink one glass of water after waking",
        whyWeek1: "Starts day hydrated; simple trigger",
        bestTiming: ["morning"],
        bestEnergy: ["low", "medium", "high"],
        addressesBarrier: ["forgetting", "motivation"],
        suggestedAnchor: "After feet hit the floor",
        suggestedRecovery: "Take one sip of water",
      },
      {
        id: "water_coffee",
        action: "Drink water before or after each coffee",
        whyWeek1: "Links to existing habit; balances caffeine",
        bestTiming: ["morning", "midday", "flexible"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["forgetting"],
        suggestedAnchor: "When you pour coffee",
        suggestedRecovery: "One sip of water with coffee",
      },
      {
        id: "water_bottle",
        action: "Fill and place water bottle on desk each morning",
        whyWeek1: "Makes water visible; removes friction",
        bestTiming: ["morning"],
        bestEnergy: ["medium", "high"],
        addressesBarrier: ["forgetting", "time"],
        suggestedAnchor: "When you sit down to work",
        suggestedRecovery: "Place empty bottle on desk as reminder",
      },
    ],
  },
};
