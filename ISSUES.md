# Open Issues

Tracked here until GitHub Issues are accessible from this environment.

---

## From PR: fix top 5 priority issues (`claude/fix-top-priority-issues-Miyn1`)

### Security / Validation

**[S-1] Normalize `gasPrice` at URL ingestion, not only at calculation boundary**
`src/app/page.tsx` → `readUrlParams()`, `gas` param block.
Currently `gasPrice` is stored as a raw string from the URL with no sanitization. The
`parseFloat(gasPrice) > 0` guard in the calculator input prevents bad values from
affecting arithmetic, but the two validation sites are decoupled — a future caller that
reads `gasPrice` state directly could skip the guard. Fix: apply the `> 0` parse check
inside `readUrlParams` and return either a canonical numeric string or `""`.
_Raised by: Vesper_

**[S-2] No upper bound on `dist` URL param**
`src/app/page.tsx` → `readUrlParams()`, `dist` param block.
`distance` accepts any `val >= 0` with no maximum. A value like `?dist=999999999` produces
a nonsensical but non-crashing UI. Recommend capping at a domain-appropriate maximum
(e.g. 10 000 miles / 16 000 km).
_Raised by: Vesper_

**[S-3] Silent copy failure UX risk if app is served over HTTP**
`src/app/page.tsx` → `copyLink`. _(Partially addressed: error message now shown.)_
The error message directs the user to the address bar, but there is no persistent
fallback (e.g. a visible URL text field) for contexts where the Clipboard API is
permanently unavailable. Consider surfacing the URL inline when the first copy attempt
fails.
_Raised by: Vesper_

---

### Accessibility / UX

**[A-1] ~~`aria-label` on FuelGauge slider embeds the current value, making the accessible name unstable~~** ✅ RESOLVED
`src/components/FuelGauge.tsx` — `aria-label={label}` is now stable (label prop only).
Value is communicated exclusively via `aria-valuetext`. Covered by test:
`"aria-label on slider is stable (does not embed the current value)"`.
_Raised by: Dex — Resolved_

**[A-2] ~~`aria-disabled` without matching keyboard guard on `onKeyDown`~~** ✅ RESOLVED
`src/components/FuelGauge.tsx` — `handleKeyDown` early-returns on `disabled` as its
first line, preventing key events from reaching `onChange` regardless of how focus
arrived. Covered by test: `"keyboard events do not fire when the slider is disabled"`.
_Raised by: Dex — Resolved_

**[A-3] ~~"✓" checkmark in "✓ Link copied!" is read aloud by some screen readers~~** ✅ RESOLVED
`src/app/page.tsx` — checkmark is wrapped in `<span aria-hidden="true">✓ </span>`.
Covered by test: `"checkmark in 'Link copied!' is wrapped in aria-hidden…"`.
_Raised by: Dex — Resolved_

**[A-4] VoiceOver + Safari may be slow to announce `aria-valuetext` changes on custom sliders**
`src/components/FuelGauge.tsx`.
Flag for manual AT testing — no code change required until verified.
_Raised by: Dex_

---

### Front-End / React

**[F-1] `useState(readUrlParams)` lazy-initializer pattern needs inline comment**
`src/app/page.tsx` line 58.
The pattern `const [initialParams] = useState(readUrlParams)` is non-obvious. Add a
comment explaining that `readUrlParams` is the initializer function (called once by
React on mount) and that subsequent `useState(initialParams.x)` calls use the
initial-value form (ignored after first render).
_Raised by: Rio_

**[F-2] Gas price lower bound could be tighter**
`src/app/page.tsx` → calculator input, `gasPricePerGallon` guard.
`> 0` rejects negative values but also rejects `0.00` which is a valid (if unusual)
gas price. Consider `>= 0.01` or showing the cost estimate only when the price is
non-zero. Product decision — not a bug.
_Raised by: Rio_

**[F-3] Verify keyboard-focus behaviour on FuelGauge — dual slider/button elements**
`src/components/FuelGauge.tsx`.
The component exposes a `sr-only` slider div (keyboard/AT) and visible buttons (pointer).
Confirm that a keyboard user does not land on both the slider and the first button in
sequence, which would create a redundant tab stop. Manual keyboard test recommended.
_Raised by: Rio_

---

### Data Accuracy

**[D-1] Penske 22 ft and 26 ft tank capacity may be 70 gal, not 50 gal**
`src/data/trucks.ts` → `PENSKE_TRUCKS`, `penske-22ft` and `penske-26ft`.
SOURCES.md flags this for spec review (issue #42). Under-reporting tank size causes
the app to under-calculate fuel needed for the final drive on large Penske trucks.
Verify against official Penske spec pages and update if confirmed.
_Pre-existing, documented in SOURCES.md_

**[D-2] Budget 24 ft and 26 ft tank capacities derived from community comparison, not official spec**
`src/data/trucks.ts` → `BUDGET_TRUCKS`, `budget-24ft` and `budget-26ft`.
Confirm directly with budgettruck.com detail pages.
_Pre-existing, documented in SOURCES.md_
