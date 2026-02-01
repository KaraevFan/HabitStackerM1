import { CheckIn, HabitSystem } from '@/types/habit';
import { CheckInPatterns } from '@/lib/patterns/patternFinder';

/**
 * Opening message and suggested replies for conversation
 */
export interface ConversationOpener {
  message: string;
  suggestedReplies: string[];
}

/**
 * AI response with optional follow-up or close signal
 */
export interface ConversationResponse {
  message: string;
  suggestedReplies?: string[];
  shouldClose: boolean;
}

/**
 * Generate the opening message based on check-in outcome, difficulty, and patterns
 */
export function generateConversationOpener(
  checkIn: CheckIn,
  patterns: CheckInPatterns | null,
  system: HabitSystem
): ConversationOpener {
  const difficulty = checkIn.difficulty || checkIn.difficultyRating || 3;
  const isSuccess = checkIn.actionTaken;
  const isMiss = checkIn.triggerOccurred && !checkIn.actionTaken;
  const isNoTrigger = !checkIn.triggerOccurred;
  const streak = patterns?.currentStreak || 0;

  // First rep - special case
  if (isSuccess && patterns?.isFirstRep) {
    return {
      message: "First one done. That's the hardest part. How did it feel?",
      suggestedReplies: ["Good", "Awkward but okay", "Harder than expected", "Not sure yet"],
    };
  }

  // Success + Streak (3+)
  if (isSuccess && streak >= 3) {
    return {
      message: `That's ${streak} in a row. What's making this stick?`,
      suggestedReplies: ["The anchor works", "Getting easier", "Don't want to break it", "Honestly not sure"],
    };
  }

  // Success + Easy (difficulty 1-2)
  if (isSuccess && difficulty <= 2) {
    return {
      message: "Nice work! Anything click today that made it easier?",
      suggestedReplies: ["Setup was ready", "Good timing", "Just felt natural", "Not sure"],
    };
  }

  // Success + Hard (difficulty 4-5)
  if (isSuccess && difficulty >= 4) {
    return {
      message: "That took real effort today. What made it tough?",
      suggestedReplies: ["Low energy", "Bad timing", "Almost skipped", "Something else"],
    };
  }

  // Success + Normal difficulty
  if (isSuccess) {
    return {
      message: "Rep logged. How did that feel?",
      suggestedReplies: ["Good", "Fine", "Harder than expected", "Easier than expected"],
    };
  }

  // Miss - check for repeated miss reason
  if (isMiss) {
    if (patterns?.repeatedMissReason) {
      return {
        message: `I noticed "${patterns.repeatedMissReason}" has come up before. Same thing today, or something different?`,
        suggestedReplies: ["Same thing", "Different this time", "Not sure"],
      };
    }
    return {
      message: "No worries — misses happen. What got in the way?",
      suggestedReplies: ["Too tired", "Forgot", "Didn't have time", "Something else"],
    };
  }

  // No trigger (reactive habits)
  if (isNoTrigger) {
    const noTriggerStreak = patterns?.currentNoTriggerStreak || 1;
    if (noTriggerStreak >= 3) {
      return {
        message: `${noTriggerStreak} good nights in a row. How are you feeling about the system?`,
        suggestedReplies: ["It's working", "Might be coincidence", "Feeling good", "Too early to tell"],
      };
    }
    return {
      message: "Good night — no trigger needed. Anything on your mind about the habit?",
      suggestedReplies: ["All good", "Have a question", "Something feels off", "Nope"],
    };
  }

  // Fallback
  return {
    message: "Logged. Anything you want to note?",
    suggestedReplies: ["All good", "Something to mention", "Skip"],
  };
}

/**
 * Generate AI response based on user's message
 * Rule-based for MVP - can be upgraded to AI later
 */
