import type { TruckType } from "@/types";

/**
 * U-Haul truck fleet data.
 * Sources:
 * - Tank capacities: HireAHelper rental truck guide, miramarspeedcircuit.com, quora community data
 * - MPG estimates: U-Pack guide, U-Haul documentation (empty truck estimates)
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
 * All supported truck fleets. Add Penske, Budget, etc. in v1.0 (see issue #15).
 */
export const ALL_TRUCKS: TruckType[] = [...UHAUL_TRUCKS];

/**
 * Lookup a truck by its ID. Returns undefined if not found.
 */
export function getTruckById(id: string): TruckType | undefined {
  return ALL_TRUCKS.find((t) => t.id === id);
}
