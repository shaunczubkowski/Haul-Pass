// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * The spike exists to produce a latency number. The SDK retries twice by
 * default and transparently, so a retried call would report the wall clock of
 * three attempts as if it were one — the measurement has to be single-attempt.
 */

const constructorOptions: Array<Record<string, unknown>> = [];
const createCalls: Array<Record<string, unknown>> = [];

const REFUSAL = {
  content: [],
  model: "claude-opus-5",
  stop_reason: "refusal",
  usage: { input_tokens: 1, output_tokens: 1 },
};

function reading(overrides: Record<string, unknown> = {}) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          level: 0.75,
          confidence: 0.9,
          reasoning: "Needle sits on the 3/4 mark.",
        }),
      },
    ],
    model: "claude-opus-5",
    stop_reason: "end_turn",
    usage: {
      input_tokens: 6431,
      output_tokens: 900,
      output_tokens_details: { thinking_tokens: 850 },
    },
    ...overrides,
  };
}

let nextResponse: unknown = REFUSAL;
let nextError: Error | null = null;

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = {
      create: vi.fn(async (params: Record<string, unknown>) => {
        createCalls.push(params);
        if (nextError) throw nextError;
        return nextResponse;
      }),
    };

    constructor(options: Record<string, unknown>) {
      constructorOptions.push(options);
    }

    static BadRequestError = class extends Error {};
    static RateLimitError = class extends Error {};
    static AuthenticationError = class extends Error {};
    static APIConnectionTimeoutError = class extends Error {};
    static APIError = class extends Error {};
  }

  return { default: MockAnthropic };
});

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  constructorOptions.length = 0;
  createCalls.length = 0;
  nextResponse = REFUSAL;
  nextError = null;
  process.env.SPIKE_GAUGE_TOKEN = "correct-horse";
  process.env.ANTHROPIC_API_KEY = "sk-test";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function post(body: unknown) {
  return new NextRequest("http://localhost/api/spike-gauge", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-spike-token": "correct-horse",
    },
    body: JSON.stringify(body),
  });
}

async function loadRoute() {
  vi.resetModules();
  return import("../route");
}

describe("spike-gauge client configuration", () => {
  it("disables SDK retries so latencyMs covers exactly one attempt", async () => {
    const { POST } = await loadRoute();

    await POST(post({ image: "aGVsbG8=", mediaType: "image/jpeg" }));

    expect(constructorOptions).toHaveLength(1);
    expect(constructorOptions[0].maxRetries).toBe(0);
  });

  it("forwards a data URL's payload with the prefix stripped", async () => {
    const { POST } = await loadRoute();

    await POST(
      post({
        image: "data:image/jpeg;base64,aGVsbG8=",
        mediaType: "image/jpeg",
      })
    );

    expect(createCalls).toHaveLength(1);
    const messages = createCalls[0].messages as Array<{
      content: Array<{ source?: Record<string, unknown> }>;
    }>;
    expect(messages[0].content[0].source).toMatchObject({
      type: "base64",
      media_type: "image/jpeg",
      data: "aGVsbG8=",
    });
  });
});

/**
 * The metrics block is the only artefact this spike exists to produce, so it
 * needs a test that actually reaches it — a mock that always refuses exits at
 * the 422 branch and never executes the code under discussion.
 */
describe("spike-gauge metrics", () => {
  it("reports both spans and the thinking-token split on success", async () => {
    nextResponse = reading();
    const { POST } = await loadRoute();

    const response = await POST(post({ image: "aGVsbG8=", mediaType: "image/jpeg" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.reading.level).toBe(0.75);
    expect(payload.metrics).toMatchObject({
      model: "claude-opus-5",
      inputTokens: 6431,
      outputTokens: 900,
      thinkingTokens: 850,
      stopReason: "end_turn",
    });
    expect(typeof payload.metrics.latencyMs).toBe("number");
    expect(typeof payload.metrics.totalMs).toBe("number");
    // totalMs spans the buffered upload as well, so it can never be the shorter.
    expect(payload.metrics.totalMs).toBeGreaterThanOrEqual(payload.metrics.latencyMs);
  });

  it("reports null thinking tokens when the API omits the detail", async () => {
    nextResponse = reading({
      usage: { input_tokens: 10, output_tokens: 20 },
    });
    const { POST } = await loadRoute();

    const response = await POST(post({ image: "aGVsbG8=", mediaType: "image/jpeg" }));

    expect((await response.json()).metrics.thinkingTokens).toBeNull();
  });

  it("still reports timings when the call fails", async () => {
    const { POST } = await loadRoute();

    // Default mock refuses — the 422 path.
    const response = await POST(post({ image: "aGVsbG8=", mediaType: "image/jpeg" }));
    const payload = await response.json();

    expect(response.status).toBe(422);
    expect(typeof payload.metrics.latencyMs).toBe("number");
    expect(typeof payload.metrics.totalMs).toBe("number");
  });

  it("reports timings on a truncated reading", async () => {
    nextResponse = reading({ stop_reason: "max_tokens" });
    const { POST } = await loadRoute();

    const response = await POST(post({ image: "aGVsbG8=", mediaType: "image/jpeg" }));
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(typeof payload.metrics.latencyMs).toBe("number");
  });
});

describe("spike-gauge payload cap", () => {
  it("forwards a payload just under the cap to the model", async () => {
    nextResponse = reading();
    const { POST } = await loadRoute();

    const response = await POST(
      post({ image: "A".repeat(1_000_000), mediaType: "image/jpeg" })
    );

    expect(response.status).toBe(200);
    expect(createCalls).toHaveLength(1);
  });
});

describe("spike-gauge upstream error mapping", () => {
  it("maps an upstream 400 to a 400, not a generic 502", async () => {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    nextError = new (Anthropic as unknown as {
      BadRequestError: new (m: string) => Error;
    }).BadRequestError("image dimensions exceed 8000px");
    const { POST } = await loadRoute();

    const response = await POST(post({ image: "aGVsbG8=", mediaType: "image/jpeg" }));

    expect(response.status).toBe(400);
  });
});
