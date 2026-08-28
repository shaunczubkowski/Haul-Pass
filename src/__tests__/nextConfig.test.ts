import { describe, it, expect } from "vitest";
import nextConfig from "../../next.config";

/**
 * The route planner page was removed (#120). It shipped in the sitemap at
 * priority 0.8 and was linked from the footer sitewide, so the URL is indexed
 * and bookmarked — it needs a redirect rather than a hard 404.
 *
 * The redirect is temporary (307) on purpose: the feature is archived at the
 * route-planner-v1 tag and could return at this URL, and a permanent 308 is
 * cached indefinitely by browsers.
 */
describe("next.config redirects", () => {
  it("redirects the retired /route-planner to the calculator, temporarily", async () => {
    if (typeof nextConfig.redirects !== "function") {
      throw new Error("next.config.ts defines no redirects()");
    }
    const redirects = await nextConfig.redirects();

    expect(redirects).toContainEqual({
      source: "/route-planner",
      destination: "/",
      permanent: false,
    });
  });
});
