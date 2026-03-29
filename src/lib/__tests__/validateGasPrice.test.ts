import { describe, it, expect } from "vitest";
import { validateGasPrice } from "@/lib/validateGasPrice";

describe("validateGasPrice", () => {
  describe("valid cases", () => {
    it("returns valid for a normal positive price", () => {
      expect(validateGasPrice(3.99)).toEqual({ ok: true });
    });

    it("returns valid for price of 0.01", () => {
      expect(validateGasPrice(0.01)).toEqual({ ok: true });
    });

    it("returns valid for a large price", () => {
      expect(validateGasPrice(9.99)).toEqual({ ok: true });
    });

    it("returns valid for undefined (field is optional)", () => {
      expect(validateGasPrice(undefined)).toEqual({ ok: true });
    });
  });

  describe("invalid cases — returns 400 error", () => {
    it("rejects Infinity", () => {
      const result = validateGasPrice(Infinity);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatch(/positive/i);
      }
    });

    it("rejects -Infinity", () => {
      const result = validateGasPrice(-Infinity);
      expect(result.ok).toBe(false);
    });

    it("rejects NaN", () => {
      const result = validateGasPrice(NaN);
      expect(result.ok).toBe(false);
    });

    it("rejects negative values", () => {
      const result = validateGasPrice(-1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatch(/positive/i);
      }
    });

    it("rejects zero", () => {
      const result = validateGasPrice(0);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatch(/positive/i);
      }
    });

    it("rejects non-number types (string)", () => {
      // @ts-expect-error intentional wrong type
      const result = validateGasPrice("3.99");
      expect(result.ok).toBe(false);
    });
  });
});
