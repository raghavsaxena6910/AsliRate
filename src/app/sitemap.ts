import type { MetadataRoute } from "next";

const SITE = "https://www.aslirate.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [
    ["", 1],
    ["/demo", 0.9],
    ["/pricing", 0.8],
    ["/signup", 0.6],
    ["/contact", 0.3],
    ["/privacy", 0.2],
    ["/terms", 0.2],
    ["/refunds", 0.2],
  ];
  return pages.map(([path, priority]) => ({ url: `${SITE}${path}`, changeFrequency: "monthly", priority }));
}
