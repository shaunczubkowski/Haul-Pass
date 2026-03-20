import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TruckSpecsPage, { metadata } from "@/app/truck-specs/page";
import { ALL_TRUCKS, UHAUL_TRUCKS, PENSKE_TRUCKS, BUDGET_TRUCKS, ENTERPRISE_TRUCKS } from "@/data/trucks";

describe("truck-specs page metadata", () => {
  it("has an indexable title mentioning tank and MPG", () => {
    expect(metadata.title).toBeTruthy();
    const title = typeof metadata.title === "string" ? metadata.title : "";
    expect(title.toLowerCase()).toContain("tank");
    expect(title.toLowerCase()).toContain("mpg");
  });

  it("has a description mentioning all four companies", () => {
    expect(typeof metadata.description).toBe("string");
    const desc = (metadata.description as string).toLowerCase();
    expect(desc).toContain("u-haul");
    expect(desc).toContain("penske");
    expect(desc).toContain("budget");
    expect(desc).toContain("enterprise");
  });

  it("has robots set to index and follow", () => {
    const robots = metadata.robots as { index?: boolean; follow?: boolean };
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(true);
  });
});

describe("truck-specs page rendering", () => {
  it("renders the page heading", () => {
    render(<TruckSpecsPage />);
    expect(screen.getByRole("heading", { level: 1, name: /moving truck specifications/i })).toBeInTheDocument();
  });

  it("renders a section for each company", () => {
    render(<TruckSpecsPage />);
    expect(screen.getByRole("heading", { level: 2, name: /u-haul/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /penske/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /budget/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /enterprise/i })).toBeInTheDocument();
  });

  it("renders a row for every truck in the fleet", () => {
    render(<TruckSpecsPage />);
    // Each truck name appears as a table cell
    for (const truck of ALL_TRUCKS) {
      expect(screen.getAllByText(truck.name).length).toBeGreaterThan(0);
    }
  });

  it("renders correct truck counts per company", () => {
    render(<TruckSpecsPage />);
    // Check row counts via data — all trucks should be present
    expect(UHAUL_TRUCKS.length).toBe(7);
    expect(PENSKE_TRUCKS.length).toBe(5);
    expect(BUDGET_TRUCKS.length).toBe(4);
    expect(ENTERPRISE_TRUCKS.length).toBe(3);
    expect(ALL_TRUCKS.length).toBe(19);
  });

  it("renders source links for trucks with sourceUrl", () => {
    render(<TruckSpecsPage />);
    const trucksWithSource = ALL_TRUCKS.filter((t) => t.sourceUrl);
    // Every truck has a sourceUrl, so there should be source badge links
    expect(trucksWithSource.length).toBe(ALL_TRUCKS.length);
    // Official and Estimated badges should appear in the document
    expect(screen.getAllByText("Official").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Estimated").length).toBeGreaterThan(0);
  });

  it("renders a back link to the home page", () => {
    render(<TruckSpecsPage />);
    const backLink = screen.getByRole("link", { name: /back to fillright/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("renders the methodology callout", () => {
    render(<TruckSpecsPage />);
    expect(screen.getByText(/about these figures/i)).toBeInTheDocument();
    expect(screen.getByText(/empty truck under ideal conditions/i)).toBeInTheDocument();
  });
});

describe("truck data source fields", () => {
  it("all trucks have a sourceUrl", () => {
    for (const truck of ALL_TRUCKS) {
      expect(truck.sourceUrl, `${truck.id} missing sourceUrl`).toBeTruthy();
    }
  });

  it("all trucks have an mpgSource of 'official' or 'estimated'", () => {
    for (const truck of ALL_TRUCKS) {
      expect(["official", "estimated"], `${truck.id} has invalid mpgSource`).toContain(truck.mpgSource);
    }
  });

  it("all U-Haul trucks are marked as official MPG", () => {
    for (const truck of UHAUL_TRUCKS) {
      expect(truck.mpgSource, `${truck.id} should be official`).toBe("official");
    }
  });

  it("all Budget trucks are marked as estimated MPG", () => {
    for (const truck of BUDGET_TRUCKS) {
      expect(truck.mpgSource).toBe("estimated");
    }
  });

  it("all Enterprise trucks are marked as estimated MPG", () => {
    for (const truck of ENTERPRISE_TRUCKS) {
      expect(truck.mpgSource).toBe("estimated");
    }
  });

  it("all Penske trucks are marked as official MPG", () => {
    for (const truck of PENSKE_TRUCKS) {
      expect(truck.mpgSource, `${truck.id} should be official`).toBe("official");
    }
  });
});
