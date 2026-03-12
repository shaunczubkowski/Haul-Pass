"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FuelGauge } from "@/components/FuelGauge";
import { TruckSelector } from "@/components/TruckSelector";
import { DistanceInput } from "@/components/DistanceInput";
import { calculateFuelReturn } from "@/lib/calculator";
import { GAUGE_LEVELS } from "@/types";
import { getTruckById } from "@/data/trucks";
import type { GaugeLevel, TruckType } from "@/types";

// Only the 5 levels selectable via the UI; used for URL param validation
const VALID_LEVELS = new Set([0, 0.25, 0.5, 0.75, 1.0]);

function readUrlParams() {
  if (typeof window === "undefined") {
    return { truck: null, pickupLevel: GAUGE_LEVELS.FULL, currentLevel: GAUGE_LEVELS.HALF, distance: 0, gasPrice: "" };
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

  const MAX_DISTANCE_MILES = 10_000;
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
    if (!isNaN(parsedGas) && parsedGas > 0) gasPrice = String(parsedGas);
  }

  return { truck, pickupLevel, currentLevel, distance, gasPrice };
}

export default function Home() {
  // Parse URL params once; the lazy initializer runs only on first render.
  const [initialParams] = useState(readUrlParams);
  const [truck, setTruck] = useState<TruckType | null>(initialParams.truck);
  const [pickupLevel, setPickupLevel] = useState<GaugeLevel>(initialParams.pickupLevel);
  const [currentLevel, setCurrentLevel] = useState<GaugeLevel>(initialParams.currentLevel);
  const [distance, setDistance] = useState<number>(initialParams.distance);
  const [gasPrice, setGasPrice] = useState<string>(initialParams.gasPrice);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const resultRef = useRef<HTMLElement | null>(null);

  // Sync state to URL (replaceState — no browser history spam)
  useEffect(() => {
    const params = new URLSearchParams();
    if (truck) params.set("truck", truck.id);
    params.set("pickup", String(pickupLevel));
    params.set("current", String(currentLevel));
    if (distance > 0) params.set("dist", String(distance));
    if (gasPrice !== "") params.set("gas", gasPrice);

    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [truck, pickupLevel, currentLevel, distance, gasPrice]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (non-secure context, browser permission denied)
      setCopyError(true);
      setCopied(false);
      setTimeout(() => setCopyError(false), 4000);
    }
  }

  const result =
    truck != null
      ? calculateFuelReturn({
          truck,
          pickupLevel,
          currentLevel,
          distanceToDropoff: distance,
          gasPricePerGallon: gasPrice !== "" && !isNaN(parseFloat(gasPrice)) && parseFloat(gasPrice) > 0 ? parseFloat(gasPrice) : undefined,
        })
      : null;

  const scrollResultIntoView = useCallback(() => {
    if (!result) return;
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [result]);

  return (
    <main id="main-content" className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl" aria-hidden="true">⛽</div>
          <p className="text-3xl font-bold tracking-tight text-zinc-900">FillRight</p>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">Moving Truck Fuel Return Calculator</h1>
          <p className="mt-1 text-sm text-zinc-500">Avoid the $30 fuel surcharge — get the exact gallons for U&#8209;Haul, Penske, Budget &amp; Enterprise.</p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Step 1: Truck */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Step 1 — Your Truck
            </h2>
            <TruckSelector value={truck} onChange={setTruck} />
          </section>

          {/* Step 2: Fuel levels */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Step 2 — Fuel Levels
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <FuelGauge
                label="At Pickup"
                value={pickupLevel}
                onChange={setPickupLevel}
              />
              <FuelGauge
                label="Right Now"
                value={currentLevel}
                onChange={setCurrentLevel}
              />
            </div>
            <p className="mt-3 text-xs text-zinc-400 text-center">
              &ldquo;At Pickup&rdquo; is the level shown on your rental contract.
            </p>
          </section>

          {/* Step 3: Distance + gas price */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Step 3 — Final Drive
            </h2>
            <DistanceInput value={distance} onChange={setDistance} onBlur={scrollResultIntoView} />

            {/* Optional gas price */}
            <div className="mt-4 flex flex-col gap-2">
              <label
                htmlFor="gas-price"
                className="text-sm font-medium text-gray-600 uppercase tracking-wide"
              >
                Gas Price{" "}
                <span className="text-zinc-400 normal-case font-normal">(optional)</span>
              </label>
              <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden focus-within:border-orange-400 transition-colors">
                <span className="flex items-center px-3 bg-gray-50 text-sm font-semibold text-gray-500 border-r-2 border-gray-200">
                  $
                </span>
                <input
                  id="gas-price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.01}
                  placeholder="3.99"
                  value={gasPrice}
                  onChange={(e) => setGasPrice(e.target.value)}
                  onBlur={scrollResultIntoView}
                  aria-label="Gas price per gallon in dollars"
                  className={[
                    "flex-1 px-3 py-3 text-lg font-semibold text-gray-900 bg-white",
                    "outline-none appearance-none",
                    "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                  ].join(" ")}
                />
                <span className="flex items-center px-3 bg-gray-50 text-sm font-semibold text-gray-500 border-l-2 border-gray-200">
                  /gal
                </span>
              </div>
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
                ? "border-green-400 bg-green-50"
                : result.isAtRisk
                ? "border-red-400 bg-red-50"
                : "border-orange-400 bg-orange-50",
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
                    <p className="text-lg font-bold text-green-800">You&apos;re good to go!</p>
                    <p className="mt-1 text-sm text-green-700">
                      Your current fuel level is sufficient for return.
                    </p>
                  </div>
                ) : (
                  <>
                    {result.isAtRisk && (
                      <div
                        role="alert"
                        className="mb-4 flex items-start gap-3 rounded-lg border-2 border-red-500 bg-red-100 px-4 py-3 text-red-800"
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
                      <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-1">
                        Add before returning
                      </p>
                      <p className="text-5xl font-bold text-zinc-900">
                        {result.gallonsToAdd}
                        <span className="text-2xl font-semibold text-zinc-500 ml-1">gal</span>
                      </p>
                      {result.costEstimate != null && (
                        <p className="mt-2 text-xl font-semibold text-orange-600">
                          ≈ ${result.costEstimate.toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Breakdown */}
                    <div className="mt-4 rounded-lg bg-white/60 px-4 py-3 text-sm text-zinc-600 space-y-1">
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
                      <div className="flex justify-between border-t border-zinc-200 pt-1">
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
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      copied
                        ? "bg-green-100 text-green-700"
                        : "bg-white/70 text-zinc-600 hover:bg-white hover:text-zinc-900",
                    ].join(" ")}
                    aria-label="Copy shareable link to clipboard"
                  >
                    {copied ? <><span aria-hidden="true">✓ </span>Link copied!</> : "Share this calculation"}
                  </button>
                  {copyError && (
                    <p className="text-sm text-red-600 text-center">
                      Could not copy link — please copy the URL from your address bar.
                    </p>
                  )}
                  {/* Polite live region: announces copy success/failure to screen readers
                      without the AT cross-browser quirk of dynamic button label changes. */}
                  <span aria-live="polite" className="sr-only">
                    {copied ? "Link copied to clipboard." : ""}
                    {copyError ? "Could not copy link." : ""}
                  </span>
                </div>
              </>
            )}
          </section>

          {!truck && (
            <div className="rounded-xl border border-zinc-200 bg-white/70 px-5 py-4 text-center text-sm text-zinc-500">
              <p className="font-medium text-zinc-700 mb-1">👆 Select your truck size above to see the calculation.</p>
              <p>Each truck has a different tank capacity and fuel efficiency — FillRight uses these to calculate exactly how much to add.</p>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-zinc-600">
          Estimates only — verify with your rental contract. Not affiliated with any rental company.
        </p>
      </div>

      {/* SEO content — How it works, Why it matters, FAQ */}
      <div className="w-full max-w-lg mt-16 mb-12 space-y-12 text-zinc-700">

        {/* How FillRight Works */}
        <section aria-labelledby="how-it-works-heading">
          <h2 id="how-it-works-heading" className="text-xl font-bold text-zinc-900 mb-5">How FillRight Works</h2>
          <ol className="space-y-5 list-none">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center" aria-hidden="true">1</span>
              <div>
                <p className="font-semibold text-zinc-800">Select your truck</p>
                <p className="text-sm text-zinc-500 mt-0.5">Choose your rental company and truck size. FillRight knows the exact tank capacity for every U-Haul, Penske, Budget, and Enterprise model.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center" aria-hidden="true">2</span>
              <div>
                <p className="font-semibold text-zinc-800">Set your fuel levels</p>
                <p className="text-sm text-zinc-500 mt-0.5">Enter the gauge level shown on your rental contract at pickup, then set your current level. FillRight calculates the gap.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center" aria-hidden="true">3</span>
              <div>
                <p className="font-semibold text-zinc-800">Get your answer</p>
                <p className="text-sm text-zinc-500 mt-0.5">See the exact gallons to add, adjusted for any miles still left to drive. Add your gas price for a cost estimate.</p>
              </div>
            </li>
          </ol>
        </section>

        {/* Why This Matters */}
        <section aria-labelledby="why-it-matters-heading" className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 id="why-it-matters-heading" className="text-lg font-bold text-zinc-900 mb-2">Why the fuel level matters</h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            U-Haul, Penske, Budget, and Enterprise all charge a <strong>$30+ fuel service fee</strong> if you return a truck below the level shown on your contract — plus above-market per-gallon rates to top up the difference. FillRight gives you the exact number so you fill up at a regular gas station, not theirs.
          </p>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-bold text-zinc-900 mb-5">Frequently Asked Questions</h2>
          <dl className="space-y-6">
            <div>
              <dt className="font-semibold text-zinc-800">How much gas do I need to return a U-Haul?</dt>
              <dd className="mt-1 text-sm text-zinc-500 leading-relaxed">It depends on your truck size, the fuel level at pickup, your current level, and how far you still need to drive. Use FillRight above to get the exact gallon count — it accounts for tank capacity, fuel efficiency, and a small safety buffer.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-800">What happens if I return a U-Haul without enough fuel?</dt>
              <dd className="mt-1 text-sm text-zinc-500 leading-relaxed">U-Haul charges a $30 fuel service fee plus above-market per-gallon rates to top up the difference. You end up paying significantly more than you would at a regular gas station.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-800">Does U-Haul use regular gas or diesel?</dt>
              <dd className="mt-1 text-sm text-zinc-500 leading-relaxed">All U-Haul trucks use regular unleaded gasoline — never diesel. Penske trucks use diesel. Budget and Enterprise trucks use regular unleaded. FillRight shows the correct fuel type for your truck.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-800">How accurate is the fuel gauge on a moving truck?</dt>
              <dd className="mt-1 text-sm text-zinc-500 leading-relaxed">Moving truck gauges can lag or read slightly low after refueling. FillRight adds a small safety buffer to your calculation so you&apos;re protected even if the gauge isn&apos;t perfectly accurate at return.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-800">Can I use FillRight for Penske, Budget, and Enterprise trucks?</dt>
              <dd className="mt-1 text-sm text-zinc-500 leading-relaxed">Yes. FillRight supports all four major rental companies. Each truck model has accurate tank capacity and fuel efficiency data built in, so your result is specific to your exact truck.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-800">What is U-Haul&apos;s fuel policy?</dt>
              <dd className="mt-1 text-sm text-zinc-500 leading-relaxed">U-Haul requires you to return the truck at the same fuel level documented on your rental agreement at pickup. Returning below that level triggers a service fee plus per-gallon charges at their rates — typically higher than local pump prices.</dd>
            </div>
          </dl>
        </section>

      </div>
    </main>
  );
}
