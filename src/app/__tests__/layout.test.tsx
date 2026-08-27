import { describe, it, expect, vi } from "vitest";
import { metadata, viewport } from "@/app/layout";

describe("layout metadata", () => {
  it("exports a metadata object", () => {
    expect(metadata).toBeDefined();
    expect(typeof metadata).toBe("object");
  });

  it("has a title with default and template", () => {
    expect(metadata.title).toBeDefined();
    const title = metadata.title as { default: string; template: string };
    expect(title.default).toContain("FillRight");
    expect(title.default).toContain("Moving Truck");
    expect(title.template).toBe("%s | FillRight");
  });

  it("has a description that mentions the fuel surcharge", () => {
    expect(metadata.description).toBeDefined();
    expect(typeof metadata.description).toBe("string");
    expect(metadata.description).toContain("$30");
  });

  it("has keywords array including all four rental companies", () => {
    expect(Array.isArray(metadata.keywords)).toBe(true);
    const keywords = metadata.keywords as string[];
    expect(keywords.some((k) => k.toLowerCase().includes("u-haul"))).toBe(true);
    expect(keywords.some((k) => k.toLowerCase().includes("penske"))).toBe(true);
    expect(keywords.some((k) => k.toLowerCase().includes("budget"))).toBe(true);
    expect(keywords.some((k) => k.toLowerCase().includes("enterprise"))).toBe(true);
    expect(keywords.some((k) => k.toLowerCase().includes("fuel") || k.toLowerCase().includes("gas"))).toBe(true);
  });

  it("has OpenGraph metadata with image", () => {
    expect(metadata.openGraph).toBeDefined();
    const og = metadata.openGraph as {
      title?: string;
      description?: string;
      images?: Array<{ url: string; width?: number; height?: number; alt?: string }>;
      url?: string;
      type?: string;
    };
    expect(og.title).toBeTruthy();
    expect(og.description).toBeTruthy();
    expect(og.url).toBeTruthy();
    expect(og.images).toBeDefined();
    expect(Array.isArray(og.images)).toBe(true);
    expect((og.images as Array<{ url: string }>).length).toBeGreaterThan(0);
    const image = (og.images as Array<{ url: string; width?: number; height?: number; alt?: string }>)[0];
    expect(image.url).toBeTruthy();
    expect(image.width).toBe(1200);
    expect(image.height).toBe(630);
  });

  it("has Twitter card metadata with image", () => {
    expect(metadata.twitter).toBeDefined();
    const twitter = metadata.twitter as {
      card?: string;
      title?: string;
      description?: string;
      images?: string[];
    };
    expect(twitter.card).toBe("summary_large_image");
    expect(twitter.title).toBeTruthy();
    expect(twitter.description).toBeTruthy();
    expect(twitter.images).toBeDefined();
    expect(Array.isArray(twitter.images)).toBe(true);
    expect((twitter.images as string[]).length).toBeGreaterThan(0);
  });

  it("has canonical URL set", () => {
    expect(metadata.alternates).toBeDefined();
    const alternates = metadata.alternates as { canonical?: string };
    expect(alternates.canonical).toBeTruthy();
    expect(alternates.canonical).toContain("https://");
  });

  it("has robots configured to allow all", () => {
    expect(metadata.robots).toBeDefined();
    const robots = metadata.robots as { index?: boolean; follow?: boolean };
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(true);
  });
});

describe("JSON-LD structured data", () => {
  it("layout exports a JsonLd component or the layout renders JSON-LD script", async () => {
    // We'll verify by importing the JsonLd component from layout
    const layoutModule = await import("@/app/layout");
    // The layout should export a JsonLd component or the RootLayout should include structured data
    // We check that the module has the necessary exports
    expect(layoutModule.metadata).toBeDefined();
    // The JSON-LD should be part of the layout — we test it exists via a named export or via rendering
    expect(layoutModule.JsonLd || layoutModule.default).toBeDefined();
  });

  it("JsonLd component is exported from layout", async () => {
    const layoutModule = await import("@/app/layout");
    expect(layoutModule.JsonLd).toBeDefined();
    expect(typeof layoutModule.JsonLd).toBe("function");
  });

  it("JSON-LD structured data has WebApplication type", async () => {
    const { jsonLdData } = await import("@/app/layout");
    expect(jsonLdData).toBeDefined();
    expect(jsonLdData["@context"]).toBe("https://schema.org");
    expect(jsonLdData["@type"]).toBe("WebApplication");
  });

  it("JSON-LD structured data has required WebApplication fields", async () => {
    const { jsonLdData } = await import("@/app/layout");
    expect(jsonLdData.name).toBeTruthy();
    expect(jsonLdData.description).toBeTruthy();
    expect(jsonLdData.url).toBeTruthy();
    expect(jsonLdData.applicationCategory).toBeTruthy();
  });
});

