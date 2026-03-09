import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TruckSelector } from "@/components/TruckSelector";
import { ALL_TRUCKS, UHAUL_TRUCKS, PENSKE_TRUCKS } from "@/data/trucks";

const noop = () => {};

describe("TruckSelector", () => {
  describe("rendering", () => {
    it("renders company selector tabs for all 4 companies", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      const companyGroup = screen.getByRole("radiogroup", { name: /select rental company/i });
      const companyButtons = companyGroup.querySelectorAll('[role="radio"]');
      expect(companyButtons.length).toBe(4);
    });

    it("renders only U-Haul trucks by default", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      const truckGroup = screen.getByRole("radiogroup", { name: /select truck size/i });
      const truckButtons = truckGroup.querySelectorAll('[role="radio"]');
      expect(truckButtons.length).toBe(UHAUL_TRUCKS.length);
    });

    it("renders Penske trucks when Penske company tab is clicked", async () => {
      const user = userEvent.setup();
      render(<TruckSelector value={null} onChange={noop} />);
      const penskeTab = screen.getByRole("radio", { name: "Penske" });
      await user.click(penskeTab);
      const truckGroup = screen.getByRole("radiogroup", { name: /select truck size/i });
      const truckButtons = truckGroup.querySelectorAll('[role="radio"]');
      expect(truckButtons.length).toBe(PENSKE_TRUCKS.length);
    });

    it("renders truck name on each card for the selected company", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      for (const truck of UHAUL_TRUCKS) {
        expect(screen.getByText(truck.name)).toBeInTheDocument();
      }
    });

    it("renders tank capacity on each card", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      // Capacity and MPG are combined in a single element: "26 gal · 18 MPG"
      expect(screen.getByText(/26 gal/)).toBeInTheDocument(); // cargo van (unique)
      expect(screen.getAllByText(/40 gal/).length).toBeGreaterThan(0); // 15ft/17ft/20ft share 40 gal
      expect(screen.getAllByText(/60 gal/).length).toBeGreaterThan(0); // 24ft/26ft share 60 gal
    });

    it("renders MPG on each card", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      // Capacity and MPG are combined in a single element: "34 gal · 19 MPG"
      expect(screen.getByText(/19 MPG/)).toBeInTheDocument(); // pickup (unique)
      expect(screen.getAllByText(/7 MPG/).length).toBeGreaterThan(0); // 24ft/26ft share 7 MPG
    });

    it("renders load size hint on each card", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      expect(screen.getByText("2 bedrooms")).toBeInTheDocument(); // 15ft
      expect(screen.getByText("Studio")).toBeInTheDocument(); // cargo van
    });

    it("has a truck size radiogroup with accessible label", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      expect(screen.getByRole("radiogroup", { name: /select truck size/i })).toBeInTheDocument();
    });

    it("shows diesel warning when Penske is selected", async () => {
      const user = userEvent.setup();
      render(<TruckSelector value={null} onChange={noop} />);
      await user.click(screen.getByRole("radio", { name: "Penske" }));
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/penske trucks use diesel fuel/i)).toBeInTheDocument();
    });

    it("does not show diesel warning for U-Haul", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows 'diesel' badge on Penske truck cards", async () => {
      const user = userEvent.setup();
      render(<TruckSelector value={null} onChange={noop} />);
      await user.click(screen.getByRole("radio", { name: "Penske" }));
      const dieselBadges = screen.getAllByText("diesel");
      expect(dieselBadges.length).toBe(PENSKE_TRUCKS.length);
    });
  });

  describe("selection state", () => {
    it("marks the selected truck as checked in its truck group", () => {
      const truck15ft = ALL_TRUCKS.find((t) => t.id === "uhaul-15ft")!;
      render(<TruckSelector value={truck15ft} onChange={noop} />);
      const truckGroup = screen.getByRole("radiogroup", { name: /select truck size/i });
      const selected = Array.from(truckGroup.querySelectorAll('[role="radio"]')).find(
        (r) => r.getAttribute("aria-checked") === "true"
      );
      expect(selected).toBeDefined();
      expect(selected!.textContent).toContain("15 ft Truck");
    });

    it("marks all other trucks as not checked when one is selected", () => {
      const truck15ft = ALL_TRUCKS.find((t) => t.id === "uhaul-15ft")!;
      render(<TruckSelector value={truck15ft} onChange={noop} />);
      const truckGroup = screen.getByRole("radiogroup", { name: /select truck size/i });
      const unchecked = Array.from(truckGroup.querySelectorAll('[role="radio"]')).filter(
        (r) => r.getAttribute("aria-checked") === "false"
      );
      expect(unchecked.length).toBe(UHAUL_TRUCKS.length - 1);
    });

    it("marks no truck as checked when value is null", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      const truckGroup = screen.getByRole("radiogroup", { name: /select truck size/i });
      const checked = Array.from(truckGroup.querySelectorAll('[role="radio"]')).filter(
        (r) => r.getAttribute("aria-checked") === "true"
      );
      expect(checked.length).toBe(0);
    });

    it("switches to Penske company tab when a Penske truck is passed as value", () => {
      const penskeTruck = PENSKE_TRUCKS[0];
      render(<TruckSelector value={penskeTruck} onChange={noop} />);
      const penskeTab = screen.getByRole("radio", { name: "Penske" });
      expect(penskeTab).toHaveAttribute("aria-checked", "true");
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

    it("auto-selects first Penske truck when switching to Penske company tab", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const truck15ft = ALL_TRUCKS.find((t) => t.id === "uhaul-15ft")!;
      render(<TruckSelector value={truck15ft} onChange={onChange} />);
      await user.click(screen.getByRole("radio", { name: "Penske" }));
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ company: "penske" })
      );
    });
  });
});
