import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { ALL_TRUCKS } from "@/data/trucks";

// Helper: click the first truck card (8ft Pickup)
async function selectTruck(user: ReturnType<typeof userEvent.setup>, name: string) {
  const card = screen.getByText(name).closest("button")!;
  await user.click(card);
}

describe("Home page", () => {
  describe("initial state", () => {
    it("renders the app heading", () => {
      render(<Home />);
      expect(screen.getByRole("heading", { name: /fillright/i })).toBeInTheDocument();
    });

    it("shows the cold-start guidance before a truck is selected", () => {
      render(<Home />);
      expect(screen.getByText(/start by selecting your truck size/i)).toBeInTheDocument();
    });

    it("does not show the result section before a truck is selected", () => {
      render(<Home />);
      expect(screen.queryByText(/add before returning/i)).not.toBeInTheDocument();
    });

    it("renders all truck cards", () => {
      render(<Home />);
      for (const truck of ALL_TRUCKS) {
        expect(screen.getByText(truck.name)).toBeInTheDocument();
      }
    });
  });

  describe("alreadySufficient result state", () => {
    it("shows 'You're good to go!' when no fuel is needed", async () => {
      const user = userEvent.setup();
      render(<Home />);
      // Select 10ft truck (31 gal, 12 MPG)
      await selectTruck(user, "10 ft Truck");
      // Default: pickup=Full, current=Half — current > pickup after no drive → sufficient
      // Actually pickup=Full (31 gal), current=Half (15.5 gal) → not sufficient by default.
      // We need pickup < current. Set pickup to 1/4 via gauge buttons.
      const pickupGauge = screen.getAllByRole("button", { name: /At Pickup 1\/4/ })[0];
      await user.click(pickupGauge);
      // current defaults to 1/2, which is > 1/4 pickup → sufficient
      expect(screen.getByText(/you're good to go/i)).toBeInTheDocument();
    });
  });

  describe("needs fuel result state", () => {
    it("shows gallons to add when fuel is needed", async () => {
      const user = userEvent.setup();
      render(<Home />);
      // 8ft Pickup: 34 gal tank, 19 MPG
      // pickup=Full (34 gal), current=Half (17 gal), no distance
      // Needs: 34 - 17 + 0.5 buffer = 17.5 gal
      await selectTruck(user, "8 ft Pickup");
      expect(screen.getByText(/add before returning/i)).toBeInTheDocument();
      expect(screen.getByText("gal")).toBeInTheDocument();
    });

    it("shows the breakdown section", async () => {
      const user = userEvent.setup();
      render(<Home />);
      await selectTruck(user, "8 ft Pickup");
      expect(screen.getByText(/needed at return/i)).toBeInTheDocument();
      expect(screen.getByText(/in tank now/i)).toBeInTheDocument();
    });

    it("shows cost estimate when gas price is entered", async () => {
      const user = userEvent.setup();
      render(<Home />);
      await selectTruck(user, "8 ft Pickup");
      const gasPriceInput = screen.getByLabelText(/gas price per gallon/i);
      fireEvent.change(gasPriceInput, { target: { value: "4" } });
      // Cost estimate line always starts with "≈ $"
      expect(screen.getByText(/≈ \$/)).toBeInTheDocument();
    });

    it("hides cost estimate when gas price is cleared", async () => {
      const user = userEvent.setup();
      render(<Home />);
      await selectTruck(user, "8 ft Pickup");
      const gasPriceInput = screen.getByLabelText(/gas price per gallon/i);
      await user.click(gasPriceInput);
      await user.type(gasPriceInput, "4.00");
      await user.clear(gasPriceInput);
      // Cost estimate line (≈ $xx.xx) should disappear
      expect(screen.queryByText(/≈ \$/)).not.toBeInTheDocument();
    });
  });

  describe("isAtRisk result state", () => {
    it("shows the $30 fee risk warning when level will drop below 1/4 tank", async () => {
      const user = userEvent.setup();
      render(<Home />);
      // 10ft truck: 31 gal, 12 MPG
      // pickup=Full (31 gal), current=1/4 (7.75 gal), distance=50 miles (4.17 gal consumed)
      // level after drive = (7.75 - 4.17)/31 = ~11.5% < 25% → at risk
      await selectTruck(user, "10 ft Truck");
      const currentQuarterBtn = screen.getAllByRole("button", { name: /Right Now 1\/4/ })[0];
      await user.click(currentQuarterBtn);
      const distanceInput = screen.getByLabelText(/distance to drop-off in miles/i);
      fireEvent.change(distanceInput, { target: { value: "50" } });
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/\$30 service fee risk/i)).toBeInTheDocument();
    });
  });

  describe("result section accessibility", () => {
    it("result section has aria-live=polite and aria-atomic=true", async () => {
      const user = userEvent.setup();
      render(<Home />);
      await selectTruck(user, "8 ft Pickup");
      const resultSection = document.querySelector("[aria-live='polite']");
      expect(resultSection).not.toBeNull();
      expect(resultSection).toHaveAttribute("aria-atomic", "true");
    });
  });
});
