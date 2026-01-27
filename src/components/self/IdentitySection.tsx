'use client';

interface IdentitySectionProps {
  identity: string;
  identityBehaviors: string[];
}

/**
 * IdentitySection - Display identity and behaviors
 * Shows who the user is becoming through this habit
 */
export default function IdentitySection({
  identity,
  identityBehaviors,
}: IdentitySectionProps) {
  // Don't render if no identity data
  if (!identity) return null;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
        Who You&apos;re Becoming
      </p>

      {/* Identity statement */}
      <p className="text-base text-[var(--text-primary)] leading-relaxed">
        You&apos;re building the identity of{' '}
        <span className="font-medium">{identity.toLowerCase()}</span>.
      </p>

      {/* Identity behaviors */}
      {identityBehaviors && identityBehaviors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-[var(--text-secondary)]">
            People with this identity typically:
          </p>
          <ul className="space-y-1.5">
            {identityBehaviors.map((behavior, index) => (
              <li
                key={index}
                className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
              >
                <span className="text-[var(--text-tertiary)] mt-1">•</span>
                <span>{behavior}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
