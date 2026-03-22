"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { FuelGauge } from "@/components/FuelGauge";
import { TruckSelector } from "@/components/TruckSelector";
import { DistanceInput } from "@/components/DistanceInput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { calculateFuelReturn, RISK_TOLERANCE_BUFFERS } from "@/lib/calculator";
import { GAUGE_LEVELS, RISK_TOLERANCE_CONFIG } from "@/types";
import { getTruckById } from "@/data/trucks";
import type { GaugeLevel, RiskTolerance, TruckType } from "@/types";
import { Fuel, MapPin } from "lucide-react";

// All 9 eighth-step levels selectable via the UI; used for URL param validation
const VALID_LEVELS = new Set([0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0]);
// Domain upper bounds for URL param sanitization
const MAX_DISTANCE_MILES = 10_000;
const MAX_GAS_PRICE_USD = 50;
// Valid risk tolerance values for URL param sanitization
const VALID_RISK_TOLERANCE = new Set<RiskTolerance>(["conservative", "standard", "lean"]);

type MapsApp = "google" | "apple";
const MAPS_APP_KEY = "fillright:mapsApp";

/**
 * Returns the appropriate map search URL for a gas/diesel station finder.
 */
function getGasStationUrl(fuelType: "regular" | "diesel", mapsApp: MapsApp): string {
  const query = fuelType === "diesel" ? "diesel+gas+stations+near+me" : "gas+stations+near+me";
  if (mapsApp === "apple") {
    return `https://maps.apple.com/?q=${query}`;
  }
  return `https://www.google.com/maps/search/${query}`;
}

