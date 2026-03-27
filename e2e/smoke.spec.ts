import { test, expect } from "@playwright/test";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Select a U-Haul 10 ft truck (used in multiple tests). */
async function selectUhaul10ft(page: import("@playwright/test").Page) {
  // U-Haul is the default company; click the truck size button
  await page.getByRole("radio", { name: "10 ft Truck" }).click();
}

// ─── Page load ──────────────────────────────────────────────────────────────

test.describe("page load", () => {
  test("renders title and heading", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/FillRight/);
    await expect(
      page.getByRole("heading", { name: "Moving Truck Fuel Return Calculator" })
    ).toBeVisible();
  });

  test("renders all three calculator steps", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Step 1 — Your Truck")).toBeVisible();
    await expect(page.getByText("Step 2 — Fuel Levels")).toBeVisible();
    await expect(page.getByText("Step 3 — Final Drive")).toBeVisible();
  });

  test("rental company radio group is visible", async ({ page }) => {
    await page.goto("/");
    const companyGroup = page.getByRole("radiogroup", {
      name: "Select rental company",
    });
    await expect(companyGroup).toBeVisible();
    await expect(
      companyGroup.getByRole("radio", { name: "U-Haul" })
    ).toBeVisible();
    await expect(
      companyGroup.getByRole("radio", { name: "Penske" })
    ).toBeVisible();
    await expect(
      companyGroup.getByRole("radio", { name: "Budget" })
    ).toBeVisible();
    await expect(
      companyGroup.getByRole("radio", { name: "Enterprise" })
    ).toBeVisible();
  });
});

// ─── Truck selector ─────────────────────────────────────────────────────────

test.describe("truck selector", () => {
  test("can select a truck size and truck radio becomes checked", async ({
    page,
  }) => {
    await page.goto("/");
    const truckBtn = page.getByRole("radio", { name: "10 ft Truck" });
    await truckBtn.click();
    await expect(truckBtn).toHaveAttribute("aria-checked", "true");
  });

  test("switching companies resets truck selection", async ({ page }) => {
    await page.goto("/");
    await selectUhaul10ft(page);
    await page.getByRole("radio", { name: "Penske" }).click();
    // After switching company the truck group should show Penske trucks
    await expect(
      page.getByRole("radiogroup", { name: "Select truck size" })
    ).toBeVisible();
    // No U-Haul truck should remain checked
    const uhaulTruck = page.getByRole("radio", { name: "10 ft Truck" });
    await expect(uhaulTruck).not.toBeVisible();
  });
});

// ─── Full calculator flow ───────────────────────────────────────────────────

test.describe("calculator flow", () => {
  test("shows gallons result after selecting truck, levels, and distance", async ({
    page,
  }) => {
    await page.goto("/");

    // Step 1: select truck
    await selectUhaul10ft(page);

    // Step 2: default gauges are At Pickup = Full, Right Now = 1/2
    // Set Right Now to 1/4 to ensure fuel is needed
    await page.getByRole("button", { name: "Right Now 1/4" }).click();

    // Step 3: enter distance
    await page.locator("#distance-input").fill("5");
    await page.locator("#distance-input").blur();

    // Result section should appear with a gallon count
    const result = page.locator("[data-result='true']");
    await expect(result).toBeVisible();
    // exact: true matches only the standalone "gal" unit label, not breakdown rows
    await expect(result.getByText("gal", { exact: true })).toBeVisible();
  });

  test("shows already-sufficient state when tank is full and pickup was half", async ({
    page,
  }) => {
    await page.goto("/");
    await selectUhaul10ft(page);

    // Set pickup to 1/2, current to Full → tank already exceeds pickup level
    await page.getByRole("button", { name: "At Pickup 1/2" }).click();
    await page.getByRole("button", { name: "Right Now F" }).click();

    const result = page.locator("[data-result='true']");
    await expect(result).toBeVisible();
    await expect(result.getByText("You're good to go!")).toBeVisible();
  });

  test("shows at-risk warning when tank will drop below quarter", async ({
    page,
  }) => {
    await page.goto("/");
    await selectUhaul10ft(page);

    // At Pickup = Full, Right Now = 1/8 — below the 1/4 threshold so isAtRisk is true.
    // Using 1/8 (not 1/4) because the calculator uses strict less-than: levelAfterDrive < 0.25.
    // At exactly 1/4 with no remaining drive, levelAfterDrive === 0.25 → isAtRisk = false.
    await page.getByRole("button", { name: "Right Now 1/8" }).click();

    const result = page.locator("[data-result='true']");
    await expect(result).toBeVisible();
    // Verify both the text and the alert role (WCAG 2.1 AA live region)
    await expect(result.getByRole("alert")).toBeVisible();
    await expect(result.getByText("$30 Service Fee Risk")).toBeVisible();
  });

  test("Penske company shows diesel fuel type warning note", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "Penske" }).click();
    await expect(page.getByRole("note")).toBeVisible();
    await expect(
      page.getByText("Fuel type varies by truck size")
    ).toBeVisible();
  });

  test("copy link button shows feedback after click", async ({ page }) => {
    await page.goto("/");
    await selectUhaul10ft(page);
    await page.getByRole("button", { name: "Right Now 1/4" }).click();

    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: "Copy shareable link to clipboard" }).click();
    // Button label should change to "Link copied!" confirmation
    await expect(page.getByText("Link copied!")).toBeVisible();
  });

  test("share button is visible when result is showing", async ({ page }) => {
    await page.goto("/");
    await selectUhaul10ft(page);
    await page.getByRole("button", { name: "Right Now 1/4" }).click();
    await expect(
      page.getByRole("button", { name: "Copy shareable link to clipboard" })
    ).toBeVisible();
  });

  test("optional gas price produces cost estimate", async ({ page }) => {
    await page.goto("/");
    await selectUhaul10ft(page);
    await page.getByRole("button", { name: "Right Now 1/4" }).click();
    await page.getByRole("spinbutton", { name: "Gas price per gallon in dollars" }).fill("3.99");
    await page.getByRole("spinbutton", { name: "Gas price per gallon in dollars" }).blur();

    const result = page.locator("[data-result='true']");
    await expect(result.getByText(/≈ \$/)).toBeVisible();
  });
});

