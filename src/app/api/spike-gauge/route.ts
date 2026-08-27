import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GAUGE_LEVELS } from "@/types";

/**
 * THROWAWAY SPIKE — delete before merging (see issue #110).
 *
 * A thin vertical slice of the #18 gauge camera: accept a photo of a fuel
 * gauge, ask Claude for the nearest standard gauge level, and report latency
 * and token counts so #18 can decide whether it needs a progress UI and #112
 * can size rate limits.
 *
 * Mirrors src/app/api/autocomplete/route.ts: the secret is read server-side
 * only, errors are typed NextResponse.json payloads, and an unconfigured
 * environment returns 503 rather than failing at request time. Preview
 * deployments are keyless by design, so they return 503 here.
 */

// Server-side only; never sent to the client.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Shared secret guarding the route. Every request to this endpoint is a billed
// Opus 5 vision call, so the gate fails closed: with no token configured the
// route is unreachable, which keeps a keyed production deploy from exposing an
// unmetered inference endpoint.
//
// The 404 is not concealment — GET returns Next's own 405 for a route that
// exists, so the endpoint is discoverable whatever this returns. It is only a
// terse refusal. The secret must therefore carry real entropy
// (openssl rand -hex 32); there is no rate limit behind it.
const SPIKE_GAUGE_TOKEN = process.env.SPIKE_GAUGE_TOKEN;

const SPIKE_TOKEN_HEADER = "x-spike-token";

// Node runtime: the SDK is not Edge-safe and #18 will need Buffer for image
// handling. Confirming this choice is part of the spike.
export const runtime = "nodejs";

// Make the intent explicit rather than inheriting it: the SDK timeout below is
// 30s, which is only reachable under Fluid compute (300s default). Without
// this, a project with Fluid off preempts at 10-15s and the 504 branch becomes
// dead code, replaced by Vercel's own timeout page.
export const maxDuration = 35;

// Vision + adaptive thinking is far slower than the 5s Mapbox budget. This
// ceiling is deliberately generous — measuring the real number is the point.
const MODEL_TIMEOUT_MS = 30_000;

const ACCEPTED_MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
type AcceptedMediaType = (typeof ACCEPTED_MEDIA_TYPES)[number];

// The nine levels a U-Haul gauge is actually read against, sourced from the
// same constant the FuelGauge component renders, so the model can never return
// a value the calculator cannot consume.
const GAUGE_LEVEL_VALUES = Object.values(GAUGE_LEVELS);

const GAUGE_READING_SCHEMA = {
  type: "object",
  properties: {
    level: {
      type: "number",
      enum: GAUGE_LEVEL_VALUES,
      description: "Nearest standard gauge level as a fraction of a full tank.",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Confidence in the reading, 0 to 1.",
    },
    reasoning: {
      type: "string",
      description: "One short sentence explaining what the needle position showed.",
    },
  },
  required: ["level", "confidence", "reasoning"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT =
  "You read fuel gauges from photographs of rental truck dashboards. " +
  "Report the standard gauge level nearest to the needle. If the needle sits " +
  "between two marks, choose the closer one and say so in your reasoning. " +
  "If the gauge is unreadable, return your best guess with a low confidence.";

interface GaugeReading {
  level: number;
  confidence: number;
  reasoning: string;
}

// FileReader.readAsDataURL — what #18's camera flow will use — yields a
// "data:<media>;base64,<payload>" string. Forwarding the whole thing as image
// data earns an opaque 502 from the API, so unwrap it here and check that its
// media type agrees with the declared one rather than silently trusting either.
const DATA_URL = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.*)$/i;

// Canonical base64: full quartets, at most two padding chars.
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

// The only cost control in the route. A 2576px JPEG — the size FINDINGS.md
// lands on — encodes to well under 2 MB, so this rejects junk payloads well
// before they become a billed vision call, and sits under Vercel's 4.5 MB
// body cap so the check is reachable rather than shadowed by a platform 413.
const MAX_IMAGE_BASE64_CHARS = 4_000_000;

type Normalised = { data: string } | { error: string; status: 400 | 413 };

function normaliseImage(image: string, mediaType: AcceptedMediaType): Normalised {
  let data = image;

  if (image.startsWith("data:")) {
    const match = DATA_URL.exec(image);
    if (!match) {
      return {
        error: "Field 'image' is a data URL but not base64-encoded",
        status: 400,
      };
    }
    if (match[1].toLowerCase() !== mediaType) {
      return {
        error: `Data URL media type '${match[1]}' contradicts mediaType '${mediaType}'`,
        status: 400,
      };
    }
    data = match[2];
  }

  if (data.length > MAX_IMAGE_BASE64_CHARS) {
    return {
      error: "Field 'image' is too large — resize to 2576px on the long edge",
      status: 413,
    };
  }

  if (data.length === 0 || data.length % 4 !== 0 || !BASE64.test(data)) {
    return { error: "Field 'image' is not valid base64", status: 400 };
  }

  return { data };
}

// Compare SHA-256 digests so the inputs are always the same length —
// timingSafeEqual throws on a length mismatch, and raw lengths would leak the
// size of the secret.
function tokenMatches(provided: string, expected: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(provided).digest(),
    createHash("sha256").update(expected).digest()
  );
}

