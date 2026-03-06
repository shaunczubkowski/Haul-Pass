"use client";

import { ALL_TRUCKS } from "@/data/trucks";
import type { TruckType } from "@/types";

interface TruckSelectorProps {
  value: TruckType | null;
  onChange: (truck: TruckType) => void;
}

export function TruckSelector({ value, onChange }: TruckSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
        Truck Size
      </span>
      {/* Horizontal scroll on mobile, wrapping grid on desktop */}
      {/* Outer wrapper adds a fade-out on the right edge to signal more trucks off-screen */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent z-10 sm:hidden" />
      <div
        role="radiogroup"
        aria-label="Select truck size"
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:flex-wrap sm:overflow-visible sm:pb-0"
      >
        {ALL_TRUCKS.map((truck) => {
          const isSelected = value?.id === truck.id;
          return (
            <button
              key={truck.id}
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(truck)}
              className={[
                "flex-shrink-0 snap-start flex flex-col items-center gap-1",
                "rounded-xl border-2 px-4 py-3 w-[110px] transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400",
                isSelected
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-orange-300",
              ].join(" ")}
            >
              {/* Truck silhouette icon */}
              <TruckIcon size={truck} />
              <span
                className={[
                  "text-sm font-semibold text-center leading-tight",
                  isSelected ? "text-orange-600" : "text-gray-800",
                ].join(" ")}
              >
                {truck.name}
              </span>
              {truck.loadSize && (
                <span className="text-xs text-gray-500 text-center leading-tight">{truck.loadSize}</span>
              )}
              <span className="text-xs text-gray-400">{truck.tankCapacity} gal · {truck.mpg} MPG</span>
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}

// Simple SVG truck silhouette — scales visually with truck size
function TruckIcon({ size }: { size: TruckType }) {
  // Map tank capacity to a rough visual width (26 gal cargo van → smallest, 60 gal 26ft → largest)
  const min = 26;
  const max = 60;
  const scale = 0.6 + ((size.tankCapacity - min) / (max - min)) * 0.4;
  const w = Math.round(40 * scale);
  const h = Math.round(22 * scale);
  const cabW = Math.round(12 * scale);

  return (
    <svg
      viewBox="0 0 56 30"
      width={56}
      height={30}
      aria-hidden="true"
      className="text-gray-400"
    >
      {/* Cargo box */}
      <rect
        x={2}
        y={8 - h / 2 + 8}
        width={w}
        height={h}
        rx={2}
        fill="currentColor"
        opacity={0.5}
      />
      {/* Cab */}
      <rect
        x={w + 2}
        y={8 - (h * 0.75) / 2 + 8 + h * 0.125}
        width={cabW}
        height={h * 0.75}
        rx={2}
        fill="currentColor"
        opacity={0.8}
      />
      {/* Wheels */}
      <circle cx={10} cy={28} r={3} fill="currentColor" opacity={0.9} />
      <circle cx={w - 4} cy={28} r={3} fill="currentColor" opacity={0.9} />
      <circle cx={w + cabW - 2} cy={28} r={3} fill="currentColor" opacity={0.9} />
    </svg>
  );
}
