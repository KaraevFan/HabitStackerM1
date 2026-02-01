'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HabitSystem, CheckIn, HabitData, getCheckInState } from '@/types/habit';
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
import CheckInOptions from './CheckInOptions';
import CheckInOptionsTimeEvent from './CheckInOptionsTimeEvent';
import CheckInSuccess from './CheckInSuccess';
import CheckInMiss from './CheckInMiss';
import RecoveryOffer from './RecoveryOffer';
import CheckInConversation, { ConversationData } from './CheckInConversation';

type FlowStep =
  | 'options'       // For reactive: 3-option selector
  | 'success'       // Success screen with whisper + difficulty
  | 'conversation'  // Brief chat after success/no-trigger (V0.6)
  | 'miss_reason'   // Capture why they missed
  | 'recovery'      // Offer recovery action
  | 'done';         // Complete, redirect

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
    if (entryMode === 'miss') return 'miss_reason';
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

  // Pattern analysis for conversation
  const [patterns, setPatterns] = useState<CheckInPatterns | null>(null);

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
    const today = new Date().toISOString().split('T')[0];
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
      c => getCheckInState(c) === 'completed'
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
    setCheckInData(prev => ({ ...prev, triggerOccurred: true, actionTaken: false }));
    setStep('miss_reason');
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

  // Handle success screen done - go to conversation
  const handleSuccessDone = () => {
    // If we have a logged check-in, go to conversation
    if (loggedCheckIn) {
      setStep('conversation');
    } else {
      handleDone();
    }
  };

  // Handle conversation completion
  const handleConversationComplete = (conversation: ConversationData) => {
    // Store conversation with today's check-in
    updateTodayConversation(conversation);
    handleDone();
  };

  // Handle conversation skip
  const handleConversationSkip = () => {
    updateTodayConversation({ skipped: true, messages: [], duration: 0 });
    handleDone();
  };

  // Note: All habits now go through options screen, so no auto-logging needed
  // The user explicitly chooses Done/Missed, which triggers the appropriate handlers

  // Render current step
  switch (step) {
    case 'options':
      // Show different options based on habit type
      if (isReactive) {
        return (
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
        return (
          <CheckInOptionsTimeEvent
            habitAction={system.action}
            onCompleted={handleCompleted}
            onMissed={handleMissed}
            onSkip={handleSkipOptions}
          />
        );
      }

    case 'success':
      return (
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

    case 'conversation':
      // Show conversation after success/no-trigger
      if (loggedCheckIn) {
        return (
          <CheckInConversation
            checkIn={loggedCheckIn}
            patterns={patterns}
            system={system}
            onComplete={handleConversationComplete}
            onSkip={handleConversationSkip}
          />
        );
      }
      // Fallback if no check-in data
      handleDone();
      return null;

    case 'miss_reason':
      return (
        <CheckInMiss
          isReactiveHabit={isReactive}
          onSelectReason={handleMissReason}
          onSkip={handleSkipMissReason}
        />
      );

    case 'recovery':
      return (
        <RecoveryOffer
          recoveryAction={system.recovery}
          onAccept={handleAcceptRecovery}
          onDecline={handleDeclineRecovery}
        />
      );

    case 'done':
    default:
      return null;
  }
}
