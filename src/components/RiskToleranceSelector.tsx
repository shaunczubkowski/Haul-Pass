"use client";

import { RISK_TOLERANCE_CONFIG } from "@/types";
import type { RiskTolerance } from "@/types";

interface RiskToleranceSelectorProps {
  value: RiskTolerance;
  onChange: (value: RiskTolerance) => void;
}

export function RiskToleranceSelector({ value, onChange }: RiskToleranceSelectorProps) {
  const levels = ["conservative", "standard", "lean"] as const;

  return (
    <div>
      <p
        id="risk-tolerance-label"
        className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-3"
      >
        Risk Tolerance
      </p>
      <div
        role="radiogroup"
        aria-labelledby="risk-tolerance-label"
        className="flex rounded-lg border-2 border-border overflow-hidden"
        onKeyDown={(e) => {
          const idx = levels.indexOf(value);
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            const next = levels[(idx + 1) % levels.length];
            onChange(next);
            (e.currentTarget.querySelector(`[data-level="${next}"]`) as HTMLElement | null)?.focus();
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            const prev = levels[(idx - 1 + levels.length) % levels.length];
            onChange(prev);
            (e.currentTarget.querySelector(`[data-level="${prev}"]`) as HTMLElement | null)?.focus();
          }
        }}
      >
        {levels.map((level) => {
          const config = RISK_TOLERANCE_CONFIG[level];
          const isSelected = value === level;
          return (
            <button
              key={level}
              role="radio"
              aria-checked={isSelected}
              data-level={level}
              onClick={() => onChange(level)}
              tabIndex={isSelected ? 0 : -1}
              className={[
                "flex-1 px-3 py-2.5 text-sm font-semibold transition-colors text-center",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                "border-r-2 border-border last:border-r-0",
                isSelected
                  ? "bg-accent text-text-on-accent"
                  : "bg-surface text-text-secondary hover:bg-surface-raised hover:text-text-primary",
              ].join(" ")}
            >
              {config.label}
            </button>
          );
        })}
      </div>
      <p
        id="risk-tolerance-description"
        className="mt-2 text-xs text-text-muted"
        aria-live="polite"
      >
        {RISK_TOLERANCE_CONFIG[value].description}
      </p>
    </div>
  );
}
