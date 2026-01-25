"use client";

import { useState, useCallback } from "react";
import { ConsultOption, ConsultSelections, ConsultStepResponse, HabitDomain } from "@/types/habit";

type ConsultStepType = "success_week" | "action" | "orientation" | "anchor" | "habit_select" | "system_design";

interface UseConsultAIResult {
  isLoading: boolean;
  error: string | null;
  response: ConsultStepResponse | null;
  usedFallback: boolean;
  generate: (step: ConsultStepType, selections: ConsultSelections) => Promise<ConsultStepResponse | null>;
}

/**
 * Hook for calling the consult AI API with fallback support
 */
export function useConsultAI(): UseConsultAIResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ConsultStepResponse | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  const generate = useCallback(
    async (
      step: ConsultStepType,
      selections: ConsultSelections
    ): Promise<ConsultStepResponse | null> => {
      setIsLoading(true);
      setError(null);
      setUsedFallback(false);

      try {
        const res = await fetch("/api/consult", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step, selections }),
        });

        const data = await res.json();

        if (!res.ok) {
          // If AI fails, use fallback
          if (data.fallback) {
            console.warn("AI unavailable, using fallback options");
            const fallback = getFallbackResponse(step, selections);
            setResponse(fallback);
            setUsedFallback(true);
            return fallback;
          }
          throw new Error(data.error || "API request failed");
        }

        setResponse(data.response);
        return data.response;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Consult AI error:", message);
        setError(message);

        // Use fallback on any error
        const fallback = getFallbackResponse(step, selections);
        setResponse(fallback);
        setUsedFallback(true);
        return fallback;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { isLoading, error, response, usedFallback, generate };
}

/**
 * Fallback responses when AI is unavailable
 */
function getFallbackResponse(
  step: ConsultStepType,
  selections: ConsultSelections
): ConsultStepResponse {
  switch (step) {
    case "success_week":
      return getSuccessWeekFallback(selections);
    case "anchor":
      return getAnchorFallback(selections);
    case "action":
      return getPlanningFallback(selections);
    case "orientation":
      return getOrientationFallback(selections);
    case "habit_select":
      return getHabitSelectFallback(selections);
    case "system_design":
      return getSystemDesignFallback(selections);
    default:
      throw new Error(`Unknown step: ${step}`);
  }
}

/**
 * NEW: Habit selection fallback (Iteration 2)
 */
