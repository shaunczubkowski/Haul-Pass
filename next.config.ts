import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The route planner was removed (#120). The URL was sitemapped and
      // footer-linked sitewide, so send indexed and bookmarked traffic to the
      // calculator instead of 404ing it.
      //
      // Deliberately temporary (307, not 308): the feature is archived at the
      // route-planner-v1 tag and may be revived at this URL. A 308 is cached
      // indefinitely by browsers, which would strand anyone who saw it.
      { source: "/route-planner", destination: "/", permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // NOTE: If a Content-Security-Policy header is added in future, Vercel Analytics
          // requires these two sources to be whitelisted:
          //   script-src: https://va.vercel-scripts.com
          //   connect-src: https://vitals.vercel-insights.com
        ],
      },
      {
        source: "/:path*\\.(png|jpg|jpeg|gif|svg|ico|webp|woff2|woff|ttf|otf)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
