import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", selected = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl border bg-[var(--bg-secondary)] p-4 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${
          selected
            ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]"
            : "border-[var(--bg-tertiary)] hover:border-[var(--accent-primary)]"
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