function getHabitSelectFallback(selections: ConsultSelections): ConsultStepResponse {
  const domain = selections.domain;
  const subProblem = selections.subProblem || "";

  // Domain-specific habit recommendations
  const habitsByDomainAndSubProblem: Record<string, Record<string, ConsultOption[]>> = {
    health: {
      exercise_start: [
        {
          id: "5_pushups",
          title: "Do 5 pushups",
          description: "5 pushups against a wall or on the floor. Takes 30 seconds.",
          why: "Pushups require no equipment. 5 is small enough to always complete, big enough to build strength over time.",
        },
        {
          id: "walk_block",
          title: "Walk around the block",
          description: "One lap around your block or building. About 2 minutes.",
          why: "Walking is the most sustainable exercise. Getting outside changes your state immediately.",
        },
        {
          id: "stretch_2min",
          title: "2-minute stretch",
          description: "Simple stretching routine you can do anywhere.",
          why: "Stretching reduces the barrier to movement. It builds the habit of doing something physical daily.",
        },
      ],
      eat_better: [
        {
          id: "one_fruit",
          title: "Eat one piece of fruit",
          description: "Add one serving of fruit to any meal or snack.",
          why: "Adding is easier than restricting. One fruit daily creates momentum for other healthy choices.",
        },
        {
          id: "glass_water_before",
          title: "Drink water before meals",
          description: "One glass of water before you eat anything.",
          why: "Water before meals is a simple win. It improves digestion and creates a healthy trigger.",
        },
      ],
      sleep_improve: [
        {
          id: "dim_lights",
          title: "Dim one light at 9pm",
          description: "Reduce brightness of one light source an hour before bed.",
          why: "Light affects melatonin. This tiny action signals your body that sleep is coming.",
        },
        {
          id: "phone_away",
          title: "Phone on charger by bed",
          description: "Put your phone on the charger away from arm's reach.",
          why: "Physical distance creates friction. You'll naturally check it less.",
        },
      ],
      hydration: [
        {
          id: "morning_water",
          title: "One glass when you wake",
          description: "Drink a full glass of water first thing in the morning.",
          why: "You wake up dehydrated. Morning water kickstarts hydration and is easy to remember.",
        },
        {
          id: "water_with_coffee",
          title: "Water with your coffee",
          description: "Have a glass of water alongside your first cup of coffee.",
          why: "Pairing with coffee makes it automatic. You're already in the kitchen.",
        },
      ],
    },
    finances: {
      track_spending: [
        {
          id: "check_balance",
          title: "Check one account balance",
          description: "Open your banking app and look at one account balance.",
          why: "Awareness is the foundation. Just looking builds the habit of knowing your numbers.",
        },
        {
          id: "log_one_expense",
          title: "Log your last purchase",
          description: "Write down or note your most recent purchase.",
          why: "Logging creates awareness without judgment. One purchase is manageable.",
        },
      ],
      build_savings: [
        {
          id: "move_5_dollars",
          title: "Move $5 to savings",
          description: "Transfer any small amount to your savings account.",
          why: "The habit of saving matters more than the amount. $5 proves you can save consistently.",
        },
        {
          id: "round_up",
          title: "Round up one purchase",
          description: "When you buy something, mentally note what rounding up would save.",
          why: "Building savings awareness. Many apps can automate this once you're ready.",
        },
      ],
      reduce_spending: [
        {
          id: "pause_before_buy",
          title: "Pause before buying",
          description: "Wait 10 seconds before completing any purchase.",
          why: "Impulse happens fast. A small pause creates space for intentional choice.",
        },
        {
          id: "note_urge",
          title: "Note one purchase urge",
          description: "When you want to buy something, write it down instead.",
          why: "Writing separates wanting from buying. Most urges pass.",
        },
      ],
      financial_review: [
        {
          id: "check_one_number",
          title: "Check one financial number",
          description: "Look at one number: balance, bill, or transaction.",
          why: "Starting with one number removes overwhelm. Awareness builds from here.",
        },
      ],
    },
    home: {
      keep_tidy: [
        {
          id: "clear_one_surface",
          title: "Clear one surface",
          description: "Pick one flat surface and clear everything off it.",
          why: "One clear surface creates visual calm. It often sparks more tidying naturally.",
        },
        {
          id: "put_away_one",
          title: "Put away one item",
          description: "Take one thing that's out of place and put it where it belongs.",
          why: "One item is impossible to resist. It builds the tidying instinct.",
        },
      ],
      declutter: [
        {
          id: "remove_one_item",
          title: "Remove one item from home",
          description: "Find one thing to donate, trash, or recycle.",
          why: "Decluttering is about making decisions. One per day adds up fast.",
        },
        {
          id: "one_drawer",
          title: "Touch one drawer",
          description: "Open one drawer and remove anything you don't need.",
          why: "Drawers hide clutter. Opening them is the hardest part.",
        },
      ],
      daily_cleaning: [
        {
          id: "wipe_one_surface",
          title: "Wipe one surface",
          description: "Quick wipe of one counter, table, or surface.",
          why: "Clean surfaces prevent accumulation. One wipe takes 30 seconds.",
        },
        {
          id: "dishes_one",
          title: "Wash one dish",
          description: "Wash just one item in the sink.",
          why: "One dish often becomes all dishes. Starting is the barrier.",
        },
      ],
      meal_prep: [
        {
          id: "chop_one_vegetable",
          title: "Chop one vegetable",
          description: "Prep one vegetable for tomorrow's meal.",
          why: "Having something ready removes the friction. One veggie is easy.",
        },
        {
          id: "plan_one_meal",
          title: "Decide tomorrow's dinner",
          description: "Make one decision about what you'll eat tomorrow.",
          why: "Decision fatigue leads to takeout. Deciding ahead removes it.",
        },
      ],
    },
    relationships: {
      stay_connected: [
        {
          id: "text_one_person",
          title: "Send one text",
          description: "Message one person you haven't talked to recently.",
          why: "Connection doesn't require big gestures. A text shows you're thinking of them.",
        },
        {
          id: "think_of_one",
          title: "Think of one person",
          description: "Spend a moment thinking about someone you care about.",
          why: "Intentional thinking about others primes you for connection.",
        },
      ],
      be_present: [
        {
          id: "phone_down_5min",
          title: "Phone down for 5 minutes",
          description: "Put your phone face-down during one conversation.",
          why: "Physical action signals presence. Others notice immediately.",
        },
        {
          id: "one_question",
          title: "Ask one real question",
          description: "Ask someone a question you genuinely want the answer to.",
          why: "Questions show interest. One good question deepens any conversation.",
        },
      ],
      express_gratitude: [
        {
          id: "say_thank_you",
          title: "Say one thank you",
          description: "Thank someone for something specific today.",
          why: "Spoken gratitude changes both people. Specificity makes it real.",
        },
        {
          id: "notice_good",
          title: "Notice one good thing",
          description: "Notice and name one thing someone did well.",
          why: "Noticing is the first step. You can share it or just hold it.",
        },
      ],
      listen_better: [
        {
          id: "listen_fully",
          title: "Listen without planning reply",
          description: "In one conversation, just listen. Don't plan what to say next.",
          why: "Planning your reply means you're not listening. This shifts focus outward.",
        },
      ],
    },
    learning: {
      read_more: [
        {
          id: "read_one_page",
          title: "Read one page",
          description: "Open your book and read just one page.",
          why: "One page is never too much. It often becomes five.",
        },
        {
          id: "read_2_min",
          title: "Read for 2 minutes",
          description: "Set a timer and read until it goes off.",
          why: "Time-based goals remove page pressure. 2 minutes is always available.",
        },
      ],
      learn_skill: [
        {
          id: "practice_5_min",
          title: "5 minutes of practice",
          description: "Practice your skill for just 5 minutes.",
          why: "Skills are built in small sessions. 5 minutes daily beats 2 hours weekly.",
        },
        {
          id: "watch_one_tutorial",
          title: "Watch one short tutorial",
          description: "Find and watch one video under 5 minutes on your skill.",
          why: "Learning something small keeps momentum. Videos are accessible.",
        },
      ],
      journal: [
        {
          id: "write_one_sentence",
          title: "Write one sentence",
          description: "Open your journal and write just one sentence about your day.",
          why: "One sentence removes the blank page problem. It often becomes more.",
        },
        {
          id: "three_words",
          title: "Three words about today",
          description: "Capture your day in just three words.",
          why: "Ultra-minimal journaling still builds reflection. Three words is impossible to skip.",
        },
      ],
      reduce_screens: [
        {
          id: "one_minute_delay",
          title: "One minute before opening",
          description: "Wait one minute before opening social media or distracting apps.",
          why: "The urge often passes in a minute. This builds awareness of habits.",
        },
        {
          id: "phone_free_meal",
          title: "One phone-free meal",
          description: "Put your phone away during one meal.",
          why: "Meals are natural screen-free zones. Starting with one is achievable.",
        },
      ],
    },
  };

  // Get options for this domain and sub-problem
  const domainHabits = domain ? habitsByDomainAndSubProblem[domain] : null;
  const options = domainHabits?.[subProblem] || getGenericHabitFallback(selections);

  return {
    step: "habit_select",
    question: "Which habit would you like to start with?",
    options,
    recommended_id: options[0]?.id || "generic",
    needs_free_text: false,
    free_text_prompt: null,
  };
}

