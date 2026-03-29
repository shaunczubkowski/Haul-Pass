/**
 * E2E tests for issue #99 — geometry passthrough eliminates double Mapbox call.
 *
 * When the user selects a route from the alternatives picker, the client should
 * forward the geometry it received from /api/route-alternatives back to
 * /api/route-plan as `routeGeometry`. The server then reuses that geometry
 * instead of making a second Mapbox request, ensuring the planned stops are
 * always on the same route the user chose in the picker.
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

// Distinct geometry per route so we can assert the correct one was forwarded
const GEO_0: [number, number][] = [
  [-87.6298, 41.8781],
  [-91.0, 41.5],
  [-104.9903, 39.7392],
];
const GEO_1: [number, number][] = [
  [-87.6298, 41.8781],
  [-95.0, 40.0],
  [-100.0, 39.5],
  [-104.9903, 39.7392],
];

const TWO_ALTERNATIVES = {
  alternatives: [
    { index: 0, distanceMiles: 1840, durationMinutes: 1500, label: "via I-80 E", geometry: GEO_0 },
    { index: 1, distanceMiles: 1967, durationMinutes: 1620, label: "via I-84 E, I-90 E", geometry: GEO_1 },
  ],
};

const SINGLE_ALTERNATIVE = {
  alternatives: [
    { index: 0, distanceMiles: 1000, durationMinutes: 900, label: "via I-80 E", geometry: GEO_0 },
  ],
};

function makeMockRoute(stopCount = 2) {
  return {
    origin: CHICAGO,
    destination: DENVER,
    totalMiles: 1000,
    totalStops: stopCount,
    estimatedTotalGallons: stopCount * 20,
    estimatedTotalCost: null,
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
        estimatedCost: null,
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

async function fillForm(page: import("@playwright/test").Page) {
  await page.getByRole("combobox", { name: /starting from/i }).fill("Chicago");
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.getByRole("option").first().click();

  await page.getByRole("combobox", { name: /going to/i }).fill("Denver");
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.getByRole("option").first().click();

  await page.getByRole("radio", { name: "10 ft Truck" }).click();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("route planner — geometry passthrough (#99)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/autocomplete*", (route) =>
      route.fulfill({ json: { suggestions: [CHICAGO, DENVER] } })
    );
    await page.goto("/route-planner");
  });

  test("selecting route 0 from picker forwards its geometry to route-plan", async ({
    page,
  }) => {
    await page.route("**/api/route-alternatives**", (route) =>
      route.fulfill({ json: TWO_ALTERNATIVES })
    );

    let capturedBody: Record<string, unknown> = {};
    await page.route("**/api/route-plan", async (route) => {
      capturedBody = (await route.request().postDataJSON()) as Record<string, unknown>;
      await route.fulfill({ json: makeMockRoute() });
    });

    await fillForm(page);
    await page.getByRole("button", { name: /plan route/i }).click();

    await page.getByRole("button", { name: /via i-80 e/i }).click();
    await expect(page.getByRole("region", { name: /route plan results/i })).toBeVisible();

    expect(capturedBody.routeGeometry).toEqual(GEO_0);
    expect(capturedBody.routeIndex).toBe(0);
  });

  test("selecting route 1 from picker forwards its distinct geometry to route-plan", async ({
    page,
  }) => {
    await page.route("**/api/route-alternatives**", (route) =>
      route.fulfill({ json: TWO_ALTERNATIVES })
    );

    let capturedBody: Record<string, unknown> = {};
    await page.route("**/api/route-plan", async (route) => {
      capturedBody = (await route.request().postDataJSON()) as Record<string, unknown>;
      await route.fulfill({ json: makeMockRoute() });
    });

    await fillForm(page);
    await page.getByRole("button", { name: /plan route/i }).click();

    await page.getByRole("button", { name: /via i-84 e/i }).click();
    await expect(page.getByRole("region", { name: /route plan results/i })).toBeVisible();

    // GEO_1 has 4 points — different from GEO_0's 3 points
    expect(capturedBody.routeGeometry).toEqual(GEO_1);
    expect(capturedBody.routeIndex).toBe(1);
  });

  test("single-route flow also forwards geometry (no picker shown)", async ({
    page,
  }) => {
    await page.route("**/api/route-alternatives**", (route) =>
      route.fulfill({ json: SINGLE_ALTERNATIVE })
    );

    let capturedBody: Record<string, unknown> = {};
    await page.route("**/api/route-plan", async (route) => {
      capturedBody = (await route.request().postDataJSON()) as Record<string, unknown>;
      await route.fulfill({ json: makeMockRoute() });
    });

    await fillForm(page);
    await page.getByRole("button", { name: /plan route/i }).click();

    await expect(page.getByRole("region", { name: /route plan results/i })).toBeVisible();

    // No picker shown — geometry should still be forwarded from the single alternative
    expect(capturedBody.routeGeometry).toEqual(GEO_0);
  });

  test("geometry forwarded contains the correct number of coordinate pairs", async ({
    page,
  }) => {
    await page.route("**/api/route-alternatives**", (route) =>
      route.fulfill({ json: TWO_ALTERNATIVES })
    );

    let capturedBody: Record<string, unknown> = {};
    await page.route("**/api/route-plan", async (route) => {
      capturedBody = (await route.request().postDataJSON()) as Record<string, unknown>;
      await route.fulfill({ json: makeMockRoute() });
    });

    await fillForm(page);
    await page.getByRole("button", { name: /plan route/i }).click();
    await page.getByRole("button", { name: /via i-84 e/i }).click();
    await expect(page.getByRole("region", { name: /route plan results/i })).toBeVisible();

    const geometry = capturedBody.routeGeometry as [number, number][];
    expect(Array.isArray(geometry)).toBe(true);
    expect(geometry.length).toBe(GEO_1.length); // 4 coordinate pairs
    expect(geometry[0]).toHaveLength(2); // each entry is [lng, lat]
  });
});
