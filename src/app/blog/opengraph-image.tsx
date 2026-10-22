import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "AsliRate guides for buyers";

export default async function Image() {
  return ogCard({
    eyebrow: "Guides for buyers",
    title: "GST credit, freight, MOQ and the real cost of a quote",
    footer: "aslirate.in/blog",
  });
}
