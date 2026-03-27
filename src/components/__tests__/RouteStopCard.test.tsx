import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouteStopCard } from "@/components/RouteStopCard";
import type { RouteStop } from "@/types";

const MAPS_APP_KEY = "fillright:mapsApp";

const makeStop = (overrides: Partial<RouteStop> = {}): RouteStop => ({
  stopNumber: 1,
  waypoint: {
    lat: 39.8283,
    lng: -98.5795,
    milesFromOrigin: 180,
    locationLabel: "near Salina, KS",
  },
  milesFromPreviousStop: 180,
  station: {
    name: null,
    address: null,
    coordinates: { lat: 39.8283, lng: -98.5795 },
    mapsUrl: "https://www.google.com/maps/search/gas+stations/@39.8283,-98.5795,14z",
  },
  fuelCalculation: {
    gallonsToAdd: 12,
    estimatedCost: 45.6,
    isAtRisk: false,
    fuelType: "regular",
  },
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
});

describe("RouteStopCard — no saved preference", () => {
  it("shows 'Open in Maps' button initially", () => {
    render(<RouteStopCard stop={makeStop()} />);
    expect(screen.getByRole("button", { name: /open in maps/i })).toBeInTheDocument();
  });

  it("does not show app-specific links before the button is clicked", () => {
    render(<RouteStopCard stop={makeStop()} />);
    expect(screen.queryByRole("link", { name: /google maps/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /apple maps/i })).not.toBeInTheDocument();
  });

  it("shows Google Maps and Apple Maps links after clicking the button", async () => {
    const user = userEvent.setup();
    render(<RouteStopCard stop={makeStop()} />);
    await user.click(screen.getByRole("button", { name: /open in maps/i }));
    expect(screen.getByRole("link", { name: /google maps/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /apple maps/i })).toBeInTheDocument();
  });

  it("Google Maps link points to google.com/maps with correct coords", async () => {
    const user = userEvent.setup();
    render(<RouteStopCard stop={makeStop()} />);
    await user.click(screen.getByRole("button", { name: /open in maps/i }));
    const googleLink = screen.getByRole("link", { name: /google maps/i });
    expect(googleLink).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
    expect(googleLink).toHaveAttribute("href", expect.stringContaining("39.8283"));
    expect(googleLink).toHaveAttribute("href", expect.stringContaining("-98.5795"));
  });

  it("Apple Maps link points to maps.apple.com with correct coords", async () => {
    const user = userEvent.setup();
    render(<RouteStopCard stop={makeStop()} />);
    await user.click(screen.getByRole("button", { name: /open in maps/i }));
    const appleLink = screen.getByRole("link", { name: /apple maps/i });
    expect(appleLink).toHaveAttribute("href", expect.stringContaining("maps.apple.com"));
    expect(appleLink).toHaveAttribute("href", expect.stringContaining("39.8283"));
    expect(appleLink).toHaveAttribute("href", expect.stringContaining("-98.5795"));
  });

  it("uses diesel query for diesel fuel type", async () => {
    const user = userEvent.setup();
    const stop = makeStop({ fuelCalculation: { gallonsToAdd: 12, estimatedCost: null, isAtRisk: false, fuelType: "diesel" } });
    render(<RouteStopCard stop={stop} />);
    await user.click(screen.getByRole("button", { name: /open in maps/i }));
    const googleLink = screen.getByRole("link", { name: /google maps/i });
    expect(googleLink).toHaveAttribute("href", expect.stringContaining("diesel"));
  });

  it("links open in a new tab", async () => {
    const user = userEvent.setup();
    render(<RouteStopCard stop={makeStop()} />);
    await user.click(screen.getByRole("button", { name: /open in maps/i }));
    expect(screen.getByRole("link", { name: /google maps/i })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: /apple maps/i })).toHaveAttribute("target", "_blank");
  });
});

describe("RouteStopCard — preference persistence", () => {
  it("saves 'google' to localStorage when Google Maps is clicked", async () => {
    const user = userEvent.setup();
    render(<RouteStopCard stop={makeStop()} />);
    await user.click(screen.getByRole("button", { name: /open in maps/i }));
    await user.click(screen.getByRole("link", { name: /google maps/i }));
    expect(localStorage.getItem(MAPS_APP_KEY)).toBe("google");
  });

  it("saves 'apple' to localStorage when Apple Maps is clicked", async () => {
    const user = userEvent.setup();
    render(<RouteStopCard stop={makeStop()} />);
    await user.click(screen.getByRole("button", { name: /open in maps/i }));
    await user.click(screen.getByRole("link", { name: /apple maps/i }));
    expect(localStorage.getItem(MAPS_APP_KEY)).toBe("apple");
  });

  it("shows preferred button directly when google preference is saved", () => {
    localStorage.setItem(MAPS_APP_KEY, "google");
    render(<RouteStopCard stop={makeStop()} />);
    expect(screen.getByRole("link", { name: /google maps/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open in maps/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /apple maps/i })).not.toBeInTheDocument();
  });

  it("shows preferred button directly when apple preference is saved", () => {
    localStorage.setItem(MAPS_APP_KEY, "apple");
    render(<RouteStopCard stop={makeStop()} />);
    expect(screen.getByRole("link", { name: /apple maps/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open in maps/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /google maps/i })).not.toBeInTheDocument();
  });

  it("shows picker again after clicking 'Switch app'", async () => {
    const user = userEvent.setup();
    localStorage.setItem(MAPS_APP_KEY, "google");
    render(<RouteStopCard stop={makeStop()} />);
    await user.click(screen.getByRole("button", { name: /switch app/i }));
    expect(screen.getByRole("link", { name: /google maps/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /apple maps/i })).toBeInTheDocument();
  });

  it("preferred link opens in a new tab", () => {
    localStorage.setItem(MAPS_APP_KEY, "google");
    render(<RouteStopCard stop={makeStop()} />);
    expect(screen.getByRole("link", { name: /google maps/i })).toHaveAttribute("target", "_blank");
  });
});
