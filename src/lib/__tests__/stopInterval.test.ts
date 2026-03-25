import { describe, it, expect } from "vitest";
import { calculateStopInterval } from "@/lib/calculator";
import type { TruckType } from "@/types";

// 40-gal, 10-MPG truck — easy mental math
const TRUCK: TruckType = {
  id: "test-truck",
  name: "Test Truck",
  company: "uhaul",
  tankCapacity: 40,
  mpg: 10,
  fuelType: "regular",
};

describe("calculateStopInterval", () => {
  describe("risk tolerance affects interval length", () => {
    it("conservative gives shorter interval than standard (empty truck)", () => {
      const conservative = calculateStopInterval(TRUCK, 1.0, "conservative");
      const standard = calculateStopInterval(TRUCK, 1.0, "standard");
      expect(conservative).toBeLessThan(standard);
    });

    it("standard gives shorter interval than lean (empty truck)", () => {
      const standard = calculateStopInterval(TRUCK, 1.0, "standard");
      const lean = calculateStopInterval(TRUCK, 1.0, "lean");
      expect(standard).toBeLessThan(lean);
    });

    it("conservative, empty: floor((1−0.5) × 10 × 40 × 0.9) = 180 miles", () => {
      // (1 - 0.5) * 10 * 40 * 0.9 = 180 exactly
      expect(calculateStopInterval(TRUCK, 1.0, "conservative")).toBe(180);
    });

    it("standard, empty: floor((1−0.375) × 10 × 40 × 0.9) = 225 miles", () => {
      // (1 - 0.375) * 10 * 40 * 0.9 = 225 exactly
      expect(calculateStopInterval(TRUCK, 1.0, "standard")).toBe(225);
    });

    it("lean, empty: floor((1−0.25) × 10 × 40 × 0.9) = 270 miles", () => {
      // (1 - 0.25) * 10 * 40 * 0.9 = 270 exactly
      expect(calculateStopInterval(TRUCK, 1.0, "lean")).toBe(270);
    });
  });

  describe("load level (mpgMultiplier) affects interval length", () => {
    it("full load gives shorter interval than empty (conservative)", () => {
      const empty = calculateStopInterval(TRUCK, 1.0, "conservative");
      const full = calculateStopInterval(TRUCK, 0.6, "conservative");
      expect(full).toBeLessThan(empty);
    });

    it("conservative, full load (0.6×): floor((1−0.5) × 6 × 40 × 0.9) = 108 miles", () => {
      // (1 - 0.5) * 6 * 40 * 0.9 = 108 exactly
      expect(calculateStopInterval(TRUCK, 0.6, "conservative")).toBe(108);
    });

    it("standard, full load (0.6×): floor((1−0.375) × 6 × 40 × 0.9) = 135 miles", () => {
      // (1 - 0.375) * 6 * 40 * 0.9 = 135 exactly
      expect(calculateStopInterval(TRUCK, 0.6, "standard")).toBe(135);
    });
  });

  describe("result is always an integer", () => {
    it("returns an integer for standard inputs", () => {
      const result = calculateStopInterval(TRUCK, 0.75, "standard");
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe("clamping", () => {
    it("clamps to minimum of 80 miles for a very small tank + heavy load", () => {
      const tinyTruck: TruckType = { ...TRUCK, tankCapacity: 10, mpg: 5 };
      // (1 - 0.5) * (5 * 0.6) * 10 * 0.9 = 13.5 → 13 → clamped to 80
      expect(calculateStopInterval(tinyTruck, 0.6, "conservative")).toBe(80);
    });

    it("clamps to maximum of 350 miles for a very large tank", () => {
      const hugeTruck: TruckType = { ...TRUCK, tankCapacity: 200, mpg: 5 };
      // (1 - 0.25) * 5 * 200 * 0.9 = 675 → clamped to 350
      expect(calculateStopInterval(hugeTruck, 1.0, "lean")).toBe(350);
    });
  });
});