// ─── URL parameter sync & pre-loading ───────────────────────────────────────

test.describe("URL parameters", () => {
  test("syncs truck selection to URL", async ({ page }) => {
    await page.goto("/");
    await selectUhaul10ft(page);

    const url = new URL(page.url());
    expect(url.searchParams.get("truck")).toBe("uhaul-10ft");
  });

  test("syncs gauge variant to URL when switched to horizontal", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Bar", exact: true }).click();
    const url = new URL(page.url());
    expect(url.searchParams.get("variant")).toBe("horizontal");
  });

  test("pre-loads state from URL parameters", async ({ page }) => {
    await page.goto(
      "/?truck=uhaul-10ft&pickup=1&current=0.75&dist=10"
    );

    // Truck should be selected
    await expect(
      page.getByRole("radio", { name: "10 ft Truck" })
    ).toHaveAttribute("aria-checked", "true");

    // Gauge levels should reflect URL params
    await expect(
      page.getByRole("button", { name: "At Pickup F" })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "Right Now 3/4" })
    ).toHaveAttribute("aria-pressed", "true");

    // Distance input should be populated
    await expect(page.locator("#distance-input")).toHaveValue("10");

    // Result should be shown
    await expect(page.locator("[data-result='true']")).toBeVisible();
  });
});

// ─── Gauge variant toggle ───────────────────────────────────────────────────

test.describe("gauge variant toggle", () => {
  test("defaults to Arc variant", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Arc", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "Bar", exact: true })
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("can switch to Bar (horizontal) variant", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Bar", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Bar", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "Arc", exact: true })
    ).toHaveAttribute("aria-pressed", "false");
  });
});

// ─── Theme toggle ───────────────────────────────────────────────────────────

test.describe("theme toggle", () => {
  test("toggles dark/light class on html element", async ({ page }) => {
    await page.goto("/");

    // Determine current theme state from button label
    const darkBtn = page.getByRole("button", { name: "Switch to dark theme" });
    const lightBtn = page.getByRole("button", { name: "Switch to light theme" });

    // Wait for ThemeToggle to mount (it renders nothing until useEffect fires)
    await expect(darkBtn.or(lightBtn)).toBeVisible();
    const isLight = await darkBtn.isVisible();

    if (isLight) {
      await darkBtn.click();
      await expect(page.locator("html")).toHaveClass(/dark/);
    } else {
      await lightBtn.click();
      await expect(page.locator("html")).not.toHaveClass(/dark/);
    }
  });
});

// ─── Navigation ─────────────────────────────────────────────────────────────

test.describe("navigation", () => {
  test("/terms page loads", async ({ page }) => {
    const response = await page.goto("/terms");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("/privacy page loads", async ({ page }) => {
    const response = await page.goto("/privacy");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("/offline page loads", async ({ page }) => {
    const response = await page.goto("/offline");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("/truck-specs page loads", async ({ page }) => {
    const response = await page.goto("/truck-specs");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("footer 'Truck Specs' link navigates to /truck-specs", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Truck Specs" }).click();
    await expect(page).toHaveURL(/\/truck-specs/);
    await expect(page.getByRole("heading", { level: 1, name: /moving truck specifications/i })).toBeVisible();
  });
});
