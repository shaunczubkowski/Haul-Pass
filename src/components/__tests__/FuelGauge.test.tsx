import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FuelGauge } from "@/components/FuelGauge";
import { GAUGE_LEVELS } from "@/types";

const noop = () => {};

describe("FuelGauge — horizontal variant", () => {
  describe("SVG structure", () => {
    it("renders a background rect with width 260", () => {
      const { container } = render(
        <FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Test" variant="horizontal" />
      );
      const rects = container.querySelectorAll("svg rect");
      const bgRect = rects[0];
      expect(bgRect).toBeTruthy();
      expect(bgRect.getAttribute("width")).toBe("260");
    });

    it("renders a filled rect with width = 260 * value", () => {
      const { container } = render(
        <FuelGauge value={GAUGE_LEVELS.QUARTER} onChange={noop} label="Test" variant="horizontal" />
      );
      const rects = container.querySelectorAll("svg rect");
      const filledRect = rects[1];
      expect(parseFloat(filledRect.getAttribute("width")!)).toBeCloseTo(65, 0);
    });

    it("filled rect has width 0 at EMPTY", () => {
      const { container } = render(
        <FuelGauge value={GAUGE_LEVELS.EMPTY} onChange={noop} label="Test" variant="horizontal" />
      );
      const rects = container.querySelectorAll("svg rect");
      expect(parseFloat(rects[1].getAttribute("width")!)).toBe(0);
    });

    it("filled rect has width 260 at FULL", () => {
      const { container } = render(
        <FuelGauge value={GAUGE_LEVELS.FULL} onChange={noop} label="Test" variant="horizontal" />
      );
      const rects = container.querySelectorAll("svg rect");
      expect(parseFloat(rects[1].getAttribute("width")!)).toBeCloseTo(260, 0);
    });

    it("renders exactly 9 tick lines", () => {
      const { container } = render(
        <FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Test" variant="horizontal" />
      );
      const lines = container.querySelectorAll("svg line");
      expect(lines.length).toBe(9);
    });

    it("tick lines are at x positions for all 9 eighth-step levels (20 + level * 260)", () => {
      const { container } = render(
        <FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Test" variant="horizontal" />
      );
      const lines = container.querySelectorAll("svg line");
      const xPositions = Array.from(lines).map((l) => parseFloat(l.getAttribute("x1")!));
      const expectedXs = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0].map(
        (lvl) => 20 + lvl * 260
      );
      xPositions.forEach((x, i) => expect(x).toBeCloseTo(expectedXs[i], 1));
    });

    it("tick lines at or below current value use the active gauge token", () => {
      const { container } = render(
        <FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Test" variant="horizontal" />
      );
      const lines = container.querySelectorAll("svg line");
      // HALF = 0.5 — levels 0, 1/8, 1/4, 3/8, 1/2 are all <= 0.5 → 5 active
      const activeCount = Array.from(lines).filter(
        (l) => l.getAttribute("stroke") === "var(--gauge-tick-active)"
      ).length;
      expect(activeCount).toBe(5);
    });

    it("needle polygon x-center is at 20 + value * 260", () => {
      const { container } = render(
        <FuelGauge value={GAUGE_LEVELS.QUARTER} onChange={noop} label="Test" variant="horizontal" />
      );
      const polygon = container.querySelector("svg polygon");
      expect(polygon).toBeTruthy();
      // QUARTER = 0.25 → xPos = 20 + 0.25 * 260 = 85
      const points = polygon!.getAttribute("points")!;
      // First point is the apex: "85,20"
      expect(points).toMatch(/^85,/);
    });

    it("renders E and F text labels", () => {
      const { container } = render(
        <FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Test" variant="horizontal" />
      );
      const texts = Array.from(container.querySelectorAll("svg text")).map((t) => t.textContent);
      expect(texts).toContain("E");
      expect(texts).toContain("F");
    });
  });

  describe("value selection (shared logic)", () => {
    it("calls onChange when a level button is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <FuelGauge value={GAUGE_LEVELS.EMPTY} onChange={onChange} label="Test" variant="horizontal" />
      );
      await user.click(screen.getByRole("button", { name: /Test 1\/2/ }));
      expect(onChange).toHaveBeenCalledWith(GAUGE_LEVELS.HALF);
    });
  });

  describe("keyboard interaction (shared logic)", () => {
    it("increases value with ArrowRight", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <FuelGauge value={GAUGE_LEVELS.QUARTER} onChange={onChange} label="Test" variant="horizontal" />
      );
      const slider = screen.getByRole("slider");
      slider.focus();
      await user.keyboard("{ArrowRight}");
      expect(onChange).toHaveBeenCalledWith(GAUGE_LEVELS.THREE_EIGHTHS);
    });
  });
});

