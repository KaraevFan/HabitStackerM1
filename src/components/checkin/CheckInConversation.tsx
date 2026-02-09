'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckIn, HabitSystem } from '@/types/habit';
import { CheckInPatterns } from '@/lib/patterns/patternFinder';
import {
  generateConversationOpener,
  generateConversationResponse,
} from '@/lib/checkin/conversationGenerator';
import { ReflectionContext, ReflectionAgentResponse, ReflectionSummary } from '@/lib/ai/prompts/reflectionAgent';
import { RecoveryCoachContext, RecoveryCoachResponse } from '@/lib/ai/prompts/recoveryCoachAgent';
import { loadHabitData } from '@/lib/store/habitStore';
import { daysSince } from '@/lib/dateUtils';
import { readSSEResponse } from '@/lib/ai/sseClient';

interface Message {
  role: 'ai' | 'user';
  content: string;
}

export interface ConversationData {
  messages: Message[];
  skipped: boolean;
  duration: number;
  frictionNotes?: string[]; // Track any friction mentioned
  reflection?: ReflectionSummary; // AI-extracted summary for timeline
  // Recovery-specific fields (R16)
  recoveryAccepted?: boolean;
  missReason?: string;
  systemChangeProposed?: { field: string; suggestion: string } | null;
}

interface CheckInConversationProps {
  checkIn: CheckIn;
  patterns: CheckInPatterns | null;
  system: HabitSystem;
  // Intake context for personalized reflection
  userGoal?: string | null;
  realLeverage?: string | null; // The blocker from intake
  onComplete: (conversation: ConversationData) => void;
  onSkip: () => void;
  // Mode: reflection (default) or recovery (R16)
  mode?: 'reflection' | 'recovery';
}

// Mode-dependent config
const MODE_CONFIG = {
  reflection: {
    apiEndpoint: '/api/reflection/stream',
    headerText: 'Quick check-in',
    closeButtonText: 'Done reflecting',
    minExchangesForClose: 1,
  },
  recovery: {
    apiEndpoint: '/api/recovery/stream',
    headerText: "Let's talk about today",
    closeButtonText: 'Got it, thanks',
    minExchangesForClose: 2,
  },
} as const;

/**
 * Brief chat interface after check-in
 * Supports both reflection (post-success) and recovery (post-miss) modes
 * Uses AI for personalized responses, falls back to rule-based if API fails
 */
