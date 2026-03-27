import Link from "next/link";
import type { PlannedRoute } from "@/types";
import { RouteStopCard } from "@/components/RouteStopCard";

interface RoutePlanResultsProps {
  plan: PlannedRoute;
}

export function RoutePlanResults({ plan }: RoutePlanResultsProps) {
  const { origin, destination, totalMiles, stops, estimatedTotalGallons, estimatedTotalCost } = plan;

  if (stops.length === 0) {
    return (
      <section
        className="rounded-xl border-2 border-green-500 bg-green-50 dark:border-green-700 dark:bg-green-950/40 p-5"
        aria-live="polite"
      >
        <p className="text-lg font-bold text-green-800 dark:text-green-300 text-center">
          Short trip — one fill-up is enough!
        </p>
        <p className="mt-2 text-sm text-green-700 dark:text-green-400 text-center">
          Your route is under 180 miles. Fill up near your starting point and you&apos;re set.
          Use the{" "}
          <Link href="/" className="underline font-semibold">
            fuel return calculator
          </Link>{" "}
          for your return trip.
        </p>
      </section>
    );
  }

  return (
    <section aria-live="polite" aria-label="Route plan results">
      {/* Route summary */}
      <div className="rounded-xl border border-border bg-surface p-4 mb-4 shadow-sm">
        <p className="text-sm font-semibold text-text-primary leading-snug">
          {origin.displayName} → {destination.displayName}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
          <span>{totalMiles} miles</span>
          <span>{stops.length} fuel {stops.length === 1 ? "stop" : "stops"}</span>
          <span>≈ {estimatedTotalGallons} gal total</span>
          {estimatedTotalCost != null && (
            <span className="font-semibold text-accent">
              ≈ ${estimatedTotalCost.toFixed(2)} total
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Fill to <strong>FULL</strong> at each stop. The last stop before drop-off is marked.
        </p>
      </div>

      {/* Stop cards */}
      <div className="flex flex-col gap-3">
        {stops.map((stop, index) => (
          <RouteStopCard
            key={stop.stopNumber}
            stop={stop}
            isLast={index === stops.length - 1}
          />
        ))}
      </div>
    </section>
  );
}
