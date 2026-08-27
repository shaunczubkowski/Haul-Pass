/**
 * E2E tests for accessibility improvements in the route planner.
 *
 * Covers:
 *   #100 — aria-busy on submit button + loading skeleton in results area
 *   #102 — swap button uses ArrowUpDown SVG icon, not the ↕ Unicode character
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

const TWO_ALTERNATIVES = {
  alternatives: [
    {
      index: 0,
      distanceMiles: 1840,
      durationMinutes: 1500,
      label: "via I-80 E",
      geometry: [[-87.6298, 41.8781], [-104.9903, 39.7392]] as [number, number][],
    },
    {
      index: 1,
      distanceMiles: 1967,
      durationMinutes: 1620,
      label: "via I-84 E, I-90 E",
      geometry: [[-87.6298, 41.8781], [-95.0, 40.0], [-104.9903, 39.7392]] as [number, number][],
    },
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

test.describe("route planner — submit button aria-busy (#100)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/autocomplete*", (route) =>
      route.fulfill({ json: { suggestions: [CHICAGO, DENVER] } })
    );
    await page.goto("/route-planner");
  });

  test("submit button has aria-busy=true while alternatives are loading", async ({
    page,
  }) => {
    // Hold the alternatives response so we can inspect state mid-flight
    // Held in an object: TS does not track assignments made inside a closure,
    // so a plain `let` would narrow to `never` at the call site below.
    const alt: { resolve: (() => void) | null } = { resolve: null };
    await page.route("**/api/route-alternatives**", async (route) => {
      await new Promise<void>((resolve) => { alt.resolve = resolve; });
      await route.fulfill({ json: SINGLE_ALTERNATIVE });
    });
    await page.route("**/api/route-plan", (route) =>
      route.fulfill({ json: makeMockRoute() })
    );

    await fillForm(page);
    const submitBtn = page.getByRole("button", { name: /plan route/i });
    await submitBtn.click();

    // Button should now carry aria-busy=true while the fetch is in-flight
    await expect(submitBtn).toHaveAttribute("aria-busy", "true");

    // Unblock the response
    alt.resolve?.();
    await expect(page.getByRole("region", { name: /route plan results/i })).toBeVisible();

    // Once complete, aria-busy reverts to false
    await expect(submitBtn).toHaveAttribute("aria-busy", "false");
  });

  test("submit button has aria-busy=true while plan is loading after route selection", async ({
    page,
  }) => {
    await page.route("**/api/route-alternatives**", (route) =>
      route.fulfill({ json: TWO_ALTERNATIVES })
    );

    // See note above: closure assignment needs an object to survive narrowing.
    const plan: { resolve: (() => void) | null } = { resolve: null };
    await page.route("**/api/route-plan", async (route) => {
      await new Promise<void>((resolve) => { plan.resolve = resolve; });
      await route.fulfill({ json: makeMockRoute() });
    });

    await fillForm(page);
    await page.getByRole("button", { name: /plan route/i }).click();

    // Picker is shown — pick route 0
    await expect(page.getByRole("group", { name: /choose your route/i })).toBeVisible();
    await page.getByRole("button", { name: /via i-80 e/i }).click();

    const submitBtn = page.getByRole("button", { name: /plan route/i });
    await expect(submitBtn).toHaveAttribute("aria-busy", "true");

    plan.resolve?.();
    await expect(page.getByRole("region", { name: /route plan results/i })).toBeVisible();
    await expect(submitBtn).toHaveAttribute("aria-busy", "false");
  });
});

