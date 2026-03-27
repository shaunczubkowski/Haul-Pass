import type { CalculatorInput, CalculatorResult, RiskTolerance, RouteLegInput, RouteLegResult, TruckType } from "@/types";
import { GAUGE_LEVELS, RISK_TOLERANCE_CONFIG } from "@/types";

/**
 * Maps each risk tolerance level to a safetyBuffer value in gallons.
 *
 * - Conservative: 2.0 gal — extra cushion for mountain routes, first-time movers
 * - Standard: 0.5 gal — default; comfortable buffer above the fee threshold
 * - Lean: 0.0 gal — no extra buffer; for experienced movers on short urban returns
 */
export const RISK_TOLERANCE_BUFFERS: Record<RiskTolerance, number> = {
  conservative: 2.0,
  standard: 0.5,
  lean: 0.0,
};

/**
 * Calculate fuel needed for a single leg of a multi-stop route plan.
 *
 * Formula:
 *   gallonsConsumed    = legDistanceMiles / effectiveMpg
 *   gallonsAtArrival   = max(0, startingFuelFraction × tankCapacity − gallonsConsumed)
 *   gallonsToAdd       = max(0, targetFuelFraction × tankCapacity − gallonsAtArrival + safetyBuffer)
 *   isAtRisk           = fuelFractionAtArrival < 1/4
 */
export function calculateRouteLeg(input: RouteLegInput): RouteLegResult {
  const { truck, mpgMultiplier, safetyBuffer, legDistanceMiles, startingFuelFraction, targetFuelFraction, gasPricePerGallon } = input;
  const { tankCapacity, mpg } = truck;

  const effectiveMpg = Math.max(mpg * mpgMultiplier, 0.01);
  const gallonsConsumed = legDistanceMiles > 0 ? legDistanceMiles / effectiveMpg : 0;

  const startingGallons = startingFuelFraction * tankCapacity;
  const gallonsAtArrival = Math.max(0, startingGallons - gallonsConsumed);
  const fuelFractionAtArrival = gallonsAtArrival / tankCapacity;

  const targetGallons = targetFuelFraction * tankCapacity;
  const rawGallonsToAdd = targetGallons - gallonsAtArrival + safetyBuffer;
  const gallonsToAdd = rawGallonsToAdd <= 0 ? 0 : Math.round(rawGallonsToAdd * 10) / 10;

  const isAtRisk = fuelFractionAtArrival < GAUGE_LEVELS.QUARTER;

  const estimatedCost =
    gasPricePerGallon != null && gallonsToAdd > 0
      ? Math.round(gallonsToAdd * gasPricePerGallon * 100) / 100
      : null;

  return {
    gallonsConsumed: Math.round(gallonsConsumed * 10) / 10,
    fuelFractionAtArrival: Math.round(fuelFractionAtArrival * 1000) / 1000,
    gallonsToAdd,
    estimatedCost,
    isAtRisk,
  };
}

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
  const { truck, pickupLevel, currentLevel, distanceToDropoff, gasPricePerGallon } = input;
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

/**
 * Calculate how many miles to drive between fuel stops based on truck specs,
 * load level, and risk tolerance.
 *
 * Formula:
 *   interval = floor((1 − riskThreshold) × effectiveMpg × tankCapacity × 0.9)
 *
 * The 0.9 factor provides a 10% safety margin so the truck arrives at each stop
 * comfortably above the risk threshold rather than right at it.
 * Result is clamped to [80, 350] miles.
 */
export function calculateStopInterval(
  truck: TruckType,
  mpgMultiplier: number,
  riskTolerance: RiskTolerance
): number {
  const riskThreshold = RISK_TOLERANCE_CONFIG[riskTolerance].threshold;
  const effectiveMpg = truck.mpg * mpgMultiplier;
  const interval = Math.floor((1 - riskThreshold) * effectiveMpg * truck.tankCapacity * 0.9);
  return Math.max(80, Math.min(350, interval));
}
