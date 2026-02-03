'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckIn, HabitSystem } from '@/types/habit';
import { CheckInPatterns } from '@/lib/patterns/patternFinder';
import {
  generateConversationOpener,
  generateConversationResponse,
} from '@/lib/checkin/conversationGenerator';
import { ReflectionContext, ReflectionAgentResponse, ReflectionSummary } from '@/lib/ai/prompts/reflectionAgent';

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
}

/**
 * Brief chat interface after check-in
 * Uses AI for personalized, engaging responses (R13)
 * Falls back to rule-based generation if API fails
 */
export default function CheckInConversation({
  checkIn,
  patterns,
  system,
  userGoal,
  realLeverage,
  onComplete,
  onSkip,
}: CheckInConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [startTime] = useState(Date.now());
  const [frictionNotes, setFrictionNotes] = useState<string[]>([]);
  const [readyToClose, setReadyToClose] = useState(false);
  const latestSummaryRef = useRef<ReflectionSummary | undefined>(undefined);
  const closingDataRef = useRef<{ allMessages: Message[]; summary?: ReflectionSummary } | null>(null);
  const [useAI, setUseAI] = useState(true); // Toggle for AI vs rule-based
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Build context for the reflection API
   */
  const buildContext = useCallback((): ReflectionContext => {
    return {
      checkIn,
      patterns,
      system,
      userGoal: userGoal || null,
      realLeverage: realLeverage || null,
      exchangeCount,
      previousMessages: messages,
    };
  }, [checkIn, patterns, system, userGoal, realLeverage, exchangeCount, messages]);

  /**
   * Call the reflection API
   */
  const callReflectionAPI = useCallback(async (
    context: ReflectionContext,
    userMessage?: string
  ): Promise<ReflectionAgentResponse | null> => {
    try {
      const response = await fetch('/api/reflection/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, userMessage }),
      });

      if (!response.ok) {
        console.error('[CheckInConversation] API error:', response.status);
        return null;
      }

      const data = await response.json();
      return data as ReflectionAgentResponse;
    } catch (error) {
      console.error('[CheckInConversation] API call failed:', error);
      return null;
    }
  }, []);

  /**
   * Generate opening message - try AI first, fall back to rules
   */
  const generateOpening = useCallback(async () => {
    setIsTyping(true);

    if (useAI) {
      const context = buildContext();
      const aiResponse = await callReflectionAPI(context);

      if (aiResponse) {
        setMessages([{ role: 'ai', content: aiResponse.message }]);
        setSuggestedReplies(aiResponse.suggestedReplies || []);
        setIsTyping(false);

        if (aiResponse.frictionNote) {
          setFrictionNotes(prev => [...prev, aiResponse.frictionNote!]);
        }
        return;
      }

      // AI failed, fall back to rule-based
      console.log('[CheckInConversation] AI failed, using rule-based opener');
      setUseAI(false);
    }

    // Rule-based fallback
    const opener = generateConversationOpener(checkIn, patterns, system);
    setMessages([{ role: 'ai', content: opener.message }]);
    setSuggestedReplies(opener.suggestedReplies);
    setIsTyping(false);
  }, [useAI, buildContext, callReflectionAPI, checkIn, patterns, system]);

  // Generate opening message on mount
  useEffect(() => {
    // Small delay for natural feel
    const timer = setTimeout(() => {
      generateOpening();
    }, 400);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Build context with updated messages
      const context: ReflectionContext = {
        checkIn,
        patterns,
        system,
        userGoal: userGoal || null,
        realLeverage: realLeverage || null,
        exchangeCount,
        previousMessages: [...messages, userMsg],
      };

      const aiResponse = await callReflectionAPI(context, trimmedContent);

      if (aiResponse) {
        aiMsg = { role: 'ai', content: aiResponse.message };
        shouldClose = aiResponse.shouldClose;
        newSuggestedReplies = aiResponse.suggestedReplies || [];

        if (aiResponse.frictionNote) {
          setFrictionNotes(prev => [...prev, aiResponse.frictionNote!]);
        }

        // Capture reflection summary (persist across exchanges via ref)
        if (aiResponse.reflectionSummary) {
          reflectionSummary = aiResponse.reflectionSummary;
          latestSummaryRef.current = aiResponse.reflectionSummary;
        }
      } else {
        // AI failed, fall back to rule-based
        console.log('[CheckInConversation] AI failed for response, using rule-based');
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

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
    setExchangeCount(prev => prev + 1);

    // When ready to close, show "Done reflecting" button instead of auto-transitioning
    if (shouldClose || exchangeCount >= 1) {
      const finalSummary = reflectionSummary || latestSummaryRef.current;
      closingDataRef.current = {
        allMessages: [...messages, userMsg, aiMsg],
        summary: finalSummary,
      };
      setReadyToClose(true);
    } else {
      setSuggestedReplies(newSuggestedReplies);
    }
  }, [
    isTyping, useAI, checkIn, patterns, system, userGoal, realLeverage,
    exchangeCount, messages, callReflectionAPI, frictionNotes, startTime, onComplete
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

  const handleDoneReflecting = () => {
    const data = closingDataRef.current;
    onComplete({
      messages: data?.allMessages || messages,
      skipped: false,
      duration: Math.round((Date.now() - startTime) / 1000),
      frictionNotes: frictionNotes.length > 0 ? frictionNotes : undefined,
      reflection: data?.summary,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-8 pb-4">
        <p className="text-[var(--text-tertiary)] text-sm">Quick check-in</p>
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

      {/* Bottom area: either "Done reflecting" or input */}
      <div className="flex-shrink-0 px-6 pb-6 pt-2 border-t border-[var(--border-primary)]">
        {readyToClose ? (
          <>
            <button
              onClick={handleDoneReflecting}
              className="w-full py-3 rounded-full bg-[var(--accent-primary)] text-white font-medium text-base hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Done reflecting
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
