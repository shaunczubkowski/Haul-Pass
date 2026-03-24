"use client";

import { useId } from "react";
import { GAUGE_LEVELS, GAUGE_LEVEL_LABELS } from "@/types";
import type { GaugeLevel } from "@/types";

// All nine gauge levels available for precise input
const ALL_LEVELS: GaugeLevel[] = [
  GAUGE_LEVELS.EMPTY,
  GAUGE_LEVELS.ONE_EIGHTH,
  GAUGE_LEVELS.QUARTER,
  GAUGE_LEVELS.THREE_EIGHTHS,
  GAUGE_LEVELS.HALF,
  GAUGE_LEVELS.FIVE_EIGHTHS,
  GAUGE_LEVELS.THREE_QUARTER,
  GAUGE_LEVELS.SEVEN_EIGHTHS,
  GAUGE_LEVELS.FULL,
];

// Quarter-step levels get thicker, more prominent tick marks
const MAJOR_LEVELS = new Set<GaugeLevel>([
  GAUGE_LEVELS.EMPTY,
  GAUGE_LEVELS.QUARTER,
  GAUGE_LEVELS.HALF,
  GAUGE_LEVELS.THREE_QUARTER,
  GAUGE_LEVELS.FULL,
]);

// SVG geometry for the semicircular gauge
// Arc spans 180° from left (E) to right (F), centered at bottom of the SVG viewport
const CX = 100; // center x
const CY = 110; // center y (below viewport midpoint so arc appears as bottom half)
const R = 80;   // radius

// Full semicircle arc length (used for stroke-dashoffset animation)
const ARC_LENGTH = Math.PI * R; // ≈ 251.33

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

// Horizontal gauge geometry
// Track spans x: 20 → 280 (width = 260), bar centered at y=40 in viewBox "0 0 300 80"
const H_TRACK_X = 20;
const H_TRACK_WIDTH = 260;
const H_BAR_Y = 32;
const H_BAR_HEIGHT = 16;

interface ArcGaugeSvgProps {
  value: GaugeLevel;
  gradientId: string;
}