test.describe("route planner — loading skeleton in results area (#100)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/autocomplete*", (route) =>
      route.fulfill({ json: { suggestions: [CHICAGO, DENVER] } })
    );
    await page.goto("/route-planner");
  });

  test("loading skeleton appears while plan is loading after route selection", async ({
    page,
  }) => {
    await page.route("**/api/route-alternatives**", (route) =>
      route.fulfill({ json: TWO_ALTERNATIVES })
    );

    // See note above: closure assignment needs an object to survive narrowing.
    const plan: { resolve: (() => void) | null } = { resolve: null };
    await page.route("**/api/route-plan", async (route) => {
      await new Promise<void>((resolve) => { plan.resolve = resolve; });
      await route.fulfill({ json: makeMockRoute() });
    });

    await fillForm(page);
    await page.getByRole("button", { name: /plan route/i }).click();

    await expect(page.getByRole("group", { name: /choose your route/i })).toBeVisible();
    await page.getByRole("button", { name: /via i-80 e/i }).click();

    // Loading skeleton should be visible during fetch
    await expect(page.getByRole("status", { name: /planning your route/i })).toBeVisible();

    plan.resolve?.();
    // Skeleton disappears once results arrive
    await expect(page.getByRole("status", { name: /planning your route/i })).not.toBeVisible();
    await expect(page.getByRole("region", { name: /route plan results/i })).toBeVisible();
  });

  test("loading skeleton appears for initial form submission (single route)", async ({
    page,
  }) => {
    // Held in an object: TS does not track assignments made inside a closure,
    // so a plain `let` would narrow to `never` at the call site below.
    const alt: { resolve: (() => void) | null } = { resolve: null };
    await page.route("**/api/route-alternatives**", async (route) => {
      await new Promise<void>((resolve) => { alt.resolve = resolve; });
      await route.fulfill({ json: SINGLE_ALTERNATIVE });
    });
    await page.route("**/api/route-plan", (route) =>
      route.fulfill({ json: makeMockRoute() })
    );

    await fillForm(page);
    await page.getByRole("button", { name: /plan route/i }).click();

    // Skeleton should be visible while alternatives are fetching too
    await expect(page.getByRole("status", { name: /planning your route/i })).toBeVisible();

    alt.resolve?.();
    await expect(page.getByRole("region", { name: /route plan results/i })).toBeVisible();
    await expect(page.getByRole("status", { name: /planning your route/i })).not.toBeVisible();
  });
});

test.describe("route planner — swap button SVG icon (#102)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/autocomplete*", (route) =>
      route.fulfill({ json: { suggestions: [CHICAGO, DENVER] } })
    );
    await page.goto("/route-planner");
  });

  test("swap button renders an SVG icon, not the ↕ Unicode character", async ({
    page,
  }) => {
    const swapBtn = page.getByRole("button", { name: /swap origin and destination/i });
    await expect(swapBtn).toBeVisible();

    // Must contain an SVG element
    await expect(swapBtn.locator("svg")).toBeVisible();

    // Must NOT contain the raw ↕ Unicode character as text content
    const textContent = await swapBtn.textContent();
    expect(textContent).not.toContain("↕");
  });

  test("swap button SVG icon has aria-hidden to prevent double announcement", async ({
    page,
  }) => {
    const svgIcon = page
      .getByRole("button", { name: /swap origin and destination/i })
      .locator("svg");

    await expect(svgIcon).toHaveAttribute("aria-hidden", "true");
  });

  test("swap button aria-label is preserved after icon change", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: "Swap origin and destination" })
    ).toBeVisible();
  });

  test("clicking swap button swaps the origin and destination fields", async ({
    page,
  }) => {
    // Fill origin
    await page.getByRole("combobox", { name: /starting from/i }).fill("Chicago");
    await expect(page.getByRole("option").first()).toBeVisible();
    await page.getByRole("option").first().click();

    // Fill destination
    await page.getByRole("combobox", { name: /going to/i }).fill("Denver");
    await expect(page.getByRole("option").first()).toBeVisible();
    await page.getByRole("option").first().click();

    // Values before swap
    await expect(
      page.getByRole("combobox", { name: /starting from/i })
    ).toHaveValue(/chicago/i);
    await expect(
      page.getByRole("combobox", { name: /going to/i })
    ).toHaveValue(/denver/i);

    // Swap
    await page.getByRole("button", { name: /swap origin and destination/i }).click();

    // Values after swap
    await expect(
      page.getByRole("combobox", { name: /starting from/i })
    ).toHaveValue(/denver/i);
    await expect(
      page.getByRole("combobox", { name: /going to/i })
    ).toHaveValue(/chicago/i);
  });
});
