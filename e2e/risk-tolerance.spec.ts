import { test, expect } from "@playwright/test";

/** Select a U-Haul 10 ft truck. */
async function selectUhaul10ft(page: import("@playwright/test").Page) {
  await page.getByRole("radio", { name: "10 ft Truck" }).click();
}

/** Read the gallons value from the result section. */
async function readGallons(page: import("@playwright/test").Page): Promise<number> {
  const result = page.locator("[data-result='true']");
  // The gallons number appears as siblings: <p class="text-5xl ...">17.5<span>gal</span></p>
  // We grab the text of the big number paragraph which contains the span too.
  const galText = await result.locator("p.text-5xl").textContent();
  // Strip the "gal" suffix appended by the inner span
  return parseFloat((galText ?? "0").replace("gal", "").trim());
}

test.describe("risk tolerance selector", () => {
  test("renders risk tolerance radiogroup with three options", async ({ page }) => {
    await page.goto("/");
    const group = page.getByRole("radiogroup", { name: /risk tolerance/i });
    await expect(group).toBeVisible();
    await expect(group.getByRole("radio", { name: /conservative/i })).toBeVisible();
    await expect(group.getByRole("radio", { name: /standard/i })).toBeVisible();
    await expect(group.getByRole("radio", { name: /lean/i })).toBeVisible();
  });

  test("Standard is selected by default", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("radio", { name: /standard/i })
    ).toHaveAttribute("aria-checked", "true");
  });

  test("switching to Conservative increases gallons vs Standard", async ({ page }) => {
    await page.goto("/");

    // Setup: select truck, set current level to 1/4 so fuel is needed
    await selectUhaul10ft(page);
    await page.getByRole("button", { name: "Right Now 1/4" }).click();

    // Read standard gallons
    const standardGallons = await readGallons(page);

    // Switch to Conservative (+2.0 gallon buffer)
    await page.getByRole("radio", { name: /conservative/i }).click();
    await expect(
      page.getByRole("radio", { name: /conservative/i })
    ).toHaveAttribute("aria-checked", "true");

    const conservativeGallons = await readGallons(page);
    expect(conservativeGallons).toBeGreaterThan(standardGallons);
  });

  test("switching to Lean decreases gallons vs Standard", async ({ page }) => {
    await page.goto("/");

    await selectUhaul10ft(page);
    await page.getByRole("button", { name: "Right Now 1/4" }).click();

    const standardGallons = await readGallons(page);

    // Switch to Lean (0.0 gallon buffer)
    await page.getByRole("radio", { name: /lean/i }).click();
    await expect(
      page.getByRole("radio", { name: /lean/i })
    ).toHaveAttribute("aria-checked", "true");

    const leanGallons = await readGallons(page);
    expect(leanGallons).toBeLessThan(standardGallons);
  });

  test("gallons order: Conservative > Standard > Lean", async ({ page }) => {
    await page.goto("/");
    await selectUhaul10ft(page);
    await page.getByRole("button", { name: "Right Now 1/4" }).click();

    await page.getByRole("radio", { name: /standard/i }).click();
    const standardGallons = await readGallons(page);

    await page.getByRole("radio", { name: /conservative/i }).click();
    const conservativeGallons = await readGallons(page);

    await page.getByRole("radio", { name: /lean/i }).click();
    const leanGallons = await readGallons(page);

    expect(conservativeGallons).toBeGreaterThan(standardGallons);
    expect(standardGallons).toBeGreaterThan(leanGallons);
  });

  test("URL param updates when risk tolerance changes", async ({ page }) => {
    await page.goto("/");
    await selectUhaul10ft(page);

    // Switch to Conservative
    await page.getByRole("radio", { name: /conservative/i }).click();
    const url1 = new URL(page.url());
    expect(url1.searchParams.get("risk")).toBe("conservative");

    // Switch to Lean
    await page.getByRole("radio", { name: /lean/i }).click();
    const url2 = new URL(page.url());
    expect(url2.searchParams.get("risk")).toBe("lean");

    // Switch back to Standard — risk param should be omitted (default)
    await page.getByRole("radio", { name: /standard/i }).click();
    const url3 = new URL(page.url());
    expect(url3.searchParams.get("risk")).toBeNull();
  });

  test("page reload preserves risk tolerance selection via URL param", async ({ page }) => {
    await page.goto("/?truck=uhaul-10ft&pickup=1&current=0.25&risk=conservative");

    // Conservative should be pre-selected
    await expect(
      page.getByRole("radio", { name: /conservative/i })
    ).toHaveAttribute("aria-checked", "true");

    // Result should be visible and show higher gallons than standard would
    const result = page.locator("[data-result='true']");
    await expect(result).toBeVisible();

    // Verify the conservative description is shown
    await expect(
      page.getByText(/recommended for mountain routes/i)
    ).toBeVisible();
  });

  test("lean tolerance pre-loaded from URL param", async ({ page }) => {
    await page.goto("/?truck=uhaul-10ft&pickup=1&current=0.25&risk=lean");

    await expect(
      page.getByRole("radio", { name: /lean/i })
    ).toHaveAttribute("aria-checked", "true");

    await expect(
      page.getByText(/experienced movers on urban routes/i)
    ).toBeVisible();
  });

  test("description updates when switching risk tolerance", async ({ page }) => {
    await page.goto("/");

    // Default: Standard description
    await expect(
      page.getByText(/comfortable buffer above fee threshold/i)
    ).toBeVisible();

    // Switch to Conservative
    await page.getByRole("radio", { name: /conservative/i }).click();
    await expect(
      page.getByText(/recommended for mountain routes/i)
    ).toBeVisible();

    // Switch to Lean
    await page.getByRole("radio", { name: /lean/i }).click();
    await expect(
      page.getByText(/experienced movers on urban routes/i)
    ).toBeVisible();
  });

  test("risk tolerance selector is keyboard navigable", async ({ page }) => {
    await page.goto("/");

    // Focus Conservative radio button and check it is reachable via Tab
    const conservativeRadio = page.getByRole("radio", { name: /conservative/i });
    await conservativeRadio.focus();
    await expect(conservativeRadio).toBeFocused();

    // Arrow key navigation within the radiogroup
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("radio", { name: /standard/i })).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("radio", { name: /lean/i })).toBeFocused();
  });
});
