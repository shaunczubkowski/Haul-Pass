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

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = {
      create: vi.fn(async (params: Record<string, unknown>) => {
        createCalls.push(params);
        return {
          content: [],
          model: "claude-opus-5",
          stop_reason: "refusal",
          usage: { input_tokens: 1, output_tokens: 1 },
        };
      }),
    };

    constructor(options: Record<string, unknown>) {
      constructorOptions.push(options);
    }

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
