"use client";

import { useState } from "react";

type Unit = "miles" | "km";

const KM_TO_MILES = 0.621371;

interface DistanceInputProps {
  value: number; // always in miles internally
  onChange: (miles: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

export function DistanceInput({ value, onChange, onBlur, disabled = false }: DistanceInputProps) {
  const [unit, setUnit] = useState<Unit>("miles");

  // Display value in the currently selected unit
  const displayValue =
    value === 0
      ? ""
      : unit === "miles"
      ? String(value)
      : String(parseFloat((value / KM_TO_MILES).toFixed(1)));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") {
      onChange(0);
      return;
    }
    const parsed = parseFloat(raw);
    if (isNaN(parsed) || parsed < 0) return;
    const miles = unit === "miles" ? parsed : parseFloat((parsed * KM_TO_MILES).toFixed(1));
    onChange(miles);
  }

  function toggleUnit() {
    setUnit((u) => (u === "miles" ? "km" : "miles"));
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label
          htmlFor="distance-input"
          className="text-sm font-medium text-gray-600 uppercase tracking-wide"
        >
          {unit === "miles" ? "Miles" : "km"} to Drop-off
        </label>
        <p className="text-xs text-gray-400 mt-0.5">From this pump to the U-Haul location</p>
      </div>
      <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden focus-within:border-orange-400 transition-colors">
        <input
          id="distance-input"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={displayValue}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder="e.g. 12"
          aria-label={`${unit === "miles" ? "Miles" : "km"} to drop-off in ${unit}`}
          className={[
            "flex-1 px-4 py-3 text-lg font-semibold text-gray-900 bg-white",
            "outline-none appearance-none",
            "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            disabled ? "opacity-50 cursor-not-allowed" : "",
          ].join(" ")}
        />
        {/* Unit toggle */}
        <button
          type="button"
          onClick={toggleUnit}
          disabled={disabled}
          aria-label={`Switch to ${unit === "miles" ? "kilometers" : "miles"}`}
          className={[
            "px-4 border-l-2 border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600",
            "hover:bg-orange-50 hover:text-orange-600 transition-colors min-w-[64px]",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          ].join(" ")}
        >
          {unit === "miles" ? "mi" : "km"}
        </button>
      </div>
      {unit === "km" && value > 0 && (
        <p className="text-xs text-gray-400">≈ {value} miles</p>
      )}
    </div>
  );
}
