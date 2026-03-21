# Plan: Issue #39 — Replace Placeholder PWA Icon with Branded FillRight Icon

## Problem Summary

The PWA icons (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) are white placeholder
images. When users add FillRight to their iOS/Android home screen, they see a plain circle
with no content. The `icon.svg` already has the right concept (white "FR" on orange circle)
but the raster PNGs haven't been updated to match.

## Current State

| File | Size | Content |
|------|------|---------|
| `public/icon.svg` | SVG | Orange circle + white "FR" text (good baseline) |
| `public/icon-192.png` | 192×192 | White placeholder |
| `public/icon-512.png` | 512×512 | White placeholder |
| `public/apple-touch-icon.png` | 180×180 | White placeholder |

`manifest.json` references all three PNGs and the SVG. `layout.tsx` references
`/apple-touch-icon.png` in the `icons.apple` metadata field.

## Design

**Brand constants:**
- Background: FillRight orange `#f97316` (rgb 249, 115, 22)
- Foreground: White `#ffffff`
- Concept: Fuel pump glyph (⛽) OR clean "FR" monogram — fuel pump preferred per issue

**Icon design:** Orange filled square (safe-zone aware) with:
- A simplified white fuel-pump silhouette centered in the canvas
- Built from pure geometry (rectangles + small arc for hose nozzle) — no font rendering needed
- Safe-zone padding (≈12% of canvas) so maskable cropping doesn't cut off the shape

The fuel pump shape is composed of:
1. Rectangular pump body (tall rect, slightly left of center)
2. Rectangular base/stand
3. Small nozzle rectangle (upper right, at an angle via rotation or approximated)
4. Curved hose approximated as a thick arc

This approach avoids any font/text rendering dependency and produces a shape that reads
clearly at 48×48 dp (real phone icon size).

## Implementation Steps

All work on branch `claude/plan-issue-39-qydkv`.

### Step 1 — Write failing tests first (TDD)

Add tests to `src/app/__tests__/manifest.test.ts` (or new `icons.test.ts`):

```ts
// Tests to add:
it("icon-192.png exists in /public", ...)
it("icon-512.png exists in /public", ...)
it("apple-touch-icon.png exists in /public", ...)
it("icon.svg contains brand orange color", ...)
it("manifest icons reference files that exist", ...)
it("manifest has a maskable icon entry", ...)  // new AC
```

Tests will pass for existence (files already exist) but the maskable-purpose test will
fail until we add a dedicated `icon-192-maskable.png` or update the existing entry.

Actually — the current `manifest.json` already has a `maskable` entry for `icon-512.png`.
The real failing test should be about the *visual content* of the PNGs (are they branded?).
We'll add a test that verifies the dominant color of the icon is the FillRight orange.

### Step 2 — Install dependencies

```bash
cd /home/user/Haul-Pass && npm install
```

### Step 3 — Improve `icon.svg`

Update `public/icon.svg` with a cleaner fuel pump design:
- 512×512 viewBox (higher fidelity source)
- Orange background square with rounded corners (maskable-safe)
- White fuel pump silhouette
- Centered, legible at small sizes

### Step 4 — Generate PNG icons via Python script

No imagemagick/inkscape available, so we render via Python's built-in `struct`/`zlib`:

Write `scripts/generate-icons.py` that:
1. Defines the fuel pump shape as pixel-level geometry (filled rectangles + circles)
2. Renders at 512×512, 192×192, 180×180 with anti-aliasing via supersampling (render 2× then downsample)
3. Outputs PNG files to `/public/`

The script is a one-time generation tool, not part of the production build.

### Step 5 — Run the icon generation script

```bash
python3 scripts/generate-icons.py
```

Verify output with:
```bash
python3 -c "
import struct, zlib
# check first row of pixels for orange color
for f in ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png']:
    # sample center pixel — should be orange (249, 115, 22)
    ...
"
```

### Step 6 — Update `manifest.json`

Add a dedicated maskable icon entry for `icon-192.png` with `"purpose": "maskable"`:

```json
{
  "src": "/icon-192.png",
  "sizes": "192x192",
  "type": "image/png",
  "purpose": "maskable"
}
```

(The 512 maskable entry already exists — add 192 as well for broader compatibility.)

### Step 7 — Verify `layout.tsx`

The `icons.apple` field already points to `/apple-touch-icon.png`. No changes needed
unless the path needs updating. Confirm it renders correctly.

### Step 8 — Run tests and lint

```bash
npx vitest run
npx eslint .
```

All tests must pass, no new lint errors.

### Step 9 — Commit, push, open PR

```bash
git add public/icon.svg public/icon-192.png public/icon-512.png public/apple-touch-icon.png \
        public/manifest.json src/app/__tests__/manifest.test.ts scripts/generate-icons.py
git commit -m "feat(pwa): replace placeholder icons with branded FillRight fuel-pump icon (#39)"
git push -u origin claude/plan-issue-39-qydkv
```

## Acceptance Criteria (from issue)

- [ ] Icon is visually distinctive at 192×192 and 512×512
- [ ] Saved to iPhone Home Screen shows the new icon (not a plain circle)
- [ ] `apple-touch-icon` also updated for iOS (180×180)
- [ ] Icon assets checked into `/public`
- [ ] No new lint or test failures

## Files Changed

| File | Action |
|------|--------|
| `public/icon.svg` | Update with fuel-pump design |
| `public/icon-192.png` | Replace with branded PNG |
| `public/icon-512.png` | Replace with branded PNG |
| `public/apple-touch-icon.png` | Replace with branded PNG (180×180) |
| `public/manifest.json` | Add maskable purpose to 192 icon entry |
| `src/app/__tests__/manifest.test.ts` | Add icon color/content tests |
| `scripts/generate-icons.py` | New: one-time icon generation script |

## Team

- **Dex** designed the icon concept (fuel pump on orange, this plan)
- **Rio** integrates into manifest/layout
- **Sage** reviews and merges

## Open Questions

1. **Fuel pump vs "FR" wordmark:** The issue suggests either. Fuel pump is preferred
   (more universally recognizable) but requires geometric rendering. "FR" wordmark is
   simpler to implement via bitmap font. → Defaulting to fuel pump; will escalate if
   the rendered shape isn't clean enough at 48dp.

2. **Maskable safe zone:** Maskable icons should have their key content within the
   center 80% of the canvas. Our design needs to account for this.
