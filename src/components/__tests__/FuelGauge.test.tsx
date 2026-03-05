import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FuelGauge } from "@/components/FuelGauge";
import { GAUGE_LEVELS } from "@/types";

const noop = () => {};

describe("FuelGauge", () => {
  describe("rendering", () => {
    it("renders the label", () => {
      render(<FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Pickup Level" />);
      expect(screen.getByText("Pickup Level")).toBeInTheDocument();
    });

    it("renders all 9 level buttons", () => {
      render(<FuelGauge value={GAUGE_LEVELS.EMPTY} onChange={noop} label="Current Level" />);
      const labels = ["E", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8", "F"];
      for (const label of labels) {
        expect(screen.getAllByRole("button", { name: new RegExp(label) }).length).toBeGreaterThan(0);
      }
    });

    it("marks the selected button as pressed", () => {
      render(<FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Pickup Level" />);
      const halfButton = screen.getByRole("button", { name: /Pickup Level 1\/2/ });
      expect(halfButton).toHaveAttribute("aria-pressed", "true");
    });

    it("marks all other buttons as not pressed", () => {
      render(<FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Pickup Level" />);
      const notPressedButtons = screen
        .getAllByRole("button")
        .filter((b) => b.getAttribute("aria-pressed") === "false");
      expect(notPressedButtons.length).toBe(8); // 9 total - 1 selected
    });
  });

  describe("value selection", () => {
    it("calls onChange with the clicked level", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FuelGauge value={GAUGE_LEVELS.EMPTY} onChange={onChange} label="Current Level" />);
      await user.click(screen.getByRole("button", { name: /Current Level 3\/4/ }));
      expect(onChange).toHaveBeenCalledWith(GAUGE_LEVELS.THREE_QUARTER);
    });

    it("does not call onChange when disabled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FuelGauge value={GAUGE_LEVELS.HALF} onChange={onChange} label="Pickup Level" disabled />);
      await user.click(screen.getByRole("button", { name: /Pickup Level 3\/4/ }));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("keyboard interaction", () => {
    it("increases value with ArrowRight", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FuelGauge value={GAUGE_LEVELS.QUARTER} onChange={onChange} label="Pickup Level" />);
      const slider = screen.getByRole("slider");
      slider.focus();
      await user.keyboard("{ArrowRight}");
      expect(onChange).toHaveBeenCalledWith(GAUGE_LEVELS.THREE_EIGHTHS);
    });

    it("decreases value with ArrowLeft", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FuelGauge value={GAUGE_LEVELS.HALF} onChange={onChange} label="Pickup Level" />);
      const slider = screen.getByRole("slider");
      slider.focus();
      await user.keyboard("{ArrowLeft}");
      expect(onChange).toHaveBeenCalledWith(GAUGE_LEVELS.THREE_EIGHTHS);
    });

    it("does not go below E on ArrowLeft", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FuelGauge value={GAUGE_LEVELS.EMPTY} onChange={onChange} label="Pickup Level" />);
      const slider = screen.getByRole("slider");
      slider.focus();
      await user.keyboard("{ArrowLeft}");
      expect(onChange).toHaveBeenCalledWith(GAUGE_LEVELS.EMPTY);
    });

    it("does not go above F on ArrowRight", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FuelGauge value={GAUGE_LEVELS.FULL} onChange={onChange} label="Pickup Level" />);
      const slider = screen.getByRole("slider");
      slider.focus();
      await user.keyboard("{ArrowRight}");
      expect(onChange).toHaveBeenCalledWith(GAUGE_LEVELS.FULL);
    });
  });

  describe("accessibility", () => {
    it("has role=slider with correct aria attributes", () => {
      render(<FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Pickup Level" />);
      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("aria-valuenow", "4"); // index of 0.5 in LEVELS array
      expect(slider).toHaveAttribute("aria-valuemin", "0");
      expect(slider).toHaveAttribute("aria-valuemax", "8");
      expect(slider).toHaveAttribute("aria-label", "Pickup Level: 1/2");
    });

    it("sets aria-disabled when disabled", () => {
      render(<FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Pickup Level" disabled />);
      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("aria-disabled", "true");
    });
  });
});
