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
// unmetered inference endpoint to anyone who guesses the path.
const SPIKE_GAUGE_TOKEN = process.env.SPIKE_GAUGE_TOKEN;

const SPIKE_TOKEN_HEADER = "x-spike-token";

// Node runtime: the SDK is not Edge-safe and #18 will need Buffer for image
// handling. Confirming this choice is part of the spike.
export const runtime = "nodejs";

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

  const client = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
    timeout: MODEL_TIMEOUT_MS,
  });

  const startedAt = Date.now();

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
                data: image,
              },
            },
            { type: "text", text: "What level is this fuel gauge reading?" },
          ],
        },
      ],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Rate limited, retry later" }, { status: 429 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Gauge reading service misconfigured" }, { status: 503 });
    }
    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return NextResponse.json({ error: "Gauge reading timed out" }, { status: 504 });
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: "Gauge reading service error" }, { status: 502 });
    }
    throw error;
  }

  const latencyMs = Date.now() - startedAt;

  if (response.stop_reason === "refusal") {
    return NextResponse.json({ error: "Request was declined" }, { status: 422 });
  }

  // Truncated output is not malformed JSON from the model — surface it as its
  // own case so the spike does not chase a parse failure that is really a cap.
  if (response.stop_reason === "max_tokens") {
    return NextResponse.json(
      { error: "Reading was truncated by the token limit" },
      { status: 502 }
    );
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No reading returned" }, { status: 502 });
  }

  let reading: GaugeReading;
  try {
    reading = JSON.parse(textBlock.text) as GaugeReading;
  } catch {
    return NextResponse.json({ error: "Reading was not valid JSON" }, { status: 502 });
  }

  // The schema constrains this, but #18 consumes the value directly — assert it
  // here so a schema regression surfaces in the spike rather than downstream.
  if (!GAUGE_LEVEL_VALUES.includes(reading.level as (typeof GAUGE_LEVEL_VALUES)[number])) {
    return NextResponse.json(
      { error: `Reading '${reading.level}' is not a standard gauge level` },
      { status: 502 }
    );
  }

  return NextResponse.json({
    reading,
    // Recorded for #110: latency drives the #18 progress-UI decision, tokens
    // drive the #112 rate-limit budget.
    metrics: {
      latencyMs,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      stopReason: response.stop_reason,
    },
  });
}
