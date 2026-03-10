import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { UHAUL_TRUCKS } from "@/data/trucks";

// Helper: click a truck card by name
async function selectTruck(user: ReturnType<typeof userEvent.setup>, name: string) {
  const card = screen.getByText(name).closest("button")!;
  await user.click(card);
}

describe("Home page", () => {
  // Reset URL between tests so URL-state reads from one test don't pollute the next
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });
  describe("initial state", () => {
    it("renders the app heading", () => {
      render(<Home />);
      expect(screen.getByRole("heading", { name: /fillright/i })).toBeInTheDocument();
    });

    it("shows the cold-start guidance before a truck is selected", () => {
      render(<Home />);
      expect(screen.getByText(/select your truck size above/i)).toBeInTheDocument();
    });

    it("does not show the result section before a truck is selected", () => {
      render(<Home />);
      expect(screen.queryByText(/add before returning/i)).not.toBeInTheDocument();
    });

    it("renders U-Haul truck cards by default", () => {
      render(<Home />);
      // Only U-Haul trucks shown by default; other companies require selecting the company tab
      for (const truck of UHAUL_TRUCKS) {
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
      const distanceInput = screen.getByLabelText(/miles to drop-off in miles/i);
      fireEvent.change(distanceInput, { target: { value: "50" } });
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/\$30 service fee risk/i)).toBeInTheDocument();
    });
  });

  describe("share button", () => {
    function stubClipboard() {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        configurable: true,
        writable: true,
      });
      return writeText;
    }

    it("renders a share button in the result section", async () => {
      const user = userEvent.setup();
      render(<Home />);
      await selectTruck(user, "8 ft Pickup");
      expect(screen.getByRole("button", { name: /copy shareable link/i })).toBeInTheDocument();
    });

    it("shows 'Link copied!' confirmation after clicking", async () => {
      stubClipboard();
      const user = userEvent.setup();
      render(<Home />);
      await selectTruck(user, "8 ft Pickup");
      await user.click(screen.getByRole("button", { name: /copy shareable link/i }));
      expect(screen.getByText(/link copied/i)).toBeInTheDocument();
    });

    it("displays the share button text before copying", async () => {
      const user = userEvent.setup();
      render(<Home />);
      await selectTruck(user, "8 ft Pickup");
      // Before clicking: button shows the default label
      expect(screen.getByText("Share this calculation")).toBeInTheDocument();
    });
  });

  describe("URL state", () => {
    it("syncs truck selection to the URL", async () => {
      const user = userEvent.setup();
      render(<Home />);
      await selectTruck(user, "Cargo Van");
      await waitFor(() =>
        expect(window.location.search).toContain("truck=uhaul-cargo-van")
      );
    });

    it("syncs distance to the URL when entered", async () => {
      const user = userEvent.setup();
      render(<Home />);
      await selectTruck(user, "8 ft Pickup");
      const distanceInput = screen.getByLabelText(/miles to drop-off in miles/i);
      fireEvent.change(distanceInput, { target: { value: "25" } });
      await waitFor(() => expect(window.location.search).toContain("dist=25"));
    });

    it("reads truck from URL params on mount", async () => {
      window.history.replaceState(null, "", "?truck=uhaul-26ft&pickup=0.75&current=0.5");
      render(<Home />);
      await waitFor(() =>
        expect(screen.getByText(/add before returning/i)).toBeInTheDocument()
      );
      // 26ft truck is selected: find the checked card within the truck size radiogroup
      const truckGroup = screen.getByRole("radiogroup", { name: /select truck size/i });
      const selectedCard = Array.from(truckGroup.querySelectorAll('[role="radio"]')).find(
        (r) => r.getAttribute("aria-checked") === "true"
      );
      expect(selectedCard?.textContent).toContain("26 ft Truck");
    });

    it("ignores unknown truck IDs from URL params", () => {
      window.history.replaceState(null, "", "?truck=unknown-truck-xyz");
      render(<Home />);
      // No truck selected, cold-start guidance shown
      expect(screen.getByText(/select your truck size above/i)).toBeInTheDocument();
    });

    it("ignores invalid gauge level values from URL params", async () => {
      // 0.33 is not a valid display level; should fall back to default (FULL for pickup)
      window.history.replaceState(null, "", "?truck=uhaul-15ft&pickup=0.33&current=0.5");
      render(<Home />);
      await waitFor(() =>
        expect(screen.getByText(/add before returning/i)).toBeInTheDocument()
      );
      // pickup defaults to FULL (1.0) because 0.33 is not a valid level
      const pickupFullBtn = screen.getByRole("button", { name: /At Pickup F/ });
      expect(pickupFullBtn).toHaveAttribute("aria-pressed", "true");
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

  describe("scroll-into-view on keyboard dismissal", () => {
    it("calls scrollIntoView on result section when distance input is blurred", async () => {
      const user = userEvent.setup();
      render(<Home />);
      await selectTruck(user, "8 ft Pickup");

      const scrollIntoView = vi.fn();
      const resultSection = document.querySelector("[aria-live='polite']");
      expect(resultSection).not.toBeNull();
      (resultSection as HTMLElement).scrollIntoView = scrollIntoView;

      const distanceInput = screen.getByLabelText(/miles to drop-off in miles/i);
      await user.click(distanceInput);
      await user.tab(); // blur the distance input

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "nearest" });
    });

    it("calls scrollIntoView on result section when gas price input is blurred", async () => {
      const user = userEvent.setup();
      render(<Home />);
      await selectTruck(user, "8 ft Pickup");

      const scrollIntoView = vi.fn();
      const resultSection = document.querySelector("[aria-live='polite']");
      expect(resultSection).not.toBeNull();
      (resultSection as HTMLElement).scrollIntoView = scrollIntoView;

      const gasPriceInput = screen.getByLabelText(/gas price per gallon/i);
      await user.click(gasPriceInput);
      await user.tab(); // blur the gas price input

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "nearest" });
    });

    it("result section renders with data-result attribute when result exists", async () => {
      const user = userEvent.setup();
      render(<Home />);
      await selectTruck(user, "8 ft Pickup");
      const resultSection = document.querySelector("[data-result='true']");
      expect(resultSection).not.toBeNull();
    });

    it("does not scroll when no result exists (no truck selected)", async () => {
      const user = userEvent.setup();
      render(<Home />);
      // Do NOT select a truck — result is null

      const scrollIntoView = vi.fn();
      // The result section should not be in the DOM
      const resultSection = document.querySelector("[aria-live='polite']");
      if (resultSection) {
        (resultSection as HTMLElement).scrollIntoView = scrollIntoView;
      }

      const distanceInput = screen.getByLabelText(/miles to drop-off in miles/i);
      await user.click(distanceInput);
      await user.tab();

      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it("still fires scroll attempt when gas price input is blurred with invalid value", async () => {
      const user = userEvent.setup();
      render(<Home />);
      await selectTruck(user, "8 ft Pickup");

      const scrollIntoView = vi.fn();
      const resultSection = document.querySelector("[aria-live='polite']");
      if (resultSection) {
        (resultSection as HTMLElement).scrollIntoView = scrollIntoView;
      }

      const gasPriceInput = screen.getByLabelText(/gas price per gallon/i);
      await user.click(gasPriceInput);
      await user.type(gasPriceInput, "abc");
      await user.tab();

      // scroll fires regardless of gas price validity — result is based on truck/distance
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "nearest" });
    });
  });
});
