import { describe, it, expect } from "vitest";
import { ALL_TRUCKS, UHAUL_TRUCKS, getTruckById } from "@/data/trucks";

describe("Truck fleet data", () => {
  describe("UHAUL_TRUCKS", () => {
    it("contains all 8 U-Haul truck sizes", () => {
      expect(UHAUL_TRUCKS).toHaveLength(8);
    });

    it("all U-Haul trucks use regular unleaded fuel", () => {
      UHAUL_TRUCKS.forEach((truck) => {
        expect(truck.fuelType).toBe("regular");
      });
    });

    it("all trucks have positive tank capacity", () => {
      ALL_TRUCKS.forEach((truck) => {
        expect(truck.tankCapacity).toBeGreaterThan(0);
      });
    });

    it("all trucks have positive MPG", () => {
      ALL_TRUCKS.forEach((truck) => {
        expect(truck.mpg).toBeGreaterThan(0);
      });
    });

    it("all trucks have unique IDs", () => {
      const ids = ALL_TRUCKS.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("all trucks have non-empty names", () => {
      ALL_TRUCKS.forEach((truck) => {
        expect(truck.name.trim().length).toBeGreaterThan(0);
      });
    });

    it("contains expected U-Haul truck sizes with correct tank capacities", () => {
      const capacities: Record<string, number> = {
        "uhaul-pickup": 34,
        "uhaul-cargo-van": 26,
        "uhaul-10ft": 31,
        "uhaul-15ft": 40,
        "uhaul-17ft": 40,
        "uhaul-20ft": 40,
        "uhaul-24ft": 60,
        "uhaul-26ft": 60,
      };

      for (const [id, expectedCapacity] of Object.entries(capacities)) {
        const truck = getTruckById(id);
        expect(truck, `Truck ${id} not found`).toBeDefined();
        expect(truck!.tankCapacity).toBe(expectedCapacity);
      }
    });

    it("contains expected MPG values for U-Haul trucks", () => {
      const mpgValues: Record<string, number> = {
        "uhaul-pickup": 19,
        "uhaul-cargo-van": 18,
        "uhaul-10ft": 12,
        "uhaul-15ft": 10,
        "uhaul-26ft": 7,
      };

      for (const [id, expectedMpg] of Object.entries(mpgValues)) {
        const truck = getTruckById(id);
        expect(truck!.mpg).toBe(expectedMpg);
      }
    });
  });

  describe("getTruckById", () => {
    it("returns the correct truck for a valid ID", () => {
      const truck = getTruckById("uhaul-15ft");
      expect(truck).toBeDefined();
      expect(truck!.name).toBe("15 ft Truck");
      expect(truck!.tankCapacity).toBe(40);
    });

    it("returns undefined for an unknown ID", () => {
      const truck = getTruckById("nonexistent-truck");
      expect(truck).toBeUndefined();
    });
  });
});