export default function CheckInConversation({
  checkIn,
  patterns,
  system,
  userGoal,
  realLeverage,
  onComplete,
  onSkip,
  mode = 'reflection',
}: CheckInConversationProps) {
  const config = MODE_CONFIG[mode];

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [startTime] = useState(Date.now());
  const [frictionNotes, setFrictionNotes] = useState<string[]>([]);
  const [readyToClose, setReadyToClose] = useState(false);
  const latestSummaryRef = useRef<ReflectionSummary | undefined>(undefined);
  const closingDataRef = useRef<{
    allMessages: Message[];
    summary?: ReflectionSummary;
    recoveryAccepted?: boolean;
    missReason?: string;
    systemChangeProposed?: { field: string; suggestion: string } | null;
  } | null>(null);
  const [useAI, setUseAI] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recovery-specific refs to persist across exchanges
  const recoveryAcceptedRef = useRef(false);
  const missReasonRef = useRef<string | undefined>(undefined);
  const systemChangeProposedRef = useRef<{ field: string; suggestion: string } | null>(null);

  /**
   * Build context for the API call (same shape for both modes)
   */
  const buildContext = useCallback((): ReflectionContext | RecoveryCoachContext => {
    const habitData = loadHabitData();
    const dayMemories = habitData.dayMemories;

    const base = {
      checkIn,
      patterns,
      system,
      userGoal: userGoal || null,
      realLeverage: realLeverage || null,
      exchangeCount,
      previousMessages: messages,
      dayMemories,
    };

    // For recovery mode, compute daysSinceLastCheckIn (3B)
    if (mode === 'recovery') {
      let daysSinceLastCheckIn: number | undefined;
      const checkIns = habitData.checkIns || [];
      if (checkIns.length > 0) {
        const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
        const gap = daysSince(sorted[0].date);
        if (gap > 1) daysSinceLastCheckIn = gap;
      }
      return { ...base, daysSinceLastCheckIn } as RecoveryCoachContext;
    }

    return base as ReflectionContext;
  }, [checkIn, patterns, system, userGoal, realLeverage, exchangeCount, messages, mode]);

  /**
   * Call the conversation API (reflection or recovery based on mode)
   */
  const callConversationAPI = useCallback(async (
    context: ReflectionContext | RecoveryCoachContext,
    userMessage?: string,
    onMessage?: (partialMessage: string) => void,
  ): Promise<ReflectionAgentResponse | RecoveryCoachResponse | null> => {
    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, userMessage }),
      });

      if (!response.ok) {
        console.error(`[CheckInConversation:${mode}] API error:`, response.status);
        return null;
      }

      return await readSSEResponse<ReflectionAgentResponse | RecoveryCoachResponse>(response, onMessage);
    } catch (error) {
      console.error(`[CheckInConversation:${mode}] API call failed:`, error);
      return null;
    }
  }, [config.apiEndpoint, mode]);

  /**
   * Extract recovery-specific fields from a response
   */
  const extractRecoveryFields = useCallback((response: RecoveryCoachResponse) => {
    if (response.recoveryAccepted) {
      recoveryAcceptedRef.current = true;
    }
    if (response.missReason) {
      missReasonRef.current = response.missReason;
    }
    if (response.systemChangeProposed) {
      systemChangeProposedRef.current = response.systemChangeProposed;
    }
  }, []);

  /**
   * Generate opening message - try AI first, fall back to rules
   */
  const generateOpening = useCallback(async () => {
    setIsTyping(true);

    if (useAI) {
      const context = buildContext();
      const aiResponse = await callConversationAPI(context, undefined, (partialMsg) => {
        setIsTyping(false);
        setMessages([{ role: 'ai', content: partialMsg }]);
      });

      if (aiResponse) {
        setMessages([{ role: 'ai', content: aiResponse.message }]);
        setSuggestedReplies(aiResponse.suggestedReplies || []);
        setIsTyping(false);

        if (aiResponse.frictionNote) {
          setFrictionNotes(prev => [...prev, aiResponse.frictionNote!]);
        }

        // Extract recovery fields if in recovery mode
        if (mode === 'recovery') {
          extractRecoveryFields(aiResponse as RecoveryCoachResponse);
        }
        return;
      }

      // AI failed, fall back to rule-based (or static recovery)
      console.log(`[CheckInConversation:${mode}] AI failed, using fallback opener`);
      setUseAI(false);

      // For recovery mode, show static recovery action if available
      if (mode === 'recovery') {
        const habitData = loadHabitData();
        if (habitData?.system?.recovery) {
          setMessages([{
            role: 'ai',
            content: `Your coach is unavailable right now. Here's your recovery action:\n\n${habitData.system.recovery}\n\nDid you do it?`,
          }]);
          setSuggestedReplies(['Done', 'Not yet']);
          setIsTyping(false);
          return;
        }
      }
    }

    // Rule-based fallback
    const opener = generateConversationOpener(checkIn, patterns, system);
    setMessages([{ role: 'ai', content: opener.message }]);
    setSuggestedReplies(opener.suggestedReplies);
    setIsTyping(false);
  }, [useAI, buildContext, callConversationAPI, checkIn, patterns, system, mode, extractRecoveryFields]);

  // Generate opening message on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      generateOpening();
    }, 400);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Typing safety timeout: if typing persists for 20s, show fallback
  useEffect(() => {
    if (!isTyping) return;
    const timer = setTimeout(() => {
      setIsTyping(false);
      if (messages.length === 0) {
        // AI failed to produce opening message — show static fallback
        const habitData = loadHabitData();
        if (mode === 'recovery' && habitData?.system?.recovery) {
          setMessages([{
            role: 'ai',
            content: `Your coach is unavailable right now. Here's your recovery action:\n\n${habitData.system.recovery}\n\nDid you do it?`,
          }]);
          setSuggestedReplies(['Done', 'Not yet']);
        } else {
          setMessages([{
            role: 'ai',
            content: mode === 'recovery'
              ? "Couldn't connect right now. Your check-in was saved."
              : "Let's keep going \u2014 your check-in is saved.",
          }]);
        }
      }
      setReadyToClose(true);
    }, 20_000);
    return () => clearTimeout(timer);
  }, [isTyping, messages.length, mode]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /**
   * Handle user message - try AI first, fall back to rules
   */
  const handleUserMessage = useCallback(async (content: string) => {
    if (!content.trim() || isTyping) return;

    const trimmedContent = content.trim();

    // Add user message immediately
    const userMsg: Message = { role: 'user', content: trimmedContent };
    setMessages(prev => [...prev, userMsg]);
    setSuggestedReplies([]);
    setInputValue('');
    setIsTyping(true);

    let aiMsg: Message;
    let shouldClose = false;
    let newSuggestedReplies: string[] = [];
    let reflectionSummary: ReflectionSummary | undefined;

    if (useAI) {
      // Build context with updated messages (includes dayMemories + daysSinceLastCheckIn)
      const context = {
        ...buildContext(),
        previousMessages: [...messages, userMsg],
      };

      const aiResponse = await callConversationAPI(context, trimmedContent, (partialMsg) => {
        setIsTyping(false);
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].role === 'ai') {
            updated[updated.length - 1] = { role: 'ai', content: partialMsg };
          } else {
            updated.push({ role: 'ai', content: partialMsg });
          }
          return updated;
        });
      });

      if (aiResponse) {
        aiMsg = { role: 'ai', content: aiResponse.message };
        shouldClose = aiResponse.shouldClose;
        newSuggestedReplies = aiResponse.suggestedReplies || [];

        if (aiResponse.frictionNote) {
          setFrictionNotes(prev => [...prev, aiResponse.frictionNote!]);
        }

        if (mode === 'reflection') {
          // Capture reflection summary
          const reflectionResponse = aiResponse as ReflectionAgentResponse;
          if (reflectionResponse.reflectionSummary) {
            reflectionSummary = reflectionResponse.reflectionSummary;
            latestSummaryRef.current = reflectionResponse.reflectionSummary;
          }
        } else {
          // Extract recovery fields
          extractRecoveryFields(aiResponse as RecoveryCoachResponse);
        }
      } else {
        // AI failed, fall back to rule-based
        console.log(`[CheckInConversation:${mode}] AI failed for response, using rule-based`);
        const response = generateConversationResponse(
          trimmedContent,
          checkIn,
          patterns,
          system,
          exchangeCount
        );
        aiMsg = { role: 'ai', content: response.message };
        shouldClose = response.shouldClose;
        newSuggestedReplies = response.suggestedReplies || [];
      }
    } else {
      // Rule-based
      const response = generateConversationResponse(
        trimmedContent,
        checkIn,
        patterns,
        system,
        exchangeCount
      );
      aiMsg = { role: 'ai', content: response.message };
      shouldClose = response.shouldClose;
      newSuggestedReplies = response.suggestedReplies || [];
    }

    // Update or add the AI message (streaming may have already added it)
    setMessages(prev => {
      const updated = [...prev];
      if (updated.length > 0 && updated[updated.length - 1].role === 'ai') {
        updated[updated.length - 1] = aiMsg;
      } else {
        updated.push(aiMsg);
      }
      return updated;
    });
    setIsTyping(false);
    setExchangeCount(prev => prev + 1);

    // When ready to close, show close button
    // Reflection mode: close when AI says so OR after minimum exchanges (brief by design)
    // Recovery mode: only close when AI says shouldClose (conversation needs room to breathe)
    const shouldShowClose = mode === 'recovery'
      ? shouldClose
      : (shouldClose || exchangeCount >= config.minExchangesForClose);
    if (shouldShowClose) {
      const finalSummary = reflectionSummary || latestSummaryRef.current;
      closingDataRef.current = {
        allMessages: [...messages, userMsg, aiMsg],
        summary: finalSummary,
        recoveryAccepted: recoveryAcceptedRef.current,
        missReason: missReasonRef.current,
        systemChangeProposed: systemChangeProposedRef.current,
      };
      setReadyToClose(true);
    } else {
      setSuggestedReplies(newSuggestedReplies);
    }
  }, [
    isTyping, useAI, buildContext,
    exchangeCount, messages, callConversationAPI, mode, config.minExchangesForClose,
    extractRecoveryFields,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() && !isTyping) {
      handleUserMessage(inputValue);
    }
  };

  const handleSkip = () => {
    onComplete({
      messages,
      skipped: true,
      duration: Math.round((Date.now() - startTime) / 1000),
    });
  };

  const handleDoneConversation = () => {
    const data = closingDataRef.current;
    onComplete({
      messages: data?.allMessages || messages,
      skipped: false,
      duration: Math.round((Date.now() - startTime) / 1000),
      frictionNotes: frictionNotes.length > 0 ? frictionNotes : undefined,
      reflection: data?.summary,
      // Recovery-specific fields
      recoveryAccepted: data?.recoveryAccepted,
      missReason: data?.missReason,
      systemChangeProposed: data?.systemChangeProposed,
    });
  };

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-8 pb-4">
        <p className="text-[var(--text-tertiary)] text-sm">{config.headerText}</p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`message-enter ${
                msg.role === 'ai' ? 'flex justify-start' : 'flex justify-end'
              }`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 ${
                  msg.role === 'ai'
                    ? 'bg-[var(--ai-message-bg)] rounded-[16px_16px_16px_4px] text-[var(--text-primary)]'
                    : 'bg-[var(--user-message-bg)] rounded-[16px_16px_4px_16px] text-white'
                }`}
              >
                <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start message-enter">
              <div className="bg-[var(--ai-message-bg)] rounded-[16px_16px_16px_4px] px-4 py-3">
                <div className="flex space-x-1">
                  <span className="typing-dot w-2 h-2 rounded-full bg-[var(--text-tertiary)]" style={{ animationDelay: '0ms' }} />
                  <span className="typing-dot w-2 h-2 rounded-full bg-[var(--text-tertiary)]" style={{ animationDelay: '150ms' }} />
                  <span className="typing-dot w-2 h-2 rounded-full bg-[var(--text-tertiary)]" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested replies - hidden when ready to close */}
      {suggestedReplies.length > 0 && !isTyping && !readyToClose && (
        <div className="flex-shrink-0 px-6 pb-4">
          <div className="flex flex-wrap gap-2">
            {suggestedReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => handleUserMessage(reply)}
                className="px-4 py-2 rounded-full border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-tertiary)] transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom area: either close button or input */}
      <div className="flex-shrink-0 px-6 pb-6 pt-2 border-t border-[var(--border-primary)]">
        {readyToClose ? (
          <>
            <button
              onClick={handleDoneConversation}
              className="w-full py-3 rounded-full bg-[var(--accent-primary)] text-white font-medium text-base hover:opacity-90 active:opacity-80 transition-opacity"
            >
              {config.closeButtonText}
            </button>
            <button
              onClick={handleSkip}
              className="w-full mt-3 text-center text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              Skip for now
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Or type your own..."
                disabled={isTyping}
                className="flex-1 px-4 py-3 rounded-full border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] disabled:opacity-50"
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

            <button
              onClick={handleSkip}
              className="w-full mt-4 text-center text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              Skip for now
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .message-enter {
          animation: messageEnter 0.3s ease-out;
        }

        @keyframes messageEnter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .typing-dot {
          animation: typingPulse 1s ease-in-out infinite;
        }

        @keyframes typingPulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
