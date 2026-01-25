'use client';

export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4 animate-message-enter">
      <div className="bg-[var(--ai-message-bg)] border border-[var(--bg-tertiary)] rounded-[16px_16px_16px_4px] px-5 py-4">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-typing-pulse" />
          <div className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-typing-pulse [animation-delay:0.2s]" />
          <div className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-typing-pulse [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
}
