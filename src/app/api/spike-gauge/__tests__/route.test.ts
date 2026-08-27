// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * The spike route is a live inference endpoint billed to the project key, so
 * the shared-secret gate must fail closed: no token configured, no token sent,
 * or a wrong token all look identical from the outside.
 */

const ORIGINAL_ENV = { ...process.env };

function post(
  headers: Record<string, string> = {},
  body: unknown = { image: "aGVsbG8=", mediaType: "image/jpeg" }
) {
  return new NextRequest("http://localhost/api/spike-gauge", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const AUTHED = { "x-spike-token": "correct-horse" };

async function loadAuthedRoute() {
  process.env.SPIKE_GAUGE_TOKEN = "correct-horse";
  process.env.ANTHROPIC_API_KEY = "sk-test";
  return loadRoute();
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

/**
 * A data URL is what FileReader.readAsDataURL produces, so #18's camera flow
 * will hand one over. Left unhandled the prefix reaches the API as image data
 * and comes back as an opaque 502, hiding a client-side mistake behind a
 * server-fault status.
 */
describe("spike-gauge image normalisation", () => {
  it("400s when the data URL media type contradicts the declared one", async () => {
    const { POST } = await loadAuthedRoute();

    const response = await POST(
      post(AUTHED, {
        image: "data:image/png;base64,aGVsbG8=",
        mediaType: "image/jpeg",
      })
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/mediaType/i);
  });

  it("400s on a non-base64 data URL", async () => {
    const { POST } = await loadAuthedRoute();

    const response = await POST(
      post(AUTHED, { image: "data:image/jpeg,notbase64", mediaType: "image/jpeg" })
    );

    expect(response.status).toBe(400);
  });

  it("400s on a payload that is not valid base64", async () => {
    const { POST } = await loadAuthedRoute();

    const response = await POST(
      post(AUTHED, { image: "not base64 at all!!", mediaType: "image/jpeg" })
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/base64/i);
  });

  it("400s on base64 of the wrong length rather than forwarding it", async () => {
    const { POST } = await loadAuthedRoute();

    const response = await POST(
      post(AUTHED, { image: "aGVsbG8", mediaType: "image/jpeg" })
    );

    expect(response.status).toBe(400);
  });
});

describe("spike-gauge payload cap", () => {
  it("413s an oversized image instead of forwarding it to the model", async () => {
    const { POST } = await loadAuthedRoute();

    // Valid base64, far past anything a 2576px JPEG produces.
    const oversized = "A".repeat(8_000_000);
    const response = await POST(post(AUTHED, { image: oversized, mediaType: "image/jpeg" }));

    expect(response.status).toBe(413);
  });
});
