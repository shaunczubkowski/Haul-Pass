import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RiskToleranceSelector } from "../RiskToleranceSelector";
import { RISK_TOLERANCE_CONFIG } from "@/types";
import { RISK_TOLERANCE_BUFFERS } from "@/lib/calculator";
import type { RiskTolerance } from "@/types";

const LEVELS: RiskTolerance[] = ["conservative", "standard", "lean"];

// Language that promises the app will advise refuelling part-way through the trip.
// FillRight has no route model — the route planner was removed in #121 — so any
// description implying en-route advice describes behaviour that does not exist.
const EN_ROUTE_LANGUAGE = /fill up when|tank hits|mountain route|urban route/i;

describe("RiskToleranceSelector", () => {
  describe("descriptions describe the safety buffer, not en-route refuelling", () => {
    it.each(LEVELS)("%s description makes no en-route promise", (level) => {
      expect(RISK_TOLERANCE_CONFIG[level].description).not.toMatch(EN_ROUTE_LANGUAGE);
    });

    it.each(LEVELS)("%s description states the gallons it adds", (level) => {
      const gallons = RISK_TOLERANCE_BUFFERS[level];
      const description = RISK_TOLERANCE_CONFIG[level].description;

      if (gallons === 0) {
        expect(description).toMatch(/no extra|no buffer/i);
      } else {
        // e.g. 2 -> /\b2(\.0)? gallons?\b/, 0.5 -> /\b0.5 gallons?\b/
        const figure = String(gallons).replace(".", "\\.");
        expect(description).toMatch(new RegExp(`\\b${figure} gallons?\\b`, "i"));
      }
    });
  });

  describe("buffer values have a single source of truth", () => {
    it("exposes the buffer on the config each option is rendered from", () => {
      for (const level of LEVELS) {
        expect(RISK_TOLERANCE_CONFIG[level].bufferGallons).toBe(RISK_TOLERANCE_BUFFERS[level]);
      }
    });

    it("no longer carries a gauge threshold that nothing calculates from", () => {
      for (const level of LEVELS) {
        expect(RISK_TOLERANCE_CONFIG[level]).not.toHaveProperty("threshold");
      }
    });
  });

  describe("rendering", () => {
    it("shows the description of the selected option", async () => {
      render(<RiskToleranceSelector value="conservative" onChange={vi.fn()} />);
      expect(
        screen.getByText(RISK_TOLERANCE_CONFIG.conservative.description),
      ).toBeInTheDocument();
    });

    it("reports the selected option to assistive technology", () => {
      render(<RiskToleranceSelector value="lean" onChange={vi.fn()} />);
      expect(screen.getByRole("radio", { name: /lean/i })).toHaveAttribute("aria-checked", "true");
    });

    it("calls onChange with the clicked option", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<RiskToleranceSelector value="standard" onChange={onChange} />);
      await user.click(screen.getByRole("radio", { name: /conservative/i }));
      expect(onChange).toHaveBeenCalledWith("conservative");
    });
  });
});
