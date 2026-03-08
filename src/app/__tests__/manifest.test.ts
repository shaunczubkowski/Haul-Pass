import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("public/manifest.json", () => {
  const manifestPath = join(process.cwd(), "public", "manifest.json");
  let manifest: Record<string, unknown>;

  try {
    const raw = readFileSync(manifestPath, "utf-8");
    manifest = JSON.parse(raw);
  } catch {
    manifest = {};
  }

  it("exists and is valid JSON", () => {
    const raw = readFileSync(manifestPath, "utf-8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("has required name field", () => {
    expect(manifest.name).toBeDefined();
    expect(typeof manifest.name).toBe("string");
  });

  it("has required start_url field", () => {
    expect(manifest.start_url).toBeDefined();
    expect(manifest.start_url).toBe("/");
  });

  it("has required display field", () => {
    expect(manifest.display).toBeDefined();
    expect(manifest.display).toBe("standalone");
  });

  it("has required icons field with at least one entry", () => {
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect((manifest.icons as unknown[]).length).toBeGreaterThan(0);
  });

  it("has correct app name", () => {
    expect(manifest.name).toBe("FillRight");
  });
});
