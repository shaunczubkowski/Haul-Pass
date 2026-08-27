// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * The spike route is a live inference endpoint billed to the project key, so
 * the shared-secret gate must fail closed: no token configured, no token sent,
 * or a wrong token all look identical from the outside.
 */

const ORIGINAL_ENV = { ...process.env };

function post(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/spike-gauge", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ image: "aGVsbG8=", mediaType: "image/jpeg" }),
  });
}

async function loadRoute() {
  vi.resetModules();
  return import("../route");
}

beforeEach(() => {
  delete process.env.SPIKE_GAUGE_TOKEN;
  delete process.env.ANTHROPIC_API_KEY;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("spike-gauge shared-secret gate", () => {
  it("404s when no token is configured, even with a key present", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const { POST } = await loadRoute();

    const response = await POST(post({ "x-spike-token": "anything" }));

    expect(response.status).toBe(404);
  });

  it("404s when the request sends no token", async () => {
    process.env.SPIKE_GAUGE_TOKEN = "correct-horse";
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const { POST } = await loadRoute();

    const response = await POST(post());

    expect(response.status).toBe(404);
  });

  it("404s on a wrong token", async () => {
    process.env.SPIKE_GAUGE_TOKEN = "correct-horse";
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const { POST } = await loadRoute();

    const response = await POST(post({ "x-spike-token": "battery-staple" }));

    expect(response.status).toBe(404);
  });

  it("404s on a token of the wrong length rather than throwing", async () => {
    process.env.SPIKE_GAUGE_TOKEN = "correct-horse";
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const { POST } = await loadRoute();

    const response = await POST(post({ "x-spike-token": "short" }));

    expect(response.status).toBe(404);
  });

  it("passes a correct token through to the existing key check", async () => {
    process.env.SPIKE_GAUGE_TOKEN = "correct-horse";
    const { POST } = await loadRoute();

    const response = await POST(post({ "x-spike-token": "correct-horse" }));

    expect(response.status).toBe(503);
  });
});
