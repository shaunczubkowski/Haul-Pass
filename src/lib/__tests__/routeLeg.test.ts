import { describe, it, expect } from "vitest";
import { calculateRouteLeg } from "@/lib/calculator";
import type { RouteLegInput, TruckType } from "@/types";
import { GAUGE_LEVELS } from "@/types";

// 15ft U-Haul: 40 gal, 10 MPG
const TRUCK: TruckType = {
  id: "uhaul-15ft",
  name: "15 ft Truck",
  company: "uhaul",
  tankCapacity: 40,
  mpg: 10,
  fuelType: "regular",
};

const base = (overrides: Partial<RouteLegInput> = {}): RouteLegInput => ({
  truck: TRUCK,
  mpgMultiplier: 1.0,
  safetyBuffer: 0,
  legDistanceMiles: 180,
  startingFuelFraction: GAUGE_LEVELS.FULL,
  targetFuelFraction: GAUGE_LEVELS.FULL,
  ...overrides,
});

describe("calculateRouteLeg", () => {
  describe("fuel consumed", () => {
    it("calculates gallons consumed over the leg distance", () => {
      // 180 miles / 10 MPG = 18 gal consumed
      const result = calculateRouteLeg(base());
      expect(result.gallonsConsumed).toBe(18);
    });

    it("applies mpgMultiplier to effective MPG", () => {
      // 180 miles / (10 * 0.75) = 180 / 7.5 = 24 gal consumed
      const result = calculateRouteLeg(base({ mpgMultiplier: 0.75 }));
      expect(result.gallonsConsumed).toBeCloseTo(24, 1);
    });
  });

  describe("fuel level at arrival", () => {
    it("computes fuel fraction remaining after leg", () => {
      // Start FULL (40 gal), burn 18 gal → 22 gal → 22/40 = 0.55
      const result = calculateRouteLeg(base());
      expect(result.fuelFractionAtArrival).toBeCloseTo(0.55, 2);
    });

    it("clamps fuel fraction to 0 if consumption exceeds starting fuel", () => {
      // Start at 1/4 (10 gal), 200 miles / 10 MPG = 20 gal burned → can't go negative
      const result = calculateRouteLeg(
        base({ startingFuelFraction: GAUGE_LEVELS.QUARTER, legDistanceMiles: 200 })
      );
      expect(result.fuelFractionAtArrival).toBe(0);
    });
  });

  describe("gallons to add at stop", () => {
    it("calculates gallons to add to reach target FULL", () => {
      // Arrive with 22 gal (0.55), target FULL (40 gal) → add 18 gal
      const result = calculateRouteLeg(base());
      expect(result.gallonsToAdd).toBe(18);
    });

    it("calculates gallons for partial target (final leg to contract level)", () => {
      // Start FULL (40 gal), 180 miles / 10 MPG = 18 gal consumed → 22 gal remain
      // Target 3/4 (30 gal) → add 30 - 22 = 8 gal
      const result = calculateRouteLeg(
        base({ targetFuelFraction: GAUGE_LEVELS.THREE_QUARTER })
      );
      expect(result.gallonsToAdd).toBe(8);
    });

    it("includes safety buffer in gallons to add", () => {
      // 18 gal + 0.5 buffer = 18.5
      const result = calculateRouteLeg(base({ safetyBuffer: 0.5 }));
      expect(result.gallonsToAdd).toBe(18.5);
    });

    it("returns 0 gallons when arrival level already meets or exceeds target", () => {
      // Start FULL (40 gal), 0 miles driven → still FULL → no fuel needed to reach FULL
      const result = calculateRouteLeg(base({ legDistanceMiles: 0 }));
      expect(result.gallonsToAdd).toBe(0);
    });

    it("rounds gallons to add to 1 decimal place", () => {
      // 180 miles / (10 * 0.75 MPG) = 24 gal consumed; start FULL (40) → arrive at 16 gal
      // Target FULL → add 24 gal exactly
      const result = calculateRouteLeg(base({ mpgMultiplier: 0.75 }));
      expect(result.gallonsToAdd).toBeCloseTo(24, 1);
    });
  });

  describe("risk detection", () => {
    it("isAtRisk=true when arrival fuel fraction drops below 1/4", () => {
      // Start at HALF (20 gal), 180 miles / 10 MPG = 18 gal consumed → 2 gal = 0.05 fraction
      const result = calculateRouteLeg(
        base({ startingFuelFraction: GAUGE_LEVELS.HALF })
      );
      expect(result.isAtRisk).toBe(true);
    });

    it("isAtRisk=false when arrival fuel fraction stays at or above 1/4", () => {
      // Start FULL (40 gal), 100 miles / 10 MPG = 10 gal → 30 gal = 0.75 fraction
      const result = calculateRouteLeg(base({ legDistanceMiles: 100 }));
      expect(result.isAtRisk).toBe(false);
    });

    it("isAtRisk=false when arrival fraction is exactly 1/4 (boundary)", () => {
      // Start FULL (40 gal), need to arrive at exactly 10 gal (1/4)
      // 40 - 10 = 30 gal consumed → 30 * 10 MPG = 300 miles
      const result = calculateRouteLeg(base({ legDistanceMiles: 300 }));
      expect(result.fuelFractionAtArrival).toBeCloseTo(0.25, 2);
      expect(result.isAtRisk).toBe(false);
    });
  });

  describe("cost estimation", () => {
    it("calculates cost when gas price is provided", () => {
      // 18 gal × $3.50 = $63.00
      const result = calculateRouteLeg(base({ gasPricePerGallon: 3.5 }));
      expect(result.estimatedCost).toBeCloseTo(63.0, 2);
    });

    it("returns null when no gas price is provided", () => {
      const result = calculateRouteLeg(base());
      expect(result.estimatedCost).toBeNull();
    });

    it("returns null when gallonsToAdd is 0", () => {
      const result = calculateRouteLeg(base({ legDistanceMiles: 0, gasPricePerGallon: 3.5 }));
      expect(result.estimatedCost).toBeNull();
    });
  });
});
