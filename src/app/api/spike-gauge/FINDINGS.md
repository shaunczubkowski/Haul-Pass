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

**The #18 progress-UI decision therefore remains open.** Run the spike once the key is set in Vercel dev scope. `metrics` is returned on every path, errors included, and carries `latencyMs` (model call), `totalMs` (upload + model), and `thinkingTokens` (the reasoning share of `outputTokens`):

```bash
IMG=$(base64 -w0 gauge.jpg)
curl -s -X POST http://localhost:3000/api/spike-gauge \
  -H 'content-type: application/json' \
  -H "x-spike-token: $SPIKE_GAUGE_TOKEN" \
  -d "{\"image\":\"$IMG\",\"mediaType\":\"image/jpeg\"}" | jq .metrics
```

## Verified without a key

| Case | Result |
|---|---|
| `POST` with no `SPIKE_GAUGE_TOKEN` configured | `404` — the gate fails closed |
| `POST` with a missing or wrong `x-spike-token` | `404` — same shape as unconfigured |
| Oversized `image` | `413` |
| Keyless `POST` (gate passed) | `503` — matches the Mapbox routes, so keyless previews degrade rather than error |
| `GET` (no handler) | `405` |
| Non-JSON body | `400` |
| Missing `image` | `400` |
| Unsupported `mediaType` | `400` |
| Route registration | `ƒ /api/spike-gauge` in the build output |

## Routing gotcha

The plan specified `src/app/api/_spike-gauge/route.ts`. An underscore-prefixed App Router folder is a **private folder** and is excluded from routing entirely — that path would never have resolved. Renamed to `spike-gauge`.

## Access gate

Every request here is a billed Opus 5 vision call, so the route requires a
shared secret in `x-spike-token` matching `SPIKE_GAUGE_TOKEN`. Both the
unconfigured and the wrong-token case return `404`. Comparison is over SHA-256
digests via `timingSafeEqual` — equal-length inputs, no length leak.

**The 404 does not hide the endpoint.** `GET /api/spike-gauge` returns `405`,
which Next only produces for a route that *exists*, and the gate's JSON body
differs from Next's HTML 404 page. Both are oracles: an unauthenticated caller
can confirm the route is real in one request. The 404 is a terse refusal, not
concealment — an earlier version of this document claimed otherwise.

The secret is therefore the whole defence, and there is **no rate limit** behind
it. Generate it with real entropy, never by hand:

```bash
openssl rand -hex 32
```

Set `SPIKE_GAUGE_TOKEN` in the same Vercel scopes as `ANTHROPIC_API_KEY`
(development + production). Without it the route is unreachable everywhere,
which is the intended resting state for a throwaway spike.

Second cost control: `image` is capped at 4,000,000 base64 characters (`413`).
A 2576px JPEG encodes to well under that, and the cap sits below Vercel's
4.5 MB body limit so it is reachable rather than shadowed by a platform 413.
