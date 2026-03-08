# FillRight — E2E QA Test Plan

**App:** FillRight — U-Haul Fuel Return Calculator
**URL:** https://getfillright.com
**Repo:** Haul-Pass
**Issue:** #33
**Last Updated:** 2026-03-08
**Plan Version:** 1.0

---

## Table of Contents

1. [Test Environment](#1-test-environment)
2. [Truck Selection — Happy Path](#2-truck-selection--happy-path)
3. [Fuel Gauge Levels — Happy Path](#3-fuel-gauge-levels--happy-path)
4. [Distance Input — Miles and km](#4-distance-input--miles-and-km)
5. [Gas Price and Cost Estimate](#5-gas-price-and-cost-estimate)
6. [Shareable Link / URL State](#6-shareable-link--url-state)
7. [Already Sufficient State](#7-already-sufficient-state)
8. [Edge Cases](#8-edge-cases)
9. [Mobile UX](#9-mobile-ux)
10. [Cross-Browser](#10-cross-browser)
11. [OG / Social Preview](#11-og--social-preview)
12. [PWA & Offline](#12-pwa--offline)
13. [Test Run Log](#13-test-run-log)

---

## 1. Test Environment

### Supported Browsers

| Browser | Desktop | Mobile |
|---|---|---|
| Chrome | Yes | Android |
| Safari | Yes | iOS |
| Firefox | Yes | N/A |

### Devices / Resolutions

| Category | Details |
|---|---|
| Desktop | 1440px wide (standard laptop), 1920px (external monitor) |
| Tablet | iPad (portrait 768px, landscape 1024px) |
| Mobile | iPhone 14 / Pixel 7 — 390px wide |

### Test Data Reference

Truck specs used to calculate expected values:

| Truck | ID | Tank (gal) | MPG |
|---|---|---|---|
| 8 ft Pickup | `uhaul-pickup` | 34 | 19 |
| Cargo Van (9 ft) | `uhaul-cargo-van` | 26 | 18 |
| 10 ft Truck | `uhaul-10ft` | 31 | 12 |
| 15 ft Truck | `uhaul-15ft` | 40 | 10 |
| 17 ft Truck | `uhaul-17ft` | 40 | 10 |
| 20 ft Truck | `uhaul-20ft` | 40 | 10 |
| 24 ft Truck | `uhaul-24ft` | 60 | 7 |
| 26 ft Truck | `uhaul-26ft` | 60 | 7 |

Gauge levels selectable in UI (the only valid values for URL params):

| Label | Fraction |
|---|---|
| E (Empty) | 0.0 |
| 1/4 | 0.25 |
| 1/2 | 0.5 |
| 3/4 | 0.75 |
| F (Full) | 1.0 |

Calculator constants:
- Safety buffer: **0.5 gal**
- $30 fee threshold: **below 1/4 tank at drop-off**
- km→miles conversion: **1 km = 0.621371 mi** (not a round 0.6 — see TC-D-02)

---

## 2. Truck Selection — Happy Path

Goal: Confirm every truck option appears in the selector and selecting one triggers result calculation.

### TC-T-01 — 8 ft Pickup selectable

| Field | Detail |
|---|---|
| **ID** | TC-T-01 |
| **Description** | Select "8 ft Pickup" from the truck selector |

**Steps:**

1. Open https://getfillright.com (no URL params).
2. Locate Step 1 — "Your Truck" section.
3. Click/tap the "8 ft Pickup" option.

**Expected Result:** The option highlights as selected. The result section appears (or updates) below. No JS errors in console.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-T-02 — Cargo Van (9 ft) selectable

| Field | Detail |
|---|---|
| **ID** | TC-T-02 |
| **Description** | Select "Cargo Van" from the truck selector |

**Steps:**

1. Open https://getfillright.com.
2. Click/tap the "Cargo Van" option.

**Expected Result:** Option is selected; result section updates using tank capacity 26 gal / 18 mpg.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-T-03 — 10 ft Truck selectable

| Field | Detail |
|---|---|
| **ID** | TC-T-03 |
| **Description** | Select "10 ft Truck" |

**Steps:**

1. Open https://getfillright.com.
2. Click/tap "10 ft Truck".

**Expected Result:** Option selected; result uses 31 gal tank / 12 mpg.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-T-04 — 15 ft Truck selectable

| Field | Detail |
|---|---|
| **ID** | TC-T-04 |
| **Description** | Select "15 ft Truck" |

**Steps:**

1. Open https://getfillright.com.
2. Click/tap "15 ft Truck".

**Expected Result:** Option selected; result uses 40 gal tank / 10 mpg.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-T-05 — 20 ft Truck selectable

| Field | Detail |
|---|---|
| **ID** | TC-T-05 |
| **Description** | Select "20 ft Truck" |

**Steps:**

1. Open https://getfillright.com.
2. Click/tap "20 ft Truck".

**Expected Result:** Option selected; result uses 40 gal tank / 10 mpg.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-T-06 — 26 ft Truck selectable

| Field | Detail |
|---|---|
| **ID** | TC-T-06 |
| **Description** | Select "26 ft Truck" |

**Steps:**

1. Open https://getfillright.com.
2. Click/tap "26 ft Truck".

**Expected Result:** Option selected; result uses 60 gal tank / 7 mpg.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-T-07 — No truck selected → prompt shown, result hidden

| Field | Detail |
|---|---|
| **ID** | TC-T-07 |
| **Description** | Page loads with no truck selected; placeholder prompt is shown |

**Steps:**

1. Open https://getfillright.com (no `truck` URL param).
2. Observe the area below Step 3.

**Expected Result:** "Start by selecting your truck size above" prompt is visible. The result card is absent.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-T-08 — Switching trucks updates result

| Field | Detail |
|---|---|
| **ID** | TC-T-08 |
| **Description** | Changing truck type recalculates with new specs |

**Steps:**

1. Open https://getfillright.com.
2. Select "10 ft Truck". Note the gallons shown in result.
3. Switch to "26 ft Truck".

**Expected Result:** The gallons-to-add value changes (26 ft has a larger tank and worse MPG, so result should be higher for the same gauge settings). No stale values from the previous truck remain.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

## 3. Fuel Gauge Levels — Happy Path

Goal: Confirm all five UI gauge steps work for both "At Pickup" and "Right Now" gauges, and that result math is correct.

### TC-G-01 — Pickup gauge: all five steps selectable

| Field | Detail |
|---|---|
| **ID** | TC-G-01 |
| **Description** | Each level (E, 1/4, 1/2, 3/4, F) can be selected on the "At Pickup" gauge |

**Steps:**

1. Select any truck.
2. Click/tap each step on the "At Pickup" gauge in order: E → 1/4 → 1/2 → 3/4 → F.
3. After each tap, verify the gauge visually reflects the selection and the URL `pickup` param updates.

**Expected Result:** All five steps respond to tap/click. Each selection is reflected in the URL (`pickup=0`, `pickup=0.25`, `pickup=0.5`, `pickup=0.75`, `pickup=1`).

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-G-02 — Current level gauge: all five steps selectable

| Field | Detail |
|---|---|
| **ID** | TC-G-02 |
| **Description** | Each level can be selected on the "Right Now" gauge |

**Steps:**

1. Select any truck.
2. Click/tap each step on the "Right Now" gauge: E → 1/4 → 1/2 → 3/4 → F.
3. Verify URL `current` param updates accordingly.

**Expected Result:** All five steps respond. URL reflects `current=0`, `current=0.25`, etc.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-G-03 — Result math: known input → known output

| Field | Detail |
|---|---|
| **ID** | TC-G-03 |
| **Description** | Verify gallons calculation with a manually computed reference case |

**Steps:**

1. Select "15 ft Truck" (40 gal, 10 mpg).
2. Set "At Pickup" to **F** (1.0 → 40 gal).
3. Set "Right Now" to **1/2** (0.5 → 20 gal).
4. Set distance to **0** miles.
5. Read gallons displayed.

**Expected Result:**
- gallonsAtPickup = 40 × 1.0 = 40 gal
- gallonsNow = 40 × 0.5 = 20 gal
- gallonsForFinalDrive = 0 / 10 = 0 gal
- deficit = 40 − 20 + 0 = 20 gal
- rawGallonsToAdd = 20 + 0.5 (buffer) = 20.5 gal
- Display: **20.5 gal**

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-G-04 — Result math with non-zero distance

| Field | Detail |
|---|---|
| **ID** | TC-G-04 |
| **Description** | Gallons for final drive included correctly in calculation |

**Steps:**

1. Select "15 ft Truck" (40 gal, 10 mpg).
2. Set "At Pickup" to **F** (1.0).
3. Set "Right Now" to **1/2** (0.5).
4. Enter **20 miles** in the distance field.

**Expected Result:**
- gallonsForFinalDrive = 20 / 10 = 2 gal
- deficit = 20 + 2 = 22 gal
- rawGallonsToAdd = 22 + 0.5 = 22.5 gal
- Display: **22.5 gal**

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

## 4. Distance Input — Miles and km

Goal: Confirm the unit toggle works, conversion is precise (not rounded to 0.6), and the value persists correctly.

### TC-D-01 — Default unit is miles

| Field | Detail |
|---|---|
| **ID** | TC-D-01 |
| **Description** | Distance field defaults to miles on first load |

**Steps:**

1. Open https://getfillright.com (no URL params).
2. Observe the label and unit toggle button on the distance field.

**Expected Result:** Label reads "Miles to Drop-off". Toggle button reads "mi".

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-D-02 — km→miles conversion precision (not 0.6 shortcut)

| Field | Detail |
|---|---|
| **ID** | TC-D-02 |
| **Description** | Entering 10 km produces ~6.2 miles internally, not 6 miles |

**Steps:**

1. Select any truck.
2. Click the "mi" unit toggle button — it should switch to "km".
3. Type **10** into the distance field.
4. Observe the "≈ X miles" hint text that appears below the field.

**Expected Result:**
- Hint text reads "≈ 6.2 miles" (rounded to 1 decimal). Internal value stored is `parseFloat((10 × 0.621371).toFixed(1))` = **6.2 miles**.
- The result card calculation uses 6.2 miles, not 6 miles. Confirm by comparing result values: at 10 mpg, 6.2 mi consumes 0.62 gal vs 0.6 gal with the incorrect 0.6 ratio.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-D-03 — Switching unit preserves the underlying miles value

| Field | Detail |
|---|---|
| **ID** | TC-D-03 |
| **Description** | Toggling between mi/km does not alter the stored miles value |

**Steps:**

1. Select any truck.
2. Enter **10** in miles mode.
3. Click the unit toggle to switch to km.
4. Observe the displayed value (should be ~16.1 km).
5. Click the toggle again to return to miles.
6. Observe the displayed value.

**Expected Result:** After round-tripping through km, the miles value displayed is still **10**. The result card does not show a changed gallons value between step 2 and step 6.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-D-04 — Clearing distance field resets to 0

| Field | Detail |
|---|---|
| **ID** | TC-D-04 |
| **Description** | Deleting the distance value removes the final-drive component from the result |

**Steps:**

1. Select any truck.
2. Enter **20** miles.
3. Note the gallons result.
4. Clear the distance field (select all + delete).
5. Observe the result.

**Expected Result:** gallonsForFinalDrive line disappears from the breakdown. Result decreases by `(20 / mpg)` gallons.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-D-05 — km hint text appears only in km mode

| Field | Detail |
|---|---|
| **ID** | TC-D-05 |
| **Description** | The "≈ X miles" hint is only shown when unit is km and distance > 0 |

**Steps:**

1. Enter a non-zero distance in miles mode.
2. Confirm no hint text is shown.
3. Toggle to km mode.
4. Confirm hint text appears.
5. Clear the distance field.
6. Confirm hint text disappears.

**Expected Result:** Hint is visible only in km mode with a non-zero value.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

## 5. Gas Price and Cost Estimate

Goal: Confirm the optional gas price field drives the cost estimate, and clearing it removes the estimate.

### TC-P-01 — Cost estimate appears when gas price entered

| Field | Detail |
|---|---|
| **ID** | TC-P-01 |
| **Description** | Entering a gas price displays a cost estimate in the result |

**Steps:**

1. Select "15 ft Truck".
2. Set pickup level to F, current level to 1/2, distance to 20 miles. (From TC-G-04: result should be 22.5 gal.)
3. Enter **3.99** in the gas price field.
4. Observe the result card.

**Expected Result:** Cost estimate line appears: **≈ $89.78** (22.5 × 3.99 = 89.775, rounded to $89.78).

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-P-02 — Clearing gas price removes cost estimate

| Field | Detail |
|---|---|
| **ID** | TC-P-02 |
| **Description** | Deleting the gas price value removes the cost estimate from the result |

**Steps:**

1. Reproduce the state from TC-P-01 (gas price = 3.99, cost estimate visible).
2. Clear the gas price field (select all + delete).

**Expected Result:** The "≈ $XX.XX" line disappears from the result card. Gallons-to-add remains unchanged.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-P-03 — Cost estimate recalculates when gas price changes

| Field | Detail |
|---|---|
| **ID** | TC-P-03 |
| **Description** | Changing gas price live-updates the cost estimate |

**Steps:**

1. Set up a scenario with 22.5 gal needed and gas price **3.00**.
2. Note estimate: ≈ $67.50.
3. Change gas price to **4.00**.

**Expected Result:** Cost estimate updates to ≈ $90.00 (22.5 × 4.00).

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-P-04 — Cost estimate absent when gallons = 0 (sufficient)

| Field | Detail |
|---|---|
| **ID** | TC-P-04 |
| **Description** | Cost estimate is not shown when alreadySufficient = true |

**Steps:**

1. Create a scenario where current level exceeds pickup level by enough to cover final drive (e.g., pickup = 1/4, current = F, distance = 0).
2. Enter a gas price.

**Expected Result:** The "You're good to go!" state is shown. No cost estimate is displayed (cost is $0 when gallonsToAdd = 0).

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

## 6. Shareable Link / URL State

Goal: Confirm all app state is encoded in the URL and fully restores on reload.

### TC-U-01 — URL updates in real time (no history spam)

| Field | Detail |
|---|---|
| **ID** | TC-U-01 |
| **Description** | URL query string updates as selections change; back button is not polluted |

**Steps:**

1. Open https://getfillright.com.
2. Select a truck, change gauge levels, enter distance, enter gas price.
3. Press the browser back button.

**Expected Result:** URL updates via `replaceState` (not `pushState`). Pressing back navigates away from the app entirely, not through a history of intermediate states.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-U-02 — Full state restores from URL on reload

| Field | Detail |
|---|---|
| **ID** | TC-U-02 |
| **Description** | Reloading a URL with all params restores the exact same result |

**Steps:**

1. Select "26 ft Truck", set pickup = F, current = 1/4, distance = 50 miles, gas price = 4.00.
2. Copy the URL from the address bar.
3. Open the URL in a new tab (or reload).
4. Verify each field matches the original state.

**Expected Result:**
- Truck: 26 ft Truck selected.
- At Pickup: F (1.0).
- Right Now: 1/4 (0.25).
- Distance: 50 miles.
- Gas price: 4.00.
- Result is calculated immediately on load (no user interaction required).

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-U-03 — "Share this calculation" button copies link

| Field | Detail |
|---|---|
| **ID** | TC-U-03 |
| **Description** | Clicking "Share this calculation" copies the current URL to clipboard |

**Steps:**

1. Set up any complete scenario with a result.
2. Click/tap the "Share this calculation" button.
3. Paste clipboard contents into a text editor.

**Expected Result:**
- Button label briefly changes to "✓ Link copied!" for ~2 seconds, then reverts.
- Pasted URL matches the current browser URL including all query params.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-U-04 — Invalid URL params are ignored gracefully

| Field | Detail |
|---|---|
| **ID** | TC-U-04 |
| **Description** | Tampered or invalid URL params do not crash the app |

**Steps:**

1. Navigate to `https://getfillright.com?truck=fake-truck&pickup=0.33&current=99&dist=-5&gas=abc`.
2. Observe the app state.

**Expected Result:**
- `truck=fake-truck` → no truck selected (falls back to null).
- `pickup=0.33` → ignored (not a valid level); defaults to F (1.0).
- `current=99` → ignored; defaults to 1/2 (0.5).
- `dist=-5` → ignored; distance = 0.
- `gas=abc` → ignored; gas price field empty.
- App loads without errors. No JS exceptions in console.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-U-05 — Truck not in URL → no truck pre-selected

| Field | Detail |
|---|---|
| **ID** | TC-U-05 |
| **Description** | Opening a URL with only gauge/distance/gas params but no truck param shows the no-truck prompt |

**Steps:**

1. Navigate to `https://getfillright.com?pickup=1&current=0.5&dist=10&gas=3.50`.
2. Observe Step 1 and the result area.

**Expected Result:** No truck is selected. The "Start by selecting your truck size above" prompt is shown. The result card is not shown.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

## 7. Already Sufficient State

Goal: Confirm the "You're good to go!" state renders correctly when no fuel is needed.

### TC-S-01 — "You're good to go!" shown when tank is already sufficient

| Field | Detail |
|---|---|
| **ID** | TC-S-01 |
| **Description** | When current level is well above pickup level and no final drive, the app shows the green sufficient state |

**Steps:**

1. Select "10 ft Truck" (31 gal, 12 mpg).
2. Set "At Pickup" to **1/4** (0.25 → 7.75 gal).
3. Set "Right Now" to **F** (1.0 → 31 gal).
4. Set distance to **0** miles.

**Expected Result:**
- rawGallonsToAdd = (7.75 − 31 + 0) + 0.5 = −22.75 ≤ 0 → alreadySufficient = true.
- Result card has green border/background.
- "✅ You're good to go!" text is visible.
- "Your current fuel level is sufficient for return." subtext is visible.
- No gallons-to-add number is shown.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-S-02 — Sufficient state with gas price entered shows no cost estimate

| Field | Detail |
|---|---|
| **ID** | TC-S-02 |
| **Description** | Gas price field has no effect when alreadySufficient = true |

**Steps:**

1. Reproduce the sufficient state from TC-S-01.
2. Enter $4.00 in the gas price field.

**Expected Result:** The "You're good to go!" card remains unchanged. No cost estimate line appears.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

## 8. Edge Cases

### TC-E-01 — Distance = 0, no final-drive line shown

| Field | Detail |
|---|---|
| **ID** | TC-E-01 |
| **Description** | When distance is 0 (or empty), the "Final drive" breakdown row does not appear |

**Steps:**

1. Select "15 ft Truck", pickup = F, current = 1/2.
2. Leave distance at 0 (or blank).
3. Inspect the breakdown table in the result card.

**Expected Result:** The "Final drive" row (`−X gal`) is absent. Only "Needed at return", "In tank now", and "Safety buffer" rows are shown.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-E-02 — Current level above pickup level (over-filled scenario)

| Field | Detail |
|---|---|
| **ID** | TC-E-02 |
| **Description** | When current fuel exceeds what was in the tank at pickup, result is "already sufficient" |

**Steps:**

1. Select "Cargo Van" (26 gal, 18 mpg).
2. Set "At Pickup" to **1/4** (0.25 → 6.5 gal).
3. Set "Right Now" to **3/4** (0.75 → 19.5 gal).
4. Set distance to **20** miles.

**Expected Result:**
- gallonsForFinalDrive = 20 / 18 ≈ 1.1 gal.
- deficit = 6.5 − 19.5 + 1.1 = −11.9 gal.
- rawGallonsToAdd = −11.9 + 0.5 = −11.4 ≤ 0 → alreadySufficient = true.
- "You're good to go!" state is shown.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-E-03 — $30 fee risk warning appears

| Field | Detail |
|---|---|
| **ID** | TC-E-03 |
| **Description** | When the current level will drop below 1/4 tank before drop-off, the red warning banner appears |

**Steps:**

1. Select "26 ft Truck" (60 gal, 7 mpg).
2. Set "At Pickup" to **F** (1.0 → 60 gal).
3. Set "Right Now" to **1/4** (0.25 → 15 gal).
4. Set distance to **50** miles.

**Expected Result:**
- gallonsForFinalDrive = 50 / 7 ≈ 7.1 gal.
- levelAfterDrive = (15 − 7.1) / 60 = 7.9 / 60 ≈ 0.132 → below 0.25 threshold.
- isAtRisk = true.
- Red alert banner with "⚠️ $30 Service Fee Risk" headline is visible.
- Banner message: "Your tank will drop below ¼ before drop-off. Fill up to avoid U-Haul's refueling surcharge."
- Result card border is red (`border-red-400 bg-red-50`).

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-E-04 — $30 fee risk warning does NOT appear when not at risk

| Field | Detail |
|---|---|
| **ID** | TC-E-04 |
| **Description** | No warning when level after final drive is at or above 1/4 |

**Steps:**

1. Select "15 ft Truck" (40 gal, 10 mpg).
2. Set "At Pickup" to **F**, current to **1/2** (20 gal).
3. Set distance to **5** miles.

**Expected Result:**
- gallonsForFinalDrive = 5 / 10 = 0.5 gal.
- levelAfterDrive = (20 − 0.5) / 40 = 0.4875 → above 0.25 threshold.
- No red warning banner.
- Result card has orange border (`border-orange-400 bg-orange-50`).

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-E-05 — Fuel level = E at pickup (contract says empty)

| Field | Detail |
|---|---|
| **ID** | TC-E-05 |
| **Description** | Setting "At Pickup" to E (0.0) means user needs to return the truck empty |

**Steps:**

1. Select "10 ft Truck" (31 gal, 12 mpg).
2. Set "At Pickup" to **E** (0.0 → 0 gal needed at return).
3. Set "Right Now" to **1/4** (0.25 → 7.75 gal).
4. Set distance to **0** miles.

**Expected Result:**
- deficit = 0 − 7.75 + 0 = −7.75 gal.
- rawGallonsToAdd = −7.75 + 0.5 = −7.25 ≤ 0 → alreadySufficient = true.
- "You're good to go!" is shown.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-E-06 — Very large distance value

| Field | Detail |
|---|---|
| **ID** | TC-E-06 |
| **Description** | Entering a large distance (e.g., 999 miles) does not break the UI |

**Steps:**

1. Select "26 ft Truck" (60 gal, 7 mpg).
2. Set pickup = F, current = F.
3. Enter **999** miles.

**Expected Result:**
- gallonsForFinalDrive = 999 / 7 ≈ 142.7 gal.
- Even though 142.7 exceeds tank size, the math proceeds: result is a very large gallons-to-add number.
- No crash or NaN displayed. The result may logically exceed tank size, which is a user-input concern, not a bug.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

## 9. Mobile UX

### TC-M-01 — Unit toggle button not accidentally tapped when focusing distance input

| Field | Detail |
|---|---|
| **ID** | TC-M-01 |
| **Description** | On a mobile device, tapping the number field to enter distance does not accidentally trigger the mi/km toggle |

**Steps:**

1. Open https://getfillright.com on a mobile device (iOS Safari or Android Chrome).
2. Tap directly on the distance number input field (left portion of the row).
3. Observe: (a) the keyboard appears, (b) the unit toggle state.

**Expected Result:**
- The software keyboard opens.
- The unit (mi/km) does not change.
- The toggle button ("mi" label) is visually distinct and separated from the input area by a left border.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-M-02 — Result scrolls into view after dismissing keyboard from distance field

| Field | Detail |
|---|---|
| **ID** | TC-M-02 |
| **Description** | After finishing distance entry and blurring the input, the result section scrolls into view |

**Steps:**

1. Open on a mobile device.
2. Select a truck, set gauge levels.
3. Tap the distance input and type a distance value.
4. Dismiss the keyboard (tap "Done" / swipe down / tap outside the input).
5. Observe scroll position.

**Expected Result:** The result section scrolls smoothly into the visible viewport (behavior: "smooth", block: "nearest"). The user does not need to manually scroll to see the result.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-M-03 — Result scrolls into view after dismissing keyboard from gas price field

| Field | Detail |
|---|---|
| **ID** | TC-M-03 |
| **Description** | Same scroll behavior triggered on blur of the gas price input |

**Steps:**

1. Open on a mobile device with a truck selected and levels configured.
2. Tap the gas price input and enter a value.
3. Dismiss the keyboard.

**Expected Result:** Result section scrolls into view, same as TC-M-02.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-M-04 — Layout is not broken on 390px wide screen

| Field | Detail |
|---|---|
| **ID** | TC-M-04 |
| **Description** | All UI elements are usable and not clipped on a 390px viewport (iPhone 14 width) |

**Steps:**

1. Open in Chrome DevTools device emulation at 390px width, or on a physical iPhone 14.
2. Scroll through the entire page.
3. Interact with truck selector, gauges, distance input, gas price, and share button.

**Expected Result:**
- No horizontal overflow / scrollbar.
- All text is readable (not truncated or overlapping).
- Touch targets are large enough (gauge steps, toggle button, truck selector buttons).
- The two FuelGauge columns (grid-cols-2) fit side by side without clipping.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-M-05 — Decimal keyboard appears for distance and gas price

| Field | Detail |
|---|---|
| **ID** | TC-M-05 |
| **Description** | Mobile keyboard uses numeric/decimal mode for numeric inputs |

**Steps:**

1. Open on iOS Safari or Android Chrome.
2. Tap the distance input.
3. Observe the keyboard type.
4. Tap the gas price input.
5. Observe the keyboard type.

**Expected Result:** Both inputs trigger a numeric/decimal keyboard (`inputMode="decimal"`), not the full alphanumeric keyboard.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

## 10. Cross-Browser

Run the core happy-path scenario on each browser combination. Core scenario: 15 ft Truck, pickup = F, current = 1/2, distance = 20 mi, gas = $3.99. Expected: 22.5 gal, ≈ $89.78.

### TC-B-01 — Chrome Desktop

| Field | Detail |
|---|---|
| **ID** | TC-B-01 |
| **Browser** | Chrome (latest stable, desktop) |

**Steps:**

1. Open https://getfillright.com in Chrome on desktop.
2. Run the core scenario.
3. Verify result, URL state, share button, and no console errors.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-B-02 — Chrome Android

| Field | Detail |
|---|---|
| **ID** | TC-B-02 |
| **Browser** | Chrome (latest stable, Android) |

**Steps:**

1. Open https://getfillright.com on an Android device in Chrome.
2. Run the core scenario.
3. Also verify: TC-M-01, TC-M-02, TC-M-05.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-B-03 — Safari Desktop

| Field | Detail |
|---|---|
| **ID** | TC-B-03 |
| **Browser** | Safari (latest stable, macOS) |

**Steps:**

1. Open https://getfillright.com in Safari on macOS.
2. Run the core scenario.
3. Verify result, URL state, clipboard copy (Safari may prompt for clipboard permission).

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-B-04 — Safari iOS

| Field | Detail |
|---|---|
| **ID** | TC-B-04 |
| **Browser** | Safari (latest stable, iOS) |

**Steps:**

1. Open https://getfillright.com on an iPhone in Safari.
2. Run the core scenario.
3. Also verify: TC-M-01, TC-M-02, TC-M-04, TC-M-05.
4. Verify share sheet (navigator.clipboard API behavior on iOS Safari).

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-B-05 — Firefox Desktop

| Field | Detail |
|---|---|
| **ID** | TC-B-05 |
| **Browser** | Firefox (latest stable, desktop) |

**Steps:**

1. Open https://getfillright.com in Firefox on desktop.
2. Run the core scenario.
3. Verify result, URL state, share button, and no console errors.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

## 11. OG / Social Preview

Goal: Confirm the OpenGraph and Twitter Card metadata renders correctly so shared links show a rich preview in iMessage, Twitter/X, Slack, etc.

### TC-OG-01 — OG tags present in page source

| Field | Detail |
|---|---|
| **ID** | TC-OG-01 |
| **Description** | The page HTML contains required OG meta tags |

**Steps:**

1. Open https://getfillright.com.
2. View page source (Cmd+U / Ctrl+U).
3. Search for `og:` meta tags.

**Expected Result:** The following tags are present and non-empty:
- `og:title`
- `og:description`
- `og:image` (absolute URL to a preview image)
- `og:url`
- `twitter:card` (should be `summary_large_image` or `summary`)

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-OG-02 — Twitter/X card preview

| Field | Detail |
|---|---|
| **ID** | TC-OG-02 |
| **Description** | Shared link renders a card preview on Twitter/X |

**Steps:**

1. Construct a shareable link with a full scenario (truck, levels, distance, gas price).
2. Use the Twitter Card Validator (https://cards-dev.twitter.com/validator) to validate the URL.

**Expected Result:** Card preview loads with correct title, description, and image. No "Error fetching page" or missing image.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-OG-03 — iMessage link preview

| Field | Detail |
|---|---|
| **ID** | TC-OG-03 |
| **Description** | Sharing the link via iMessage shows a rich preview |

**Steps:**

1. Copy a shareable link from the app.
2. Send the link via iMessage on an iPhone.
3. Observe the link preview bubble.

**Expected Result:** A rich preview bubble appears with the app title and preview image. The link is not displayed as a bare URL.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

## 12. PWA & Offline

---

### TC-PWA-01 — Service worker registers successfully

| Field | Detail |
|---|---|
| **ID** | TC-PWA-01 |
| **Description** | The service worker registers and activates on first load |

**Steps:**

1. Open https://getfillright.com in Chrome (fresh profile / incognito).
2. Open DevTools → Application → Service Workers.
3. Observe the SW status.

**Expected Result:** A service worker for `/sw.js` is listed with status **activated and is running**. No console errors.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-PWA-02 — Manifest loads and passes Chrome install criteria

| Field | Detail |
|---|---|
| **ID** | TC-PWA-02 |
| **Description** | Chrome reports the manifest as valid and the app meets installability criteria |

**Steps:**

1. Open DevTools → Application → Manifest.
2. Verify name, short_name, start_url, display, theme_color, background_color, and icons.
3. Check DevTools → Application → Service Workers for the active SW.
4. Run Lighthouse → PWA audit.

**Expected Result:** Manifest fields are all populated. Lighthouse PWA score ≥ 90. No "installability errors" are listed.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-PWA-03 — Offline navigation shows offline page

| Field | Detail |
|---|---|
| **ID** | TC-PWA-03 |
| **Description** | Navigating while offline renders the /offline fallback page |

**Steps:**

1. Load https://getfillright.com and wait for the SW to activate.
2. In DevTools → Network, tick **Offline**.
3. Navigate to https://getfillright.com (or click browser refresh).
4. Observe the page content.

**Expected Result:** The FillRight offline page appears showing the app name, an offline message, and a **Try again** button. The browser does not show a generic "no internet" error page.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-PWA-04 — "Try again" button reloads the page

| Field | Detail |
|---|---|
| **ID** | TC-PWA-04 |
| **Description** | Clicking Try again triggers a reload so the user gets live content once reconnected |

**Steps:**

1. Follow TC-PWA-03 to reach the offline page.
2. In DevTools → Network, untick **Offline** to restore connectivity.
3. Click the **Try again** button on the offline page.

**Expected Result:** The page reloads and the main FillRight calculator is displayed.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-PWA-05 — Static assets served from cache while offline

| Field | Detail |
|---|---|
| **ID** | TC-PWA-05 |
| **Description** | Next.js static assets cached by the SW are served from cache when offline |

**Steps:**

1. Load the app online so the SW caches `/_next/static/` assets.
2. In DevTools → Network, tick **Offline**.
3. Reload the page.
4. Open DevTools → Network and filter by `_next/static`.

**Expected Result:** Static assets are served from `ServiceWorker` (shown in the Size column), not from the network.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-PWA-06 — Install to home screen (Android Chrome)

| Field | Detail |
|---|---|
| **ID** | TC-PWA-06 |
| **Description** | The app can be installed to the Android home screen and launches in standalone mode |

**Steps:**

1. Open https://getfillright.com in Chrome on Android.
2. Tap the browser menu → **Add to Home screen** (or wait for the install banner).
3. Confirm the install. Find and tap the icon on the home screen.

**Expected Result:** The app launches without browser chrome (no address bar). The app icon shows the orange FillRight icon. The title bar shows the theme color.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-PWA-07 — Install to home screen (iOS Safari)

| Field | Detail |
|---|---|
| **ID** | TC-PWA-07 |
| **Description** | The app can be added to the iOS home screen with correct icon and title |

**Steps:**

1. Open https://getfillright.com in Safari on iOS.
2. Tap the Share button → **Add to Home Screen**.
3. Confirm the name "FillRight" and tap **Add**.
4. Find and tap the icon on the home screen.

**Expected Result:** The icon displayed is the orange FillRight PNG (not a screenshot of the page). The app launches in standalone mode without Safari chrome.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

### TC-PWA-08 — SW update — new version activates on next navigation

| Field | Detail |
|---|---|
| **ID** | TC-PWA-08 |
| **Description** | When a new SW is deployed the updated worker activates and clears old caches |

**Steps:**

1. Install the app and let the SW activate.
2. Deploy a new SW with an incremented `CACHE_NAME` (e.g. `fillright-v2`).
3. Reload the page twice (first reload installs new SW; second activates it).
4. Check DevTools → Application → Cache Storage.

**Expected Result:** Only the new cache (`fillright-v2`) exists. The old cache (`fillright-v1`) has been deleted.

| Pass | Fail | N/A |
|---|---|---|
| | | |

---

## 13. Test Run Log

Use this section to record the outcome of each test run. Add a new entry for each test session.

---

### Run Template

```
## Test Run: YYYY-MM-DD

**Tester:**
**Environment:** (browser, OS, device)
**App Version / Commit:**
**URL tested:** https://getfillright.com

### Results Summary

| Total | Passed | Failed | N/A |
|---|---|---|---|
| | | | |

### Failures

| TC ID | Description | Actual Result | Notes |
|---|---|---|---|
| | | | |

### Notes / Observations

(Any flakiness, unexpected behavior, or follow-up items)
```

---

### Run #1 — (placeholder)

_No runs recorded yet. Copy the template above to log the first run._
