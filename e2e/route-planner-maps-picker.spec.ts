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

function makeMockRoute(
  stopCount = 2,
  options: { fuelType?: "regular" | "diesel" } = {}
) {
  const fuelType = options.fuelType ?? "regular";
  const truck = { ...BASE_TRUCK, fuelType };
  return {
    origin: CHICAGO,
    destination: DENVER,
    totalMiles: 1000,
    totalStops: stopCount,
    estimatedTotalGallons: stopCount * 20,
    estimatedTotalCost: null,
    stops: Array.from({ length: stopCount }, (_, i) => {
      const lat = 41.5 - i * 0.5;
      const lng = -90.0 - i * 4.0;
      return {
        stopNumber: i + 1,
        waypoint: {
          lat,
          lng,
          milesFromOrigin: (i + 1) * 200,
          locationLabel: `${(i + 1) * 200} miles from start`,
        },
        milesFromPreviousStop: 200,
        station: {
          name: null,
          address: null,
          coordinates: { lat, lng },
          mapsUrl: `https://www.google.com/maps/search/gas+stations/@${lat},${lng},14z`,
        },
        fuelCalculation: {
          gallonsToAdd: 20,
          estimatedCost: null,
          isAtRisk: false,
          fuelType,
        },
      };
    }),
    truck,
    riskTolerance: "standard",
    loadLevel: "empty",
    generatedAt: new Date().toISOString(),
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function planRoute(
  page: import("@playwright/test").Page,
  stopCount = 2,
  options: { fuelType?: "regular" | "diesel" } = {}
) {
  await page.route("**/api/route-plan", (route) =>
    route.fulfill({ json: makeMockRoute(stopCount, options) })
  );

  await page.getByRole("combobox", { name: /starting from/i }).fill("Chicago");
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.getByRole("option").first().click();

  await page.getByRole("combobox", { name: /going to/i }).fill("Denver");
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.getByRole("option").first().click();

  await page.getByRole("radio", { name: "10 ft Truck" }).click();
  await page.getByRole("button", { name: /plan route/i }).click();
  await expect(
    page.getByRole("region", { name: /route plan results/i })
  ).toBeVisible();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("route planner — maps picker", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/autocomplete*", (route) =>
      route.fulfill({ json: { suggestions: [CHICAGO, DENVER] } })
    );
    await page.goto("/route-planner");
  });

  test("shows 'Open in Maps' button on every stop card initially", async ({
    page,
  }) => {
    await planRoute(page, 2);
    const buttons = page.getByRole("button", { name: /open in maps/i });
    await expect(buttons).toHaveCount(2);
  });

  test("clicking 'Open in Maps' reveals Google Maps and Apple Maps links", async ({
    page,
  }) => {
    await planRoute(page);
    const firstCard = page.getByRole("article", { name: "Stop 1" });
    await firstCard.getByRole("button", { name: /open in maps/i }).click();
    await expect(
      firstCard.getByRole("link", { name: /google maps/i })
    ).toBeVisible();
    await expect(
      firstCard.getByRole("link", { name: /apple maps/i })
    ).toBeVisible();
  });

  test("Google Maps link URL contains google.com/maps and stop coordinates", async ({
    page,
  }) => {
    await planRoute(page);
    const firstCard = page.getByRole("article", { name: "Stop 1" });
    await firstCard.getByRole("button", { name: /open in maps/i }).click();

    const href = await firstCard
      .getByRole("link", { name: /google maps/i })
      .getAttribute("href");
    expect(href).toContain("google.com/maps");
    // Stop 1 coordinates from fixture: lat=41.5, lng=-90.0
    expect(href).toContain("41.5");
    expect(href).toContain("-90");
  });

  test("Apple Maps link URL contains maps.apple.com and stop coordinates", async ({
    page,
  }) => {
    await planRoute(page);
    const firstCard = page.getByRole("article", { name: "Stop 1" });
    await firstCard.getByRole("button", { name: /open in maps/i }).click();

    const href = await firstCard
      .getByRole("link", { name: /apple maps/i })
      .getAttribute("href");
    expect(href).toContain("maps.apple.com");
    expect(href).toContain("41.5");
    expect(href).toContain("-90");
  });

  test("both picker links open in a new tab", async ({ page }) => {
    await planRoute(page);
    const firstCard = page.getByRole("article", { name: "Stop 1" });
    await firstCard.getByRole("button", { name: /open in maps/i }).click();

    const googleLink = firstCard.getByRole("link", { name: /google maps/i });
    const appleLink = firstCard.getByRole("link", { name: /apple maps/i });
    await expect(googleLink).toHaveAttribute("target", "_blank");
    await expect(googleLink).toHaveAttribute("rel", "noopener noreferrer");
    await expect(appleLink).toHaveAttribute("target", "_blank");
    await expect(appleLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("diesel stops: picker links use diesel+gas+stations in the URL", async ({
    page,
  }) => {
    await planRoute(page, 1, { fuelType: "diesel" });
    const firstCard = page.getByRole("article", { name: "Stop 1" });
    await firstCard.getByRole("button", { name: /open in maps/i }).click();

    const googleHref = await firstCard
      .getByRole("link", { name: /google maps/i })
      .getAttribute("href");
    const appleHref = await firstCard
      .getByRole("link", { name: /apple maps/i })
      .getAttribute("href");
    expect(googleHref).toContain("diesel");
    expect(appleHref).toContain("diesel");
  });

  test("clicking 'Google Maps' closes the picker and shows the Google Maps button on that card", async ({
    page,
  }) => {
    await planRoute(page);
    const firstCard = page.getByRole("article", { name: "Stop 1" });
    await firstCard.getByRole("button", { name: /open in maps/i }).click();
    await firstCard.getByRole("link", { name: /google maps/i }).click();

    // Picker is gone, preferred link is shown directly
    await expect(
      firstCard.getByRole("link", { name: /google maps/i })
    ).toBeVisible();
    await expect(
      firstCard.getByRole("button", { name: /open in maps/i })
    ).not.toBeVisible();
    // Apple Maps link is also gone (not in picker mode)
    await expect(
      firstCard.getByRole("link", { name: /apple maps/i })
    ).not.toBeVisible();
  });

  test("clicking 'Apple Maps' closes the picker and shows the Apple Maps button on that card", async ({
    page,
  }) => {
    await planRoute(page);
    const firstCard = page.getByRole("article", { name: "Stop 1" });
    await firstCard.getByRole("button", { name: /open in maps/i }).click();
    await firstCard.getByRole("link", { name: /apple maps/i }).click();

    await expect(
      firstCard.getByRole("link", { name: /apple maps/i })
    ).toBeVisible();
    await expect(
      firstCard.getByRole("button", { name: /open in maps/i })
    ).not.toBeVisible();
    await expect(
      firstCard.getByRole("link", { name: /google maps/i })
    ).not.toBeVisible();
  });

  test("'Switch app' button shows the picker again", async ({ page }) => {
    await planRoute(page);
    const firstCard = page.getByRole("article", { name: "Stop 1" });

    // Set a preference first
    await firstCard.getByRole("button", { name: /open in maps/i }).click();
    await firstCard.getByRole("link", { name: /google maps/i }).click();

    // Switch app
    await firstCard.getByRole("button", { name: /switch app/i }).click();

    // Both options visible again
    await expect(
      firstCard.getByRole("link", { name: /google maps/i })
    ).toBeVisible();
    await expect(
      firstCard.getByRole("link", { name: /apple maps/i })
    ).toBeVisible();
  });

  test("preference persists across page reload: new stop cards skip the picker", async ({
    page,
  }) => {
    // Plan route and save a preference
    await planRoute(page);
    const firstCard = page.getByRole("article", { name: "Stop 1" });
    await firstCard.getByRole("button", { name: /open in maps/i }).click();
    await firstCard.getByRole("link", { name: /google maps/i }).click();

    // Reload — localStorage persists, form resets
    await page.reload();

    // Re-plan with a fresh form (mocks still active from this test's page)
    await page.getByRole("combobox", { name: /starting from/i }).fill("Chicago");
    await expect(page.getByRole("option").first()).toBeVisible();
    await page.getByRole("option").first().click();
    await page.getByRole("combobox", { name: /going to/i }).fill("Denver");
    await expect(page.getByRole("option").first()).toBeVisible();
    await page.getByRole("option").first().click();
    await page.getByRole("radio", { name: "10 ft Truck" }).click();
    await page.getByRole("button", { name: /plan route/i }).click();
    await expect(
      page.getByRole("region", { name: /route plan results/i })
    ).toBeVisible();

    // New cards should show "Google Maps" directly — no "Open in Maps" button
    const newFirstCard = page.getByRole("article", { name: "Stop 1" });
    await expect(
      newFirstCard.getByRole("link", { name: /google maps/i })
    ).toBeVisible();
    await expect(
      newFirstCard.getByRole("button", { name: /open in maps/i })
    ).not.toBeVisible();
  });
});
