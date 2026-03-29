import { describe, it, expect } from "vitest";
import { validateRouteGeometry } from "@/lib/validateRouteGeometry";

describe("validateRouteGeometry", () => {
  describe("valid cases", () => {
    it("accepts a 2-point geometry with valid coordinates", () => {
      expect(
        validateRouteGeometry([[-87.6298, 41.8781], [-104.9903, 39.7392]])
      ).toEqual({ ok: true });
    });

    it("accepts a multi-point geometry", () => {
      expect(
        validateRouteGeometry([
          [-87.6298, 41.8781],
          [-95.0, 40.0],
          [-104.9903, 39.7392],
        ])
      ).toEqual({ ok: true });
    });

    it("accepts boundary coordinate values", () => {
      expect(
        validateRouteGeometry([
          [-180, -90],
          [180, 90],
        ])
      ).toEqual({ ok: true });
    });

    it("returns valid for undefined (field is optional)", () => {
      expect(validateRouteGeometry(undefined)).toEqual({ ok: true });
    });
  });

  describe("invalid cases", () => {
    it("rejects geometry with fewer than 2 points", () => {
      const result = validateRouteGeometry([[-87.6298, 41.8781]]);
      expect(result.ok).toBe(false);
    });

    it("rejects empty array", () => {
      const result = validateRouteGeometry([]);
      expect(result.ok).toBe(false);
    });

    it("rejects latitude out of range (> 90)", () => {
      const result = validateRouteGeometry([
        [-87.0, 91],
        [-104.0, 39.0],
      ]);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/out-of-range/i);
    });

    it("rejects latitude out of range (< -90)", () => {
      const result = validateRouteGeometry([
        [-87.0, -91],
        [-104.0, 39.0],
      ]);
      expect(result.ok).toBe(false);
    });

    it("rejects longitude out of range (> 180)", () => {
      const result = validateRouteGeometry([
        [181, 41.0],
        [-104.0, 39.0],
      ]);
      expect(result.ok).toBe(false);
    });

    it("rejects longitude out of range (< -180)", () => {
      const result = validateRouteGeometry([
        [-181, 41.0],
        [-104.0, 39.0],
      ]);
      expect(result.ok).toBe(false);
    });

    it("rejects non-finite values (NaN)", () => {
      const result = validateRouteGeometry([
        [NaN, 41.0],
        [-104.0, 39.0],
      ]);
      expect(result.ok).toBe(false);
    });

    it("rejects non-finite values (Infinity)", () => {
      const result = validateRouteGeometry([
        [Infinity, 41.0],
        [-104.0, 39.0],
      ]);
      expect(result.ok).toBe(false);
    });
  });
});
