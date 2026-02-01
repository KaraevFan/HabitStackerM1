'use client';

import { useState } from 'react';
import { HabitRecommendation } from '@/lib/ai/prompts/intakeAgent';
import { SetupItem } from '@/types/habit';
import IdentityReveal from './IdentityReveal';
import RitualReveal from './RitualReveal';
import OnboardingSetup from './OnboardingSetup';
import ReadyToStart from './ReadyToStart';

type OnboardingStep = 'identity' | 'ritual' | 'setup' | 'ready';

interface OnboardingFlowProps {
  recommendation: HabitRecommendation;
  onComplete: (startNow: boolean, checkedSetupItems?: Set<string>) => void;
  onBackToChat: () => void;
}

/**
 * Convert AI setup items to SetupItem format
 */
function convertToSetupItems(recommendation: HabitRecommendation): SetupItem[] {
  if (!recommendation.setupChecklist) return [];
  return recommendation.setupChecklist.map((item, index) => ({
    id: `setup-${index}`,
    category: item.category,
    text: item.text,
    completed: false,
    notApplicable: false,
  }));
}

/**
 * Multi-screen onboarding flow controller
 * Manages progression: Identity → Ritual → Setup → Ready
 */
export default function OnboardingFlow({
  recommendation,
  onComplete,
  onBackToChat,
}: OnboardingFlowProps) {
  const hasIdentity = !!recommendation.identity;
  const setupItems = convertToSetupItems(recommendation);
  const hasSetup = setupItems.length > 0;

  // Determine starting step based on available data
  const getInitialStep = (): OnboardingStep => {
    if (hasIdentity) return 'identity';
    return 'ritual';
  };

  const [step, setStep] = useState<OnboardingStep>(getInitialStep());
  const [checkedSetupItems, setCheckedSetupItems] = useState<Set<string>>(new Set());

  // Build the steps array based on what data is available
  const buildSteps = (): OnboardingStep[] => {
    const steps: OnboardingStep[] = [];
    if (hasIdentity) steps.push('identity');
    steps.push('ritual');
    if (hasSetup) steps.push('setup');
    steps.push('ready');
    return steps;
  };

  const steps = buildSteps();
  const currentIndex = steps.indexOf(step);

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    } else {
      // At first step, go back to chat
      onBackToChat();
    }
  };

  const handleSetupComplete = (checked: Set<string>) => {
    setCheckedSetupItems(checked);
    goNext();
  };

  const handleSetupSkip = () => {
    goNext();
  };

  const handleStartNow = () => {
    onComplete(true, checkedSetupItems);
  };

  const handleStartLater = () => {
    onComplete(false, checkedSetupItems);
  };

  const handleAdjust = () => {
    // Go back to chat for adjustments
    onBackToChat();
  };

  switch (step) {
    case 'identity':
      return (
        <IdentityReveal
          identity={recommendation.identity || ''}
          identityBehaviors={recommendation.identityBehaviors || []}
          onNext={goNext}
          onBack={goBack}
        />
      );

    case 'ritual':
      return (
        <RitualReveal
          anchor={recommendation.anchor}
          action={recommendation.action}
          whyItFits={recommendation.whyItFits}
          recovery={recommendation.recovery}
          onNext={goNext}
          onBack={goBack}
          onAdjust={handleAdjust}
        />
      );

    case 'setup':
      return (
        <OnboardingSetup
          items={setupItems}
          onComplete={handleSetupComplete}
          onSkip={handleSetupSkip}
          onBack={goBack}
        />
      );

    case 'ready':
      return (
        <ReadyToStart
          onStartNow={handleStartNow}
          onStartLater={handleStartLater}
          onBack={goBack}
        />
      );

    default:
      return null;
  }
}