describe("FuelGauge", () => {
  describe("rendering", () => {
    it("renders the label", () => {
      render(<FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Pickup Level" />);
      expect(screen.getByText("Pickup Level")).toBeInTheDocument();
    });

    it("renders exactly 9 level buttons (E, 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8, F)", () => {
      render(<FuelGauge value={GAUGE_LEVELS.EMPTY} onChange={noop} label="Current Level" />);
      const labels = ["E", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8", "F"];
      for (const label of labels) {
        expect(screen.getAllByRole("button", { name: new RegExp(label.replace("/", "\\/")) }).length).toBeGreaterThan(0);
      }
      expect(screen.getAllByRole("button").length).toBe(9);
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

    it("increases value with ArrowUp", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FuelGauge value={GAUGE_LEVELS.QUARTER} onChange={onChange} label="Pickup Level" />);
      const slider = screen.getByRole("slider");
      slider.focus();
      await user.keyboard("{ArrowUp}");
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

    it("decreases value with ArrowDown", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FuelGauge value={GAUGE_LEVELS.HALF} onChange={onChange} label="Pickup Level" />);
      const slider = screen.getByRole("slider");
      slider.focus();
      await user.keyboard("{ArrowDown}");
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

  describe("tick mark orientation", () => {
    it("tick marks extend outward beyond the arc stroke, not inward toward the pivot", () => {
      // Arc geometry: R=80, strokeWidth=12 → outer edge at r=86 from center (CX=100, CY=110)
      const CX = 100;
      const CY = 110;
      const ARC_OUTER_EDGE_R = 86; // R(80) + strokeWidth/2(6)

      const { container } = render(
        <FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Test" />
      );

      const lines = container.querySelectorAll("svg line");
      expect(lines.length).toBeGreaterThan(0);

      lines.forEach((line) => {
        const x1 = parseFloat(line.getAttribute("x1")!);
        const y1 = parseFloat(line.getAttribute("y1")!);
        const x2 = parseFloat(line.getAttribute("x2")!);
        const y2 = parseFloat(line.getAttribute("y2")!);

        const r1 = Math.sqrt((x1 - CX) ** 2 + (y1 - CY) ** 2);
        const r2 = Math.sqrt((x2 - CX) ** 2 + (y2 - CY) ** 2);
        const outerR = Math.max(r1, r2);

        // The outermost endpoint of each tick must reach beyond the arc stroke
        expect(outerR).toBeGreaterThan(ARC_OUTER_EDGE_R);
      });
    });
  });

  describe("fill arc", () => {
    it("fill arc uses sweep=1 so it follows the outer gauge track, not a chord through the interior", () => {
      // sweep=0 causes the SVG engine to resolve to center (20,30) instead of (100,110),
      // drawing the fill on a different circle that cuts through the gauge interior.
      // sweep=1 resolves to center (100,110) and correctly follows the arc track.
      const { container } = render(
        <FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Test" />
      );

      const paths = container.querySelectorAll("svg path");
      const filledPath = Array.from(paths).find(
        (p) => p.getAttribute("stroke") === "var(--gauge-fill)"
      );

      expect(filledPath).toBeTruthy();
      // The arc command must use sweep-flag=1 (the "1" after large-arc-flag in "A rx ry rot large sweep x y")
      expect(filledPath!.getAttribute("d")).toMatch(/A 80 80 0 0 1/);
    });

    it("background arc uses sweep=1 so it draws the upper semicircle, not the lower one", () => {
      // sweep=0 from (20,110) to (180,110) traces through (100,190) — the lower semicircle,
      // mostly below the viewBox (height 120) and visually inverted.
      // sweep=1 traces through (100,30) — the upper semicircle that forms the correct gauge track.
      const { container } = render(
        <FuelGauge value={GAUGE_LEVELS.EMPTY} onChange={noop} label="Test" />
      );

      const paths = container.querySelectorAll("svg path");
      const bgPath = Array.from(paths).find(
        (p) => p.getAttribute("stroke") === "var(--gauge-track)"
      );

      expect(bgPath).toBeTruthy();
      expect(bgPath!.getAttribute("d")).toMatch(/A 80 80 0 0 1/);
    });
  });

  describe("accessibility", () => {
    it("has role=slider with correct aria attributes", () => {
      render(<FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Pickup Level" />);
      const slider = screen.getByRole("slider");
      // HALF is index 4 in [E, 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8, F]
      expect(slider).toHaveAttribute("aria-valuenow", "4");
      expect(slider).toHaveAttribute("aria-valuemin", "0");
      expect(slider).toHaveAttribute("aria-valuemax", "8");
      expect(slider).toHaveAttribute("aria-label", "Pickup Level");
    });

    it("has aria-valuetext matching the human-readable gauge label", () => {
      render(<FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Pickup Level" />);
      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("aria-valuetext", "1/2");
    });

    it("aria-valuetext reflects the current gauge level", () => {
      render(<FuelGauge value={GAUGE_LEVELS.THREE_QUARTER} onChange={noop} label="Pickup Level" />);
      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("aria-valuetext", "3/4");
    });

    it("sets aria-disabled when disabled", () => {
      render(<FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Pickup Level" disabled />);
      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("aria-disabled", "true");
    });

    it("aria-label on slider is stable (does not embed the current value)", () => {
      render(<FuelGauge value={GAUGE_LEVELS.HALF} onChange={noop} label="Pickup Level" />);
      const slider = screen.getByRole("slider");
      // aria-label must be exactly the label prop — value is communicated via aria-valuetext only
      expect(slider).toHaveAttribute("aria-label", "Pickup Level");
    });

    it("keyboard events do not fire when the slider is disabled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FuelGauge value={GAUGE_LEVELS.HALF} onChange={onChange} label="Pickup Level" disabled />);
      const slider = screen.getByRole("slider");
      slider.focus();
      await user.keyboard("{ArrowRight}");
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
