'use client';

import { useEffect, useState, useRef } from 'react';
import { useTuneUpAgent } from '@/lib/ai/useTuneUpAgent';
import { TuneUpExtractedData } from '@/lib/ai/prompts/tuneUpAgent';
import Button from '@/components/ui/Button';

interface TuneUpScreenProps {
  habitInfo: {
    anchor: string;
    action: string;
    repsCompleted: number;
  };
  onComplete: (toolkit: TuneUpExtractedData) => void;
  onBack: () => void;
}

export default function TuneUpScreen({
  habitInfo,
  onComplete,
  onBack,
}: TuneUpScreenProps) {
  const {
    messages,
    isLoading,
    error,
    extractedData,
    suggestedResponses,
    isComplete,
    sendMessage,
    startConversation,
  } = useTuneUpAgent(habitInfo);

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Start conversation on mount
  useEffect(() => {
    startConversation();
  }, [startConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle completion
  useEffect(() => {
    if (isComplete && extractedData) {
      // Small delay for user to see summary
      const timer = setTimeout(() => {
        onComplete(extractedData);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, extractedData, onComplete]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleSuggestedResponse = (response: string) => {
    sendMessage(response);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--bg-tertiary)]">
        <div className="flex items-center justify-between">
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
          <h1 className="text-sm font-medium text-[var(--text-secondary)]">
            Tune Your System
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-secondary)] rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Completion message */}
        {isComplete && (
          <div className="text-center py-4">
            <p className="text-sm text-[var(--text-tertiary)]">
              Saving your system...
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Responses */}
      {suggestedResponses && suggestedResponses.length > 0 && !isLoading && !isComplete && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {suggestedResponses.map((response, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedResponse(response)}
                className="px-3 py-2 text-sm bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full border border-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {response}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      {!isComplete && (
        <div className="px-4 pb-4 pt-2 border-t border-[var(--bg-tertiary)]">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] rounded-full text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              variant="primary"
              className="px-4 rounded-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
