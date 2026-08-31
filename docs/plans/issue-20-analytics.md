# Plan: Issue #20 — Analytics and Conversion Tracking

> **Archived.** Written March 2026 on `claude/plan-issue-20-gldMx`, which was never merged and has since been deleted. Preserved here because [#20](https://github.com/shaunczubkowski/Haul-Pass/issues/20) is still open. Verify it against the current codebase before acting on it — Vercel Analytics has landed since.

## Overview

Add custom event tracking to FillRight using the existing `@vercel/analytics` package
(already installed, already rendering `<Analytics />` in layout). No new dependency
needed — Vercel Analytics supports custom events via `track()` and is already
privacy-first, GDPR-compliant, and cookie-free.

> **Why not Plausible/PostHog?** The issue recommends them as options. Since
> `@vercel/analytics` is already installed, ships with the Vercel deployment, and
> satisfies every acceptance criterion (no PII, no cookie banner, privacy-first),
> adding another provider would be redundant overhead. If the team wants richer
> funnels or A/B testing in the future, PostHog can be layered in then.

---

## Events to Implement

| Event | Where fired | Key properties (no PII) |
|---|---|---|
| `calculator_loaded` | `page.tsx` — on mount | `deviceType: "mobile" \| "tablet" \| "desktop"` |
| `truck_selected` | `page.tsx` — when `truck` state changes (skip initial) | `truckId`, `company`, `tankCapacity` |
| `calculation_completed` | `page.tsx` — when valid result renders | `gallonsBucket` (see below), `isAtRisk`, `hasGasPrice`, `company` |
| `risk_alert_shown` | `page.tsx` — when `result.isAtRisk === true` | `company`, `truckId` |
| `share_clicked` | `page.tsx` — in the copy-link handler | `method: "clipboard" \| "fallback"` |
| `station_finder_used` | _(new UI element, see below)_ | `granted: boolean` (geolocation consent) |

**Gallons bucketing** (keeps data useful without storing exact amounts):

```
0–1 gal   → "0-1"
1–3 gal   → "1-3"
3–5 gal   → "3-5"
5–10 gal  → "5-10"
10+ gal   → "10+"
```

**Device type detection** (based on `window.innerWidth`, no UA string):

```
< 768px  → "mobile"
< 1024px → "tablet"
≥ 1024px → "desktop"
```

---

## Station Finder UI

`station_finder_used` requires a small UI element — currently nothing in the codebase
triggers geolocation. Plan: add a **"Find gas station nearby"** button in the results
section (visible when a valid result exists). On click it requests `navigator.geolocation`
and opens the system map app (Google Maps / Apple Maps via a `geo:` or maps URL), firing
the event with `granted: true/false` based on permission outcome.

This is intentionally minimal — it uses native platform maps rather than an embedded
map widget, keeping the bundle lean and maintaining the privacy-first approach.

---

## File-by-file Changes

### 1. `src/lib/analytics.ts` _(new file)_

Typed wrapper around Vercel's `track()`. Exports:
- `trackEvent(name, properties)` — strongly-typed, swallows errors (analytics must
  never break the app)
- `bucketGallons(n: number): string` — testable pure function for gallons bucketing
- `getDeviceType(): "mobile" | "tablet" | "desktop"` — testable pure function

### 2. `src/lib/__tests__/analytics.test.ts` _(new file)_

Tests (TDD — write first):
- `bucketGallons` returns correct bucket for boundary values
- `getDeviceType` returns correct type for given window widths
- `trackEvent` calls Vercel `track()` with correct args
- `trackEvent` does NOT throw when `track()` throws (resilience)

### 3. `src/app/page.tsx` _(modify)_

Add tracking calls:
- `useEffect([], [])` on mount → `calculator_loaded`
- `useEffect([truck])` with a "hasMounted" ref guard → `truck_selected`
- Inside the `result` derivation or a `useEffect([result])` → `calculation_completed`
  and `risk_alert_shown` (deduplicated so they only fire when result changes to a new
  value, not on every render)
- Share button `onClick` → `share_clicked`
- New "Find gas station nearby" button → `station_finder_used`

### 4. `src/components/__tests__/` or `src/app/__tests__/` _(modify/new)_

Integration-style smoke test: mock `@vercel/analytics/react` and verify that
rendering the page with a full set of state calls `track` with expected event names.

---

## Acceptance Criteria Checklist

- [ ] Analytics provider integrated — **Vercel Analytics already integrated; custom
  events added via `track()`**
- [ ] All 6 events tracked
- [ ] No PII collected — properties are enums/booleans/bucketed numbers only
- [ ] No cookie consent banner — Vercel Analytics is cookieless by design
- [ ] Dashboard screenshot in PR — fire events in dev/preview environment, capture
  Vercel Analytics dashboard

---

## Implementation Order (TDD)

1. Write failing tests for `analytics.ts` helpers
2. Implement `src/lib/analytics.ts` to make tests pass
3. Wire `calculator_loaded`, `truck_selected`, `calculation_completed`, `risk_alert_shown`
   in `page.tsx` — run tests after each event
4. Wire `share_clicked` in share button handler
5. Add "Find gas station nearby" button + `station_finder_used` event
6. Run full test suite (`npx vitest run`) and linter (`npx eslint .`)
7. Commit (atomic commits per logical change), push to `claude/plan-issue-20-gldMx`
8. Open PR targeting `main`

---

## Out of Scope

- Switching analytics provider (PostHog / Plausible) — can be revisited in a future
  issue if richer funnels are needed
- A custom analytics dashboard — Vercel's built-in dashboard satisfies the PR screenshot
  requirement
- Any server-side analytics — this app has no backend; all tracking is client-side
