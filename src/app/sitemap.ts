import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://getfillright.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date("2026-03-11"),
      changeFrequency: "weekly",
      priority: 1,
    },
    // /terms and /privacy are intentionally excluded — both pages carry noindex
    // and should not be advertised to crawlers via the sitemap.
  ];
}
