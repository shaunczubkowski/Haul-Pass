import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DistanceInput } from "@/components/DistanceInput";

const noop = () => {};

describe("DistanceInput", () => {
  describe("rendering", () => {
    it("renders with label", () => {
      render(<DistanceInput value={0} onChange={noop} />);
      expect(screen.getByLabelText(/miles to drop-off in miles/i)).toBeInTheDocument();
    });

    it("shows 'mi' toggle button by default (miles mode — button shows current unit)", () => {
      render(<DistanceInput value={0} onChange={noop} />);
      expect(screen.getByRole("button", { name: /distance unit: miles\. switch to kilometers/i })).toBeInTheDocument();
      // Button shows the current unit (mi), consistent with the "Miles to Drop-off" label
      expect(screen.getByText("mi")).toBeInTheDocument();
    });

    it("displays empty input when value is 0", () => {
      render(<DistanceInput value={0} onChange={noop} />);
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveValue(null); // empty string renders as null in number inputs
    });

    it("displays value in miles when in miles mode", () => {
      render(<DistanceInput value={50} onChange={noop} />);
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveValue(50);
    });
  });

  describe("value changes", () => {
    it("calls onChange with miles when user types a distance", () => {
      const onChange = vi.fn();
      render(<DistanceInput value={0} onChange={onChange} />);
      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "25" } });
      expect(onChange).toHaveBeenLastCalledWith(25);
    });

    it("calls onChange with 0 when input is cleared", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<DistanceInput value={10} onChange={onChange} />);
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      expect(onChange).toHaveBeenCalledWith(0);
    });
  });

  describe("unit toggle", () => {
    it("switches to km mode when toggle is clicked", async () => {
      const user = userEvent.setup();
      render(<DistanceInput value={0} onChange={noop} />);
      await user.click(screen.getByRole("button", { name: /switch to kilometers/i }));
      // Now in km mode: button shows "km" (the current unit)
      expect(screen.getByText("km")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /switch to miles/i })).toBeInTheDocument();
    });

    it("converts km input to miles when calling onChange", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<DistanceInput value={0} onChange={onChange} />);
      // Switch to km
      await user.click(screen.getByRole("button", { name: /switch to kilometers/i }));
      const input = screen.getByRole("spinbutton");
      // Use fireEvent.change to avoid controlled-input re-render issue with vi.fn()
      fireEvent.change(input, { target: { value: "100" } });
      // 100 km = 62.1 miles (parseFloat((100 * 0.621371).toFixed(1)))
      expect(onChange).toHaveBeenLastCalledWith(62.1);
    });

    it("toggles back to miles when clicked again", async () => {
      const user = userEvent.setup();
      render(<DistanceInput value={0} onChange={noop} />);
      const btn = screen.getByRole("button", { name: /switch to kilometers/i });
      await user.click(btn);
      await user.click(screen.getByRole("button", { name: /switch to miles/i }));
      // Back in miles mode: button shows "mi" (the current unit)
      expect(screen.getByText("mi")).toBeInTheDocument();
    });
  });

  describe("input validation", () => {
    it("ignores negative input values and does not call onChange", () => {
      const onChange = vi.fn();
      render(<DistanceInput value={0} onChange={onChange} />);
      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "-50" } });
      expect(onChange).not.toHaveBeenCalled();
    });

    it("accepts decimal distances", () => {
      const onChange = vi.fn();
      render(<DistanceInput value={0} onChange={onChange} />);
      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "15.5" } });
      expect(onChange).toHaveBeenLastCalledWith(15.5);
    });
  });

  describe("disabled state", () => {
    it("disables the input when disabled prop is true", () => {
      render(<DistanceInput value={0} onChange={noop} disabled />);
      expect(screen.getByRole("spinbutton")).toBeDisabled();
    });

    it("disables the unit toggle when disabled", () => {
      render(<DistanceInput value={0} onChange={noop} disabled />);
      expect(screen.getByRole("button", { name: /switch to kilometers/i })).toBeDisabled();
    });
  });
});
