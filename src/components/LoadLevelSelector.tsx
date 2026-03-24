"use client";

import { LOAD_LEVEL_CONFIG } from "@/types";
import type { LoadLevel } from "@/types";

interface LoadLevelSelectorProps {
  value: LoadLevel;
  onChange: (value: LoadLevel) => void;
}

export function LoadLevelSelector({ value, onChange }: LoadLevelSelectorProps) {
  return (
    <div>
      <fieldset>
        <legend className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-3">
          How loaded is your truck?
        </legend>
        <div className="flex rounded-lg border-2 border-border overflow-hidden">
          {(["empty", "partial", "full"] as const).map((level) => {
            const config = LOAD_LEVEL_CONFIG[level];
            const isSelected = value === level;
            return (
              <button
                key={level}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange(level)}
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
      </fieldset>
      <p className="mt-2 text-xs text-text-muted" aria-live="polite">
        {LOAD_LEVEL_CONFIG[value].description}
      </p>
    </div>
  );
}
