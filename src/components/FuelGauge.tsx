"use client";

import { GAUGE_LEVELS, GAUGE_LEVEL_LABELS } from "@/types";
import type { GaugeLevel } from "@/types";

// Five canonical gauge levels shown in the UI (matching marks printed on most fuel gauges)
const DISPLAY_LEVELS: GaugeLevel[] = [
  GAUGE_LEVELS.EMPTY,
  GAUGE_LEVELS.QUARTER,
  GAUGE_LEVELS.HALF,
  GAUGE_LEVELS.THREE_QUARTER,
  GAUGE_LEVELS.FULL,
];

// SVG geometry for the semicircular gauge
// Arc spans 180° from left (E) to right (F), centered at bottom of the SVG viewport
const CX = 100; // center x
const CY = 110; // center y (below viewport midpoint so arc appears as bottom half)
const R = 80;   // radius

function polarToCartesian(angleDeg: number): { x: number; y: number } {
  // 0° = left (E), 180° = right (F), mapped over a 180° arc
  const rad = ((180 - angleDeg) * Math.PI) / 180;
  return {
    x: CX + R * Math.cos(rad),
    y: CY - R * Math.sin(rad),
  };
}

function levelToAngle(level: GaugeLevel): number {
  // Map 0→0°, 1→180°
  return level * 180;
}

// Tick mark positions for each gauge level.
// TICK_OUTER_R must exceed R + strokeWidth/2 (= 86) so marks extend
// visibly outward beyond the arc stroke rather than pointing inward.
const TICK_INNER_R = 72;
const TICK_OUTER_R = 92;

interface FuelGaugeProps {
  value: GaugeLevel;
  onChange: (value: GaugeLevel) => void;
  label: string;
  disabled?: boolean;
}

export function FuelGauge({ value, onChange, label, disabled = false }: FuelGaugeProps) {
  // Find the closest display level index; guard against -1 if value is an intermediate level
  const currentIndex = Math.max(
    0,
    DISPLAY_LEVELS.findIndex((l) => l >= value)
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = DISPLAY_LEVELS[Math.min(currentIndex + 1, DISPLAY_LEVELS.length - 1)];
      onChange(next);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      const prev = DISPLAY_LEVELS[Math.max(currentIndex - 1, 0)];
      onChange(prev);
    }
  }

  // Needle tip position
  const needleAngle = levelToAngle(value);
  const needleTip = polarToCartesian(needleAngle);
  const needleBase1 = { x: CX - 3, y: CY };
  const needleBase2 = { x: CX + 3, y: CY };

  // Arc path: full background arc (E to F)
  const arcStart = polarToCartesian(0);
  const arcEnd = polarToCartesian(180);
  const arcPath = `M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 0 1 ${arcEnd.x} ${arcEnd.y}`;

  // Filled arc from E to current value.
  // sweep=1 (clockwise) is required so the SVG arc algorithm resolves to the gauge's
  // center (CX, CY). sweep=0 with a non-diameter endpoint resolves to a different
  // circle center, drawing the fill through the gauge interior instead of along the track.
  const filledEnd = polarToCartesian(needleAngle);
  const filledPath =
    needleAngle > 0
      ? `M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 0 1 ${filledEnd.x} ${filledEnd.y}`
      : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
        {label}
      </span>

      {/* SVG Gauge */}
      <svg
        viewBox="0 0 200 120"
        className="w-full max-w-[220px]"
        aria-hidden="true"
        focusable="false"
      >
        {/* Background arc */}
        <path
          d={arcPath}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Filled arc (orange, up to current value) */}
        {filledPath && (
          <path
            d={filledPath}
            fill="none"
            stroke="#f97316"
            strokeWidth="12"
            strokeLinecap="round"
          />
        )}

        {/* Tick marks */}
        {DISPLAY_LEVELS.map((level) => {
          const angle = levelToAngle(level);
          const outerR = TICK_OUTER_R;
          const innerR = TICK_INNER_R;
          const rad = ((180 - angle) * Math.PI) / 180;
          const outerPt = { x: CX + outerR * Math.cos(rad), y: CY - outerR * Math.sin(rad) };
          const innerPt = { x: CX + innerR * Math.cos(rad), y: CY - innerR * Math.sin(rad) };
          return (
            <line
              key={level}
              x1={innerPt.x}
              y1={innerPt.y}
              x2={outerPt.x}
              y2={outerPt.y}
              stroke={level <= value ? "#f97316" : "#d1d5db"}
              strokeWidth={level === 0 || level === 1 ? 2.5 : 1.5}
            />
          );
        })}

        {/* Needle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill="#111827"
        />
        {/* Needle pivot */}
        <circle cx={CX} cy={CY} r={5} fill="#111827" />

        {/* E and F labels */}
        <text x={arcStart.x - 8} y={arcStart.y + 4} fontSize="11" fill="#6b7280" fontWeight="600">E</text>
        <text x={arcEnd.x + 2} y={arcEnd.y + 4} fontSize="11" fill="#6b7280" fontWeight="600">F</text>
      </svg>

      {/* Interactive level buttons — the actual accessible control */}
      <div
        role="slider"
        aria-valuenow={currentIndex}
        aria-valuemin={0}
        aria-valuemax={DISPLAY_LEVELS.length - 1}
        aria-label={`${label}: ${GAUGE_LEVEL_LABELS[value]}`}
        aria-valuetext={GAUGE_LEVEL_LABELS[value]}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        className="sr-only"
      />

      {/* Tap targets — visible button grid */}
      <div className="flex gap-1 flex-wrap justify-center">
        {DISPLAY_LEVELS.map((level) => {
          const isSelected = level === value;
          const levelLabel = GAUGE_LEVEL_LABELS[level];
          return (
            <button
              key={level}
              onClick={() => !disabled && onChange(level)}
              disabled={disabled}
              aria-label={`${label} ${levelLabel}`}
              aria-pressed={isSelected}
              className={[
                "min-w-[44px] min-h-[44px] rounded-md text-sm font-semibold transition-colors",
                "border-2 px-2",
                isSelected
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:border-orange-300",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              {levelLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