/** Reads stored maps preference; falls back to platform detection on first visit. */
function getDefaultMapsApp(): MapsApp {
  try {
    const stored = localStorage.getItem(MAPS_APP_KEY);
    if (stored === "google" || stored === "apple") return stored;
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
  // First visit: default to Apple Maps on Apple platforms, Google Maps elsewhere.
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? "apple" : "google";
}

function readUrlParams() {
  if (typeof window === "undefined") {
    return { truck: null, pickupLevel: GAUGE_LEVELS.FULL, currentLevel: GAUGE_LEVELS.HALF, distance: 0, gasPrice: "", gaugeVariant: "arc" as "arc" | "horizontal", riskTolerance: "standard" as RiskTolerance };
  }
  const params = new URLSearchParams(window.location.search);

  let truck: TruckType | null = null;
  const truckId = params.get("truck");
  if (truckId) {
    const found = getTruckById(truckId);
    if (found) truck = found;
  }

  let pickupLevel: GaugeLevel = GAUGE_LEVELS.FULL;
  const pickup = params.get("pickup");
  if (pickup !== null) {
    const val = parseFloat(pickup);
    if (VALID_LEVELS.has(val)) pickupLevel = val as GaugeLevel;
  }

  let currentLevel: GaugeLevel = GAUGE_LEVELS.HALF;
  const current = params.get("current");
  if (current !== null) {
    const val = parseFloat(current);
    if (VALID_LEVELS.has(val)) currentLevel = val as GaugeLevel;
  }

  let distance = 0;
  const dist = params.get("dist");
  if (dist !== null) {
    const val = parseFloat(dist);
    if (!isNaN(val) && val >= 0 && val <= MAX_DISTANCE_MILES) distance = val;
  }

  let gasPrice = "";
  const gas = params.get("gas");
  if (gas !== null && gas !== "") {
    const parsedGas = parseFloat(gas);
    if (isFinite(parsedGas) && parsedGas >= 0.01 && parsedGas <= MAX_GAS_PRICE_USD) gasPrice = String(parsedGas);
  }

  let gaugeVariant: "arc" | "horizontal" = "arc";
  if (params.get("variant") === "horizontal") gaugeVariant = "horizontal";

  let riskTolerance: RiskTolerance = "standard";
  const riskParam = params.get("risk");
  if (riskParam !== null && VALID_RISK_TOLERANCE.has(riskParam as RiskTolerance)) {
    riskTolerance = riskParam as RiskTolerance;
  }

  return { truck, pickupLevel, currentLevel, distance, gasPrice, gaugeVariant, riskTolerance };
}

export default function Home() {
  // Lazy initializer form: passing `readUrlParams` (not `readUrlParams()`) tells
  // React to call it once on mount and never again. Subsequent useState(initialParams.x)
  // calls use the initial-value form, which React also ignores after the first render,
  // so URL params seed each piece of state exactly once without re-running on updates.
  const [initialParams] = useState(readUrlParams);
  const [truck, setTruck] = useState<TruckType | null>(initialParams.truck);
  const [pickupLevel, setPickupLevel] = useState<GaugeLevel>(initialParams.pickupLevel);
  const [currentLevel, setCurrentLevel] = useState<GaugeLevel>(initialParams.currentLevel);
  const [distance, setDistance] = useState<number>(initialParams.distance);
  const [gasPrice, setGasPrice] = useState<string>(initialParams.gasPrice);
  const [gaugeVariant, setGaugeVariant] = useState<"arc" | "horizontal">(initialParams.gaugeVariant);
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>(initialParams.riskTolerance);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string>("");
  // Maps app preference — initialised after mount to avoid SSR/hydration mismatch.
  const [mapsApp, setMapsApp] = useState<MapsApp>("google");
  const resultRef = useRef<HTMLElement | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state to URL (replaceState — no browser history spam)
  useEffect(() => {
    const params = new URLSearchParams();
    if (truck) params.set("truck", truck.id);
    params.set("pickup", String(pickupLevel));
    params.set("current", String(currentLevel));
    if (distance > 0) params.set("dist", String(distance));
    if (gasPrice !== "") params.set("gas", gasPrice);
    if (gaugeVariant === "horizontal") params.set("variant", "horizontal");
    // Omit risk param when it's the default (standard) to keep URLs clean
    if (riskTolerance !== "standard") params.set("risk", riskTolerance);

    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [truck, pickupLevel, currentLevel, distance, gasPrice, gaugeVariant, riskTolerance]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setCopyError(false);
      setFallbackUrl("");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (non-secure context, permission denied).
      // Capture the URL here (client-only event handler — window is always defined)
      // and surface a persistent field the user can manually select and copy.
      setCopyError(true);
      setCopied(false);
      setFallbackUrl(window.location.href);
      setTimeout(() => setCopyError(false), 4000);
    }
  }

  // When the fallback URL field appears, auto-select its text so the user
  // can copy immediately with Ctrl+C / Cmd+C.
  useEffect(() => {
    if (fallbackUrl && fallbackInputRef.current) {
      fallbackInputRef.current.select();
    }
  }, [fallbackUrl]);

  // Initialise maps preference after mount (navigator + localStorage are browser-only).
  useEffect(() => {
    setMapsApp(getDefaultMapsApp());
  }, []);

  function handleMapsAppToggle() {
    const next: MapsApp = mapsApp === "google" ? "apple" : "google";
    setMapsApp(next);
    try {
      localStorage.setItem(MAPS_APP_KEY, next);
    } catch {
      // localStorage unavailable — preference won't persist, but the link still works.
    }
  }

  const parsedGasPrice = gasPrice !== "" ? parseFloat(gasPrice) : NaN;
  const validGasPrice = !isNaN(parsedGasPrice) && parsedGasPrice >= 0.01 ? parsedGasPrice : undefined;
  const gasPriceTooLow = gasPrice !== "" && !isNaN(parsedGasPrice) && parsedGasPrice < 0.01;

  const result =
    truck != null
      ? calculateFuelReturn({
          truck,
          pickupLevel,
          currentLevel,
          distanceToDropoff: distance,
          gasPricePerGallon: validGasPrice,
          safetyBuffer: RISK_TOLERANCE_BUFFERS[riskTolerance],
        })
      : null;

  const scrollResultIntoView = useCallback(() => {
    if (!result) return;
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [result]);

  return (
    <main id="main-content" className="flex flex-1 flex-col items-center bg-background px-4 py-12">
      <div className="relative w-full max-w-lg">
        {/* Theme toggle — top right */}
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <Fuel size={40} className="text-accent" aria-hidden="true" />
          </div>
          <p className="text-3xl font-bold tracking-tight text-text-primary">FillRight</p>
          <h1 className="mt-1 text-xl font-semibold text-text-primary">Moving Truck Fuel Return Calculator</h1>
          <p className="mt-1 text-sm text-text-secondary">Avoid the $30 fuel surcharge — get the exact gallons for U&#8209;Haul, Penske, Budget &amp; Enterprise.</p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Step 1: Truck */}
          <section className="rounded-xl border border-border bg-surface p-5 shadow-sm ring-1 ring-border">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="border-l-2 border-accent pl-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
                Step 1 — Your Truck
              </h2>
              <Link
                href="/truck-specs"
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                View specs<span aria-hidden="true"> →</span>
              </Link>
            </div>
            <TruckSelector value={truck} onChange={setTruck} />
          </section>

          {/* Step 2: Fuel levels */}
          <section className="rounded-xl border border-border bg-surface p-5 shadow-sm ring-1 ring-border">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="border-l-2 border-accent pl-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
                Step 2 — Fuel Levels
              </h2>
              <div className="flex bg-surface-raised rounded-md p-0.5 gap-0.5">
                {(["arc", "horizontal"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setGaugeVariant(v)}
                    aria-pressed={gaugeVariant === v}
                    className={[
                      "px-3 py-1 text-xs font-semibold rounded transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      gaugeVariant === v
                        ? "bg-surface text-accent shadow-sm"
                        : "text-text-muted hover:text-text-primary",
                    ].join(" ")}
                  >
                    {v === "arc" ? "Arc" : "Bar"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FuelGauge
                label="At Pickup"
                value={pickupLevel}
                onChange={setPickupLevel}
                variant={gaugeVariant}
              />
              <FuelGauge
                label="Right Now"
                value={currentLevel}
                onChange={setCurrentLevel}
                variant={gaugeVariant}
              />
            </div>
            <p className="mt-3 text-xs text-text-muted text-center">
              &ldquo;At Pickup&rdquo; is the level shown on your rental contract.
            </p>
          </section>

          {/* Step 3: Distance + gas price */}
          <section className="rounded-xl border border-border bg-surface p-5 shadow-sm ring-1 ring-border">
            <h2 className="mb-4 border-l-2 border-accent pl-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
              Step 3 — Final Drive
            </h2>
            <DistanceInput value={distance} onChange={setDistance} onBlur={scrollResultIntoView} />

            {/* Risk Tolerance selector */}
            <div className="mt-6">
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
                  const levels = ["conservative", "standard", "lean"] as const;
                  const idx = levels.indexOf(riskTolerance);
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                    e.preventDefault();
                    const next = levels[(idx + 1) % levels.length];
                    setRiskTolerance(next);
                    (e.currentTarget.querySelector(`[data-level="${next}"]`) as HTMLElement | null)?.focus();
                  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                    e.preventDefault();
                    const prev = levels[(idx - 1 + levels.length) % levels.length];
                    setRiskTolerance(prev);
                    (e.currentTarget.querySelector(`[data-level="${prev}"]`) as HTMLElement | null)?.focus();
                  }
                }}
              >
                {(["conservative", "standard", "lean"] as const).map((level) => {
                  const config = RISK_TOLERANCE_CONFIG[level];
                  const isSelected = riskTolerance === level;
                  return (
                    <button
                      key={level}
                      role="radio"
                      aria-checked={isSelected}
                      data-level={level}
                      onClick={() => setRiskTolerance(level)}
                      tabIndex={isSelected ? 0 : -1}
                      className={[
                        "flex-1 px-3 py-2.5 text-sm font-semibold transition-colors text-center",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                        "border-r-2 border-border last:border-r-0",
                        isSelected
                          ? "bg-accent text-white"
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
                {RISK_TOLERANCE_CONFIG[riskTolerance].description}
              </p>
            </div>

            {/* Optional gas price */}
            <div className="mt-4 flex flex-col gap-2">
              <label
                htmlFor="gas-price"
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
                  id="gas-price"
                  type="number"
                  inputMode="decimal"
                  min={0.01}
                  step={0.01}
                  placeholder="3.99"
                  value={gasPrice}
                  onChange={(e) => setGasPrice(e.target.value)}
                  onBlur={scrollResultIntoView}
                  aria-label="Gas price per gallon in dollars"
                  aria-describedby="gas-price-hint"
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
              <p
                id="gas-price-hint"
                aria-live="polite"
                className={`text-xs ${gasPriceTooLow ? "text-red-600 dark:text-red-400" : "text-text-muted"}`}
              >
                {gasPriceTooLow
                  ? "Enter at least $0.01 to see a cost estimate"
                  : "Enter $0.01 or more to see a cost estimate"}
              </p>
            </div>
          </section>

          {/* Result */}
          <section
            ref={resultRef}
            data-result={result ? "true" : undefined}
            aria-live="polite"
            aria-atomic="true"
            className={result ? [
              "rounded-xl border-2 p-5 shadow-sm transition-colors",
              result.alreadySufficient
                ? "border-green-500 bg-green-50 dark:border-green-700 dark:bg-green-950/40"
                : result.isAtRisk
                ? "border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-950/40"
                : "border-accent bg-accent-subtle",
            ].join(" ") : ""}
          >
            {!truck && (
              <p className="sr-only">Select a truck above to see your fuel calculation.</p>
            )}
            {result && (
              <>
                {result.alreadySufficient ? (
                  <div className="text-center">
                    <div className="text-3xl mb-1">✅</div>
                    <p className="text-lg font-bold text-green-800 dark:text-green-300">You&apos;re good to go!</p>
                    <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                      Your current fuel level is sufficient for return.
                    </p>
                  </div>
                ) : (
                  <>
                    {result.isAtRisk && (
                      <div
                        role="alert"
                        className="mb-4 flex items-start gap-3 rounded-lg border-2 border-red-500 bg-red-100 px-4 py-3 text-red-800 dark:border-red-700 dark:bg-red-950/60 dark:text-red-300"
                      >
                        <span aria-hidden="true" className="text-2xl leading-none">⚠️</span>
                        <div>
                          <p className="font-bold text-base">$30 Service Fee Risk</p>
                          <p className="text-sm mt-0.5">
                            Your tank will drop below ¼ before drop-off. Fill up to avoid the rental company&apos;s refueling surcharge.
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-1">
                        Add before returning
                      </p>
                      <p className="text-5xl font-bold text-text-primary">
                        {result.gallonsToAdd}
                        <span className="text-2xl font-semibold text-text-secondary ml-1">gal</span>
                      </p>
                      {result.costEstimate != null && (
                        <p className="mt-2 text-xl font-semibold text-accent">
                          ≈ ${result.costEstimate.toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Breakdown */}
                    <div className="mt-4 rounded-lg bg-surface/60 px-4 py-3 text-sm text-text-secondary space-y-1">
                      <div className="flex justify-between">
                        <span>Needed at return</span>
                        <span className="font-medium">{result.breakdown.gallonsAtPickup} gal</span>
                      </div>
                      <div className="flex justify-between">
                        <span>In tank now</span>
                        <span className="font-medium">{result.breakdown.gallonsNow} gal</span>
                      </div>
                      {result.breakdown.gallonsForFinalDrive > 0 && (
                        <div className="flex justify-between">
                          <span>Final drive</span>
                          <span className="font-medium">−{result.breakdown.gallonsForFinalDrive} gal</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-border pt-1">
                        <span>Safety buffer</span>
                        <span className="font-medium">+{result.bufferApplied} gal</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Share link */}
                <div className="mt-4 flex flex-col items-center gap-2">
                  <button
                    onClick={copyLink}
                    className={[
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      copied
                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-surface/70 text-text-secondary hover:bg-surface hover:text-text-primary",
                    ].join(" ")}
                    aria-label="Copy shareable link to clipboard"
                  >
                    {copied ? <><span aria-hidden="true">✓ </span>Link copied!</> : "Share this calculation"}
                  </button>
                  {copyError && (
                    <p className="text-sm text-red-600 dark:text-red-400 text-center">
                      Could not copy — use the link below:
                    </p>
                  )}
                  {fallbackUrl && (
                    <input
                      ref={fallbackInputRef}
                      type="text"
                      readOnly
                      value={fallbackUrl}
                      aria-label="Shareable link — select all and copy"
                      className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary select-all"
                      onFocus={(e) => e.currentTarget.select()}
                      onClick={(e) => e.currentTarget.select()}
                    />
                  )}
                  {/* Polite live region: announces copy success/failure to screen readers
                      without the AT cross-browser quirk of dynamic button label changes. */}
                  <span aria-live="polite" className="sr-only">
                    {copied ? "Link copied to clipboard." : ""}
                    {copyError ? "Could not copy link. A shareable link field is now available below — select all and copy." : ""}
                  </span>
                </div>

                {/* Gas station finder link */}
                <div className="mt-3 flex flex-col items-center gap-1">
                  <a
                    href={getGasStationUrl(truck?.fuelType ?? "regular", mapsApp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Find a nearby ${truck?.fuelType === "diesel" ? "diesel " : ""}gas station in ${mapsApp === "apple" ? "Apple Maps" : "Google Maps"} (opens in new tab)`}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-surface/70 text-text-secondary hover:bg-surface hover:text-text-primary"
                  >
                    <MapPin size={16} aria-hidden="true" />
                    Find a nearby gas station
                  </a>
                  <button
                    onClick={handleMapsAppToggle}
                    className="text-xs text-text-muted hover:text-text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    aria-label={`Switch to ${mapsApp === "google" ? "Apple Maps" : "Google Maps"}`}
                  >
                    {mapsApp === "google" ? "Google Maps" : "Apple Maps"} · switch
                  </button>
                </div>
              </>
            )}
          </section>

          {!truck && (
            <div className="rounded-xl border border-border bg-surface/70 px-5 py-4 text-center text-sm text-text-secondary">
              <p className="font-medium text-text-primary mb-1">👆 Select your truck size above to see the calculation.</p>
              <p>Each truck has a different tank capacity and fuel efficiency — FillRight uses these to calculate exactly how much to add.</p>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-text-secondary">
          Estimates only — verify with your rental contract. Not affiliated with any rental company.
        </p>
      </div>

      {/* SEO content — How it works, Why it matters, FAQ */}
      <div className="w-full max-w-lg mt-16 mb-12 space-y-12 text-text-secondary">

        {/* How FillRight Works */}
        <section aria-labelledby="how-it-works-heading">
          <h2 id="how-it-works-heading" className="text-xl font-bold text-text-primary mb-5">How FillRight Works</h2>
          <ol className="space-y-5 list-none">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-muted text-text-primary font-bold text-sm flex items-center justify-center" aria-hidden="true">1</span>
              <div>
                <p className="font-semibold text-text-primary">Select your truck</p>
                <p className="text-sm text-text-secondary mt-0.5">Choose your rental company and truck size. FillRight knows the exact tank capacity for every U-Haul, Penske, Budget, and Enterprise model.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-muted text-text-primary font-bold text-sm flex items-center justify-center" aria-hidden="true">2</span>
              <div>
                <p className="font-semibold text-text-primary">Set your fuel levels</p>
                <p className="text-sm text-text-secondary mt-0.5">Enter the gauge level shown on your rental contract at pickup, then set your current level. FillRight calculates the gap.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-muted text-text-primary font-bold text-sm flex items-center justify-center" aria-hidden="true">3</span>
              <div>
                <p className="font-semibold text-text-primary">Get your answer</p>
                <p className="text-sm text-text-secondary mt-0.5">See the exact gallons to add, adjusted for any miles still left to drive. Add your gas price for a cost estimate.</p>
              </div>
            </li>
          </ol>
        </section>

        {/* Why This Matters */}
        <section aria-labelledby="why-it-matters-heading" className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-5">
          <h2 id="why-it-matters-heading" className="text-lg font-bold text-text-primary mb-2">Why the fuel level matters</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            U-Haul, Penske, Budget, and Enterprise all charge a <strong>$30+ fuel service fee</strong> if you return a truck below the level shown on your contract — plus above-market per-gallon rates to top up the difference. FillRight gives you the exact number so you fill up at a regular gas station, not theirs.
          </p>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-bold text-text-primary mb-5">Frequently Asked Questions</h2>
          <dl className="space-y-6">
            <div>
              <dt className="font-semibold text-text-primary">How much gas do I need to return a U-Haul?</dt>
              <dd className="mt-1 text-sm text-text-secondary leading-relaxed">It depends on your truck size, the fuel level at pickup, your current level, and how far you still need to drive. Use FillRight above to get the exact gallon count — it accounts for tank capacity, fuel efficiency, and a small safety buffer.</dd>
            </div>
            <div>
              <dt className="font-semibold text-text-primary">What happens if I return a U-Haul without enough fuel?</dt>
              <dd className="mt-1 text-sm text-text-secondary leading-relaxed">U-Haul charges a $30 fuel service fee plus above-market per-gallon rates to top up the difference. You end up paying significantly more than you would at a regular gas station.</dd>
            </div>
            <div>
              <dt className="font-semibold text-text-primary">Does U-Haul use regular gas or diesel?</dt>
              <dd className="mt-1 text-sm text-text-secondary leading-relaxed">All U-Haul trucks use regular unleaded gasoline — never diesel. Penske 22 ft and 26 ft trucks use diesel; their smaller trucks use regular. Budget&apos;s 26 ft truck uses diesel; the 12 ft and 16 ft use regular. Enterprise&apos;s 16 ft Cabover, 24 ft, and 26 ft trucks use diesel; the 15 ft Parcel Van uses regular. FillRight shows the correct fuel type for your truck.</dd>
            </div>
            <div>
              <dt className="font-semibold text-text-primary">How accurate is the fuel gauge on a moving truck?</dt>
              <dd className="mt-1 text-sm text-text-secondary leading-relaxed">Moving truck gauges can lag or read slightly low after refueling. FillRight adds a small safety buffer to your calculation so you&apos;re protected even if the gauge isn&apos;t perfectly accurate at return.</dd>
            </div>
            <div>
              <dt className="font-semibold text-text-primary">Can I use FillRight for Penske, Budget, and Enterprise trucks?</dt>
              <dd className="mt-1 text-sm text-text-secondary leading-relaxed">Yes. FillRight supports all four major rental companies. Each truck model has accurate tank capacity and fuel efficiency data built in, so your result is specific to your exact truck.</dd>
            </div>
            <div>
              <dt className="font-semibold text-text-primary">What is U-Haul&apos;s fuel policy?</dt>
              <dd className="mt-1 text-sm text-text-secondary leading-relaxed">U-Haul requires you to return the truck at the same fuel level documented on your rental agreement at pickup. Returning below that level triggers a service fee plus per-gallon charges at their rates — typically higher than local pump prices.</dd>
            </div>
          </dl>
        </section>

      </div>
    </main>
  );
}
