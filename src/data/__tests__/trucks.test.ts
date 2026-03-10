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

  describe("PENSKE_TRUCKS", () => {
    it("contains Penske truck sizes", () => {
      expect(PENSKE_TRUCKS.length).toBeGreaterThanOrEqual(3);
    });

    it("all Penske trucks use diesel fuel", () => {
      PENSKE_TRUCKS.forEach((truck) => {
        expect(truck.fuelType).toBe("diesel");
      });
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
  });

  describe("BUDGET_TRUCKS", () => {
    it("contains Budget truck sizes", () => {
      expect(BUDGET_TRUCKS.length).toBeGreaterThanOrEqual(3);
    });

    it("all Budget trucks use regular unleaded fuel", () => {
      BUDGET_TRUCKS.forEach((truck) => {
        expect(truck.fuelType).toBe("regular");
      });
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
      const penskeTruck = PENSKE_TRUCKS[0];
      const found = getTruckById(penskeTruck.id);
      expect(found).toBeDefined();
      expect(found!.company).toBe("penske");
      expect(found!.fuelType).toBe("diesel");
    });
  });
});
