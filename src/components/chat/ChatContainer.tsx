'use client';

import { useRef, useEffect, useState } from 'react';
import { IntakeState } from '@/types/conversation';
import { getLastAssistantMessage, shouldShowEscapeHatch } from '@/lib/store/conversationStore';
import ChatMessage from './ChatMessage';
import SuggestedPills from './SuggestedPills';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';

interface ChatContainerProps {
  state: IntakeState;
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  streamingMessage?: string | null;
  onEscapeHatch?: () => void;
}

export default function ChatContainer({
  state,
  onSendMessage,
  isLoading = false,
  streamingMessage = null,
  onEscapeHatch,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pillSelection, setPillSelection] = useState('');

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, isLoading, streamingMessage]);

  // Get last assistant message for pills
  const lastAssistantMessage = getLastAssistantMessage(state);
  const showPills =
    lastAssistantMessage?.suggestedResponses &&
    lastAssistantMessage.suggestedResponses.length > 0 &&
    !isLoading &&
    // Only show pills if the last message is from assistant (user hasn't responded yet)
    state.messages[state.messages.length - 1]?.role === 'assistant';

  // Show escape hatch?
  const showEscape = shouldShowEscapeHatch(state) && onEscapeHatch && !isLoading;

  const handlePillSelect = (suggestion: string) => {
    setPillSelection(suggestion);
    // Auto-submit after a brief moment so user sees the selection
    setTimeout(() => {
      onSendMessage(suggestion);
      setPillSelection('');
    }, 100);
  };

  const handleSend = (message: string) => {
    setPillSelection('');
    onSendMessage(message);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-[var(--bg-primary)]">
        {/* Show welcome message while loading initial greeting */}
        {state.messages.length === 0 && isLoading && streamingMessage === null && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[85%] rounded-[16px_16px_16px_4px] px-5 py-4 bg-[var(--ai-message-bg)] border border-[var(--bg-tertiary)] text-[var(--text-primary)]">
              <p className="text-base leading-relaxed text-[var(--text-tertiary)]">
                Getting ready...
              </p>
            </div>
          </div>
        )}

        {state.messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Streaming message - show as assistant message while typing */}
        {streamingMessage !== null && (
          <ChatMessage
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingMessage || '',
              timestamp: new Date().toISOString(),
            }}
            isStreaming
          />
        )}

        {/* Show typing indicator when loading but not streaming, and not the initial load */}
        {isLoading && streamingMessage === null && state.messages.length > 0 && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Pills and escape hatch */}
      <div className="px-4">
        {showPills && (
          <SuggestedPills
            suggestions={lastAssistantMessage.suggestedResponses!}
            onSelect={handlePillSelect}
            disabled={isLoading}
          />
        )}

        {showEscape && (
          <button
            onClick={onEscapeHatch}
            className="mb-3 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            I think you understand — let&apos;s see your recommendation
          </button>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading || state.isComplete}
        initialValue={pillSelection}
        placeholder={
          state.isComplete
            ? 'Conversation complete'
            : 'Type a message...'
        }
      />
    </div>
  );
}
