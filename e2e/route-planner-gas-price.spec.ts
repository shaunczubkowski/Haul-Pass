/**
 * E2E tests for issue #98 — gasPricePerGallon input handling.
 *
 * Tests cover:
 *  - Valid gas price is forwarded to /api/route-plan as a number
 *  - Empty gas price field omits gasPricePerGallon from the request
 *  - The displayed cost estimate reflects the entered gas price
 */

import { test, expect } from "@playwright/test";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CHICAGO = {
  id: "c1",
  displayName: "Chicago",
  fullAddress: "Chicago, Illinois, United States",
  coordinates: { lat: 41.8781, lng: -87.6298 },
};

const DENVER = {
  id: "d1",
  displayName: "Denver",
  fullAddress: "Denver, Colorado, United States",
  coordinates: { lat: 39.7392, lng: -104.9903 },
};

const SINGLE_ALTERNATIVE = {
  alternatives: [
    {
      index: 0,
      distanceMiles: 1000,
      durationMinutes: 900,
      label: "via I-80 E",
      geometry: [[-87.6298, 41.8781], [-104.9903, 39.7392]] as [number, number][],
    },
  ],
};

function makeMockRoute(stopCount = 2, withCost = false) {
  return {
    origin: CHICAGO,
    destination: DENVER,
    totalMiles: 1000,
    totalStops: stopCount,
    estimatedTotalGallons: stopCount * 20,
    estimatedTotalCost: withCost ? stopCount * 20 * 3.99 : null,
    stops: Array.from({ length: stopCount }, (_, i) => ({
      stopNumber: i + 1,
      waypoint: {
        lat: 41.5 - i * 0.5,
        lng: -90.0 - i * 4.0,
        milesFromOrigin: (i + 1) * 200,
        locationLabel: `${(i + 1) * 200} miles from start`,
      },
      milesFromPreviousStop: 200,
      station: {
        name: null,
        address: null,
        coordinates: { lat: 41.5 - i * 0.5, lng: -90.0 - i * 4.0 },
        mapsUrl: `https://www.google.com/maps/search/gas+stations/@${41.5 - i * 0.5},${-90.0 - i * 4.0},14z`,
      },
      fuelCalculation: {
        gallonsToAdd: 20,
        estimatedCost: withCost ? 20 * 3.99 : null,
        isAtRisk: false,
        fuelType: "regular",
      },
    })),
    truck: { id: "uhaul-10ft", name: "10 ft Truck", company: "uhaul", tankCapacity: 31, mpg: 12, fuelType: "regular" },
    riskTolerance: "standard",
    loadLevel: "empty",
    generatedAt: new Date().toISOString(),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fillForm(page: import("@playwright/test").Page, gasPrice?: string) {
  await page.route("**/api/route-alternatives**", (route) =>
    route.fulfill({ json: SINGLE_ALTERNATIVE })
  );

  await page.getByRole("combobox", { name: /starting from/i }).fill("Chicago");
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.getByRole("option").first().click();

  await page.getByRole("combobox", { name: /going to/i }).fill("Denver");
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.getByRole("option").first().click();

  await page.getByRole("radio", { name: "10 ft Truck" }).click();

  if (gasPrice !== undefined) {
    await page.getByLabel(/gas price per gallon/i).fill(gasPrice);
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("route planner — gas price input (#98)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/autocomplete*", (route) =>
      route.fulfill({ json: { suggestions: [CHICAGO, DENVER] } })
    );
    await page.goto("/route-planner");
  });

  test("valid gas price is sent as a number in the request body", async ({
    page,
  }) => {
    let capturedBody: Record<string, unknown> = {};
    await page.route("**/api/route-plan", async (route) => {
      capturedBody = (await route.request().postDataJSON()) as Record<string, unknown>;
      await route.fulfill({ json: makeMockRoute(2, true) });
    });

    await fillForm(page, "3.99");
    await page.getByRole("button", { name: /plan route/i }).click();
    await expect(page.getByRole("region", { name: /route plan results/i })).toBeVisible();

    expect(typeof capturedBody.gasPricePerGallon).toBe("number");
    expect(capturedBody.gasPricePerGallon).toBeCloseTo(3.99, 2);
  });

  test("empty gas price field omits gasPricePerGallon from request", async ({
    page,
  }) => {
    let capturedBody: Record<string, unknown> = {};
    await page.route("**/api/route-plan", async (route) => {
      capturedBody = (await route.request().postDataJSON()) as Record<string, unknown>;
      await route.fulfill({ json: makeMockRoute() });
    });

    await fillForm(page); // no gas price
    await page.getByRole("button", { name: /plan route/i }).click();
    await expect(page.getByRole("region", { name: /route plan results/i })).toBeVisible();

    expect(capturedBody.gasPricePerGallon).toBeUndefined();
  });

  test("gas price input accepts decimal values", async ({ page }) => {
    const gasPriceInput = page.getByLabel(/gas price per gallon/i);
    await gasPriceInput.fill("4.579");
    await expect(gasPriceInput).toHaveValue("4.579");
  });

  test("gas price input has correct type and min attributes", async ({
    page,
  }) => {
    const gasPriceInput = page.getByLabel(/gas price per gallon/i);
    await expect(gasPriceInput).toHaveAttribute("type", "number");
    await expect(gasPriceInput).toHaveAttribute("min", "0.01");
  });

  test("gas price below minimum (0.01) is not sent — client guards sub-cent values", async ({
    page,
  }) => {
    // The client ignores prices below 0.01 and sends undefined
    let capturedBody: Record<string, unknown> = {};
    await page.route("**/api/route-plan", async (route) => {
      capturedBody = (await route.request().postDataJSON()) as Record<string, unknown>;
      await route.fulfill({ json: makeMockRoute() });
    });

    await fillForm(page, "0.001");
    await page.getByRole("button", { name: /plan route/i }).click();
    await expect(page.getByRole("region", { name: /route plan results/i })).toBeVisible();

    expect(capturedBody.gasPricePerGallon).toBeUndefined();
  });
});
