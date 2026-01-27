'use client';

import { SetupItem, getSetupProgress } from '@/types/habit';

interface SetupChecklistReadOnlyProps {
  items: SetupItem[];
  readOnly: true;
}

interface SetupChecklistInteractiveProps {
  items: SetupItem[];
  readOnly?: false;
  onToggle: (id: string) => void;
  onMarkNA: (id: string) => void;
}

type SetupChecklistProps = SetupChecklistReadOnlyProps | SetupChecklistInteractiveProps;

/**
 * Group items by category
 */
function groupByCategory(items: SetupItem[]): Record<string, SetupItem[]> {
  const groups: Record<string, SetupItem[]> = {
    environment: [],
    mental: [],
    tech: [],
  };

  for (const item of items) {
    if (groups[item.category]) {
      groups[item.category].push(item);
    }
  }

  return groups;
}

/**
 * Category display names
 */
const CATEGORY_LABELS: Record<string, string> = {
  environment: 'Environment',
  mental: 'Mental',
  tech: 'Tech',
};

/**
 * SetupChecklist - Interactive or read-only checklist
 * Shows environment prep tasks for habit setup
 */
export default function SetupChecklist(props: SetupChecklistProps) {
  const { items, readOnly } = props;

  // Don't render if no items
  if (!items || items.length === 0) return null;

  const grouped = groupByCategory(items);
  const progress = getSetupProgress(items);

  // Interactive mode handlers
  const onToggle = readOnly ? undefined : (props as SetupChecklistInteractiveProps).onToggle;
  const onMarkNA = readOnly ? undefined : (props as SetupChecklistInteractiveProps).onMarkNA;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
          {readOnly ? 'Your Setup Checklist' : 'Setup Checklist'}
        </p>
        {!readOnly && progress.total > 0 && (
          <span className="text-xs text-[var(--text-tertiary)]">
            {progress.completed} of {progress.total} complete
          </span>
        )}
      </div>

      {/* Description */}
      {readOnly && (
        <p className="text-sm text-[var(--text-secondary)]">
          Before your first rep, set yourself up for success:
        </p>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, categoryItems]) => {
          if (categoryItems.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              {/* Category label */}
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                {CATEGORY_LABELS[category]}
              </p>

              {/* Items */}
              <div className="space-y-1.5">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 ${
                      readOnly ? '' : 'cursor-pointer'
                    }`}
                    onClick={
                      !readOnly && onToggle && !item.notApplicable
                        ? () => onToggle(item.id)
                        : undefined
                    }
                    onContextMenu={
                      !readOnly && onMarkNA
                        ? (e) => {
                            e.preventDefault();
                            onMarkNA(item.id);
                          }
                        : undefined
                    }
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                        item.notApplicable
                          ? 'bg-[var(--bg-tertiary)] border-[var(--bg-tertiary)]'
                          : item.completed
                          ? 'bg-[var(--accent)] border-[var(--accent)]'
                          : 'border-[var(--text-tertiary)]'
                      }`}
                    >
                      {item.completed && !item.notApplicable && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {item.notApplicable && (
                        <span className="text-xs text-[var(--text-tertiary)]">—</span>
                      )}
                    </div>

                    {/* Text */}
                    <span
                      className={`text-sm leading-snug ${
                        item.notApplicable
                          ? 'text-[var(--text-tertiary)] line-through'
                          : item.completed
                          ? 'text-[var(--text-secondary)]'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help text for interactive mode */}
      {!readOnly && (
        <p className="text-xs text-[var(--text-tertiary)]">
          Tap to check off. Long-press for &quot;not applicable&quot;.
        </p>
      )}
    </div>
  );
}
