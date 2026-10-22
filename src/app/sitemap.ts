import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/blog/posts";

const SITE = "https://www.aslirate.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [
    ["", 1],
    ["/demo", 0.9],
    ["/pricing", 0.8],
    ["/tools/landed-cost-calculator", 0.8],
    ["/blog", 0.7],
    ["/signup", 0.6],
    ["/contact", 0.3],
    ["/privacy", 0.2],
    ["/terms", 0.2],
    ["/refunds", 0.2],
  ];
  return [
    ...pages.map(([path, priority]) => ({ url: `${SITE}${path}`, changeFrequency: "monthly" as const, priority })),
    ...POSTS.map((p) => ({
      url: `${SITE}/blog/${p.slug}`,
      lastModified: p.updated ?? p.published,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
