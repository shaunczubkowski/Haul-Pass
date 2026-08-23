# Spike findings — #110 (AI foundation)

**Throwaway.** Deleted with the spike route before #110 merges; findings belong in the #110 thread.

## Vercel limits probe

| Limit | Value | Consequence |
|---|---|---|
| Request body | **4.5 MB**, plan-independent, both runtimes → `413 FUNCTION_PAYLOAD_TOO_LARGE` | Caps a base64 upload |
| Response body | 4.5 MB (streaming responses exempt) | Not a constraint — we return a few hundred bytes |
| Function duration (Fluid compute, default on) | 300s default; Pro max 800s | Not a constraint |
| Function duration (Fluid disabled) | Pro 15s default, 300s max | Still not a constraint |
| Edge runtime | Must *begin* responding within 25s | One reason the route is `runtime = "nodejs"` |

Sources: [limits](https://vercel.com/docs/functions/limitations), [duration](https://vercel.com/docs/functions/configuring-functions/duration).

Whether the 4.5 MB is measured before or after base64 expansion is **not stated in Vercel's docs**. Community reports of 413s on base64 image payloads indicate the encoded bytes count, so plan against a ~3.3 MB raw-binary ceiling. Not a documented guarantee.

## Claude image constraints

| Constraint | Value |
|---|---|
| Max image size | 10 MB **base64-encoded** (≈7.5 MB source) on the first-party API |
| Max request size | 32 MB |
| Absolute max dimensions | 8000×8000 px |
| Long-edge downscale threshold | **2576 px** on Claude 4.7+ (Opus 5); 1568 px on older models |
| Formats | JPEG, PNG, GIF, WebP |

Source: [vision docs](https://platform.claude.com/docs/en/build-with-claude/vision). Cost is `⌈w/28⌉ × ⌈h/28⌉` visual tokens.

## The number #18 and #112 need

**Resize client-side to 2576 px on the long edge before upload.**

The binding constraint is Claude's downscale threshold, not Vercel's body cap. Anything above 2576 px is downscaled server-side anyway, so larger uploads buy no accuracy — they only spend bandwidth and risk the 413.

A 12 MP phone photo (~4000×3000, 3–5 MB) is well over both. So **#18 does need client-side downscaling** — a UI change, as the plan anticipated. But resizing to 2576 px puts a JPEG comfortably under 1 MB, which makes the 4.5 MB Vercel cap a non-issue rather than something to engineer around. No Vercel Blob direct-upload needed.

For #112: bill per request against the visual-token cost above; a 2576×1932 image is ≈6,431 visual tokens.

## Not measured — blocked

Latency and token counts require a live call. No `ANTHROPIC_API_KEY` and no `ant` credential profile is reachable from the Claude Code session, so the spike could not be executed against the API. Everything else in the route was exercised (see below).

**The #18 progress-UI decision therefore remains open.** Run the spike once the key is set in Vercel dev scope:

```bash
IMG=$(base64 -w0 gauge.jpg)
curl -s -X POST http://localhost:3000/api/spike-gauge \
  -H 'content-type: application/json' \
  -d "{\"image\":\"$IMG\",\"mediaType\":\"image/jpeg\"}" | jq .metrics
```

## Verified without a key

| Case | Result |
|---|---|
| Keyless `POST` | `503` — matches the Mapbox routes, so keyless previews degrade rather than error |
| `GET` (no handler) | `405` |
| Non-JSON body | `400` |
| Missing `image` | `400` |
| Unsupported `mediaType` | `400` |
| Route registration | `ƒ /api/spike-gauge` in the build output |

## Routing gotcha

The plan specified `src/app/api/_spike-gauge/route.ts`. An underscore-prefixed App Router folder is a **private folder** and is excluded from routing entirely — that path would never have resolved. Renamed to `spike-gauge`.