function getGenericHabitFallback(selections: ConsultSelections): ConsultOption[] {
  const intent = (selections.intent || "").toLowerCase();

  if (intent.includes("exercise") || intent.includes("run") || intent.includes("fitness")) {
    return [
      {
        id: "5_pushups",
        title: "Do 5 pushups",
        description: "5 pushups against a wall or on the floor. Takes 30 seconds.",
        why: "Pushups require no equipment. 5 is small enough to always complete.",
      },
      {
        id: "walk_block",
        title: "Walk around the block",
        description: "One lap around your block. About 2 minutes.",
        why: "Walking is the most sustainable exercise. Getting outside changes your state.",
      },
    ];
  }

  return [
    {
      id: "generic_2min",
      title: "2 minutes toward your goal",
      description: "Spend just 2 minutes on this habit. Any progress counts.",
      why: "Two minutes removes the barrier. Starting is the hardest part.",
    },
    {
      id: "generic_touch",
      title: "Touch your materials",
      description: "Just touch or look at whatever you need for this habit.",
      why: "Physical contact creates mental connection. It primes you for action.",
    },
  ];
}

/**
 * NEW: System design fallback (Iteration 2)
 */
function getSystemDesignFallback(selections: ConsultSelections): ConsultStepResponse {
  const selectedHabit = selections.selectedHabit || selections.intent || "your habit";

  const options: ConsultOption[] = [
    {
      id: "morning_system",
      title: "Morning routine anchor",
      description: `After morning coffee, ${selectedHabit}. Prime: Set reminder. If missed: Touch materials for 10 sec.`,
      why: "Morning routines are the most reliable. Energy is typically higher.",
    },
    {
      id: "midday_system",
      title: "Midday transition anchor",
      description: `After lunch, ${selectedHabit}. Prime: Prepare during morning. If missed: Do 30-second version.`,
      why: "Lunch is a consistent break. The transition moment makes a good trigger.",
    },
    {
      id: "evening_system",
      title: "Evening wind-down anchor",
      description: `After dinner, ${selectedHabit}. Prime: Materials visible. If missed: Just look at materials.`,
      why: "Evening is when many have more time. Pairs well with relaxation.",
    },
  ];

  return {
    step: "system_design",
    question: "Choose your habit system:",
    options,
    recommended_id: "morning_system",
    needs_free_text: false,
    free_text_prompt: null,
  };
}

