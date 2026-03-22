import { test, expect } from "@playwright/test";

// ─── Gas Station Finder Link ─────────────────────────────────────────────────

test.describe("gas station finder link", () => {
  test("does not show gas station link on initial load (no truck selected)", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /find a nearby gas station/i })
    ).not.toBeVisible();
  });

  test("shows gas station link after selecting a regular-fuel truck and result appears", async ({
    page,
  }) => {
    await page.goto("/");
    // Select U-Haul 10 ft (regular fuel)
    await page.getByRole("radio", { name: "10 ft Truck" }).click();

    const link = page.getByRole("link", { name: /find a nearby gas station/i });
    await expect(link).toBeVisible();
  });

  test("gas station link for regular-fuel truck points to Google Maps gas stations", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "10 ft Truck" }).click();

    const link = page.getByRole("link", { name: /find a nearby gas station/i });
    await expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/gas+stations+near+me"
    );
  });

  test("gas station link for diesel-fuel truck points to Google Maps diesel stations", async ({
    page,
  }) => {
    await page.goto("/");
    // Switch to Penske — 22 ft is diesel
    await page.getByRole("radio", { name: "Penske" }).click();
    await page.getByRole("radio", { name: "22 ft Truck" }).click();

    const link = page.getByRole("link", { name: /find a nearby gas station/i });
    await expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/diesel+gas+stations+near+me"
    );
  });

  test("switching from regular to diesel truck updates the gas station link href", async ({
    page,
  }) => {
    await page.goto("/");
    // Start with a regular-fuel truck
    await page.getByRole("radio", { name: "10 ft Truck" }).click();
    const link = page.getByRole("link", { name: /find a nearby gas station/i });
    await expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/gas+stations+near+me"
    );

    // Switch to Penske 22 ft (diesel)
    await page.getByRole("radio", { name: "Penske" }).click();
    await page.getByRole("radio", { name: "22 ft Truck" }).click();
    await expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/diesel+gas+stations+near+me"
    );
  });

  test("gas station link opens in a new tab (target=_blank)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "10 ft Truck" }).click();

    const link = page.getByRole("link", { name: /find a nearby gas station/i });
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("gas station link has rel=noopener noreferrer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "10 ft Truck" }).click();

    const link = page.getByRole("link", { name: /find a nearby gas station/i });
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("gas station link is visible in alreadySufficient state", async ({ page }) => {
    await page.goto("/");
    // U-Haul 10 ft, pickup=1/4, current=1/2 → already sufficient
    await page.getByRole("radio", { name: "10 ft Truck" }).click();
    await page.getByRole("button", { name: "At Pickup 1/4" }).click();

    await expect(page.getByText("You're good to go!")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /find a nearby gas station/i })
    ).toBeVisible();
  });
});
