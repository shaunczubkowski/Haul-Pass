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

const BASE_TRUCK = {
  id: "uhaul-10ft",
  name: "10 ft Truck",
  company: "uhaul",
  tankCapacity: 31,
  mpg: 12,
  fuelType: "regular",
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
    truck: BASE_TRUCK,
    riskTolerance: "standard",
    loadLevel: "empty",
    generatedAt: new Date().toISOString(),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fill and submit the route planner form. The caller is responsible for
 *  setting up the /api/route-plan mock before calling this. */
async function fillAndSubmitForm(page: import("@playwright/test").Page) {
  await page.getByRole("combobox", { name: /starting from/i }).fill("Chicago");
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.getByRole("option").first().click();

  await page.getByRole("combobox", { name: /going to/i }).fill("Denver");
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.getByRole("option").first().click();

  await page.getByRole("radio", { name: "10 ft Truck" }).click();
  await page.getByRole("button", { name: /plan route/i }).click();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("route planner — settings affect API request", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/autocomplete*", (route) =>
      route.fulfill({ json: { suggestions: [CHICAGO, DENVER] } })
    );
    await page.goto("/route-planner");
  });

  test("default settings send riskTolerance: standard and loadLevel: empty", async ({
    page,
  }) => {
    let capturedBody: Record<string, unknown> = {};
    await page.route("**/api/route-plan", async (route) => {
      capturedBody = (await route.request().postDataJSON()) as Record<
        string,
        unknown
      >;
      await route.fulfill({ json: makeMockRoute(2) });
    });

    await fillAndSubmitForm(page);
    await expect(
      page.getByRole("region", { name: /route plan results/i })
    ).toBeVisible();

    expect(capturedBody.riskTolerance).toBe("standard");
    expect(capturedBody.loadLevel).toBe("empty");
  });

  test("selecting Conservative sends riskTolerance: conservative", async ({
    page,
  }) => {
    let capturedBody: Record<string, unknown> = {};
    await page.route("**/api/route-plan", async (route) => {
      capturedBody = (await route.request().postDataJSON()) as Record<
        string,
        unknown
      >;
      await route.fulfill({ json: makeMockRoute(2) });
    });

    await page.getByRole("radio", { name: /conservative/i }).click();
    await fillAndSubmitForm(page);
    await expect(
      page.getByRole("region", { name: /route plan results/i })
    ).toBeVisible();

    expect(capturedBody.riskTolerance).toBe("conservative");
  });

  test("selecting Lean sends riskTolerance: lean", async ({ page }) => {
    let capturedBody: Record<string, unknown> = {};
    await page.route("**/api/route-plan", async (route) => {
      capturedBody = (await route.request().postDataJSON()) as Record<
        string,
        unknown
      >;
      await route.fulfill({ json: makeMockRoute(2) });
    });

    await page.getByRole("radio", { name: /lean/i }).click();
    await fillAndSubmitForm(page);
    await expect(
      page.getByRole("region", { name: /route plan results/i })
    ).toBeVisible();

    expect(capturedBody.riskTolerance).toBe("lean");
  });

  test("selecting Fully Loaded sends loadLevel: full", async ({ page }) => {
    let capturedBody: Record<string, unknown> = {};
    await page.route("**/api/route-plan", async (route) => {
      capturedBody = (await route.request().postDataJSON()) as Record<
        string,
        unknown
      >;
      await route.fulfill({ json: makeMockRoute(2) });
    });

    await page.getByRole("button", { name: /fully loaded/i }).click();
    await fillAndSubmitForm(page);
    await expect(
      page.getByRole("region", { name: /route plan results/i })
    ).toBeVisible();

    expect(capturedBody.loadLevel).toBe("full");
  });

  test("selecting Partially Loaded sends loadLevel: partial", async ({
    page,
  }) => {
    let capturedBody: Record<string, unknown> = {};
    await page.route("**/api/route-plan", async (route) => {
      capturedBody = (await route.request().postDataJSON()) as Record<
        string,
        unknown
      >;
      await route.fulfill({ json: makeMockRoute(2) });
    });

    await page.getByRole("button", { name: /partially loaded/i }).click();
    await fillAndSubmitForm(page);
    await expect(
      page.getByRole("region", { name: /route plan results/i })
    ).toBeVisible();

    expect(capturedBody.loadLevel).toBe("partial");
  });
});

test.describe("route planner — settings affect displayed stop count", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/autocomplete*", (route) =>
      route.fulfill({ json: { suggestions: [CHICAGO, DENVER] } })
    );
    await page.goto("/route-planner");
  });

  test("renders the correct number of stop cards returned by the API", async ({
    page,
  }) => {
    await page.route("**/api/route-plan", (route) =>
      route.fulfill({ json: makeMockRoute(4) })
    );
    await fillAndSubmitForm(page);
    await expect(
      page.getByRole("region", { name: /route plan results/i })
    ).toBeVisible();

    await expect(page.getByRole("article")).toHaveCount(4);
  });

  test("fewer stops shown when API returns a shorter route", async ({
    page,
  }) => {
    await page.route("**/api/route-plan", (route) =>
      route.fulfill({ json: makeMockRoute(2) })
    );
    await fillAndSubmitForm(page);
    await expect(
      page.getByRole("region", { name: /route plan results/i })
    ).toBeVisible();

    await expect(page.getByRole("article")).toHaveCount(2);
  });

  test("short trip (0 stops) shows 'Short trip — one fill-up is enough!'", async ({
    page,
  }) => {
    await page.route("**/api/route-plan", (route) =>
      route.fulfill({ json: makeMockRoute(0) })
    );
    await fillAndSubmitForm(page);
    await expect(
      page.getByText(/short trip — one fill-up is enough!/i)
    ).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);
  });

  test("re-planning after changing settings updates the stop count", async ({
    page,
  }) => {
    let returnStops = 2;
    await page.route("**/api/route-plan", (route) =>
      route.fulfill({ json: makeMockRoute(returnStops) })
    );

    // First plan: 2 stops
    await fillAndSubmitForm(page);
    await expect(
      page.getByRole("region", { name: /route plan results/i })
    ).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(2);

    // Switch to Conservative (which would yield more stops on a real route)
    returnStops = 4;
    await page.getByRole("radio", { name: /conservative/i }).click();
    await page.getByRole("button", { name: /plan route/i }).click();
    await expect(page.getByRole("article")).toHaveCount(4);
  });
});
