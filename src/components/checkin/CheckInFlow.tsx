'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HabitSystem, CheckIn, HabitData, getCheckInState } from '@/types/habit';
import { IntakeState } from '@/types/conversation';
import {
  logCheckIn,
  updateTodayCheckIn,
  updateTodayConversation,
  acceptRecovery,
  completeRecovery,
  loadHabitData,
} from '@/lib/store/habitStore';
import {
  getWhisperForCheckIn,
  getSuccessTitle,
  getSuccessSubtitle,
} from '@/lib/education/whispers';
import { analyzePatterns, CheckInPatterns } from '@/lib/patterns/patternFinder';
import { getLocalDateString } from '@/lib/dateUtils';
import { DayMemory } from '@/types/habit';
import { saveDayMemory } from '@/lib/store/habitStore';
import CheckInOptions from './CheckInOptions';
import CheckInOptionsTimeEvent from './CheckInOptionsTimeEvent';
import CheckInSuccess from './CheckInSuccess';
import CheckInMiss from './CheckInMiss';
import RecoveryOffer from './RecoveryOffer';
import CheckInConversation, { ConversationData } from './CheckInConversation';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

type FlowStep =
  | 'options'                // For reactive: 3-option selector
  | 'success'                // Success screen with whisper + difficulty
  | 'conversation'           // Brief chat after success/no-trigger (V0.6)
  | 'recovery_conversation'  // Recovery coach conversation after miss (R16)
  | 'miss_reason'            // Capture why they missed (legacy, kept for fallback)
  | 'recovery'               // Offer recovery action (legacy, kept for fallback)
  | 'done';                  // Complete, redirect

interface CheckInFlowProps {
  system: HabitSystem;
  entryMode?: 'default' | 'early' | 'miss'; // How user entered the flow
  onComplete?: () => void;
}

/**
 * Main check-in flow controller
 * Orchestrates the entire check-in experience based on habit type and user choices
 */
