import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

    it("shows fuel-type note when Penske is selected", async () => {
      const user = userEvent.setup();
      render(<TruckSelector value={null} onChange={noop} />);
      await user.click(screen.getByRole("radio", { name: "Penske" }));
      expect(screen.getByRole("note")).toBeInTheDocument();
      expect(screen.getByText(/fuel type varies by truck size/i)).toBeInTheDocument();
    });

    it("shows fuel-type note when Budget is selected", async () => {
      const user = userEvent.setup();
      render(<TruckSelector value={null} onChange={noop} />);
      await user.click(screen.getByRole("radio", { name: "Budget" }));
      expect(screen.getByRole("note")).toBeInTheDocument();
      expect(screen.getByText(/fuel type varies by truck size/i)).toBeInTheDocument();
    });

    it("does not show diesel warning for U-Haul", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      expect(screen.queryByRole("note")).not.toBeInTheDocument();
    });

    it("shows 'diesel' badge only on Penske 22 ft and 26 ft cards", async () => {
      const user = userEvent.setup();
      render(<TruckSelector value={null} onChange={noop} />);
      await user.click(screen.getByRole("radio", { name: "Penske" }));
      // Query only badge spans (px-1 rounded class), not the prose in the note banner
      const truckGroup = screen.getByRole("radiogroup", { name: /select truck size/i });
      const dieselBadges = within(truckGroup).getAllByText("diesel");
      // Only penske-22ft and penske-26ft use diesel; 12 ft and 16 ft use regular
      expect(dieselBadges.length).toBe(2);
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

  describe("keyboard navigation", () => {
    it("ArrowRight on company tab moves focus and selection to next company", async () => {
      const user = userEvent.setup();
      render(<TruckSelector value={null} onChange={noop} />);
      const uhaulTab = screen.getByRole("radio", { name: "U-Haul" });
      uhaulTab.focus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "Penske" })).toHaveFocus();
      expect(screen.getByRole("radio", { name: "Penske" })).toHaveAttribute("aria-checked", "true");
      expect(uhaulTab).toHaveAttribute("aria-checked", "false");
    });

    it("ArrowLeft on company tab moves focus and selection to previous company", async () => {
      const user = userEvent.setup();
      render(<TruckSelector value={null} onChange={noop} />);
      await user.click(screen.getByRole("radio", { name: "Penske" }));
      const penskeTab = screen.getByRole("radio", { name: "Penske" });
      penskeTab.focus();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("radio", { name: "U-Haul" })).toHaveFocus();
      expect(screen.getByRole("radio", { name: "U-Haul" })).toHaveAttribute("aria-checked", "true");
    });

    it("ArrowRight on last company tab wraps focus to first company", async () => {
      const user = userEvent.setup();
      render(<TruckSelector value={null} onChange={noop} />);
      await user.click(screen.getByRole("radio", { name: "Enterprise" }));
      const enterpriseTab = screen.getByRole("radio", { name: "Enterprise" });
      enterpriseTab.focus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "U-Haul" })).toHaveFocus();
    });

    it("ArrowLeft on first company tab wraps focus to last company", async () => {
      const user = userEvent.setup();
      render(<TruckSelector value={null} onChange={noop} />);
      const uhaulTab = screen.getByRole("radio", { name: "U-Haul" });
      uhaulTab.focus();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("radio", { name: "Enterprise" })).toHaveFocus();
    });

    it("ArrowRight on a truck card selects and focuses the next truck", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const pickup = UHAUL_TRUCKS[0]; // uhaul-pickup
      const cargoVan = UHAUL_TRUCKS[1]; // uhaul-cargo-van
      render(<TruckSelector value={pickup} onChange={onChange} />);
      const pickupCard = screen.getByText("8 ft Pickup").closest("button")!;
      pickupCard.focus();
      await user.keyboard("{ArrowRight}");
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: cargoVan.id }));
      expect(screen.getByText("Cargo Van").closest("button")).toHaveFocus();
    });

    it("ArrowLeft on first truck card wraps to last truck", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const pickup = UHAUL_TRUCKS[0];
      const last = UHAUL_TRUCKS[UHAUL_TRUCKS.length - 1];
      render(<TruckSelector value={pickup} onChange={onChange} />);
      const pickupCard = screen.getByText("8 ft Pickup").closest("button")!;
      pickupCard.focus();
      await user.keyboard("{ArrowLeft}");
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: last.id }));
    });

    it("only the selected company tab is in the natural tab order", () => {
      render(<TruckSelector value={null} onChange={noop} />);
      const uhaulTab = screen.getByRole("radio", { name: "U-Haul" });
      const penskeTab = screen.getByRole("radio", { name: "Penske" });
      expect(uhaulTab).toHaveAttribute("tabindex", "0");
      expect(penskeTab).toHaveAttribute("tabindex", "-1");
    });

    it("ArrowRight on company tab emits onChange(null) when a truck from another company is selected", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const truck15ft = ALL_TRUCKS.find((t) => t.id === "uhaul-15ft")!;
      render(<TruckSelector value={truck15ft} onChange={onChange} />);
      const uhaulTab = screen.getByRole("radio", { name: "U-Haul" });
      uhaulTab.focus();
      await user.keyboard("{ArrowRight}");
      expect(onChange).toHaveBeenCalledWith(null);
      expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ company: "penske" }));
    });

    it("clicking the already-active company tab does not call onChange", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const truck15ft = ALL_TRUCKS.find((t) => t.id === "uhaul-15ft")!;
      render(<TruckSelector value={truck15ft} onChange={onChange} />);
      await user.click(screen.getByRole("radio", { name: "U-Haul" }));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("first truck card gets tabIndex=0 after selection is cleared by company switch", async () => {
      const user = userEvent.setup();
      render(<TruckSelector value={null} onChange={noop} />);
      await user.click(screen.getByRole("radio", { name: "Penske" }));
      const truckGroup = screen.getByRole("radiogroup", { name: /select truck size/i });
      const firstCard = truckGroup.querySelectorAll('[role="radio"]')[0];
      expect(firstCard).toHaveAttribute("tabindex", "0");
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

    it("clears selection (calls onChange with null) when switching to a different company tab", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const truck15ft = ALL_TRUCKS.find((t) => t.id === "uhaul-15ft")!;
      render(<TruckSelector value={truck15ft} onChange={onChange} />);
      await user.click(screen.getByRole("radio", { name: "Penske" }));
      expect(onChange).toHaveBeenCalledWith(null);
      expect(onChange).not.toHaveBeenCalledWith(
        expect.objectContaining({ company: "penske" })
      );
    });

    it("does not call onChange when switching company tab with no truck selected", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TruckSelector value={null} onChange={onChange} />);
      await user.click(screen.getByRole("radio", { name: "Penske" }));
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