function getSuccessWeekFallback(selections: ConsultSelections): ConsultStepResponse {
  const intent = (selections.intent || "").toLowerCase();

  let options: ConsultOption[];

  if (intent.includes("run") || intent.includes("exercise") || intent.includes("workout")) {
    options = [
      {
        id: "show-up",
        title: "Just show up",
        description: "Put on your shoes and step outside. That's it. The run is optional.",
        why: "Starting is the hardest part. Once you're outside, momentum takes over.",
      },
      {
        id: "same-time",
        title: "Same time each day",
        description: "Do your tiny action at the same time, no matter what else happens.",
        why: "Consistency builds the neural pathway. The habit becomes automatic faster.",
      },
      {
        id: "no-pressure",
        title: "Zero pressure",
        description: "Do the minimum. No tracking duration or distance this week.",
        why: "Removing metrics removes anxiety. You can't fail if showing up is enough.",
      },
    ];
  } else if (intent.includes("tidy") || intent.includes("clean") || intent.includes("home")) {
    options = [
      {
        id: "show-up",
        title: "Just show up",
        description: "Touch one item and decide: keep, move, or trash. That's the whole task.",
        why: "Micro-actions build momentum. One item often leads to five.",
      },
      {
        id: "same-time",
        title: "Same time each day",
        description: "2 minutes of tidying at the same time daily. Anchor it to something you already do.",
        why: "Routine removes decision fatigue. You don't debate—you just do.",
      },
      {
        id: "no-pressure",
        title: "Zero pressure",
        description: "No full cleaning sessions. Just tiny resets. The mess is allowed.",
        why: "Perfectionism kills habits. 'Good enough' every day beats 'perfect' never.",
      },
    ];
  } else {
    options = [
      {
        id: "show-up",
        title: "Just show up",
        description: "Do the tiniest version of this habit. Showing up is the whole goal.",
        why: "The hardest part is starting. Once you start, you've already won.",
      },
      {
        id: "same-time",
        title: "Same time each day",
        description: "Anchor your tiny action to a specific time or existing routine.",
        why: "Consistency builds automaticity. Same cue, same action, every day.",
      },
      {
        id: "no-pressure",
        title: "Zero pressure",
        description: "No tracking, no goals beyond showing up. Just do the minimum.",
        why: "Pressure creates resistance. Remove it and the habit feels lighter.",
      },
    ];
  }

  return {
    step: "success_week",
    question: "What does success look like for Week 1?",
    options,
    recommended_id: "show-up",
    needs_free_text: false,
    free_text_prompt: null,
  };
}

