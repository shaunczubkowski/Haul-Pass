import type { RouteStop } from "@/types";

interface RouteStopCardProps {
  stop: RouteStop;
  isLast?: boolean;
}

export function RouteStopCard({ stop, isLast = false }: RouteStopCardProps) {
  const { stopNumber, waypoint, milesFromPreviousStop, station, fuelCalculation } = stop;

  return (
    <article
      className={[
        "rounded-xl border-2 p-4 transition-colors",
        isLast
          ? "border-accent bg-accent-subtle"
          : fuelCalculation.isAtRisk
          ? "border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-950/40"
          : "border-border bg-surface",
      ].join(" ")}
      aria-label={`Stop ${stopNumber}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={[
                "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0",
                isLast
                  ? "bg-accent text-text-on-accent"
                  : "bg-surface-raised text-text-secondary",
              ].join(" ")}
              aria-hidden="true"
            >
              {stopNumber}
            </span>
            <p className="text-sm font-semibold text-text-primary truncate">
              {waypoint.locationLabel}
            </p>
          </div>

          <p className="text-xs text-text-muted ml-8">
            {milesFromPreviousStop} mi from last stop
            {isLast && (
              <span className="ml-2 font-semibold text-accent">· Final fill-up</span>
            )}
          </p>

          {fuelCalculation.isAtRisk && (
            <p
              role="alert"
              className="mt-2 ml-8 text-xs font-semibold text-red-700 dark:text-red-400"
            >
              ⚠ Tank will run low — fill up before this leg
            </p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          {fuelCalculation.gallonsToAdd > 0 ? (
            <>
              <p className="text-lg font-bold text-text-primary leading-tight">
                {fuelCalculation.gallonsToAdd}
                <span className="text-sm font-semibold text-text-secondary ml-1">gal</span>
              </p>
              {fuelCalculation.estimatedCost != null && (
                <p className="text-sm font-semibold text-accent">
                  ≈ ${fuelCalculation.estimatedCost.toFixed(2)}
                </p>
              )}
              <span className="inline-block mt-1 text-xs font-semibold text-text-muted bg-surface-raised rounded px-2 py-0.5">
                {fuelCalculation.fuelType === "diesel" ? "DIESEL" : "REGULAR"}
              </span>
            </>
          ) : (
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Tank OK</p>
          )}
        </div>
      </div>

      <a
        href={station.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={[
          "mt-3 flex items-center justify-center gap-2 w-full rounded-lg py-2.5 px-4",
          "text-sm font-semibold transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "border-2 border-accent text-accent hover:bg-accent hover:text-text-on-accent",
        ].join(" ")}
      >
        Open in Maps
        <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}
