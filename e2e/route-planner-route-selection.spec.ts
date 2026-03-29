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

// Minimal 2-point geometry — enough to satisfy the >= 2 passthrough check in /api/route-plan
const GEO_0: [number, number][] = [[-87.6298, 41.8781], [-104.9903, 39.7392]];
const GEO_1: [number, number][] = [[-87.6298, 41.8781], [-95.0, 40.0], [-104.9903, 39.7392]];

const ONE_ALTERNATIVE = {
  alternatives: [
    { index: 0, distanceMiles: 1840, durationMinutes: 1500, label: "via I-80 E", geometry: GEO_0 },
  ],
};

const TWO_ALTERNATIVES = {
  alternatives: [
    { index: 0, distanceMiles: 1840, durationMinutes: 1500, label: "via I-80 E", geometry: GEO_0 },
    { index: 1, distanceMiles: 1967, durationMinutes: 1620, label: "via I-84 E, I-90 E", geometry: GEO_1 },
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
    truck: {
      id: "uhaul-10ft",
      name: "10 ft Truck",
      company: "uhaul",
      tankCapacity: 31,
      mpg: 12,
      fuelType: "regular",
    },
    riskTolerance: "standard",
    loadLevel: "empty",
    generatedAt: new Date().toISOString(),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

test.describe("route planner — route selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/autocomplete*", (route) =>
      route.fulfill({ json: { suggestions: [CHICAGO, DENVER] } })
    );
    await page.goto("/route-planner");
  });

  test("when only one route exists, skips picker and shows results directly", async ({
    page,
  }) => {
    await page.route("**/api/route-alternatives**", (route) =>
      route.fulfill({ json: ONE_ALTERNATIVE })
    );
    await page.route("**/api/route-plan", (route) =>
      route.fulfill({ json: makeMockRoute() })
    );

    await fillForm(page);
    await page.getByRole("button", { name: /plan route/i }).click();

    // Picker must NOT appear
    await expect(
      page.getByRole("group", { name: /choose your route/i })
    ).not.toBeVisible();

    // Results appear directly
    await expect(
      page.getByRole("region", { name: /route plan results/i })
    ).toBeVisible();
  });

  test("when two routes exist, shows route selection step before results", async ({
    page,
  }) => {
    await page.route("**/api/route-alternatives**", (route) =>
      route.fulfill({ json: TWO_ALTERNATIVES })
    );
    await page.route("**/api/route-plan", (route) =>
      route.fulfill({ json: makeMockRoute() })
    );

    await fillForm(page);
    await page.getByRole("button", { name: /plan route/i }).click();

    await expect(
      page.getByRole("group", { name: /choose your route/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /via i-80 e/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /via i-84 e/i })
    ).toBeVisible();

    // Results must NOT be shown yet
    await expect(
      page.getByRole("region", { name: /route plan results/i })
    ).not.toBeVisible();
  });

  test("route cards show distance and estimated duration", async ({ page }) => {
    await page.route("**/api/route-alternatives**", (route) =>
      route.fulfill({ json: TWO_ALTERNATIVES })
    );
    await page.route("**/api/route-plan", (route) =>
      route.fulfill({ json: makeMockRoute() })
    );

    await fillForm(page);
    await page.getByRole("button", { name: /plan route/i }).click();

    // 1840 mi formatted with comma
    await expect(page.getByText("1,840 mi")).toBeVisible();
    // 1500 min = 25 hr 0 min → "25 hr"
    await expect(page.getByText("25 hr")).toBeVisible();
  });

  test("selecting a route passes correct routeIndex to route-plan API", async ({
    page,
  }) => {
    await page.route("**/api/route-alternatives**", (route) =>
      route.fulfill({ json: TWO_ALTERNATIVES })
    );

    let capturedBody: Record<string, unknown> = {};
    await page.route("**/api/route-plan", async (route) => {
      capturedBody = (await route.request().postDataJSON()) as Record<
        string,
        unknown
      >;
      await route.fulfill({ json: makeMockRoute() });
    });

    await fillForm(page);
    await page.getByRole("button", { name: /plan route/i }).click();

    // Pick the second route (index 1)
    await page.getByRole("button", { name: /via i-84 e/i }).click();

    expect(capturedBody.routeIndex).toBe(1);
  });

  test("after selecting a route, results are shown and picker is hidden", async ({
    page,
  }) => {
    await page.route("**/api/route-alternatives**", (route) =>
      route.fulfill({ json: TWO_ALTERNATIVES })
    );
    await page.route("**/api/route-plan", (route) =>
      route.fulfill({ json: makeMockRoute() })
    );

    await fillForm(page);
    await page.getByRole("button", { name: /plan route/i }).click();
    await page.getByRole("button", { name: /via i-80 e/i }).click();

    await expect(
      page.getByRole("region", { name: /route plan results/i })
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: /choose your route/i })
    ).not.toBeVisible();
  });

  test("route-alternatives failure shows user-friendly error", async ({
    page,
  }) => {
    await page.route("**/api/route-alternatives**", (route) =>
      route.fulfill({ status: 502, json: { error: "Routing error" } })
    );

    await fillForm(page);
    await page.getByRole("button", { name: /plan route/i }).click();

    // Use the visible error container (not the Next.js route announcer which also has role="alert")
    await expect(
      page.getByRole("alert").filter({ hasText: /routing error|something went wrong|we couldn't find/i })
    ).toBeVisible();
  });

  test("feature flag off: route planner page shows coming-soon message", async ({
    page,
  }) => {
    // This test relies on NEXT_PUBLIC_FEATURE_ROUTE_PLANNER not being "true".
    // It is skipped here because tests run with the flag enabled (.env.local).
    // Validate this manually by unsetting the env var.
    test.skip(true, "Feature flag is enabled in dev — test manually with flag off");
  });
});
