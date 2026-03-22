import { test, expect } from "@playwright/test";

/** Select the U-Haul 8ft Pickup (34 gal, 19 MPG) — reliable for load tests. */
async function select8ftPickup(page: import("@playwright/test").Page) {
  await page.getByRole("radio", { name: "8 ft Pickup" }).click();
}

/** Read the gallons value from the result section. */
async function readGallons(page: import("@playwright/test").Page): Promise<number> {
  const result = page.locator("[data-result='true']");
  const galText = await result.locator("p.text-5xl").textContent();
  return parseFloat((galText ?? "0").replace("gal", "").trim());
}

test.describe("load level MPG adjustment", () => {
  test("load selector renders with three options and Empty is default", async ({ page }) => {
    await page.goto("/");

    const group = page.getByRole("group", { name: /how loaded is your truck/i });
    await expect(group).toBeVisible();

    await expect(group.getByRole("button", { name: /empty \/ light/i })).toBeVisible();
    await expect(group.getByRole("button", { name: /partially loaded/i })).toBeVisible();
    await expect(group.getByRole("button", { name: /fully loaded/i })).toBeVisible();

    // Empty / Light is selected by default
    await expect(group.getByRole("button", { name: /empty \/ light/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  test("switching to Partially Loaded increases gallons vs Empty", async ({ page }) => {
    await page.goto("/");
    await select8ftPickup(page);

    // Read gallons at Empty (default)
    const emptyGallons = await readGallons(page);

    // Switch to Partially Loaded
    await page.getByRole("button", { name: /partially loaded/i }).click();
    await expect(
      page.getByRole("button", { name: /partially loaded/i })
    ).toHaveAttribute("aria-pressed", "true");

    const partialGallons = await readGallons(page);
    expect(partialGallons).toBeGreaterThan(emptyGallons);
  });

  test("switching to Fully Loaded increases gallons further beyond Partially Loaded", async ({ page }) => {
    await page.goto("/");
    await select8ftPickup(page);

    // Partially loaded gallons
    await page.getByRole("button", { name: /partially loaded/i }).click();
    const partialGallons = await readGallons(page);

    // Fully loaded gallons
    await page.getByRole("button", { name: /fully loaded/i }).click();
    await expect(
      page.getByRole("button", { name: /fully loaded/i })
    ).toHaveAttribute("aria-pressed", "true");

    const fullGallons = await readGallons(page);
    expect(fullGallons).toBeGreaterThan(partialGallons);
  });

  test("gallons order: Full > Partial > Empty", async ({ page }) => {
    await page.goto("/");
    await select8ftPickup(page);

    const emptyGallons = await readGallons(page);

    await page.getByRole("button", { name: /partially loaded/i }).click();
    const partialGallons = await readGallons(page);

    await page.getByRole("button", { name: /fully loaded/i }).click();
    const fullGallons = await readGallons(page);

    expect(fullGallons).toBeGreaterThan(partialGallons);
    expect(partialGallons).toBeGreaterThan(emptyGallons);
  });

  test("URL param load=full appears when Fully Loaded is selected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /fully loaded/i }).click();
    const url = new URL(page.url());
    expect(url.searchParams.get("load")).toBe("full");
  });

  test("URL param load=partial appears when Partially Loaded is selected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /partially loaded/i }).click();
    const url = new URL(page.url());
    expect(url.searchParams.get("load")).toBe("partial");
  });

  test("load param is absent from URL when Empty is selected (default)", async ({ page }) => {
    await page.goto("/");
    // Switch to partial then back to empty
    await page.getByRole("button", { name: /partially loaded/i }).click();
    await page.getByRole("button", { name: /empty \/ light/i }).click();
    const url = new URL(page.url());
    expect(url.searchParams.get("load")).toBeNull();
  });

  test("page reload with load=full preserves Fully Loaded selection", async ({ page }) => {
    await page.goto("/?truck=uhaul-10ft&pickup=1&current=0.5&load=full");

    // Fully Loaded should be pre-selected
    await expect(
      page.getByRole("button", { name: /fully loaded/i })
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("page reload with load=partial preserves Partially Loaded selection", async ({ page }) => {
    await page.goto("/?load=partial");

    await expect(
      page.getByRole("button", { name: /partially loaded/i })
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("adjusted MPG note appears when Partially Loaded is selected", async ({ page }) => {
    await page.goto("/");
    await select8ftPickup(page);
    await page.getByRole("button", { name: /partially loaded/i }).click();
    await expect(page.getByText(/adjusted for load/i)).toBeVisible();
  });

  test("adjusted MPG note appears when Fully Loaded is selected", async ({ page }) => {
    await page.goto("/");
    await select8ftPickup(page);
    await page.getByRole("button", { name: /fully loaded/i }).click();
    await expect(page.getByText(/adjusted for load/i)).toBeVisible();
  });

  test("adjusted MPG note is absent when Empty is selected", async ({ page }) => {
    await page.goto("/");
    await select8ftPickup(page);
    // Default is empty — no note
    await expect(page.getByText(/adjusted for load/i)).not.toBeVisible();
  });

  test("load selector buttons are keyboard navigable", async ({ page }) => {
    await page.goto("/");

    // Tab to the Empty button
    const emptyBtn = page.getByRole("button", { name: /empty \/ light/i });
    await emptyBtn.focus();
    await expect(emptyBtn).toBeFocused();

    // Tab to Partially Loaded
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /partially loaded/i })).toBeFocused();

    // Tab to Fully Loaded
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /fully loaded/i })).toBeFocused();

    // Press Enter to select Fully Loaded
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: /fully loaded/i })
    ).toHaveAttribute("aria-pressed", "true");
  });
});