function getAnchorFallback(selections: ConsultSelections): ConsultStepResponse {
  const intent = (selections.intent || "").toLowerCase();

  let options: ConsultOption[];

  if (intent.includes("run") || intent.includes("exercise") || intent.includes("workout")) {
    options = [
      {
        id: "morning",
        title: "After morning coffee",
        description: "Use your coffee ritual as the trigger. Finish coffee → put on shoes.",
        why: "Coffee is a reliable daily ritual. Energy is often higher in the morning.",
      },
      {
        id: "lunch",
        title: "After lunch",
        description: "Use your lunch break as the trigger. Finish eating → move.",
        why: "Midday movement helps with afternoon energy. Lunch is a consistent break.",
      },
      {
        id: "evening",
        title: "After getting home",
        description: "Use arriving home as the trigger. Walk in → change into workout clothes.",
        why: "Transition moments are powerful. Changing clothes signals a mode shift.",
      },
    ];
  } else if (intent.includes("read")) {
    options = [
      {
        id: "morning",
        title: "After morning coffee",
        description: "Quiet morning time with your coffee and a book.",
        why: "Morning routines are reliable. Pairs well with coffee ritual.",
      },
      {
        id: "lunch",
        title: "During lunch break",
        description: "Read while you eat or right after.",
        why: "A built-in break you already take. Reading is a restful lunch companion.",
      },
      {
        id: "evening",
        title: "Before bed",
        description: "Read as part of your wind-down routine.",
        why: "Reading before bed is calming. The bed is a reliable trigger.",
      },
    ];
  } else {
    // Default anchors
    options = [
      {
        id: "morning",
        title: "After morning coffee",
        description: "Attach to your morning coffee or breakfast routine.",
        why: "Morning routines are reliable. Starting the day with your habit builds momentum.",
      },
      {
        id: "lunch",
        title: "After lunch",
        description: "Use your lunch break as the trigger moment.",
        why: "Midday is a natural transition. You're already taking a break.",
      },
      {
        id: "evening",
        title: "After dinner",
        description: "Attach to your evening meal as the trigger.",
        why: "Dinner is consistent. Evening habits help you wind down intentionally.",
      },
    ];
  }

  return {
    step: "anchor",
    question: "When will you do this habit?",
    options,
    recommended_id: "morning",
    needs_free_text: true,
    free_text_prompt: "Or write your own anchor routine...",
  };
}

function getPlanningFallback(selections: ConsultSelections): ConsultStepResponse {
  const intent = (selections.intent || "").toLowerCase();

  let options: ConsultOption[];

  if (intent.includes("run") || intent.includes("exercise") || intent.includes("workout")) {
    options = [
      {
        id: "minimal",
        title: "Minimal: Just show up",
        description: "Put on shoes, step outside. Prime: Shoes by door. If missed: Touch shoes.",
        why: "The smallest action that counts. Once outside, momentum takes over.",
      },
      {
        id: "standard",
        title: "Standard: 2-min walk",
        description: "Walk for 2 min, any pace. Prime: Clothes ready. If missed: 30 sec stretch.",
        why: "Short enough to always do. Walking builds the exercise habit loop.",
      },
    ];
  } else if (intent.includes("tidy") || intent.includes("clean") || intent.includes("home")) {
    options = [
      {
        id: "minimal",
        title: "Minimal: One item",
        description: "Put away 1 item. Prime: Leave basket out. If missed: Touch one thing.",
        why: "One item often leads to five. The start is what matters.",
      },
      {
        id: "standard",
        title: "Standard: 2-min reset",
        description: "Tidy one surface for 2 min. Prime: Cloth visible. If missed: Straighten one item.",
        why: "A clean surface spreads calm. Two minutes is always doable.",
      },
    ];
  } else if (intent.includes("read")) {
    options = [
      {
        id: "minimal",
        title: "Minimal: One page",
        description: "Read 1 page. Prime: Book on pillow. If missed: Read 1 sentence.",
        why: "One page removes decisions. The book is already waiting.",
      },
      {
        id: "standard",
        title: "Standard: 2-min reading",
        description: "Read for 2 min. Prime: Book visible. If missed: Open book, read a paragraph.",
        why: "Short reading sessions build the habit. Visibility is key.",
      },
    ];
  } else {
    options = [
      {
        id: "minimal",
        title: "Minimal version",
        description: "Do the tiniest version. Prime: Materials ready. If missed: Touch materials.",
        why: "The smallest action that counts. Starting is the whole goal.",
      },
      {
        id: "standard",
        title: "Standard: 2 minutes",
        description: "Spend 2 min on this. Prime: Set visual reminder. If missed: 30 sec version.",
        why: "Two minutes is always available. Consistency beats intensity.",
      },
    ];
  }

  return {
    step: "action",
    question: "Choose your action plan:",
    options,
    recommended_id: options[0].id,
    needs_free_text: true,
    free_text_prompt: "Or describe your own action...",
  };
}

function getOrientationFallback(selections: ConsultSelections): ConsultStepResponse {
  return {
    step: "orientation",
    question: "Here's what the journey looks like:",
    options: [
      {
        id: "roadmap",
        title: "Your path forward",
        description: "Sustainable habits are built in phases. Here's what success looks like over time.",
        why: "Phase 1: Show up (tiny action) → Phase 2: Stabilize (consistent timing) → Phase 3: Build (gradual expansion) → Phase 4: Graduate (automatic habit)",
      },
    ],
    recommended_id: "roadmap",
    needs_free_text: false,
    free_text_prompt: null,
  };
}
