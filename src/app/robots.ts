import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/comparisons", "/onboarding", "/billing", "/auth", "/api", "/ingest"],
    },
    sitemap: "https://www.aslirate.in/sitemap.xml",
  };
}
