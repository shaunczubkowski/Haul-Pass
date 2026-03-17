import type { TruckType, RentalCompany } from "@/types";

/**
 * U-Haul truck fleet data.
 * Sources: see SOURCES.md — U-Haul section.
 * Note: All U-Haul trucks use regular unleaded gasoline. Never use diesel.
 */
export const UHAUL_TRUCKS: TruckType[] = [
  {
    id: "uhaul-pickup",
    name: '8 ft Pickup',
    company: "uhaul",
    tankCapacity: 34,
    mpg: 19,
    fuelType: "regular",
    loadSize: "Small load",
  },
  {
    id: "uhaul-cargo-van",
    name: "Cargo Van",
    company: "uhaul",
    tankCapacity: 26,
    mpg: 18,
    fuelType: "regular",
    loadSize: "Studio",
  },
  {
    id: "uhaul-10ft",
    name: "10 ft Truck",
    company: "uhaul",
    tankCapacity: 31,
    mpg: 12,
    fuelType: "regular",
    loadSize: "1 bedroom",
  },
  {
    id: "uhaul-15ft",
    name: "15 ft Truck",
    company: "uhaul",
    tankCapacity: 40,
    mpg: 10,
    fuelType: "regular",
    loadSize: "2 bedrooms",
  },
  {
    id: "uhaul-17ft",
    name: "17 ft Truck",
    company: "uhaul",
    tankCapacity: 40,
    mpg: 10,
    fuelType: "regular",
    loadSize: "2–3 bedrooms",
  },
  {
    id: "uhaul-20ft",
    name: "20 ft Truck",
    company: "uhaul",
    tankCapacity: 40,
    mpg: 10,
    fuelType: "regular",
    loadSize: "3–4 bedrooms",
  },
  {
    id: "uhaul-24ft",
    name: "24 ft Truck",
    company: "uhaul",
    tankCapacity: 60,
    mpg: 7,
    fuelType: "regular",
    loadSize: "4–5 bedrooms",
  },
  {
    id: "uhaul-26ft",
    name: "26 ft Truck",
    company: "uhaul",
    tankCapacity: 60,
    mpg: 7,
    fuelType: "regular",
    loadSize: "5+ bedrooms",
  },
];

/**
 * Penske truck fleet data.
 * Sources: see SOURCES.md — Penske section (includes ⚠️ spec-review notes).
 * Note: 12 ft and 16 ft use gasoline; 22 ft and 26 ft use diesel.
 * MPG estimates are for empty trucks; loaded MPG will be lower.
 */
export const PENSKE_TRUCKS: TruckType[] = [
  {
    id: "penske-12ft",
    name: "12 ft Truck",
    company: "penske",
    tankCapacity: 26,
    mpg: 12,
    fuelType: "regular",
    loadSize: "1 bedroom",
  },
  {
    id: "penske-16ft",
    name: "16 ft Truck",
    company: "penske",
    tankCapacity: 33,
    mpg: 10,
    fuelType: "regular",
    loadSize: "2 bedrooms",
  },
  {
    id: "penske-22ft",
    name: "22 ft Truck",
    company: "penske",
    tankCapacity: 70, // verified: Penske 22–26 ft box trucks use a 70-gal diesel tank (pensketruckrental.com, 2026-03-15)
    mpg: 8,
    fuelType: "diesel",
    loadSize: "3–4 bedrooms",
  },
  {
    id: "penske-26ft",
    name: "26 ft Truck",
    company: "penske",
    tankCapacity: 70, // same 70-gal diesel tank as 22 ft — both listed on Penske's 22–26 ft spec page
    mpg: 7,
    fuelType: "diesel",
    loadSize: "5+ bedrooms",
  },
];

/**
 * Budget truck fleet data.
 * Sources: see SOURCES.md — Budget section.
 * Note: 10 ft and 16 ft use regular unleaded gasoline. 26 ft uses diesel.
 * Budget does not offer a consumer 24 ft truck.
 */
export const BUDGET_TRUCKS: TruckType[] = [
  {
    id: "budget-10ft",
    name: "10 ft Truck",
    company: "budget",
    tankCapacity: 31,
    mpg: 12,
    fuelType: "regular",
    loadSize: "1 bedroom",
  },
  {
    id: "budget-16ft",
    name: "16 ft Truck",
    company: "budget",
    tankCapacity: 40,
    mpg: 10,
    fuelType: "regular",
    loadSize: "2–3 bedrooms",
  },
  {
    id: "budget-26ft",
    name: "26 ft Truck",
    company: "budget",
    tankCapacity: 50, // verified: budgettruck.com/moving-trucks-accessories/truckdetails26foot (2026-03-17)
    mpg: 7,
    fuelType: "diesel", // verified: budgettruck.com/moving-trucks-accessories/truckdetails26foot (2026-03-17)
    loadSize: "5+ bedrooms",
  },
];

/**
 * Enterprise truck fleet data.
 * Sources: see SOURCES.md — Enterprise section.
 * Note: All Enterprise trucks use regular unleaded gasoline.
 */
export const ENTERPRISE_TRUCKS: TruckType[] = [
  {
    id: "enterprise-10ft",
    name: "10 ft Truck",
    company: "enterprise",
    tankCapacity: 31,
    mpg: 12,
    fuelType: "regular",
    loadSize: "1 bedroom",
  },
  {
    id: "enterprise-16ft",
    name: "16 ft Truck",
    company: "enterprise",
    tankCapacity: 40,
    mpg: 10,
    fuelType: "regular",
    loadSize: "2–3 bedrooms",
  },
  {
    id: "enterprise-24ft",
    name: "24 ft Truck",
    company: "enterprise",
    tankCapacity: 60,
    mpg: 7,
    fuelType: "regular",
    loadSize: "4–5 bedrooms",
  },
];

/**
 * All supported truck fleets.
 */
export const ALL_TRUCKS: TruckType[] = [
  ...UHAUL_TRUCKS,
  ...PENSKE_TRUCKS,
  ...BUDGET_TRUCKS,
  ...ENTERPRISE_TRUCKS,
];

/**
 * Lookup a truck by its ID. Returns undefined if not found.
 */
export function getTruckById(id: string): TruckType | undefined {
  return ALL_TRUCKS.find((t) => t.id === id);
}

/**
 * Return all trucks for a given rental company.
 */
export function getTrucksByCompany(company: RentalCompany): TruckType[] {
  return ALL_TRUCKS.filter((t) => t.company === company);
}