export function generateConversationResponse(
  userMessage: string,
  checkIn: CheckIn,
  patterns: CheckInPatterns | null,
  system: HabitSystem,
  exchangeCount: number
): ConversationResponse {
  const lowerMessage = userMessage.toLowerCase();
  const identity = system.identity || "someone who shows up";

  // Positive responses about setup/system
  if (lowerMessage.includes("setup") || lowerMessage.includes("ready") || lowerMessage.includes("natural")) {
    return {
      message: `That's the system working. When the path is clear, showing up gets easier. You're building the identity of ${identity}.`,
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("anchor") || lowerMessage.includes("timing works")) {
    return {
      message: "Good anchors make habits automatic. Yours seems to be working.",
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("easier") || lowerMessage.includes("getting easier")) {
    return {
      message: "That's the goal — sustainable, not heroic. Keep protecting what's working.",
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("good") && lowerMessage.length < 20) {
    return {
      message: "Glad to hear it. Keep showing up.",
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("working") || lowerMessage.includes("it's working")) {
    return {
      message: "That's the goal — sustainable, not heroic. Keep protecting what's working.",
      shouldClose: true,
    };
  }

  // Struggle responses
  if (lowerMessage.includes("tired") || lowerMessage.includes("energy") || lowerMessage.includes("low energy")) {
    return {
      message: "Noted. If energy keeps coming up, we might look at timing or your tiny version. For now — you showed up anyway. That's what matters.",
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("forgot")) {
    return {
      message: "Forgetting usually means the anchor isn't strong enough yet. We can work on that in your weekly reflection.",
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("time") || lowerMessage.includes("busy") || lowerMessage.includes("didn't have time")) {
    return {
      message: "When time is tight, that's what your tiny version is for. Even a minimal rep keeps the chain going.",
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("hard") || lowerMessage.includes("struggled") || lowerMessage.includes("almost")) {
    return {
      message: "Hard days happen. The fact that you did it anyway is the skill you're building. It won't always feel like this.",
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("awkward")) {
    return {
      message: "Awkward is normal at the start. You're rewiring patterns that took years to form. Give it time.",
      shouldClose: true,
    };
  }

  // First-rep specific responses
  if (lowerMessage.includes("not sure yet") || lowerMessage.includes("too early")) {
    return {
      message: "That's fair. Give it a few more days. The first rep is about showing you can do it, not about perfection.",
      shouldClose: true,
    };
  }

  // Question or concern — allow one more exchange
  if (lowerMessage.includes("question") || lowerMessage.includes("off") || lowerMessage.includes("wrong") || lowerMessage.includes("feels off")) {
    return {
      message: "I'm listening. What's on your mind?",
      suggestedReplies: ["The timing feels wrong", "Not sure this is the right habit", "Need to adjust something", "Actually, never mind"],
      shouldClose: false,
    };
  }

  // Follow-up from "something feels off"
  if (lowerMessage.includes("timing") && lowerMessage.includes("wrong")) {
    return {
      message: "Timing matters a lot. We can adjust your anchor in the weekly reflection. For now, note when it does feel right.",
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("right habit") || lowerMessage.includes("wrong habit")) {
    return {
      message: "Good instinct to question. Give it the full week — sometimes what feels wrong at first becomes natural. If it still feels off at Day 7, we'll revisit.",
      shouldClose: true,
    };
  }

  if (lowerMessage.includes("adjust") || lowerMessage.includes("change")) {
    return {
      message: "Let's save adjustments for your weekly reflection — that way we have more data to work with. For now, keep logging.",
      shouldClose: true,
    };
  }

  // Same miss reason repeated
  if (lowerMessage.includes("same thing") || lowerMessage.includes("same")) {
    const tip = getTipForMissReason(patterns?.repeatedMissReason || '', system);
    return {
      message: tip || "That's a pattern worth addressing. Let's tackle it in your weekly reflection.",
      shouldClose: true,
    };
  }

  // Different miss reason this time
  if (lowerMessage.includes("different")) {
    return {
      message: "Got it. Different obstacles are actually good news — means there's no single blocker dominating. Keep logging what gets in the way.",
      shouldClose: true,
    };
  }

  // Neutral/skip responses
  if (lowerMessage.includes("skip") || lowerMessage.includes("nope") || lowerMessage.includes("all good") || lowerMessage.includes("fine") || lowerMessage.includes("never mind")) {
    return {
      message: "Got it. See you tomorrow.",
      shouldClose: true,
    };
  }

  // Positive acknowledgment about streak
  if (lowerMessage.includes("don't want to break") || lowerMessage.includes("momentum")) {
    return {
      message: "That's the habit forming — you're starting to identify as someone who does this. Protect that feeling.",
      shouldClose: true,
    };
  }

  // "Honestly not sure" type responses
  if (lowerMessage.includes("not sure") || lowerMessage.includes("honestly")) {
    return {
      message: "That's okay. Sometimes habits just click without a clear reason. Keep doing what you're doing.",
      shouldClose: true,
    };
  }

  // Something to mention
  if (lowerMessage.includes("mention") || lowerMessage.includes("something")) {
    return {
      message: "What's on your mind?",
      suggestedReplies: ["Felt different today", "Had a thought about the habit", "Nothing major", "Actually, never mind"],
      shouldClose: false,
    };
  }

  // Default acknowledgment — close after 1 exchange
  if (exchangeCount >= 1) {
    return {
      message: "Thanks for sharing. See you tomorrow.",
      shouldClose: true,
    };
  }

  return {
    message: "Thanks for sharing. That's useful context. Anything else on your mind?",
    suggestedReplies: ["Nope, all good", "Actually yes", "That's it"],
    shouldClose: false,
  };
}

/**
 * Get a specific tip for a repeated miss reason
 */
function getTipForMissReason(reason: string, system: HabitSystem): string | null {
  const tips: Record<string, string> = {
    "too tired": "Make the path easier: slippers by the bed, robe within reach, destination already set up.",
    "tired": "Make the path easier: slippers by the bed, robe within reach, destination already set up.",
    "forgot": "Try a physical cue — something you'll see when the trigger happens.",
    "time": "Consider: is the action too big? Your tiny version is there for busy days.",
    "busy": "On packed days, use your tiny version. Something is always better than nothing.",
    "didn't have time": "On packed days, use your tiny version. Something is always better than nothing.",
  };

  const lowerReason = reason.toLowerCase();
  for (const [key, tip] of Object.entries(tips)) {
    if (lowerReason.includes(key)) {
      return tip;
    }
  }
  return null;
}

/**
 * Get a micro-insight based on patterns (for whisper enhancement)
 */
export function getMicroInsight(
  patterns: CheckInPatterns | null,
  system: HabitSystem
): string | null {
  if (!patterns) return null;

  // Week 1 complete
  if (patterns.justCompletedWeek1) {
    return "Week 1 done. You've proven you can show up. Now let's make it stick.";
  }

  // Improving response rate
  if (patterns.trends.responseRateImproving && patterns.totalCheckIns >= 10) {
    return "Your follow-through is improving. The system is working.";
  }

  // Difficulty decreasing
  if (patterns.difficultyTrend === 'decreasing' && patterns.totalCheckIns >= 7) {
    return "It's getting easier. That's the habit forming.";
  }

  // No-trigger trend for reactive habits
  if (patterns.currentNoTriggerStreak >= 5) {
    return `${patterns.currentNoTriggerStreak} nights without needing the protocol. Your baseline may be improving.`;
  }

  return null;
}
