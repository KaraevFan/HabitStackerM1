'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { HabitData } from '@/types/habit';
import { analyzePatterns } from '@/lib/patterns/patternFinder';
import {
  WeeklyReflectionContext,
  WeeklyReflectionResponse,
} from '@/lib/ai/prompts/weeklyReflectionAgent';

interface Message {
  role: 'ai' | 'user';
  content: string;
}

export interface ReflectionResult {
  messages: Message[];
  duration: number;
  sustainability: 'yes' | 'mostly' | 'no' | null;
  friction: string | null;
  recommendation: {
    text: string;
    appliesTo: 'anchor' | 'action' | 'tiny_version' | 'recovery' | 'timing' | 'none';
    newValue?: string;
    accepted: boolean;
  } | null;
}

interface WeeklyReflectionConversationProps {
  habitData: HabitData;
  reflectionType: 'weekly' | 'recovery' | 'on_demand';
  weekNumber: number;
  onComplete: (result: ReflectionResult) => void;
  onSkip: () => void;
  onDemandIntent?: string;
}

/**
 * AI-powered weekly/recovery reflection conversation
 * Modeled on CheckInConversation architecture
 */
export default function WeeklyReflectionConversation({
  habitData,
  reflectionType,
  weekNumber,
  onComplete,
  onSkip,
  onDemandIntent,
}: WeeklyReflectionConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [startTime] = useState(Date.now());
  const [readyToClose, setReadyToClose] = useState(false);
  const [pendingRecommendation, setPendingRecommendation] = useState<
    WeeklyReflectionResponse['recommendation'] | null
  >(null);

  // Accumulated data
  const sustainabilityRef = useRef<'yes' | 'mostly' | 'no' | null>(null);
  const frictionRef = useRef<string | null>(null);
  const recommendationRef = useRef<ReflectionResult['recommendation'] | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const headerText = {
    weekly: `Week ${weekNumber} Reflection`,
    recovery: 'Recovery Check-in',
    on_demand: 'Talk to Coach',
  }[reflectionType];

  /**
   * Build context for API call
   */
  const buildContext = useCallback((): WeeklyReflectionContext => {
    const checkIns = habitData.checkIns || [];
    const patterns = checkIns.length > 0
      ? analyzePatterns(checkIns, habitData.system?.habitType || 'time_anchored')
      : null;

    // Extract user goal from intake state
    const intakeState = habitData.intakeState as {
      userGoal?: string;
      realLeverage?: string;
    } | undefined;

    return {
      system: habitData.system!,
      checkIns,
      patterns,
      previousReflections: habitData.reflections || [],
      weekNumber,
      daysSinceCreation: Math.floor(
        (Date.now() - new Date(habitData.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
      userGoal: intakeState?.userGoal || null,
      realLeverage: intakeState?.realLeverage || null,
      reflectionType,
      exchangeCount,
      previousMessages: messages,
      onDemandIntent,
    };
  }, [habitData, weekNumber, reflectionType, exchangeCount, messages, onDemandIntent]);

  /**
   * Call the weekly reflection API
   */
  const callAPI = useCallback(async (
    context: WeeklyReflectionContext,
    userMessage?: string
  ): Promise<WeeklyReflectionResponse | null> => {
    try {
      const response = await fetch('/api/weekly-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, userMessage }),
      });

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }, []);

  /**
   * Extract and accumulate data from AI responses
   */
  const extractData = useCallback((response: WeeklyReflectionResponse) => {
    if (response.sustainability) {
      sustainabilityRef.current = response.sustainability;
    }
    if (response.friction) {
      frictionRef.current = response.friction;
    }
    if (response.recommendation) {
      setPendingRecommendation(response.recommendation);
    }
  }, []);

  /**
   * Generate opening message
   */
  const generateOpening = useCallback(async () => {
    setIsTyping(true);

    const context = buildContext();
    const response = await callAPI(context);

    if (response) {
      setMessages([{ role: 'ai', content: response.message }]);
      setSuggestedReplies(response.suggestedReplies || []);
      extractData(response);
    } else {
      // Fallback opener
      const fallbackMsg = reflectionType === 'recovery'
        ? "I noticed a few tough days. That's information, not failure. What's been going on?"
        : `Week ${weekNumber} is in the books. How did your system feel this week?`;
      setMessages([{ role: 'ai', content: fallbackMsg }]);
      setSuggestedReplies([
        reflectionType === 'recovery' ? "Life got in the way" : "Felt sustainable",
        reflectionType === 'recovery' ? "The habit doesn't fit" : "Some days were hard",
        reflectionType === 'recovery' ? "Not sure what happened" : "Needs adjustment",
      ]);
    }

    setIsTyping(false);
  }, [buildContext, callAPI, extractData, reflectionType, weekNumber]);

  // Generate opening on mount
  useEffect(() => {
    const timer = setTimeout(generateOpening, 400);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /**
   * Handle user message
   */
  const handleUserMessage = useCallback(async (content: string) => {
    if (!content.trim() || isTyping) return;

    const trimmed = content.trim();
    const userMsg: Message = { role: 'user', content: trimmed };

    setMessages(prev => [...prev, userMsg]);
    setSuggestedReplies([]);
    setInputValue('');
    setIsTyping(true);

    const context = {
      ...buildContext(),
      exchangeCount,
      previousMessages: [...messages, userMsg],
    };

    const response = await callAPI(context, trimmed);

    let aiMsg: Message;

    if (response) {
      aiMsg = { role: 'ai', content: response.message };
      extractData(response);

      if (response.shouldClose) {
        setMessages(prev => [...prev, aiMsg]);
        setReadyToClose(true);
        setIsTyping(false);
        setExchangeCount(prev => prev + 1);
        return;
      }

      setSuggestedReplies(response.suggestedReplies || []);
    } else {
      aiMsg = { role: 'ai', content: "I hear you. Let's focus on what will help most right now." };
      setSuggestedReplies(["Continue as-is", "Make it easier", "I'm done"]);
    }

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
    setExchangeCount(prev => prev + 1);
  }, [isTyping, buildContext, exchangeCount, messages, callAPI, extractData]);

  /**
   * Handle accepting a recommendation
   */
  const handleAcceptRecommendation = () => {
    if (pendingRecommendation) {
      recommendationRef.current = {
        text: pendingRecommendation.text,
        appliesTo: pendingRecommendation.appliesTo,
        newValue: pendingRecommendation.newValue,
        accepted: true,
      };
    }
    setPendingRecommendation(null);
    handleComplete();
  };

  /**
   * Handle declining a recommendation
   */
  const handleDeclineRecommendation = () => {
    if (pendingRecommendation) {
      recommendationRef.current = {
        text: pendingRecommendation.text,
        appliesTo: pendingRecommendation.appliesTo,
        newValue: pendingRecommendation.newValue,
        accepted: false,
      };
    }
    setPendingRecommendation(null);
    handleComplete();
  };

  const handleComplete = () => {
    onComplete({
      messages,
      duration: Math.round((Date.now() - startTime) / 1000),
      sustainability: sustainabilityRef.current,
      friction: frictionRef.current,
      recommendation: recommendationRef.current,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() && !isTyping) {
      handleUserMessage(inputValue);
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-8 pb-4 flex items-center justify-between">
        <p className="text-[var(--text-tertiary)] text-sm">{headerText}</p>
        <button
          onClick={onSkip}
          className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          Skip
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${
                msg.role === 'ai' ? 'flex justify-start' : 'flex justify-end'
              }`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 ${
                  msg.role === 'ai'
                    ? 'bg-[var(--bg-secondary)] rounded-[16px_16px_16px_4px] text-[var(--text-primary)]'
                    : 'bg-[var(--accent-primary)] rounded-[16px_16px_4px_16px] text-white'
                }`}
              >
                <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[var(--bg-secondary)] rounded-[16px_16px_16px_4px] px-4 py-3">
                <div className="flex space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Recommendation accept/decline */}
      {pendingRecommendation && !isTyping && (
        <div className="flex-shrink-0 px-6 pb-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--accent-primary)] mb-3">
            <p className="text-sm text-[var(--text-primary)] mb-3">
              {pendingRecommendation.text}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleAcceptRecommendation}
                className="flex-1 py-2.5 rounded-full bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Accept and update
              </button>
              <button
                onClick={handleDeclineRecommendation}
                className="flex-1 py-2.5 rounded-full border border-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggested replies */}
      {suggestedReplies.length > 0 && !isTyping && !readyToClose && !pendingRecommendation && (
        <div className="flex-shrink-0 px-6 pb-4">
          <div className="flex flex-wrap gap-2">
            {suggestedReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => handleUserMessage(reply)}
                className="px-4 py-2 rounded-full border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm hover:bg-[var(--bg-secondary)] transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom area */}
      <div className="flex-shrink-0 px-6 pb-6 pt-2 border-t border-[var(--bg-tertiary)]">
        {readyToClose ? (
          <button
            onClick={handleComplete}
            className="w-full py-3 rounded-full bg-[var(--accent-primary)] text-white font-medium text-base hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        ) : !pendingRecommendation ? (
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Or type your own..."
              disabled={isTyping}
              className="flex-1 px-4 py-3 rounded-full border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] disabled:opacity-50"
            />
            {inputValue.trim() && !isTyping && (
              <button
                onClick={() => handleUserMessage(inputValue)}
                className="p-3 rounded-full bg-[var(--accent-primary)] text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
