export type FuelType = "regular" | "diesel";

export type RentalCompany = "uhaul" | "penske" | "budget" | "enterprise";

export interface TruckType {
  id: string;
  name: string;
  company: RentalCompany;
  tankCapacity: number; // gallons
  mpg: number; // estimated miles per gallon (empty truck)
  fuelType: FuelType;
  loadSize?: string; // approximate move size, e.g. "1–2 bedrooms"
}

// Standard gauge levels (fraction of full tank: 0–1)
export const GAUGE_LEVELS = {
  EMPTY: 0,
  ONE_EIGHTH: 0.125,
  QUARTER: 0.25,
  THREE_EIGHTHS: 0.375,
  HALF: 0.5,
  FIVE_EIGHTHS: 0.625,
  THREE_QUARTER: 0.75,
  SEVEN_EIGHTHS: 0.875,
  FULL: 1.0,
} as const;

export type GaugeLevel = (typeof GAUGE_LEVELS)[keyof typeof GAUGE_LEVELS];

export const GAUGE_LEVEL_LABELS: Record<GaugeLevel, string> = {
  0: "E",
  0.125: "1/8",
  0.25: "1/4",
  0.375: "3/8",
  0.5: "1/2",
  0.625: "5/8",
  0.75: "3/4",
  0.875: "7/8",
  1.0: "F",
};

export interface CalculatorInput {
  truck: TruckType;
  pickupLevel: GaugeLevel; // fuel level at pickup (from contract)
  currentLevel: GaugeLevel; // fuel level right now
  distanceToDropoff: number; // miles
  safetyBuffer?: number; // extra gallons to add for gauge imprecision (default: 0.5)
  gasPricePerGallon?: number; // optional, for cost estimate; must be >= 0.01 if provided — sub-cent values are treated as unset
}

export interface CalculatorResult {
  gallonsToAdd: number;
  alreadySufficient: boolean; // true if current level already meets or exceeds what's needed
  isAtRisk: boolean; // true if current level is dangerously close to the $30 fee threshold
  bufferApplied: number; // gallons of safety buffer included
  costEstimate: number | null; // null if no gas price provided
  breakdown: {
    gallonsAtPickup: number;
    gallonsNow: number;
    gallonsForFinalDrive: number;
    deficit: number;
  };
}

export type RiskTolerance = "conservative" | "standard" | "lean";

export const RISK_TOLERANCE_CONFIG: Record<
  RiskTolerance,
  { threshold: GaugeLevel; label: string; description: string }
> = {
  conservative: {
    threshold: GAUGE_LEVELS.HALF,
    label: "Conservative",
    description: "Fill up when tank hits 1/2 — recommended for mountain routes",
  },
  standard: {
    threshold: GAUGE_LEVELS.THREE_EIGHTHS,
    label: "Standard",
    description: "Fill up when tank hits 3/8 — comfortable buffer above fee threshold",
  },
  lean: {
    threshold: GAUGE_LEVELS.QUARTER,
    label: "Lean",
    description: "Fill up when tank hits 1/4 — for experienced movers on urban routes",
  },
};
