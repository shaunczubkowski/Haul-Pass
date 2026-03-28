import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
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

  it("theme_color matches brand accent", () => {
    expect(manifest.theme_color).toBe("#0284c7");
  });

  it("has a maskable icon entry for 192x192 pointing to the dedicated maskable file", () => {
    const icons = manifest.icons as Array<Record<string, string>>;
    const maskable192 = icons.find(
      (i) => i.purpose === "maskable" && i.sizes === "192x192"
    );
    expect(maskable192).toBeDefined();
    expect(maskable192?.src).toBe("/icon-192-maskable.png");
  });

  it("has a maskable icon entry for 512x512 pointing to the dedicated maskable file", () => {
    const icons = manifest.icons as Array<Record<string, string>>;
    const maskable512 = icons.find(
      (i) => i.purpose === "maskable" && i.sizes === "512x512"
    );
    expect(maskable512).toBeDefined();
    expect(maskable512?.src).toBe("/icon-512-maskable.png");
  });
});

describe("PWA icon assets", () => {
  const publicDir = join(process.cwd(), "public");

  it("icon.svg exists", () => {
    expect(existsSync(join(publicDir, "icon.svg"))).toBe(true);
  });

  it("icon-192.png exists", () => {
    expect(existsSync(join(publicDir, "icon-192.png"))).toBe(true);
  });

  it("icon-512.png exists", () => {
    expect(existsSync(join(publicDir, "icon-512.png"))).toBe(true);
  });

  it("icon-192-maskable.png exists", () => {
    expect(existsSync(join(publicDir, "icon-192-maskable.png"))).toBe(true);
  });

  it("icon-512-maskable.png exists", () => {
    expect(existsSync(join(publicDir, "icon-512-maskable.png"))).toBe(true);
  });

  it("apple-touch-icon.png exists", () => {
    expect(existsSync(join(publicDir, "apple-touch-icon.png"))).toBe(true);
  });

  it("icon.svg contains brand accent color", () => {
    const svg = readFileSync(join(publicDir, "icon.svg"), "utf-8");
    expect(svg).toContain("#0284c7");
  });

  it("icon.svg has accessibility attributes", () => {
    const svg = readFileSync(join(publicDir, "icon.svg"), "utf-8");
    expect(svg).toContain('role="img"');
    expect(svg).toContain("<title>");
  });

  it("icon-192.png has correct dimensions and is not a blank placeholder", () => {
    const buf = readFileSync(join(publicDir, "icon-192.png"));
    // PNG IHDR: bytes 16–23 contain width/height
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    expect(width).toBe(192);
    expect(height).toBe(192);
    // A fully-blank (solid white) 192×192 PNG compresses to ~200 bytes.
    // Our branded icon with multiple colour regions is larger.
    expect(buf.length).toBeGreaterThan(400);
  });

  it("icon-512.png has correct dimensions", () => {
    const buf = readFileSync(join(publicDir, "icon-512.png"));
    expect(buf.readUInt32BE(16)).toBe(512);
    expect(buf.readUInt32BE(20)).toBe(512);
  });

  it("icon-192-maskable.png has correct dimensions", () => {
    const buf = readFileSync(join(publicDir, "icon-192-maskable.png"));
    expect(buf.readUInt32BE(16)).toBe(192);
    expect(buf.readUInt32BE(20)).toBe(192);
  });
});
