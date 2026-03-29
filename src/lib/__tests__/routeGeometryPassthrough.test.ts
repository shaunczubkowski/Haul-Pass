import { describe, it, expect } from "vitest";
import { selectRouteCoordinates } from "@/lib/routeGeometryPassthrough";

const SAMPLE_COORDS: [number, number][] = [
  [-87.6298, 41.8781],
  [-89.0, 42.0],
  [-104.9903, 39.7392],
];

describe("selectRouteCoordinates", () => {
  describe("when routeGeometry is provided and has at least 2 points", () => {
    it("returns the provided geometry directly", () => {
      const result = selectRouteCoordinates(SAMPLE_COORDS, null, 0);
      expect(result).toBe(SAMPLE_COORDS);
    });

    it("ignores mapbox routes when geometry is provided", () => {
      const mapboxRoutes = [
        { geometry: { coordinates: [[-100, 40], [-110, 41]] } },
      ];
      const result = selectRouteCoordinates(SAMPLE_COORDS, mapboxRoutes, 0);
      expect(result).toBe(SAMPLE_COORDS);
    });
  });

  describe("when routeGeometry is absent or too short, falls back to Mapbox routes", () => {
    const mapboxRoutes = [
      { geometry: { coordinates: [[-87.6, 41.8], [-104.9, 39.7]] as [number, number][] } },
      { geometry: { coordinates: [[-87.6, 41.8], [-95.0, 40.0], [-104.9, 39.7]] as [number, number][] } },
    ];

    it("returns route at routeIndex=0 when no geometry provided", () => {
      const result = selectRouteCoordinates(undefined, mapboxRoutes, 0);
      expect(result).toBe(mapboxRoutes[0].geometry.coordinates);
    });

    it("returns route at routeIndex=1 when no geometry provided", () => {
      const result = selectRouteCoordinates(undefined, mapboxRoutes, 1);
      expect(result).toBe(mapboxRoutes[1].geometry.coordinates);
    });

    it("falls back to Mapbox when routeGeometry has fewer than 2 points", () => {
      const shortGeometry: [number, number][] = [[-87.6, 41.8]];
      const result = selectRouteCoordinates(shortGeometry, mapboxRoutes, 0);
      expect(result).toBe(mapboxRoutes[0].geometry.coordinates);
    });

    it("returns null when both routeGeometry and mapboxRoutes are absent", () => {
      const result = selectRouteCoordinates(undefined, null, 0);
      expect(result).toBeNull();
    });

    it("returns null when routeIndex is out of bounds", () => {
      const result = selectRouteCoordinates(undefined, mapboxRoutes, 5);
      expect(result).toBeNull();
    });
  });
});
