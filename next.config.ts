import type { NextConfig } from "next";

// PostHog region: "us" (default) or "eu". Analytics is proxied through /ingest
// on our own domain so ad blockers don't drop it.
const region = process.env.NEXT_PUBLIC_POSTHOG_REGION === "eu" ? "eu" : "us";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  skipTrailingSlashRedirect: true, // required by PostHog's API paths
  // Share-card images read these files at request time; make sure Vercel ships them.
  outputFileTracingIncludes: {
    "/blog/**": ["./src/assets/aslirate-mark.png", "./node_modules/@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-{500,800}-normal.woff"],
    "/tools/**": ["./src/assets/aslirate-mark.png", "./node_modules/@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-{500,800}-normal.woff"],
  },
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: `https://${region}-assets.i.posthog.com/static/:path*` },
      { source: "/ingest/:path*", destination: `https://${region}.i.posthog.com/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