export async function POST(request: NextRequest) {
  // Stamped before the body is buffered: for #18 the decision-relevant span is
  // upload plus inference, and a multi-megabyte photo over LTE hides several
  // seconds that a model-only timer never sees.
  const receivedAt = Date.now();

  // 404 rather than 401 for both the unconfigured and the wrong-token case: an
  // unauthenticated caller learns nothing about the endpoint or its key.
  const providedToken = request.headers.get(SPIKE_TOKEN_HEADER);
  if (!SPIKE_GAUGE_TOKEN || !providedToken || !tokenMatches(providedToken, SPIKE_GAUGE_TOKEN)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Gauge reading service not configured" },
      { status: 503 }
    );
  }

  let body: { image?: unknown; mediaType?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const { image, mediaType } = body;

  if (typeof image !== "string" || image.length === 0) {
    return NextResponse.json(
      { error: "Field 'image' must be a base64-encoded image" },
      { status: 400 }
    );
  }

  if (
    typeof mediaType !== "string" ||
    !ACCEPTED_MEDIA_TYPES.includes(mediaType as AcceptedMediaType)
  ) {
    return NextResponse.json(
      { error: `Field 'mediaType' must be one of ${ACCEPTED_MEDIA_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const normalised = normaliseImage(image, mediaType as AcceptedMediaType);
  if ("error" in normalised) {
    return NextResponse.json(
      { error: normalised.error },
      { status: normalised.status }
    );
  }

  const client = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
    timeout: MODEL_TIMEOUT_MS,
    // No retries: the SDK's default of 2 is transparent, so a retried call
    // would report the wall clock of three attempts as a single latencyMs and
    // quietly inflate the number #18 is waiting on. A failed spike run is
    // re-run by hand.
    maxRetries: 0,
  });

  const startedAt = Date.now();

  // Every path past this point reports timings, error paths included: a 504 is
  // exactly the "a real read exceeded 30s" data point #18 needs, and it is
  // worthless without the number attached.
  const metrics = () => ({
    latencyMs: Date.now() - startedAt,
    totalMs: Date.now() - receivedAt,
  });

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: "claude-opus-5",
      // Adaptive thinking is on by default on Opus 5 and its tokens are drawn
      // from this same budget (usage.output_tokens_details.thinking_tokens), so
      // a cap sized for the JSON payload alone truncates a long-reasoning turn.
      // 16000 is the non-streaming default and stays well inside the timeout.
      max_tokens: 16_000,
      system: SYSTEM_PROMPT,
      // Effort low rather than thinking disabled: on Opus 5 a disabled-thinking
      // route can leak reasoning into the visible answer.
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: GAUGE_READING_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as AcceptedMediaType,
                data: normalised.data,
              },
            },
            { type: "text", text: "What level is this fuel gauge reading?" },
          ],
        },
      ],
    });
  } catch (error) {
    // Above the generic APIError branch: an upstream 400 is the caller's
    // payload (over 8000px, or base64 that decodes to something that is not an
    // image), not a server fault, and reporting it as 502 sends the spike
    // chasing a phantom outage.
    if (error instanceof Anthropic.BadRequestError) {
      return NextResponse.json(
        { error: "Image was rejected by the model API", metrics: metrics() },
        { status: 400 }
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited, retry later", metrics: metrics() },
        { status: 429 }
      );
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Gauge reading service misconfigured", metrics: metrics() },
        { status: 503 }
      );
    }
    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return NextResponse.json(
        { error: "Gauge reading timed out", metrics: metrics() },
        { status: 504 }
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: "Gauge reading service error", metrics: metrics() },
        { status: 502 }
      );
    }
    throw error;
  }

  if (response.stop_reason === "refusal") {
    return NextResponse.json(
      { error: "Request was declined", metrics: metrics() },
      { status: 422 }
    );
  }

  // Truncated output is not malformed JSON from the model — surface it as its
  // own case so the spike does not chase a parse failure that is really a cap.
  if (response.stop_reason === "max_tokens") {
    return NextResponse.json(
      { error: "Reading was truncated by the token limit", metrics: metrics() },
      { status: 502 }
    );
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json(
      { error: "No reading returned", metrics: metrics() },
      { status: 502 }
    );
  }

  let reading: GaugeReading;
  try {
    reading = JSON.parse(textBlock.text) as GaugeReading;
  } catch {
    return NextResponse.json(
      { error: "Reading was not valid JSON", metrics: metrics() },
      { status: 502 }
    );
  }

  // The schema constrains this, but #18 consumes the value directly — assert it
  // here so a schema regression surfaces in the spike rather than downstream.
  if (!GAUGE_LEVEL_VALUES.includes(reading.level as (typeof GAUGE_LEVEL_VALUES)[number])) {
    return NextResponse.json(
      {
        error: `Reading '${reading.level}' is not a standard gauge level`,
        metrics: metrics(),
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    reading,
    // Recorded for #110: latency drives the #18 progress-UI decision, tokens
    // drive the #112 rate-limit budget.
    metrics: {
      ...metrics(),
      model: response.model,
      inputTokens: response.usage.input_tokens,
      // output_tokens includes reasoning, so without the split two runs
      // reporting the same total are indistinguishable between mostly-thinking
      // and mostly-answer — #112 cannot size a limit on that, and #18 cannot
      // correlate latency with reasoning depth.
      outputTokens: response.usage.output_tokens,
      thinkingTokens: response.usage.output_tokens_details?.thinking_tokens ?? null,
      stopReason: response.stop_reason,
    },
  });
}
