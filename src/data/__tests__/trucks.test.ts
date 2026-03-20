import { describe, it, expect } from "vitest";
import {
  ALL_TRUCKS,
  UHAUL_TRUCKS,
  PENSKE_TRUCKS,
  BUDGET_TRUCKS,
  ENTERPRISE_TRUCKS,
  getTruckById,
  getTrucksByCompany,
} from "@/data/trucks";

describe("Truck fleet data", () => {
  describe("UHAUL_TRUCKS", () => {
    it("contains all 7 U-Haul truck sizes", () => {
      expect(UHAUL_TRUCKS).toHaveLength(7);
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
        "uhaul-pickup": 28,
        "uhaul-cargo-van": 25,
        "uhaul-10ft": 31,
        "uhaul-15ft": 40,
        "uhaul-17ft": 40,
        "uhaul-20ft": 40,
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
        "uhaul-26ft": 10,
      };

      for (const [id, expectedMpg] of Object.entries(mpgValues)) {
        const truck = getTruckById(id);
        expect(truck!.mpg).toBe(expectedMpg);
      }
    });
  });

  describe("PENSKE_TRUCKS", () => {
    it("contains Penske truck sizes", () => {
      expect(PENSKE_TRUCKS.length).toBeGreaterThanOrEqual(3);
    });

    it("Penske 12 ft and 16 ft use regular gasoline", () => {
      expect(PENSKE_TRUCKS.find((t) => t.id === "penske-12ft")!.fuelType).toBe("regular");
      expect(PENSKE_TRUCKS.find((t) => t.id === "penske-16ft")!.fuelType).toBe("regular");
    });

    it("Penske 22 ft and 26 ft use diesel", () => {
      expect(PENSKE_TRUCKS.find((t) => t.id === "penske-22ft")!.fuelType).toBe("diesel");
      expect(PENSKE_TRUCKS.find((t) => t.id === "penske-26ft")!.fuelType).toBe("diesel");
    });

    it("all Penske trucks belong to the penske company", () => {
      PENSKE_TRUCKS.forEach((truck) => {
        expect(truck.company).toBe("penske");
      });
    });

    it("all Penske truck IDs start with 'penske-'", () => {
      PENSKE_TRUCKS.forEach((truck) => {
        expect(truck.id).toMatch(/^penske-/);
      });
    });

    it("contains expected Penske sizes with valid tank capacities", () => {
      PENSKE_TRUCKS.forEach((truck) => {
        expect(truck.tankCapacity).toBeGreaterThanOrEqual(20);
        expect(truck.tankCapacity).toBeLessThanOrEqual(80);
      });
    });

    it("Penske 22 ft and 26 ft have a 70-gallon diesel tank (verified against pensketruckrental.com 2026-03-15)", () => {
      expect(getTruckById("penske-22ft")!.tankCapacity).toBe(70);
      expect(getTruckById("penske-26ft")!.tankCapacity).toBe(70);
    });
  });

  describe("BUDGET_TRUCKS", () => {
    it("contains exactly 3 Budget truck sizes (10 ft, 16 ft, 26 ft)", () => {
      expect(BUDGET_TRUCKS).toHaveLength(3);
    });

    it("Budget 10 ft and 16 ft use regular unleaded fuel", () => {
      ["budget-10ft", "budget-16ft"].forEach((id) => {
        expect(getTruckById(id)!.fuelType).toBe("regular");
      });
    });

    it("Budget 26 ft uses diesel (verified budgettruck.com 2026-03-17)", () => {
      expect(getTruckById("budget-26ft")!.fuelType).toBe("diesel");
    });

    it("Budget 26 ft has a 50-gallon tank (verified budgettruck.com 2026-03-17)", () => {
      expect(getTruckById("budget-26ft")!.tankCapacity).toBe(50);
    });

    it("does not include a 24 ft truck (not a standard Budget SKU)", () => {
      expect(getTruckById("budget-24ft")).toBeUndefined();
      expect(BUDGET_TRUCKS.find((t) => t.id === "budget-24ft")).toBeUndefined();
    });

    it("all Budget trucks belong to the budget company", () => {
      BUDGET_TRUCKS.forEach((truck) => {
        expect(truck.company).toBe("budget");
      });
    });

    it("all Budget truck IDs start with 'budget-'", () => {
      BUDGET_TRUCKS.forEach((truck) => {
        expect(truck.id).toMatch(/^budget-/);
      });
    });
  });

  describe("ENTERPRISE_TRUCKS", () => {
    it("contains Enterprise truck sizes", () => {
      expect(ENTERPRISE_TRUCKS.length).toBeGreaterThanOrEqual(2);
    });

    it("all Enterprise trucks use regular unleaded fuel", () => {
      ENTERPRISE_TRUCKS.forEach((truck) => {
        expect(truck.fuelType).toBe("regular");
      });
    });

    it("all Enterprise trucks belong to the enterprise company", () => {
      ENTERPRISE_TRUCKS.forEach((truck) => {
        expect(truck.company).toBe("enterprise");
      });
    });

    it("all Enterprise truck IDs start with 'enterprise-'", () => {
      ENTERPRISE_TRUCKS.forEach((truck) => {
        expect(truck.id).toMatch(/^enterprise-/);
      });
    });

    it("uses enterprise-24ft (standard SKU) not enterprise-26ft", () => {
      const ids = ENTERPRISE_TRUCKS.map((t) => t.id);
      expect(ids).toContain("enterprise-24ft");
      expect(ids).not.toContain("enterprise-26ft");
    });
  });

  describe("ALL_TRUCKS", () => {
    it("includes trucks from all four companies", () => {
      const companies = new Set(ALL_TRUCKS.map((t) => t.company));
      expect(companies.has("uhaul")).toBe(true);
      expect(companies.has("penske")).toBe(true);
      expect(companies.has("budget")).toBe(true);
      expect(companies.has("enterprise")).toBe(true);
    });

    it("all trucks have a valid fuelType", () => {
      ALL_TRUCKS.forEach((truck) => {
        expect(["regular", "diesel"]).toContain(truck.fuelType);
      });
    });
  });

  describe("getTrucksByCompany", () => {
    it("returns only U-Haul trucks for 'uhaul'", () => {
      const trucks = getTrucksByCompany("uhaul");
      expect(trucks.length).toBe(UHAUL_TRUCKS.length);
      trucks.forEach((t) => expect(t.company).toBe("uhaul"));
    });

    it("returns only Penske trucks for 'penske'", () => {
      const trucks = getTrucksByCompany("penske");
      expect(trucks.length).toBe(PENSKE_TRUCKS.length);
      trucks.forEach((t) => expect(t.company).toBe("penske"));
    });

    it("returns only Budget trucks for 'budget'", () => {
      const trucks = getTrucksByCompany("budget");
      expect(trucks.length).toBe(BUDGET_TRUCKS.length);
      trucks.forEach((t) => expect(t.company).toBe("budget"));
    });

    it("returns only Enterprise trucks for 'enterprise'", () => {
      const trucks = getTrucksByCompany("enterprise");
      expect(trucks.length).toBe(ENTERPRISE_TRUCKS.length);
      trucks.forEach((t) => expect(t.company).toBe("enterprise"));
    });

    it("returns empty array for unknown company", () => {
      // @ts-expect-error testing unknown company
      expect(getTrucksByCompany("unknown")).toHaveLength(0);
    });

    it("returns empty array for 'other' (removed from union — regression guard)", () => {
      // @ts-expect-error "other" was removed from RentalCompany; guards against re-introduction without data
      expect(getTrucksByCompany("other")).toHaveLength(0);
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

    it("can look up a Penske truck by ID", () => {
      const penskeTruck = PENSKE_TRUCKS[0]; // penske-12ft uses regular gasoline
      const found = getTruckById(penskeTruck.id);
      expect(found).toBeDefined();
      expect(found!.company).toBe("penske");
      expect(found!.fuelType).toBe("regular");
    });
  });
});
