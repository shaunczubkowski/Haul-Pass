"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowUpDown } from "lucide-react";
import { AddressInput } from "@/components/AddressInput";
import { TruckSelector } from "@/components/TruckSelector";
import { LoadLevelSelector } from "@/components/LoadLevelSelector";
import { RiskToleranceSelector } from "@/components/RiskToleranceSelector";
import { RoutePlanResults } from "@/components/RoutePlanResults";
import type {
  AddressSuggestion,
  TruckType,
  LoadLevel,
  RiskTolerance,
  PlannedRoute,
  RouteAlternative,
} from "@/types";

const MAPS_APP_KEY = "fillright:mapsApp";

type MapsApp = "google" | "apple";

function getDefaultMapsApp(): MapsApp {
  if (typeof window === "undefined") return "google";
  try {
    const stored = localStorage.getItem(MAPS_APP_KEY);
    if (stored === "google" || stored === "apple") return stored;
  } catch {
    // localStorage unavailable
  }
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? "apple" : "google";
}

function formatDistance(miles: number): string {
  return `${miles.toLocaleString("en-US")} mi`;
}

function formatDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export function RoutePlannerForm() {
  const [origin, setOrigin] = useState<AddressSuggestion | null>(null);
  const [destination, setDestination] = useState<AddressSuggestion | null>(null);
  const [truck, setTruck] = useState<TruckType | null>(null);
  const [loadLevel, setLoadLevel] = useState<LoadLevel>("empty");
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>("standard");
  const [gasPrice, setGasPrice] = useState("");
  const [mapsApp, setMapsApp] = useState<MapsApp>("google");

  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<PlannedRoute | null>(null);
  const [alternatives, setAlternatives] = useState<RouteAlternative[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Focus management refs
  const pickerRef = useRef<HTMLFieldSetElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMapsApp(getDefaultMapsApp());
  }, []);

  // Move focus into the picker when it appears so keyboard/SR users know
  // new content is available without having to navigate away from the form.
  useEffect(() => {
    if (alternatives && pickerRef.current) {
      pickerRef.current.focus();
    }
  }, [alternatives]);

  // Move focus into the results section once the plan is ready.
  useEffect(() => {
    if (plan && resultsRef.current) {
      resultsRef.current.focus();
    }
  }, [plan]);

  const canSubmit = origin !== null && destination !== null && truck !== null && !isLoading;

  // Core plan-fetching logic. Does not manage isLoading — callers own that
  // so that every code path has an explicit try/finally reset.
  // routeGeometry is the pre-fetched full geometry from /api/route-alternatives;
  // passing it avoids a second Mapbox call and ensures route consistency (#99).
  async function fetchPlan(routeIndex: number, routeGeometry?: [number, number][]): Promise<void> {
    setError(null);

    const parsedGasPrice = gasPrice !== "" ? parseFloat(gasPrice) : NaN;
    const validGasPrice =
      !isNaN(parsedGasPrice) && parsedGasPrice >= 0.01 ? parsedGasPrice : undefined;

    const res = await fetch("/api/route-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originId: origin!.id,
        destinationId: destination!.id,
        originCoords: origin!.coordinates,
        destinationCoords: destination!.coordinates,
        originName: origin!.fullAddress,
        destinationName: destination!.fullAddress,
        truckId: truck!.id,
        riskTolerance,
        loadLevel,
        gasPricePerGallon: validGasPrice,
        mapsApp,
        routeIndex,
        routeGeometry,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 422) {
        throw new Error(
          data.error ?? "We couldn't find a route between those locations. Check the addresses and try again."
        );
      }
      throw new Error(
        data.error ?? "Something went wrong fetching your route. Try again in a moment."
      );
    }

    const data = (await res.json()) as PlannedRoute;
    setPlan(data);
    setAlternatives(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);
    setPlan(null);
    setAlternatives(null);

    try {
      const params = new URLSearchParams({
        originLat: String(origin!.coordinates.lat),
        originLng: String(origin!.coordinates.lng),
        destLat: String(destination!.coordinates.lat),
        destLng: String(destination!.coordinates.lng),
      });

      const altRes = await fetch(`/api/route-alternatives?${params.toString()}`);

      if (!altRes.ok) {
        const data = (await altRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          altRes.status === 422
            ? "We couldn't find a route between those locations. Check the addresses and try again."
            : (data.error ?? "Something went wrong fetching your route. Try again in a moment.")
        );
      }

      const altData = (await altRes.json()) as { alternatives: RouteAlternative[] };
      const alts = altData.alternatives;

      if (alts.length <= 1) {
        // Single route — skip the picker and plan immediately, passing geometry directly
        await fetchPlan(0, alts[0]?.geometry);
      } else {
        // Multiple routes — show the picker; isLoading reset in finally below
        setAlternatives(alts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong fetching your route. Try again in a moment.");
    } finally {
      // Always reset loading. If fetchPlan threw, this clears the spinner.
      // If setAlternatives was called, this also clears it so the picker is interactive.
      setIsLoading(false);
    }
  }

  async function handleRouteSelect(index: number, geometry?: [number, number][]) {
    setAlternatives(null);
    setIsLoading(true);
    try {
      await fetchPlan(index, geometry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong fetching your route. Try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSwap() {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
    setPlan(null);
    setAlternatives(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Address inputs */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm ring-1 ring-border">
          <h2 className="mb-4 border-l-2 border-accent pl-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
            Route
          </h2>
          <div className="flex flex-col gap-4">
            <AddressInput
              id="route-origin"
              label="Starting from"
              placeholder="City or address"
              value={origin}
              onChange={setOrigin}
            />

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" aria-hidden="true" />
              <button
                type="button"
                onClick={handleSwap}
                aria-label="Swap origin and destination"
                className={[
                  "flex-shrink-0 w-11 h-11 flex items-center justify-center",
                  "rounded-full border-2 border-border bg-surface text-text-muted",
                  "hover:border-accent hover:text-accent transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                ].join(" ")}
              >
                <ArrowUpDown size={18} aria-hidden="true" />
              </button>
              <div className="flex-1 h-px bg-border" aria-hidden="true" />
            </div>

            <AddressInput
              id="route-destination"
              label="Going to"
              placeholder="City or address"
              value={destination}
              onChange={setDestination}
            />
          </div>
        </section>

        {/* Truck selection */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm ring-1 ring-border">
          <h2 className="mb-4 border-l-2 border-accent pl-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
            Your Truck
          </h2>
          <TruckSelector value={truck} onChange={setTruck} />
        </section>

        {/* Settings */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm ring-1 ring-border">
          <h2 className="mb-4 border-l-2 border-accent pl-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
            Settings
          </h2>
          <div className="flex flex-col gap-6">
            <LoadLevelSelector value={loadLevel} onChange={setLoadLevel} />
            <RiskToleranceSelector value={riskTolerance} onChange={setRiskTolerance} />

            {/* Gas price */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="route-gas-price"
                className="text-sm font-medium text-text-secondary uppercase tracking-wide"
              >
                Gas Price{" "}
                <span className="text-text-muted normal-case font-normal">(optional)</span>
              </label>
              <div className="flex rounded-lg border-2 border-border overflow-hidden focus-within:border-accent transition-colors">
                <span className="flex items-center px-3 bg-surface-raised text-sm font-semibold text-text-secondary border-r-2 border-border">
                  $
                </span>
                <input
                  id="route-gas-price"
                  type="number"
                  inputMode="decimal"
                  min={0.01}
                  step={0.01}
                  placeholder="3.99"
                  value={gasPrice}
                  onChange={(e) => setGasPrice(e.target.value)}
                  aria-label="Gas price per gallon in dollars"
                  className={[
                    "flex-1 px-3 py-3 text-lg font-semibold text-text-primary bg-surface",
                    "outline-none appearance-none",
                    "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                  ].join(" ")}
                />
                <span className="flex items-center px-3 bg-surface-raised text-sm font-semibold text-text-secondary border-l-2 border-border">
                  /gal
                </span>
              </div>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={!canSubmit}
          aria-busy={isLoading}
          aria-describedby={!truck ? "plan-route-hint" : undefined}
          className={[
            "w-full rounded-xl py-4 text-base font-bold transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            canSubmit
              ? "bg-accent text-text-on-accent hover:opacity-90"
              : "bg-surface-raised text-text-muted cursor-not-allowed",
          ].join(" ")}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              Planning your route…
            </span>
          ) : (
            "Plan Route →"
          )}
        </button>

        {!truck && (
          <p id="plan-route-hint" className="text-center text-xs text-text-muted -mt-3">
            Select a truck above to continue
          </p>
        )}
      </form>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border-2 border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-950/40 p-5"
        >
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs underline text-red-700 dark:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Route selection step — rendered as a fieldset so AT understands
          the buttons are a group of mutually-exclusive route choices. */}
      {alternatives && !isLoading && (
        <fieldset
          ref={pickerRef}
          tabIndex={-1}
          className="flex flex-col gap-3 border-0 p-0 m-0 min-w-0 outline-none"
        >
          <legend className="text-sm font-semibold uppercase tracking-widest text-text-muted border-l-2 border-accent pl-2 float-left w-full mb-1">
            Choose Your Route
          </legend>
          <p className="text-xs text-text-muted">
            We found {alternatives.length} routes. Select the one that matches your planned drive.
          </p>
          {alternatives.map((alt) => (
            <button
              key={alt.index}
              type="button"
              onClick={() => handleRouteSelect(alt.index, alt.geometry)}
              disabled={isLoading}
              className={[
                "w-full rounded-xl border-2 border-border bg-surface p-4 text-left",
                "hover:border-accent transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border",
              ].join(" ")}
            >
              <p className="font-semibold text-text-primary">{alt.label}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {formatDistance(alt.distanceMiles)}
                <span aria-hidden="true" className="mx-2 text-text-muted">·</span>
                {formatDuration(alt.durationMinutes)}
              </p>
            </button>
          ))}
        </fieldset>
      )}

      {/* Loading skeleton — shown while waiting for the plan after route selection */}
      {isLoading && !alternatives && (
        <div
          role="status"
          aria-label="Planning your route"
          className="flex flex-col gap-3"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-surface-raised animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Results */}
      {plan && !isLoading && (
        <div ref={resultsRef} tabIndex={-1} className="outline-none">
          <RoutePlanResults plan={plan} />
        </div>
      )}
    </div>
  );
}
