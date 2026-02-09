'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface MenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * MenuSheet - Main menu bottom sheet triggered by "..." button
 */
export default function MenuSheet({ isOpen, onClose }: MenuSheetProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const menuItems = [
    {
      label: 'Talk to coach',
      icon: '💬',
      description: 'Discuss your habit with the AI coach',
      onClick: () => {
        onClose();
        router.push('/reflect?mode=on_demand');
      },
    },
    {
      label: 'Redesign habit',
      icon: '🔄',
      description: 'Start fresh with a new habit design',
      onClick: () => {
        onClose();
        router.push('/setup');
      },
    },
    {
      label: 'Delete and start over',
      icon: '🗑️',
      description: 'Clear all data and start from scratch',
      onClick: () => {
        onClose();
        router.push('/reset');
      },
    },
    {
      label: 'Sign out',
      icon: '👋',
      description: 'Sign out of your account',
      onClick: () => {
        onClose();
        signOut();
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[var(--z-overlay)] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[var(--overlay)]" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="relative w-full max-w-[480px] rounded-t-2xl bg-[var(--bg-primary)] p-6 animate-slide-up safe-area-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="w-full flex items-center gap-4 p-4 rounded-xl text-left hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-[var(--text-primary)] font-medium text-sm">
                  {item.label}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-center text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
