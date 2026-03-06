import { describe, it, expect } from "vitest";
import { calculateFuelReturn } from "@/lib/calculator";
import type { CalculatorInput, TruckType } from "@/types";
import { GAUGE_LEVELS } from "@/types";

// Canonical test truck: 15ft U-Haul (most common)
const TRUCK_15FT: TruckType = {
  id: "uhaul-15ft",
  name: "15 ft Truck",
  company: "uhaul",
  tankCapacity: 40,
  mpg: 10,
  fuelType: "regular",
};

const baseInput = (overrides: Partial<CalculatorInput> = {}): CalculatorInput => ({
  truck: TRUCK_15FT,
  pickupLevel: GAUGE_LEVELS.HALF,
  currentLevel: GAUGE_LEVELS.QUARTER,
  distanceToDropoff: 0,
  safetyBuffer: 0, // zero buffer for predictable test math
  ...overrides,
});

describe("calculateFuelReturn", () => {
  describe("basic calculations", () => {
    it("calculates gallons needed when current level is below pickup level (no drive)", () => {
      // Picked up at 1/2 (20 gal), now at 1/4 (10 gal), no distance
      // Needs: 20 - 10 + 0 = 10 gallons
      const result = calculateFuelReturn(baseInput());
      expect(result.gallonsToAdd).toBe(10);
      expect(result.alreadySufficient).toBe(false);
    });

    it("accounts for fuel consumed on the final drive to drop-off", () => {
      // 1/2 tank → 1/4 tank, 20 miles to drop-off, 10 MPG = 2 gallons for drive
      // Needs: 10 + 2 = 12 gallons
      const result = calculateFuelReturn(baseInput({ distanceToDropoff: 20 }));
      expect(result.gallonsToAdd).toBe(12);
    });

    it("includes safety buffer in gallons to add", () => {
      // 10 gallons needed + 0.5 buffer = 10.5
      const result = calculateFuelReturn(baseInput({ safetyBuffer: 0.5 }));
      expect(result.gallonsToAdd).toBe(10.5);
      expect(result.bufferApplied).toBe(0.5);
    });

    it("rounds result to 1 decimal place", () => {
      // 1/2 pickup (20 gal) - 1/4 current (10 gal) + 5 miles/10 mpg (0.5 gal) + 0.3 buffer = 10.8
      const result = calculateFuelReturn(
        baseInput({ distanceToDropoff: 5, safetyBuffer: 0.3 })
      );
      expect(result.gallonsToAdd).toBe(10.8);
    });
  });

  describe("already sufficient cases", () => {
    it("returns 0 gallons and alreadySufficient=true when current level meets or exceeds pickup level", () => {
      // Picked up at 1/4, now at 1/2 — already above required level
      const result = calculateFuelReturn(
        baseInput({
          pickupLevel: GAUGE_LEVELS.QUARTER,
          currentLevel: GAUGE_LEVELS.HALF,
        })
      );
      expect(result.gallonsToAdd).toBe(0);
      expect(result.alreadySufficient).toBe(true);
    });

    it("returns 0 gallons when current level exactly equals pickup level and no distance", () => {
      const result = calculateFuelReturn(
        baseInput({
          pickupLevel: GAUGE_LEVELS.HALF,
          currentLevel: GAUGE_LEVELS.HALF,
        })
      );
      expect(result.gallonsToAdd).toBe(0);
      expect(result.alreadySufficient).toBe(true);
    });

    it("does not apply buffer when already sufficient", () => {
      const result = calculateFuelReturn(
        baseInput({
          pickupLevel: GAUGE_LEVELS.QUARTER,
          currentLevel: GAUGE_LEVELS.THREE_QUARTER,
          safetyBuffer: 0.5,
        })
      );
      expect(result.gallonsToAdd).toBe(0);
      expect(result.bufferApplied).toBe(0);
    });
  });

  describe("risk detection", () => {
    it("sets isAtRisk=true when level will drop below 1/4 tank after final drive", () => {
      // Current at 3/8 (15 gal), drive 50 miles (5 gal consumed), ends at 10/40 = 0.25 exactly
      // Barely on the threshold — should be at risk
      const result = calculateFuelReturn(
        baseInput({
          pickupLevel: GAUGE_LEVELS.THREE_QUARTER,
          currentLevel: GAUGE_LEVELS.THREE_EIGHTHS,
          distanceToDropoff: 60, // 6 gallons consumed → 15 - 6 = 9 gal = 22.5% < 25% threshold
          safetyBuffer: 0,
        })
      );
      expect(result.isAtRisk).toBe(true);
    });

    it("sets isAtRisk=false when level stays above 1/4 tank after final drive", () => {
      const result = calculateFuelReturn(
        baseInput({
          pickupLevel: GAUGE_LEVELS.HALF,
          currentLevel: GAUGE_LEVELS.HALF,
          distanceToDropoff: 5,
          safetyBuffer: 0,
        })
      );
      expect(result.isAtRisk).toBe(false);
    });

    it("does not set isAtRisk when already sufficient", () => {
      const result = calculateFuelReturn(
        baseInput({
          pickupLevel: GAUGE_LEVELS.QUARTER,
          currentLevel: GAUGE_LEVELS.FULL,
        })
      );
      expect(result.isAtRisk).toBe(false);
      expect(result.alreadySufficient).toBe(true);
    });

    it("does not set isAtRisk when level after drive is exactly 1/4 tank (boundary)", () => {
      // Current at 1/2 (20 gal), drive 100 miles (10 gal consumed), ends at exactly 10/40 = 0.25
      // Exactly at threshold — should NOT be at risk (< not <=)
      const result = calculateFuelReturn(
        baseInput({
          pickupLevel: GAUGE_LEVELS.THREE_QUARTER,
          currentLevel: GAUGE_LEVELS.HALF,
          distanceToDropoff: 100, // 10 gal consumed → 20 - 10 = 10 gal = 25% = exactly QUARTER
          safetyBuffer: 0,
        })
      );
      expect(result.isAtRisk).toBe(false);
    });
  });

  describe("cost estimation", () => {
    it("calculates cost estimate when gas price is provided", () => {
      // 10 gallons × $3.50 = $35.00
      const result = calculateFuelReturn(
        baseInput({ gasPricePerGallon: 3.5 })
      );
      expect(result.costEstimate).toBe(35.0);
    });

    it("returns null cost estimate when gas price is not provided", () => {
      const result = calculateFuelReturn(baseInput());
      expect(result.costEstimate).toBeNull();
    });

    it("returns null cost estimate when already sufficient", () => {
      const result = calculateFuelReturn(
        baseInput({
          pickupLevel: GAUGE_LEVELS.QUARTER,
          currentLevel: GAUGE_LEVELS.FULL,
          gasPricePerGallon: 3.5,
        })
      );
      expect(result.costEstimate).toBeNull();
    });
  });

  describe("breakdown", () => {
    it("provides accurate breakdown of the calculation components", () => {
      const result = calculateFuelReturn(baseInput({ distanceToDropoff: 20 }));
      expect(result.breakdown.gallonsAtPickup).toBe(20); // 40 × 0.5
      expect(result.breakdown.gallonsNow).toBe(10); // 40 × 0.25
      expect(result.breakdown.gallonsForFinalDrive).toBe(2); // 20 / 10
      expect(result.breakdown.deficit).toBe(12); // 20 - 10 + 2
    });
  });

  describe("edge cases", () => {
    it("handles 0 distance to drop-off correctly", () => {
      const result = calculateFuelReturn(baseInput({ distanceToDropoff: 0 }));
      expect(result.breakdown.gallonsForFinalDrive).toBe(0);
    });

    it("handles a full tank at pickup returning a full tank", () => {
      const result = calculateFuelReturn(
        baseInput({
          pickupLevel: GAUGE_LEVELS.FULL,
          currentLevel: GAUGE_LEVELS.FULL,
          distanceToDropoff: 0,
        })
      );
      expect(result.gallonsToAdd).toBe(0);
      expect(result.alreadySufficient).toBe(true);
    });

    it("handles empty pickup level (edge case from contract)", () => {
      // Picked up on empty (unusual but possible) — already at empty, 0 needed
      const result = calculateFuelReturn(
        baseInput({
          pickupLevel: GAUGE_LEVELS.EMPTY,
          currentLevel: GAUGE_LEVELS.EMPTY,
          distanceToDropoff: 0,
        })
      );
      expect(result.gallonsToAdd).toBe(0);
      expect(result.alreadySufficient).toBe(true);
    });

    it("works correctly for a large truck (26ft, 60 gal tank)", () => {
      const truck26ft: TruckType = {
        id: "uhaul-26ft",
        name: "26 ft Truck",
        company: "uhaul",
        tankCapacity: 60,
        mpg: 7,
        fuelType: "regular",
      };
      // Picked up at 3/4 (45 gal), now at 1/2 (30 gal), 14 miles to dropoff (2 gal)
      // Needs: 45 - 30 + 2 = 17 gallons
      const result = calculateFuelReturn({
        truck: truck26ft,
        pickupLevel: GAUGE_LEVELS.THREE_QUARTER,
        currentLevel: GAUGE_LEVELS.HALF,
        distanceToDropoff: 14,
        safetyBuffer: 0,
      });
      expect(result.gallonsToAdd).toBe(17);
    });
  });
});
