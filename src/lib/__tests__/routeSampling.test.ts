import { describe, it, expect } from "vitest";
import { sampleWaypoints, haversineDistanceMiles } from "@/lib/routeSampling";

describe("haversineDistanceMiles", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineDistanceMiles([0, 0], [0, 0])).toBe(0);
  });

  it("computes approximate distance between two known points", () => {
    // Chicago to Milwaukee: ~81 miles straight-line (haversine)
    const chicagoLng = -87.6298, chicagoLat = 41.8781;
    const milwaukeeLng = -87.9065, milwaukeeLat = 43.0389;
    const dist = haversineDistanceMiles([chicagoLng, chicagoLat], [milwaukeeLng, milwaukeeLat]);
    expect(dist).toBeGreaterThan(75);
    expect(dist).toBeLessThan(95);
  });

  it("is symmetric (A→B equals B→A)", () => {
    const a: [number, number] = [-87.6298, 41.8781];
    const b: [number, number] = [-87.9065, 43.0389];
    expect(haversineDistanceMiles(a, b)).toBeCloseTo(haversineDistanceMiles(b, a), 5);
  });
});

describe("sampleWaypoints", () => {
  // Build a synthetic straight-line route along a meridian for easy distance math
  // Each step is roughly 1 degree of latitude ≈ 69 miles
  function buildRoute(numPoints: number): [number, number][] {
    return Array.from({ length: numPoints }, (_, i) => [-90, 30 + i] as [number, number]);
  }

  it("returns empty array for empty coordinate input", () => {
    expect(sampleWaypoints([], 180)).toEqual([]);
  });

  it("returns empty array when route is shorter than the interval", () => {
    // 2-point route ≈ 69 miles, interval = 180 — no waypoints to insert
    const result = sampleWaypoints(buildRoute(2), 180);
    expect(result).toHaveLength(0);
  });

  it("returns one waypoint for a route just over one interval", () => {
    // 3-point route ≈ 138 miles — still under 180, 4 points ≈ 207 → one waypoint
    const result = sampleWaypoints(buildRoute(4), 180);
    expect(result).toHaveLength(1);
    expect(result[0].milesFromOrigin).toBeGreaterThan(150);
    expect(result[0].milesFromOrigin).toBeLessThan(220);
  });

  it("returns multiple waypoints for a long route", () => {
    // 10 points ≈ 621 miles; at 180-mile intervals → ~3 waypoints
    const result = sampleWaypoints(buildRoute(10), 180);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it("waypoints include lat, lng, and milesFromOrigin", () => {
    const result = sampleWaypoints(buildRoute(5), 180);
    if (result.length > 0) {
      const wp = result[0];
      expect(typeof wp.lat).toBe("number");
      expect(typeof wp.lng).toBe("number");
      expect(typeof wp.milesFromOrigin).toBe("number");
      expect(wp.milesFromOrigin).toBeGreaterThan(0);
    }
  });

  it("waypoints are in ascending milesFromOrigin order", () => {
    const result = sampleWaypoints(buildRoute(12), 180);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].milesFromOrigin).toBeGreaterThan(result[i - 1].milesFromOrigin);
    }
  });

  it("respects the intervalMiles parameter", () => {
    // At 100-mile intervals, a 10-point (~621 mile) route yields more waypoints than at 200 miles
    const at100 = sampleWaypoints(buildRoute(10), 100);
    const at200 = sampleWaypoints(buildRoute(10), 200);
    expect(at100.length).toBeGreaterThan(at200.length);
  });
});
