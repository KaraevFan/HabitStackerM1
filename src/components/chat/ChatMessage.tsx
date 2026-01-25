'use client';

import { Message } from '@/types/conversation';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export default function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-message-enter`}
    >
      <div
        className={`max-w-[85%] px-5 py-4 ${
          isUser
            ? 'bg-[var(--user-message-bg)] text-[var(--user-message-text)] rounded-[16px_16px_4px_16px]'
            : 'bg-[var(--ai-message-bg)] text-[var(--text-primary)] border border-[var(--bg-tertiary)] rounded-[16px_16px_16px_4px]'
        }`}
      >
        <p className="text-base leading-relaxed whitespace-pre-wrap">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-0.5 bg-current animate-pulse" />
          )}
        </p>
      </div>
    </div>
  );
}