export default function CheckInFlow({
  system,
  entryMode = 'default',
  onComplete,
}: CheckInFlowProps) {
  const router = useRouter();
  // Default to time_anchored for backwards compatibility
  const habitType = system.habitType || 'time_anchored';
  const isReactive = habitType === 'reactive';

  // Determine initial step based on entry mode
  // ALL habits now go through options screen (different options per type)
  const getInitialStep = (): FlowStep => {
    if (entryMode === 'miss') return 'recovery_conversation';
    return 'options'; // Both reactive and time/event show options
  };

  const [step, setStep] = useState<FlowStep>(getInitialStep());
  const [checkInData, setCheckInData] = useState<Partial<CheckIn>>({
    triggerOccurred: entryMode !== 'miss', // If entry is 'miss', trigger occurred but action not taken
    actionTaken: entryMode === 'default' || entryMode === 'early',
    recoveryOffered: false,
  });

  // Store the logged check-in for conversation
  const [loggedCheckIn, setLoggedCheckIn] = useState<CheckIn | null>(null);

  // Track whether we already had a conversation (recovery or reflection) — skip the second one
  const [hadConversation, setHadConversation] = useState(false);

  // Pattern analysis for conversation
  const [patterns, setPatterns] = useState<CheckInPatterns | null>(null);

  // Intake context for personalized reflection (R13)
  const [intakeContext, setIntakeContext] = useState<{
    userGoal: string | null;
    realLeverage: string | null;
  }>({ userGoal: null, realLeverage: null });

  // Load intake context on mount
  useEffect(() => {
    const habitData = loadHabitData();
    if (habitData.intakeState) {
      const intakeState = habitData.intakeState as IntakeState;
      setIntakeContext({
        userGoal: intakeState.userGoal || null,
        realLeverage: intakeState.realLeverage || null,
      });
    }
  }, []);

  // For success screen content
  const [successContent, setSuccessContent] = useState({
    title: 'Rep logged.',
    subtitle: 'Keep showing up.',
    whisper: null as ReturnType<typeof getWhisperForCheckIn>,
  });

  // Handle completing the flow
  const handleDone = () => {
    setStep('done');
    if (onComplete) {
      onComplete();
    } else {
      router.push('/');
    }
  };

  // Log the check-in and prepare success content
  const finalizeCheckIn = (data: Partial<CheckIn>, state: 'completed' | 'no_trigger' | 'missed') => {
    const today = getLocalDateString();
    const checkIn: Omit<CheckIn, 'id' | 'checkedInAt'> = {
      date: today,
      triggerOccurred: data.triggerOccurred ?? true,
      actionTaken: data.actionTaken ?? false,
      triggerTime: data.triggerTime,
      outcomeSuccess: data.outcomeSuccess,
      missReason: data.missReason,
      difficultyRating: data.difficultyRating,
      note: data.note,
      recoveryOffered: data.recoveryOffered ?? false,
      recoveryAccepted: data.recoveryAccepted,
      recoveryCompleted: data.recoveryCompleted,
    };

    // Log the check-in
    const updated = logCheckIn(checkIn);

    // Get whisper for this check-in
    const allCheckIns = updated.checkIns || [];
    const thisCheckIn = allCheckIns.find(c => c.date === today);
    const previousCheckIns = allCheckIns.filter(c => c.date !== today);

    // Store logged check-in for conversation
    if (thisCheckIn) {
      setLoggedCheckIn(thisCheckIn);
    }

    // Analyze patterns for conversation
    if (allCheckIns.length > 0) {
      const analyzedPatterns = analyzePatterns(allCheckIns, habitType);
      setPatterns(analyzedPatterns);
    }

    const whisper = thisCheckIn
      ? getWhisperForCheckIn(thisCheckIn, previousCheckIns, system)
      : null;

    const completedCount = previousCheckIns.filter(
      c => {
        const s = getCheckInState(c);
        return s === 'completed' || s === 'recovered';
      }
    ).length;

    // Only set success content for states that show the success screen
    if (state !== 'missed') {
      setSuccessContent({
        title: getSuccessTitle(state, completedCount),
        subtitle: getSuccessSubtitle(state, completedCount),
        whisper,
      });
    }

    return thisCheckIn;
  };

  // Handle reactive habit options
  const handleNoTrigger = () => {
    setCheckInData({ triggerOccurred: false, actionTaken: false, recoveryOffered: false });
    finalizeCheckIn({ triggerOccurred: false, actionTaken: false, recoveryOffered: false }, 'no_trigger');
    setStep('success');
  };

  const handleCompleted = () => {
    setCheckInData({ triggerOccurred: true, actionTaken: true, recoveryOffered: false });
    finalizeCheckIn({ triggerOccurred: true, actionTaken: true, recoveryOffered: false }, 'completed');
    setStep('success');
  };

  const handleMissed = () => {
    const data = { triggerOccurred: true, actionTaken: false, recoveryOffered: true };
    setCheckInData(prev => ({ ...prev, ...data }));
    finalizeCheckIn(data, 'missed');
    setStep('recovery_conversation');
  };

  // Handle miss reason selection
  const handleMissReason = (reason: string | null) => {
    const data = { ...checkInData, missReason: reason || undefined, recoveryOffered: true };
    setCheckInData(data);
    finalizeCheckIn(data, 'missed');
    setStep('recovery');
  };

  const handleSkipMissReason = () => {
    const data = { ...checkInData, recoveryOffered: true };
    setCheckInData(data);
    finalizeCheckIn(data, 'missed');
    setStep('recovery');
  };

  // Handle recovery
  const handleAcceptRecovery = () => {
    acceptRecovery();
    completeRecovery();
    // Update success content for recovery
    setSuccessContent({
      title: 'Recovery logged.',
      subtitle: "You're still in the game.",
      whisper: {
        content: "You did the recovery. That's not a consolation prize — it's you signaling to your brain that you're still committed.",
        type: 'encouragement',
      },
    });
    setStep('success');
  };

  const handleDeclineRecovery = () => {
    handleDone();
  };

  // Handle difficulty rating
  const handleDifficultyRate = (rating: 1 | 2 | 3 | 4 | 5) => {
    updateTodayCheckIn({ difficultyRating: rating });
  };

  // Handle outcome question (for reactive habits)
  const handleOutcomeResponse = (success: boolean) => {
    updateTodayCheckIn({ outcomeSuccess: success });
  };

  // Handle skip from options (reactive only)
  const handleSkipOptions = () => {
    handleDone();
  };

  // Handle success screen done - go to conversation (unless we already had one)
  const handleSuccessDone = () => {
    // Skip reflection conversation if we already did a recovery conversation
    if (hadConversation) {
      handleDone();
      return;
    }
    // If we have a logged check-in, go to conversation
    if (loggedCheckIn) {
      setStep('conversation');
    } else {
      handleDone();
    }
  };

  // Extract DayMemory from conversation (Option A: AI extraction with fallback)
  const extractAndSaveDayMemory = async (
    messages: Array<{ role: 'ai' | 'user'; content: string }>,
    outcome: DayMemory['outcome']
  ) => {
    const date = getLocalDateString();
    try {
      const response = await fetch('/api/extract-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, date, outcome }),
      });

      if (response.ok) {
        const memory: DayMemory = await response.json();
        saveDayMemory(memory);
        return;
      }
    } catch {
      // AI extraction failed — use rule-based fallback
    }

    // Rule-based fallback (Option B)
    const userMessages = messages.filter(m => m.role === 'user');
    const aiMessages = messages.filter(m => m.role === 'ai');
    const memory: DayMemory = {
      date,
      outcome,
      userShared: userMessages.length > 0
        ? userMessages[userMessages.length - 1].content.slice(0, 200)
        : 'No details shared.',
      coachObservation: aiMessages.length > 0
        ? aiMessages[aiMessages.length - 1].content.slice(0, 200)
        : 'Conversation logged.',
      emotionalTone: 'neutral',
    };
    saveDayMemory(memory);
  };

  // Handle conversation completion
  const handleConversationComplete = (conversation: ConversationData) => {
    // Store conversation with today's check-in
    updateTodayConversation(conversation);

    // Extract DayMemory in the background
    if (conversation.messages.length > 0) {
      const outcome = checkInData.actionTaken ? 'completed' : 'missed';
      extractAndSaveDayMemory(conversation.messages, outcome);
    }

    handleDone();
  };

  // Handle conversation skip — generate minimal DayMemory
  const handleConversationSkip = () => {
    updateTodayConversation({ skipped: true, messages: [], duration: 0 });

    // Save minimal DayMemory from check-in data alone
    const date = getLocalDateString();
    const habitData = loadHabitData();
    const repsCount = habitData.repsCount || 0;
    const memory: DayMemory = {
      date,
      outcome: checkInData.actionTaken ? 'completed' : 'missed',
      userShared: 'Logged without conversation.',
      coachObservation: `Rep #${repsCount} logged. Difficulty: ${checkInData.difficultyRating || 'not rated'}.`,
      emotionalTone: 'neutral',
    };
    saveDayMemory(memory);

    handleDone();
  };

  // Handle recovery conversation completion (R16)
  const handleRecoveryConversationComplete = (conversation: ConversationData) => {
    // Mark that we've already had a conversation (don't route to reflection after success)
    setHadConversation(true);

    // Store conversation with today's check-in
    updateTodayConversation(conversation);

    // Extract DayMemory in the background
    if (conversation.messages.length > 0) {
      const outcome = conversation.recoveryAccepted ? 'recovered' : 'missed';
      extractAndSaveDayMemory(conversation.messages, outcome);
    }

    // Store miss reason if AI extracted one
    if (conversation.missReason) {
      updateTodayCheckIn({ missReason: conversation.missReason });
    }

    // Store system change proposal if any
    if (conversation.systemChangeProposed) {
      updateTodayCheckIn({
        systemChangeProposed: {
          field: conversation.systemChangeProposed.field as 'anchor' | 'time' | 'action' | 'recovery',
          suggestion: conversation.systemChangeProposed.suggestion,
          accepted: false,
        },
      });
    }

    // If recovery was accepted in conversation, trigger recovery flow
    if (conversation.recoveryAccepted) {
      acceptRecovery();
      completeRecovery();
      setSuccessContent({
        title: 'Recovery logged.',
        subtitle: "You're still in the game.",
        whisper: {
          content: "You did the recovery. That's not a consolation prize — it's you signaling to your brain that you're still committed.",
          type: 'encouragement',
        },
      });
      setStep('success');
    } else {
      handleDone();
    }
  };

  // Handle recovery conversation skip (R16)
  const handleRecoveryConversationSkip = () => {
    updateTodayConversation({ skipped: true, messages: [], duration: 0 });

    // Save minimal DayMemory
    const date = getLocalDateString();
    const memory: DayMemory = {
      date,
      outcome: 'missed',
      userShared: 'Skipped recovery conversation.',
      coachObservation: 'Recovery was offered but conversation was skipped.',
      emotionalTone: 'neutral',
    };
    saveDayMemory(memory);

    handleDone();
  };

  // When entering directly in miss mode, finalize the check-in
  useEffect(() => {
    if (entryMode === 'miss' && !loggedCheckIn) {
      const data = { triggerOccurred: true, actionTaken: false, recoveryOffered: true };
      finalizeCheckIn(data, 'missed');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Note: All habits now go through options screen, so no auto-logging needed
  // The user explicitly chooses Done/Missed, which triggers the appropriate handlers

  // Render current step
  let content: React.ReactNode = null;

  switch (step) {
    case 'options':
      // Show different options based on habit type
      if (isReactive) {
        content = (
          <CheckInOptions
            habitAction={system.action}
            onNoTrigger={handleNoTrigger}
            onCompleted={handleCompleted}
            onMissed={handleMissed}
            onSkip={handleSkipOptions}
          />
        );
      } else {
        // Time-anchored or event-anchored habits
        content = (
          <CheckInOptionsTimeEvent
            habitAction={system.action}
            onCompleted={handleCompleted}
            onMissed={handleMissed}
            onSkip={handleSkipOptions}
          />
        );
      }
      break;

    case 'success':
      content = (
        <CheckInSuccess
          title={successContent.title}
          subtitle={successContent.subtitle}
          whisper={successContent.whisper}
          showDifficultyRating={checkInData.actionTaken}
          showOutcomeQuestion={isReactive && checkInData.actionTaken && checkInData.triggerOccurred}
          onDifficultyRate={handleDifficultyRate}
          onOutcomeResponse={handleOutcomeResponse}
          onDone={handleSuccessDone}
        />
      );
      break;

    case 'conversation':
      // Show conversation after success/no-trigger
      if (loggedCheckIn) {
        content = (
          <CheckInConversation
            checkIn={loggedCheckIn}
            patterns={patterns}
            system={system}
            userGoal={intakeContext.userGoal}
            realLeverage={intakeContext.realLeverage}
            onComplete={handleConversationComplete}
            onSkip={handleConversationSkip}
          />
        );
      } else {
        // Fallback if no check-in data
        handleDone();
      }
      break;

    case 'recovery_conversation':
      // Recovery coach conversation after miss (R16)
      if (loggedCheckIn) {
        content = (
          <CheckInConversation
            mode="recovery"
            checkIn={loggedCheckIn}
            patterns={patterns}
            system={system}
            userGoal={intakeContext.userGoal}
            realLeverage={intakeContext.realLeverage}
            onComplete={handleRecoveryConversationComplete}
            onSkip={handleRecoveryConversationSkip}
          />
        );
      }
      // Fallback if check-in not yet finalized (e.g., entryMode='miss' still loading)
      break;

    case 'miss_reason':
      content = (
        <CheckInMiss
          isReactiveHabit={isReactive}
          onSelectReason={handleMissReason}
          onSkip={handleSkipMissReason}
        />
      );
      break;

    case 'recovery':
      content = (
        <RecoveryOffer
          recoveryAction={system.recovery}
          onAccept={handleAcceptRecovery}
          onDecline={handleDeclineRecovery}
        />
      );
      break;

    case 'done':
    default:
      break;
  }

  if (!content) return null;

  return (
    <ErrorBoundary screenName="CheckInFlow">
      {content}
    </ErrorBoundary>
  );
}
