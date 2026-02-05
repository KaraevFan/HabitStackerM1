'use client';

import { useState } from 'react';
import { HabitRecommendation } from '@/lib/ai/prompts/intakeAgent';
import { getHabitEmoji, SetupItem } from '@/types/habit';
import Button from '@/components/ui/Button';
import FeltUnderstoodRating from './FeltUnderstoodRating';
import SetupChecklist from '@/components/system/SetupChecklist';

interface ConfirmationScreenProps {
  recommendation: HabitRecommendation;
  onStartFirstRep: (feltUnderstoodRating: number | null) => void;
  onStartLater: (feltUnderstoodRating: number | null) => void;
  onBack: () => void;
}

/**
 * Generate hero statement from anchor and action
 * Format: "When [anchor], I [action]."
 * Handles both action anchors ("I brush my teeth") and event anchors ("my alarm goes off")
 */
function generateHeroStatement(anchor: string, action: string): string {
  // Clean anchor: remove "after", time qualifiers (tonight, today, etc.)
  let cleanAnchor = anchor
    .replace(/^(after|when)\s+/i, '')
    .replace(/^(tonight|today|tomorrow|this evening|this morning)\s+/i, '')
    .replace(/^(after|when)\s+/i, '') // Remove again in case time qualifier was first
    .replace(/\byou\b/gi, 'I')
    .replace(/\byour\b/gi, 'my')
    .trim();

  // Detect if anchor is a noun phrase (alarm, notification, event) vs action phrase (I do something)
  // Noun phrase indicators: starts with time, contains "alarm", "notification", "reminder", or no verb
  const isNounPhrase = /^(\d|my\s|the\s)|alarm|notification|reminder|timer|bell/i.test(cleanAnchor) &&
    !/^(I|my)\s+(get|sit|wake|stand|finish|start|leave|arrive|come|go)/i.test(cleanAnchor);

  if (isNounPhrase) {
    // For noun phrases like "9pm alarm", prefix with "my" if not already present
    if (!/^(my|the)\s/i.test(cleanAnchor)) {
      cleanAnchor = `my ${cleanAnchor}`;
    }
    // Add "goes off" if it's an alarm/notification without a verb
    if (/alarm|notification|reminder|timer|bell/i.test(cleanAnchor) && !/\b(goes|rings|sounds|fires)\b/i.test(cleanAnchor)) {
      cleanAnchor = `${cleanAnchor} goes off`;
    }
  } else {
    // For action phrases, ensure it starts with "I"
    if (!/^I\s/i.test(cleanAnchor)) {
      cleanAnchor = `I ${cleanAnchor.charAt(0).toLowerCase()}${cleanAnchor.slice(1)}`;
    }
  }

  // Clean up action - ensure it starts naturally, convert "you" to "I"
  let cleanAction = action
    .replace(/\byou\b/gi, 'I')
    .replace(/\byour\b/gi, 'my')
    .trim();
  cleanAction = cleanAction.charAt(0).toLowerCase() + cleanAction.slice(1);

  return `When ${cleanAnchor}, I ${cleanAction}.`;
}

/**
 * Combine whyItFits into a single flowing paragraph
 * R8: Max 2-3 sentences
 */
function generateSupportingText(whyItFits: string[], recovery: string): {
  mainText: string;
  recoveryText: string;
} {
  // Take first 1-2 reasons and combine naturally
  const reasons = whyItFits.slice(0, 2);
  const mainText = reasons.length > 1
    ? `${reasons[0]}, and ${reasons[1].charAt(0).toLowerCase()}${reasons[1].slice(1)}`
    : reasons[0] || 'This habit is designed to fit your life.';

  // Clean up recovery text
  const recoveryText = `If you miss: ${recovery}`;

  return { mainText, recoveryText };
}

/**
 * Get timing-aware CTA text
 */
function getCTAText(): string {
  const hour = new Date().getHours();
  if (hour >= 17) {
    return 'Start first rep tonight';
  } else if (hour >= 12) {
    return 'Start first rep now';
  } else {
    return 'Start first rep today';
  }
}

/**
 * Convert AI setup items to SetupItem format for preview
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

export default function ConfirmationScreen({
  recommendation,
  onStartFirstRep,
  onStartLater,
  onBack,
}: ConfirmationScreenProps) {
  const [rating, setRating] = useState<number | null>(null);

  const emoji = getHabitEmoji(recommendation.anchor, recommendation.action);
  const heroStatement = generateHeroStatement(recommendation.anchor, recommendation.action);
  const { mainText, recoveryText } = generateSupportingText(
    recommendation.whyItFits,
    recommendation.recovery
  );
  const setupItems = convertToSetupItems(recommendation);
  const hasIdentity = !!recommendation.identity;
  const hasSetupChecklist = setupItems.length > 0;

  return (
    <div className="flex flex-col min-h-dvh bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="px-4 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Emoji */}
        <div className="text-5xl mb-6" role="img" aria-label="habit icon">
          {emoji}
        </div>

        {/* Hero Statement */}
        <blockquote className="text-2xl font-serif text-center text-[var(--text-primary)] max-w-[300px] leading-relaxed mb-8">
          &ldquo;{heroStatement}&rdquo;
        </blockquote>

        {/* Divider */}
        <div className="w-16 h-px bg-[var(--bg-tertiary)] mb-8" />

        {/* Supporting Text */}
        <div className="text-center max-w-[320px] space-y-3">
          <p className="text-base text-[var(--text-secondary)] leading-relaxed">
            {mainText}
          </p>
          <p className="text-sm text-[var(--text-tertiary)]">
            {recoveryText}
          </p>
        </div>

        {/* Identity Preview (V0.5) */}
        {hasIdentity && (
          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              You&apos;re becoming{' '}
              <span className="font-medium text-[var(--text-primary)]">
                {recommendation.identity?.toLowerCase()}
              </span>
              .
            </p>
          </div>
        )}
      </div>

      {/* Setup Checklist Preview (V0.5) - Collapsed by default */}
      {hasSetupChecklist && (
        <div className="px-6 pb-4">
          <details className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)]">
            <summary className="p-4 cursor-pointer flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">
                Setup checklist ({setupItems.length} items)
              </span>
              <span className="text-xs text-[var(--accent)]">Tap to preview</span>
            </summary>
            <div className="px-4 pb-4">
              <SetupChecklist items={setupItems} readOnly />
            </div>
          </details>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 pb-6 space-y-4">
        {/* Primary CTA */}
        <Button
          onClick={() => onStartFirstRep(rating)}
          variant="primary"
          className="w-full"
          size="lg"
        >
          {getCTAText()}
        </Button>

        {/* Secondary CTA */}
        <button
          onClick={() => onStartLater(rating)}
          className="w-full text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] py-2 transition-colors"
        >
          I&apos;ll start later
        </button>

        {/* Divider */}
        <div className="h-px bg-[var(--bg-tertiary)] my-2" />

        {/* Rating (below CTA per R8) */}
        <FeltUnderstoodRating onRate={setRating} />
      </div>
    </div>
  );
}
