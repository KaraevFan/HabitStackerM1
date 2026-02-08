'use client';

import { HabitSystem } from '@/types/habit';

interface ToolkitSectionProps {
  system: HabitSystem;
}

/**
 * ToolkitSection - Displays tinyVersion, environmentPrime, frictionReduced
 * Only renders when at least one field is populated
 */
export default function ToolkitSection({ system }: ToolkitSectionProps) {
  const hasToolkit =
    system.tinyVersion || system.environmentPrime || system.frictionReduced;

  if (!hasToolkit) return null;

  const items = [
    {
      icon: '⚡',
      label: 'Tiny version',
      value: system.tinyVersion,
      description: 'For days when everything is against you',
    },
    {
      icon: '🌙',
      label: 'Environment prime',
      value: system.environmentPrime,
      description: 'Set up the night before',
    },
    {
      icon: '🔓',
      label: 'Friction reduced',
      value: system.frictionReduced,
      description: 'Barriers you removed',
    },
  ].filter((item) => item.value);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
        Your Toolkit
      </p>

      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3 rounded-lg bg-[var(--bg-secondary)] p-3"
        >
          <span className="text-lg flex-shrink-0">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text-tertiary)] mb-0.5">
              {item.label}
            </p>
            <p className="text-sm text-[var(--text-primary)]">
              &ldquo;{item.value}&rdquo;
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