function ArcGaugeSvg({ value, gradientId }: ArcGaugeSvgProps) {
  const needleAngle = levelToAngle(value);
  // Needle is defined pointing "up" (north) and rotated to the correct gauge position.
  // E (0°) → svgRotation = -90° (points left), ½ (90°) → 0° (points up), F (180°) → 90° (points right)
  const svgRotation = needleAngle - 90;

  const arcStart = polarToCartesian(0);
  const arcEnd = polarToCartesian(180);
  const arcPath = `M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 0 1 ${arcEnd.x} ${arcEnd.y}`;

  // stroke-dashoffset animation: 0 = full arc shown (F), ARC_LENGTH = nothing shown (E)
  const filledOffset = ARC_LENGTH * (1 - value);

  return (
    <>
      <defs>
        {/* Horizontal gradient matching the E (left) → F (right) arc direction */}
        <linearGradient
          id={gradientId}
          x1={arcStart.x}
          y1="0"
          x2={arcEnd.x}
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* Background arc */}
      <path
        d={arcPath}
        fill="none"
        stroke="var(--gauge-track)"
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* Filled arc — gradient stroke, animated via stroke-dashoffset */}
      <path
        data-testid="arc-fill"
        d={arcPath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
        strokeDashoffset={filledOffset}
        style={{ transition: "stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}
      />

      {/* Tick marks */}
      {ALL_LEVELS.map((level) => {
        const angle = levelToAngle(level);
        const rad = ((180 - angle) * Math.PI) / 180;
        const outerPt = { x: CX + TICK_OUTER_R * Math.cos(rad), y: CY - TICK_OUTER_R * Math.sin(rad) };
        const innerPt = { x: CX + TICK_INNER_R * Math.cos(rad), y: CY - TICK_INNER_R * Math.sin(rad) };
        return (
          <line
            key={level}
            x1={innerPt.x}
            y1={innerPt.y}
            x2={outerPt.x}
            y2={outerPt.y}
            stroke={level <= value ? "var(--gauge-tick-active)" : "var(--gauge-tick-inactive)"}
            strokeWidth={MAJOR_LEVELS.has(level) ? 2.5 : 1.5}
            strokeLinecap="round"
          />
        );
      })}

      {/* Needle — defined pointing up, rotated to current level via CSS transform */}
      <g
        style={{
          transform: `rotate(${svgRotation}deg)`,
          transformOrigin: `${CX}px ${CY}px`,
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <polygon
          points={`${CX},${CY - R} ${CX - 3},${CY} ${CX + 3},${CY}`}
          fill="var(--gauge-needle)"
        />
      </g>

      {/* Needle pivot — outer ring + inner highlight */}
      <circle cx={CX} cy={CY} r={7} fill="var(--gauge-needle)" />
      <circle cx={CX} cy={CY} r={3.5} fill="var(--surface)" />

      {/* E and F labels */}
      <text x={arcStart.x - 8} y={arcStart.y + 4} fontSize="11" fill="var(--text-muted)" fontWeight="600">E</text>
      <text x={arcEnd.x + 2} y={arcEnd.y + 4} fontSize="11" fill="var(--text-muted)" fontWeight="600">F</text>
    </>
  );
}

interface HorizontalGaugeSvgProps {
  value: GaugeLevel;
  gradientId: string;
}

function HorizontalGaugeSvg({ value, gradientId }: HorizontalGaugeSvgProps) {
  const filledWidth = H_TRACK_WIDTH * value;
  const needleX = H_TRACK_X + filledWidth;

  return (
    <>
      <defs>
        <linearGradient
          id={gradientId}
          x1={H_TRACK_X}
          y1="0"
          x2={H_TRACK_X + H_TRACK_WIDTH}
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* Background track */}
      <rect
        x={H_TRACK_X}
        y={H_BAR_Y}
        width={H_TRACK_WIDTH}
        height={H_BAR_HEIGHT}
        rx="8"
        fill="var(--gauge-track)"
      />

      {/* Filled portion — gradient, animated width */}
      <rect
        x={H_TRACK_X}
        y={H_BAR_Y}
        width={filledWidth}
        height={H_BAR_HEIGHT}
        rx="8"
        fill={`url(#${gradientId})`}
        style={{ transition: "width 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}
      />

      {/* Tick marks */}
      {ALL_LEVELS.map((level) => {
        const tickX = H_TRACK_X + level * H_TRACK_WIDTH;
        return (
          <line
            key={level}
            x1={tickX}
            y1={24}
            x2={tickX}
            y2={56}
            stroke={level <= value ? "var(--gauge-tick-active)" : "var(--gauge-tick-inactive)"}
            strokeWidth={MAJOR_LEVELS.has(level) ? 2.5 : 1.5}
          />
        );
      })}

      {/* Needle — downward-pointing triangle at current fill position */}
      <polygon
        points={`${needleX},20 ${needleX - 5},30 ${needleX + 5},30`}
        fill="var(--gauge-needle)"
      />

      {/* E and F labels */}
      <text x={H_TRACK_X} y={70} fontSize="11" fill="var(--text-muted)" fontWeight="600" textAnchor="middle">E</text>
      <text x={H_TRACK_X + H_TRACK_WIDTH} y={70} fontSize="11" fill="var(--text-muted)" fontWeight="600" textAnchor="middle">F</text>
    </>
  );
}

interface FuelGaugeProps {
  value: GaugeLevel;
  onChange: (value: GaugeLevel) => void;
  label: string;
  disabled?: boolean;
  variant?: "arc" | "horizontal";
}

export function FuelGauge({ value, onChange, label, disabled = false, variant = "arc" }: FuelGaugeProps) {
  const uid = useId();
  const gradientId = `fuel-gradient-${uid.replace(/:/g, "")}`;

  const currentIndex = Math.max(
    0,
    ALL_LEVELS.findIndex((l) => l >= value)
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = ALL_LEVELS[Math.min(currentIndex + 1, ALL_LEVELS.length - 1)];
      onChange(next);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      const prev = ALL_LEVELS[Math.max(currentIndex - 1, 0)];
      onChange(prev);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-medium text-text-secondary uppercase tracking-wide">
        {label}
      </span>

      {/* SVG Gauge */}
      <svg
        viewBox={variant === "horizontal" ? "0 0 300 80" : "0 0 200 120"}
        className="w-full max-w-[220px]"
        aria-hidden="true"
        focusable="false"
      >
        {variant === "horizontal"
          ? <HorizontalGaugeSvg value={value} gradientId={gradientId} />
          : <ArcGaugeSvg value={value} gradientId={gradientId} />}
      </svg>

      {/* Interactive level buttons — the actual accessible control */}
      <div
        role="slider"
        aria-valuenow={currentIndex}
        aria-valuemin={0}
        aria-valuemax={ALL_LEVELS.length - 1}
        aria-label={label}
        aria-valuetext={GAUGE_LEVEL_LABELS[value]}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        className="sr-only"
      />

      {/* Segmented level track — replaces the old button grid */}
      <div className="w-full max-w-[220px] flex overflow-hidden rounded-full border border-border">
        {ALL_LEVELS.map((level) => {
          const isSelected = level === value;
          const isFilled = level < value;
          const isMajor = MAJOR_LEVELS.has(level);
          const levelLabel = GAUGE_LEVEL_LABELS[level];
          return (
            <button
              key={level}
              onClick={() => !disabled && onChange(level)}
              disabled={disabled}
              aria-label={`${label} ${levelLabel}`}
              aria-pressed={isSelected}
              className={[
                "flex flex-1 items-center justify-center",
                "min-h-[44px] border-r border-border/40 last:border-r-0",
                "transition-colors",
                isSelected
                  ? "bg-accent text-text-on-accent"
                  : isFilled
                  ? "bg-accent/10 text-accent"
                  : "text-text-muted hover:bg-surface-raised",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              {isMajor ? (
                <span className={["font-bold leading-none", isSelected ? "text-[11px]" : "text-[10px] opacity-80"].join(" ")}>
                  {levelLabel}
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className={[
                    "rounded-sm transition-colors",
                    isSelected || isFilled ? "bg-current" : "bg-border",
                  ].join(" ")}
                  style={{ width: "3px", height: "12px" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
