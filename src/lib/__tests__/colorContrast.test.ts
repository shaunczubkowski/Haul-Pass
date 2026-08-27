import { describe, it, expect } from "vitest";

/**
 * WCAG 1.4.3 AA contrast checker for the --text-muted token (#101).
 *
 * The calculator uses text-muted for:
 *   - Step headings ("Step 1 - Your Truck", "Step 2 - Fuel Levels", "Step 3 - Final Drive")
 *   - Hint text under the gauges (the "At Pickup" contract-level note)
 *   - Selector descriptions (LoadLevelSelector, RiskToleranceSelector)
 *
 * All are small sizes (text-xs), below the WCAG large-text cutoff even where
 * they are semibold → require 4.5:1 contrast ratio.
 */

function hexToLinear(hex: string): number {
  const n = parseInt(hex, 16) / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  // hex = "#rrggbb"
  const r = hexToLinear(hex.slice(1, 3));
  const g = hexToLinear(hex.slice(3, 5));
  const b = hexToLinear(hex.slice(5, 7));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const WCAG_AA_NORMAL = 4.5;

describe("WCAG 1.4.3 AA contrast — text-muted on surface (#101)", () => {
  describe("light mode", () => {
    // --text-muted: #64748b (slate-500)
    // --surface:    #ffffff
    const textMuted = "#64748b";
    const surface = "#ffffff";

    it("text-muted (#64748b) on surface (#ffffff) meets 4.5:1", () => {
      const ratio = contrastRatio(textMuted, surface);
      // Expected ≈ 4.76:1
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });
  });

  describe("dark mode", () => {
    // --text-muted: #8899b0  (custom dark-mode muted)
    // --surface:    #1e293b  (slate-800)
    const textMuted = "#8899b0";
    const surface = "#1e293b";

    it("text-muted (#8899b0) on surface (#1e293b) meets 4.5:1", () => {
      const ratio = contrastRatio(textMuted, surface);
      // Expected ≈ 5.04:1
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });
  });
});
