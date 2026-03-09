"use client";

import { useState } from "react";
import { getTrucksByCompany } from "@/data/trucks";
import type { TruckType, RentalCompany } from "@/types";

interface TruckSelectorProps {
  value: TruckType | null;
  onChange: (truck: TruckType) => void;
}

const COMPANIES: { id: RentalCompany; label: string }[] = [
  { id: "uhaul", label: "U-Haul" },
  { id: "penske", label: "Penske" },
  { id: "budget", label: "Budget" },
  { id: "enterprise", label: "Enterprise" },
];

export function TruckSelector({ value, onChange }: TruckSelectorProps) {
  const [company, setCompany] = useState<RentalCompany>(
    value?.company ?? "uhaul"
  );

  const trucks = getTrucksByCompany(company);
  const isDiesel = company === "penske";

  function handleCompanyChange(next: RentalCompany) {
    setCompany(next);
    // Clear selection if current truck belongs to a different company
    if (value && value.company !== next) {
      // Reset to first truck of the new company if one exists
      const available = getTrucksByCompany(next);
      if (available.length > 0) onChange(available[0]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Company selector */}
      <div>
        <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          Rental Company
        </span>
        <div
          role="radiogroup"
          aria-label="Select rental company"
          className="mt-2 flex gap-2 flex-wrap"
        >
          {COMPANIES.map(({ id, label }) => {
            const isSelected = company === id;
            return (
              <button
                key={id}
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleCompanyChange(id)}
                className={[
                  "rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400",
                  isSelected
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-orange-300",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Diesel warning */}
      {isDiesel && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border-2 border-yellow-400 bg-yellow-50 px-3 py-2.5 text-yellow-800"
        >
          <span aria-hidden="true" className="text-lg leading-none mt-0.5">⛽</span>
          <div>
            <p className="font-bold text-sm">Penske trucks use DIESEL fuel</p>
            <p className="text-xs mt-0.5">
              Fill at the <strong>diesel pump</strong> only — not regular unleaded.
              Check your rental agreement for the correct fuel grade.
            </p>
          </div>
        </div>
      )}

      {/* Truck size selector */}
      <div>
        <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          Truck Size
        </span>
        {/* Outer wrapper adds a fade-out on the right edge to signal more trucks off-screen */}
        <div className="relative mt-2">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent z-10 sm:hidden" />
          <div
            role="radiogroup"
            aria-label="Select truck size"
            className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:flex-wrap sm:overflow-visible sm:pb-0"
          >
            {trucks.map((truck) => {
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
                  <span className="text-xs text-gray-400">
                    {truck.tankCapacity} gal · {truck.mpg} MPG
                  </span>
                  {truck.fuelType === "diesel" && (
                    <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 rounded px-1">
                      diesel
                    </span>
                  )}
                </button>
              );
            })}
          </div>
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