describe("FAQPage JSON-LD structured data", () => {
  it("exports jsonLdFaqData with FAQPage type", async () => {
    const { jsonLdFaqData } = await import("@/app/layout");
    expect(jsonLdFaqData).toBeDefined();
    expect(jsonLdFaqData["@context"]).toBe("https://schema.org");
    expect(jsonLdFaqData["@type"]).toBe("FAQPage");
  });

  it("FAQPage has at least 5 questions covering key topics", async () => {
    const { jsonLdFaqData } = await import("@/app/layout");
    expect(Array.isArray(jsonLdFaqData.mainEntity)).toBe(true);
    expect(jsonLdFaqData.mainEntity.length).toBeGreaterThanOrEqual(5);
    const allText = jsonLdFaqData.mainEntity
      .map((q) => q.name + q.acceptedAnswer.text)
      .join(" ")
      .toLowerCase();
    expect(allText).toContain("$30");
    expect(allText).toContain("penske");
    expect(allText).toContain("diesel");
  });

  it("exports JsonLdFaq component", async () => {
    const { JsonLdFaq } = await import("@/app/layout");
    expect(JsonLdFaq).toBeDefined();
    expect(typeof JsonLdFaq).toBe("function");
  });
});

describe("HowTo JSON-LD structured data", () => {
  it("exports jsonLdHowToData with HowTo type", async () => {
    const { jsonLdHowToData } = await import("@/app/layout");
    expect(jsonLdHowToData).toBeDefined();
    expect(jsonLdHowToData["@context"]).toBe("https://schema.org");
    expect(jsonLdHowToData["@type"]).toBe("HowTo");
  });

  it("HowTo has at least 3 steps", async () => {
    const { jsonLdHowToData } = await import("@/app/layout");
    expect(Array.isArray(jsonLdHowToData.step)).toBe(true);
    expect(jsonLdHowToData.step.length).toBeGreaterThanOrEqual(3);
    jsonLdHowToData.step.forEach((s) => {
      expect(s["@type"]).toBe("HowToStep");
      expect(s.name).toBeTruthy();
      expect(s.text).toBeTruthy();
    });
  });

  it("exports JsonLdHowTo component", async () => {
    const { JsonLdHowTo } = await import("@/app/layout");
    expect(JsonLdHowTo).toBeDefined();
    expect(typeof JsonLdHowTo).toBe("function");
  });
});

describe("sitemap and robots", () => {
  it("sitemap module exports a default function", async () => {
    const sitemapModule = await import("@/app/sitemap");
    expect(typeof sitemapModule.default).toBe("function");
  });

  it("sitemap returns array with homepage entry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10"));
    const sitemapModule = await import("@/app/sitemap");
    const sitemap = await sitemapModule.default();
    expect(Array.isArray(sitemap)).toBe(true);
    expect(sitemap.length).toBeGreaterThan(0);
    expect(sitemap[0].url).toContain("https://");
    expect(sitemap[0].lastModified).toBeDefined();
    expect(sitemap[0].changeFrequency).toBeDefined();
    expect(sitemap[0].priority).toBeDefined();
    vi.useRealTimers();
  });

  it("robots module exports a default function", async () => {
    const robotsModule = await import("@/app/robots");
    expect(typeof robotsModule.default).toBe("function");
  });

  it("robots allows all crawlers", async () => {
    const robotsModule = await import("@/app/robots");
    const robotsConfig = robotsModule.default();
    expect(robotsConfig.rules).toBeDefined();
    const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules];
    const allowAll = rules.some(
      (r: { userAgent?: string | string[]; allow?: string | string[] }) =>
        (r.userAgent === "*" || r.userAgent === "all") &&
        (r.allow === "/" || (Array.isArray(r.allow) && r.allow.includes("/")))
    );
    expect(allowAll).toBe(true);
  });

  it("robots has sitemap URL", async () => {
    const robotsModule = await import("@/app/robots");
    const robotsConfig = robotsModule.default();
    expect(robotsConfig.sitemap).toBeTruthy();
  });
});

describe("layout viewport", () => {
  it("exports themeColor on the viewport export, not metadata", () => {
    // Next.js rejects themeColor in the metadata export; it belongs on viewport.
    // #0284c7 must stay in sync with manifest.json theme_color and --accent.
    expect(viewport.themeColor).toBe("#0284c7");
    expect(metadata).not.toHaveProperty("themeColor");
  });
});
