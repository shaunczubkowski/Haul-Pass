import type { CalculatorInput, CalculatorResult, IndicatedLevel, RiskTolerance } from "@/types";
import { GAUGE_LEVELS, RISK_TOLERANCE_CONFIG } from "@/types";

/**
 * Gallons of safety buffer for each risk tolerance, derived from the same config the
 * selector renders its descriptions from. Deriving rather than duplicating keeps the
 * copy a renter reads and the number the calculator applies from drifting apart —
 * see docs/adr/ and CONTEXT.md for the distinction between Risk Tolerance and the
 * en-route refuelling advice this control once claimed to give.
 */
export const RISK_TOLERANCE_BUFFERS = Object.fromEntries(
  Object.entries(RISK_TOLERANCE_CONFIG).map(([level, { bufferGallons }]) => [level, bufferGallons]),
) as Record<RiskTolerance, number>;

/**
 * The fuel level fraction below which U-Haul charges a $30 service fee.
 * Based on U-Haul's published policy: vehicles returned with less than 1/4 tank
 * are subject to an additional service charge on top of fuel costs.
 */
const UHAUL_FEE_THRESHOLD = GAUGE_LEVELS.QUARTER;

/**
 * Default safety buffer in gallons to add for analog gauge imprecision.
 * U-Haul gauges are known to be unreliable (see Aron v. U-Haul California).
 * A 0.5 gallon buffer is a conservative but reasonable margin.
 */
const DEFAULT_SAFETY_BUFFER = 0.5;

/**
 * Constrain an Indicated Level to the 0–1 range a gauge can actually show.
 *
 * Out-of-range and non-finite are different failures. A level slightly outside the range
 * still carries intent — a vision model reporting 1.02 saw a full tank — so it clamps.
 * NaN carries none, and clamping it to 0 would tell a renter their tank is empty and to
 * buy a full tank of fuel, which is the worst wrong answer this app can give. So it throws.
 *
 * See docs/adr/0003-gauge-mark-subtypes-indicated-level.md.
 */
function clampIndicatedLevel(level: IndicatedLevel, field: string): IndicatedLevel {
  if (!Number.isFinite(level)) {
    throw new RangeError(
      `${field} must be a finite Indicated Level between 0 and 1, received ${level}`,
    );
  }
  return Math.min(Math.max(level, 0), 1);
}

/**
 * Calculate how many gallons a renter needs to add before returning a moving truck.
 *
 * Formula:
 *   gallonsToAdd =
 *     (tankCapacity × pickupLevel)              // gallons needed at return
 *     - (tankCapacity × currentLevel)           // gallons currently in tank
 *     + (distanceToDropoff / effectiveMpg)      // gallons consumed on final drive
 *     + safetyBuffer                            // buffer for gauge imprecision
 *
 *   effectiveMpg = truck.mpg × mpgMultiplier    // load adjustment (1.0 = empty)
 *
 * @param input - Calculator inputs
 * @returns Result with gallons to add, cost estimate, and risk flags
 */
export function calculateFuelReturn(input: CalculatorInput): CalculatorResult {
  const { truck, distanceToDropoff, gasPricePerGallon } = input;

  // Levels are no longer constrained to the nine marks by their type, so they are
  // checked here. This is a backstop, not the validation boundary: page.tsx calls
  // this during render, so the throw is a render crash. A camera read (#18) must be
  // validated at the route before it gets here. See ADR-0003.
  const pickupLevel = clampIndicatedLevel(input.pickupLevel, "pickupLevel");
  const currentLevel = clampIndicatedLevel(input.currentLevel, "currentLevel");
  const safetyBuffer = input.safetyBuffer ?? DEFAULT_SAFETY_BUFFER;
  const mpgMultiplier = input.mpgMultiplier ?? 1.0;

  const { tankCapacity, mpg } = truck;

  // Apply load multiplier to get effective MPG (1.0 = empty truck, official MPG; <1.0 = loaded).
  // Guard against zero/negative to prevent division by zero — valid multipliers are always > 0.
  const effectiveMpg = Math.max(mpg * mpgMultiplier, 0.01);

  // Gallons the renter had at pickup (the target level to return to)
  const gallonsAtPickup = tankCapacity * pickupLevel;

  // Gallons in the tank right now
  const gallonsNow = tankCapacity * currentLevel;

  // Gallons that will be consumed on the final drive to the drop-off
  const gallonsForFinalDrive = distanceToDropoff > 0 ? distanceToDropoff / effectiveMpg : 0;

  // Deficit = how much is needed minus what's already there
  const deficit = gallonsAtPickup - gallonsNow + gallonsForFinalDrive;

  // If deficit is negative or zero (and covers buffer), the renter is already sufficient
  const rawGallonsToAdd = deficit + safetyBuffer;

  const alreadySufficient = rawGallonsToAdd <= 0;
  const gallonsToAdd = alreadySufficient ? 0 : Math.round(rawGallonsToAdd * 10) / 10;

  // Determine if the renter is at risk of the $30 service fee.
  // Risk exists when the current level, accounting for the final drive, will drop below 1/4 tank.
  const levelAfterDrive = (gallonsNow - gallonsForFinalDrive) / tankCapacity;
  const isAtRisk = levelAfterDrive < UHAUL_FEE_THRESHOLD && !alreadySufficient;

  // Cost estimate (only if gas price provided)
  const costEstimate =
    gasPricePerGallon != null && gallonsToAdd > 0
      ? Math.round(gallonsToAdd * gasPricePerGallon * 100) / 100
      : null;

  return {
    gallonsToAdd,
    alreadySufficient,
    isAtRisk,
    bufferApplied: alreadySufficient ? 0 : safetyBuffer,
    costEstimate,
    breakdown: {
      gallonsAtPickup: Math.round(gallonsAtPickup * 10) / 10,
      gallonsNow: Math.round(gallonsNow * 10) / 10,
      gallonsForFinalDrive: Math.round(gallonsForFinalDrive * 10) / 10,
      deficit: Math.round(deficit * 10) / 10,
    },
  };
}
