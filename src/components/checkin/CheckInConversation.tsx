'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckIn, HabitSystem } from '@/types/habit';
import { CheckInPatterns } from '@/lib/patterns/patternFinder';
import {
  generateConversationOpener,
  generateConversationResponse,
} from '@/lib/checkin/conversationGenerator';

interface Message {
  role: 'ai' | 'user';
  content: string;
}

export interface ConversationData {
  messages: Message[];
  skipped: boolean;
  duration: number;
}

interface CheckInConversationProps {
  checkIn: CheckIn;
  patterns: CheckInPatterns | null;
  system: HabitSystem;
  onComplete: (conversation: ConversationData) => void;
  onSkip: () => void;
}

/**
 * Brief chat interface after check-in
 * Maintains the "coach checking back in" feeling from intake
 */
export default function CheckInConversation({
  checkIn,
  patterns,
  system,
  onComplete,
  onSkip,
}: CheckInConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [startTime] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate opening message on mount
  useEffect(() => {
    const opener = generateConversationOpener(checkIn, patterns, system);
    // Simulate typing delay for natural feel
    setIsTyping(true);
    const timer = setTimeout(() => {
      setMessages([{ role: 'ai', content: opener.message }]);
      setSuggestedReplies(opener.suggestedReplies);
      setIsTyping(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [checkIn, patterns, system]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleUserMessage = (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMsg: Message = { role: 'user', content: content.trim() };
    setMessages(prev => [...prev, userMsg]);
    setSuggestedReplies([]);
    setInputValue('');
    setIsTyping(true);

    // Generate AI response after a delay
    setTimeout(() => {
      const response = generateConversationResponse(
        content,
        checkIn,
        patterns,
        system,
        exchangeCount
      );

      const aiMsg: Message = { role: 'ai', content: response.message };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      setExchangeCount(prev => prev + 1);

      // Close after 1-2 exchanges or if AI indicates completion
      if (response.shouldClose || exchangeCount >= 1) {
        setTimeout(() => {
          onComplete({
            messages: [...messages, userMsg, aiMsg],
            skipped: false,
            duration: Math.round((Date.now() - startTime) / 1000),
          });
        }, 2000);
      } else if (response.suggestedReplies) {
        setSuggestedReplies(response.suggestedReplies);
      }
    }, 800);
  };

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
                <p className="text-base leading-relaxed">{msg.content}</p>
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

      {/* Suggested replies */}
      {suggestedReplies.length > 0 && !isTyping && (
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

      {/* Input area */}
      <div className="flex-shrink-0 px-6 pb-6 pt-2 border-t border-[var(--border-primary)]">
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

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="w-full mt-4 text-center text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          Skip for now
        </button>
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
