# Research: Issue #18 — AI-Powered Fuel Gauge Reading via Camera

> **Archived.** Written 2026-03-17 on `claude/research-issue-18-ai3cM`, which was never merged and has since been deleted. Preserved here because [#18](https://github.com/shaunczubkowski/Haul-Pass/issues/18) is still open. It predates the August 2026 re-plan that split the AI work into `[AI-A]`–`[AI-E]` (#110–#114), so treat it as background, not as a current plan.

**Issue:** [#18](https://github.com/shaunczubkowski/Haul-Pass/issues/18) · Labels: `v2`, `feature`, `P3` · Milestone: v2.0
**Date:** 2026-03-17
**Team:** Sage (coord), Caden (backend), Rio (frontend), Vesper (security/privacy)

> ⚖️ **Legal Note:** The privacy policy and terms of service require material updates before this feature ships. These documents should be reviewed by legal counsel before publishing.

---

## Context

Users currently select their fuel level manually by tapping one of 9 buttons (E → F). This feature would let users optionally photograph the truck's gauge and have an AI vision model pre-fill the reading. The issue requires: camera capture UI, server-side vision API call, error handling, privacy notice, and ≥80% gauge accuracy on iOS + Android.

**Current "privacy contract" that must change:**

> §1 of privacy policy: *"The calculator inputs you enter…are never transmitted to or stored on any server."*
> §6: *"We do not…share any data with third parties."*

Both statements become false the moment a user taps "Scan Gauge." The privacy policy and ToS **must be updated before the feature ships.**

---

## Architecture Overview (shared across all options)

```
User taps "Scan Gauge"
  → device camera opens (native or custom)
  → photo captured
  → client POSTs multipart image to /api/gauge-reading
  → Next.js route handler validates + base64-encodes image
  → calls vision AI API (server-side, API key never exposed to browser)
  → parses response → one of 9 GaugeLevel values
  → client pre-fills the FuelGauge selector
  → manual override always remains available
  → image is never stored or logged on any server
```

**Key types (from `src/types/index.ts`):**
- `GaugeLevel`: `0 | 0.125 | 0.25 | 0.375 | 0.5 | 0.625 | 0.75 | 0.875 | 1.0`
- `GAUGE_LEVEL_LABELS`: maps each value to `"E" | "1/8" | "1/4" | "3/8" | "1/2" | "5/8" | "3/4" | "7/8" | "F"`

**AI prompt (consistent across vendors):**
```
This is a photo of a vehicle fuel gauge. What fuel level does it show?
Respond with ONLY one of: empty, 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8, full
If you cannot determine the level with confidence, respond with: unknown
Do not include any other text or explanation.
```

---

## Option 1 — Claude Vision (Anthropic) + File Input capture ✅ Recommended

**Summary:** Use `<input type="file" capture="environment">` for camera access and Anthropic's Claude Vision API as the AI backend.

### Frontend (Rio)

- Capture method: `<input type="file" accept="image/*" capture="environment">`
- A styled `<label>` wraps the hidden input; appears as a "Scan Gauge" button
- On `change`, client validates file type (`image/jpeg|png|webp`) and size (< 2 MB) before upload
- Shows a loading spinner with `aria-busy="true"` during the API call
- On success: pre-fills the gauge selector with detected level + shows "Detected: 3/4 — tap to change" badge
- On failure (unclear photo, API error, timeout): dismissible inline error; gauge stays in manual mode
- Inline privacy notice (required): *"Photo is processed by AI and immediately discarded — never stored."*
- New component: `src/components/ScanGaugeButton.tsx`

**Camera approach comparison:**

| | `<input capture>` | `getUserMedia()` |
|---|---|---|
| Works on iOS Safari | ✅ | ✅ (iOS 15.4+) |
| Works on Android Chrome | ✅ | ✅ |
| Native camera UI | ✅ | ❌ (must build) |
| Live preview before capture | ❌ | ✅ |
| Permission handling required | ❌ (OS handles) | ✅ |
| Code complexity | Low | High |

**Recommendation: `<input capture>` for MVP.** Save `getUserMedia()` for a follow-up if analytics show demand for live preview.

### Backend (Caden)

- New file: `src/app/api/gauge-reading/route.ts` (POST handler)
- No existing API routes — greenfield
- Flow: validate → base64 encode → call Anthropic → parse → return `GaugeLevel`
- SDK: `@anthropic-ai/sdk` (new dependency)
- Model: `claude-3-5-sonnet-20241022` (fast, cost-effective, strong vision)
- Max tokens: 50 (response is a single short label)
- Image never written to disk; base64 string is scoped to the request handler only
- Server-side env var: `ANTHROPIC_API_KEY` (never `NEXT_PUBLIC_`)

**Rate limiting:** Add Vercel KV (`@vercel/kv`) — 10 requests/hour per IP. Without rate limiting, a malicious user could run up unbounded API costs.

**Response contract:**
```json
// Success
{ "success": true, "level": 0.75, "label": "3/4" }

// Uncertain (model said "unknown")
{ "success": false, "error": "Could not detect fuel level" }

// Validation error
{ "success": false, "error": "Image too large (max 2 MB)" }
```

### AI Vendor: Anthropic

| Factor | Detail |
|---|---|
| Data retention | Not retained; not used for model training (per API usage policy) |
| Privacy policy | [anthropic.com/privacy](https://www.anthropic.com/privacy) |
| GDPR DPA | Available on request |
| Model quality for gauges | Strong analog instrument reading |
| Estimated cost per scan | ~$0.001–$0.003 |
| SDK | `@anthropic-ai/sdk` |
| New env var | `ANTHROPIC_API_KEY` |

### Security (Vesper)

- **CSP:** No CSP header exists today. Adding this API route doesn't require one — it's same-origin and the AI call happens server-to-server. No `next.config.ts` changes needed.
- **Image validation:** MIME type allowlist on client and server; reject SVG, GIF, BMP; hard 2 MB limit (return 413)
- **No storage:** No `fs.writeFile`, no DB insert, no logging of base64 content. Buffer scoped to request lifecycle only.
- **API key:** Server-only env var; set in Vercel Dashboard for production
- **CORS:** Same-origin route — no `Access-Control-Allow-Origin` header needed

---

## Option 2 — OpenAI GPT-4o + File Input capture

Identical frontend, architecture, and security posture to Option 1. Only the AI backend differs.

### Backend (Caden)

- SDK: `openai` (new dependency)
- Model: `gpt-4o`
- Image passed as `data:image/jpeg;base64,{base64}` in `image_url` content block
- Server-side env var: `OPENAI_API_KEY`

### AI Vendor: OpenAI

| Factor | Detail |
|---|---|
| Data retention | Not used for training by default (API opt-out applies since March 2023) |
| Privacy policy | [openai.com/policies/privacy-policy](https://openai.com/policies/privacy-policy) |
| GDPR DPA | Available at openai.com/policies/data-processing-addendum |
| Model quality for gauges | Strong, widely tested on instrument reading |
| Estimated cost per scan | ~$0.002–$0.005 |
| SDK | `openai` |
| New env var | `OPENAI_API_KEY` |

---

## Option 3 — Dual-provider fallback (Anthropic primary, OpenAI fallback)

Add both SDKs. Try Anthropic first; if it errors or times out, retry with OpenAI. Controlled by `GAUGE_API_PROVIDER=claude|openai|auto` env var.

**Trade-off:** More complex, two API keys to manage, two sub-processors to disclose in the privacy policy. Only warranted if uptime is a hard SLA requirement. **Not recommended for initial ship** — adds operational overhead without clear user benefit at P3 priority.

---

## Options Comparison

| | Option 1 (Claude) | Option 2 (OpenAI) | Option 3 (Both) |
|---|---|---|---|
| New dependencies | `@anthropic-ai/sdk`, `@vercel/kv` | `openai`, `@vercel/kv` | Both + `@vercel/kv` |
| New env vars | `ANTHROPIC_API_KEY` | `OPENAI_API_KEY` | Both keys |
| Sub-processors to disclose | Anthropic | OpenAI | Both |
| Est. cost per scan | ~$0.001–$0.003 | ~$0.002–$0.005 | ~$0.001–$0.003 |
| Implementation complexity | Low | Low | Medium |
| Availability | Good | Good | Best |
| **Recommended** | ✅ MVP | Viable alt | Overkill for v2 |

---

## Privacy Policy — Required Updates ⚖️

> **Legal review required before publishing.** The current policy makes explicit statements that the camera feature directly contradicts.

### §1 "What We Collect" — MUST UPDATE

Current text states inputs are "never transmitted to or stored on any server." The camera feature breaks this. Proposed addition:

> **Optional AI Gauge Scanning:** If you choose to use the "Scan Gauge" feature, the photo you take is transmitted over an encrypted connection to FillRight's server, where it is forwarded to [Anthropic, Inc.] for automated analysis. The image is used solely to detect the fuel level reading and is **not stored, logged, or retained** by FillRight or Anthropic beyond the duration of the API call (typically under 5 seconds). This feature is entirely optional — you may always enter your fuel level manually.

### "The Short Version" summary — MUST UPDATE

Add a bullet:
> ✓ Optional camera feature: photo processed by AI and immediately discarded — never stored

### §2 "What We Don't Collect" — MUST UPDATE

Clarify that images from the camera feature are transient, not stored, and only processed when the user explicitly opts in.

### §6 "Data Sharing" — MUST UPDATE (sub-processor disclosure)

> When you use the optional AI gauge scanning feature, your photo is processed by **Anthropic, Inc.** acting as a data processor on our behalf. This constitutes a temporary transfer of your image data to a third party solely for the purpose of fuel level detection. Anthropic is contractually prohibited from retaining or using images submitted via the API for any purpose other than generating the requested response. See [Anthropic's Privacy Policy](https://www.anthropic.com/privacy) for details.

### New §X "Camera & AI Processing" — RECOMMENDED

Dedicated section explaining: what the feature does, what data leaves the device, where it goes, how quickly it's discarded, that it's opt-in, and how to opt out (don't tap "Scan Gauge").

---

## Terms of Service — Required Updates ⚖️

> **Legal review required before publishing.**

### §2 "Estimates Only" — MUST UPDATE

Add to the limitations list:
> - AI-powered gauge reading (when used) is an automated estimate and may misread gauges in poor lighting, at an angle, or on non-standard gauge designs. Always visually verify the reading before relying on it.

### §3 "No Liability" — SHOULD UPDATE

Extend to explicitly cover AI misreads:
> This includes any fees resulting from an incorrect fuel level detected by the AI gauge scanning feature. The AI reading is a convenience tool only — the physical gauge in your vehicle is the authoritative source.

### New section — "Optional AI Features" — RECOMMENDED

> By using the "Scan Gauge" feature, you consent to your photo being transmitted to Anthropic, Inc. for automated processing as described in our Privacy Policy. This feature is optional. You may use the manual gauge selector at any time instead.

---

## Files to Create / Modify

| File | Action | Owner |
|---|---|---|
| `src/app/api/gauge-reading/route.ts` | **Create** | Caden |
| `src/components/ScanGaugeButton.tsx` | **Create** | Rio |
| `src/app/page.tsx` | **Modify** — add camera state, wire ScanGaugeButton | Rio |
| `src/app/privacy/page.tsx` | **Modify** — update §1, §2, §6, new camera section | Sage + Legal |
| `src/app/terms/page.tsx` | **Modify** — update §2, §3, new AI consent section | Sage + Legal |
| `src/components/__tests__/ScanGaugeButton.test.tsx` | **Create** | Rio |
| `src/app/api/gauge-reading/route.test.ts` | **Create** | Caden |
| `.env.example` | **Create** | Sage |
| `package.json` | **Modify** — add `@anthropic-ai/sdk`, `@vercel/kv` | Caden |

---

## Test Plan

**Unit tests (Vitest):**
- API route: mock Anthropic SDK; test each valid label → correct `GaugeLevel`; test `"unknown"` → 400; test missing image → 400; test oversized image → 413; test Anthropic SDK error → 500
- `ScanGaugeButton`: hidden input has `capture="environment"`; loading state renders; error state is dismissible; success pre-fills gauge selector

**Manual device testing:**
- iOS Safari: tap Scan Gauge → native camera opens → photo taken → level pre-fills
- Android Chrome: same flow
- Desktop: file picker opens (no `capture` support) — still functional

**Privacy verification:**
- Network tab: no image data persisted to localStorage/sessionStorage after scan
- Server logs: no base64 blobs in output
- Bundle check: `ANTHROPIC_API_KEY` never appears in client-side JS (grep `_next/static`)

**Accuracy gate:** ≥80% correct reads on a set of real gauge photos (well-lit, phone-distance shots) before enabling in production.

---

## Recommendation

**Ship Option 1 (Claude Vision + `<input capture>`).**

- Lowest complexity; one new vendor relationship
- Anthropic's API privacy commitments are explicit and well-documented
- `<input capture>` requires no permission-handling code; works on every mobile browser
- Rate limiting via Vercel KV protects against cost abuse
- **Gate behind legal review** — do not ship until privacy policy and ToS are updated and signed off

> ⚖️ **Action item:** Privacy policy §1, §2, §6 and the new camera section, plus the ToS additions, should be reviewed by legal counsel before this branch is merged. Key concern: EU/GDPR sub-processor implications if Anthropic processes images for EU-based users.
