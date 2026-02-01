'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { SetupItem } from '@/types/habit';

interface OnboardingSetupProps {
  items: SetupItem[];
  onComplete: (checkedItems: Set<string>) => void;
  onSkip: () => void;
  onBack: () => void;
}

/**
 * Screen 3: Setup checklist
 * One-time environment prep before first rep
 */
export default function OnboardingSetup({
  items,
  onComplete,
  onSkip,
  onBack,
}: OnboardingSetupProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const next = new Set(checkedItems);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCheckedItems(next);
  };

  const completedCount = checkedItems.size;
  const totalCount = items.length;

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, SetupItem[]>);

  const categoryLabels: Record<string, string> = {
    environment: 'Environment',
    mental: 'Mental',
    tech: 'Tech',
    other: 'Other',
  };

  const categoryOrder = ['environment', 'mental', 'tech', 'other'];

  return (
    <div className="reveal-screen">
      <button className="back-button" onClick={onBack}>
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

      <div className="reveal-content">
        <h2 className="setup-title">Set yourself up for success</h2>
        <p className="setup-subtitle">Before your first rep, a few quick things:</p>

        <div className="setup-items">
          {categoryOrder.map((category) => {
            const categoryItems = groupedItems[category];
            if (!categoryItems || categoryItems.length === 0) return null;

            return (
              <div key={category} className="category-group">
                <p className="category-label">{categoryLabels[category]}</p>
                {categoryItems.map((item) => (
                  <label key={item.id} className="setup-item">
                    <input
                      type="checkbox"
                      checked={checkedItems.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="setup-checkbox"
                    />
                    <span
                      className={`setup-item-text ${
                        checkedItems.has(item.id) ? 'checked' : ''
                      }`}
                    >
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>

        <p className="setup-progress">
          {completedCount} of {totalCount} complete
        </p>
      </div>

      <div className="reveal-footer">
        <Button
          onClick={() => onComplete(checkedItems)}
          variant="primary"
          size="lg"
          className="w-full"
        >
          I&apos;ve done these
        </Button>
        <button className="skip-button" onClick={onSkip}>
          Remind me later
        </button>
      </div>

      <style jsx>{`
        .reveal-screen {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 16px;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: var(--accent-primary);
          font-size: 14px;
          cursor: pointer;
          padding: 8px 0;
          margin-bottom: 24px;
        }

        .back-button:hover {
          opacity: 0.8;
        }

        .reveal-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0;
        }

        .setup-title {
          font-family: var(--font-fraunces), 'Fraunces', Georgia, serif;
          font-size: 24px;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 8px 0;
        }

        .setup-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 24px 0;
        }

        .setup-items {
          flex: 1;
          overflow-y: auto;
        }

        .category-group {
          margin-bottom: 20px;
        }

        .category-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 8px 0;
        }

        .setup-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--bg-tertiary);
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .setup-item:hover {
          border-color: var(--accent-primary);
        }

        .setup-checkbox {
          width: 20px;
          height: 20px;
          margin: 0;
          accent-color: var(--accent-primary);
          cursor: pointer;
          flex-shrink: 0;
        }

        .setup-item-text {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .setup-item-text.checked {
          color: var(--text-tertiary);
          text-decoration: line-through;
        }

        .setup-progress {
          font-size: 13px;
          color: var(--text-tertiary);
          text-align: center;
          margin: 16px 0 0 0;
        }

        .reveal-footer {
          padding: 16px 0;
          padding-bottom: calc(16px + env(safe-area-inset-bottom));
        }

        .skip-button {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          background: none;
          border: none;
          font-size: 14px;
          color: var(--text-tertiary);
          cursor: pointer;
        }

        .skip-button:hover {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
