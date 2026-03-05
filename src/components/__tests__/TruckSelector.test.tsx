import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TruckSelector } from "@/components/TruckSelector";
import { ALL_TRUCKS, UHAUL_TRUCKS } from "@/data/trucks";

const noop = () => {};

describe("TruckSelector", () => {
  describe("rendering", () => {
    it("renders a card for every truck in ALL_TRUCKS", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      const radios = screen.getAllByRole("radio");
      expect(radios.length).toBe(ALL_TRUCKS.length);
    });

    it("renders truck name on each card", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      for (const truck of UHAUL_TRUCKS) {
        expect(screen.getByText(truck.name)).toBeInTheDocument();
      }
    });

    it("renders tank capacity on each card", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      expect(screen.getByText("26 gal")).toBeInTheDocument(); // cargo van (unique)
      expect(screen.getAllByText("40 gal").length).toBeGreaterThan(0); // 15ft/17ft/20ft share 40 gal
      expect(screen.getAllByText("60 gal").length).toBeGreaterThan(0); // 24ft/26ft share 60 gal
    });

    it("renders MPG on each card", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      expect(screen.getByText("19 MPG")).toBeInTheDocument(); // pickup (unique)
      expect(screen.getAllByText("7 MPG").length).toBeGreaterThan(0); // 24ft/26ft share 7 MPG
    });

    it("has a radiogroup with accessible label", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      expect(screen.getByRole("radiogroup", { name: /select truck size/i })).toBeInTheDocument();
    });
  });

  describe("selection state", () => {
    it("marks the selected truck as checked", () => {
      const truck15ft = ALL_TRUCKS.find((t) => t.id === "uhaul-15ft")!;
      render(<TruckSelector value={truck15ft} onChange={noop} />);
      const selected = screen.getAllByRole("radio").find(
        (r) => r.getAttribute("aria-checked") === "true"
      );
      expect(selected).toBeDefined();
      expect(selected!.textContent).toContain("15 ft Truck");
    });

    it("marks all other trucks as not checked when one is selected", () => {
      const truck15ft = ALL_TRUCKS.find((t) => t.id === "uhaul-15ft")!;
      render(<TruckSelector value={truck15ft} onChange={noop} />);
      const unchecked = screen
        .getAllByRole("radio")
        .filter((r) => r.getAttribute("aria-checked") === "false");
      expect(unchecked.length).toBe(ALL_TRUCKS.length - 1);
    });

    it("marks no truck as checked when value is null", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      const checked = screen
        .getAllByRole("radio")
        .filter((r) => r.getAttribute("aria-checked") === "true");
      expect(checked.length).toBe(0);
    });
  });

  describe("interaction", () => {
    it("calls onChange with the clicked truck", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TruckSelector value={null} onChange={onChange} />);
      const cargoVanCard = screen.getByText("Cargo Van").closest("button")!;
      await user.click(cargoVanCard);
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: "uhaul-cargo-van" })
      );
    });

    it("calls onChange when re-clicking the already-selected truck", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const truck15ft = ALL_TRUCKS.find((t) => t.id === "uhaul-15ft")!;
      render(<TruckSelector value={truck15ft} onChange={onChange} />);
      const card = screen.getByText("15 ft Truck").closest("button")!;
      await user.click(card);
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: "uhaul-15ft" }));
    });
  });
});
