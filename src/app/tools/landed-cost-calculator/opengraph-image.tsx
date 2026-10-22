import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Free landed cost calculator";

export default async function Image() {
  return ogCard({
    eyebrow: "Free tool",
    title: "Landed cost calculator: the real cost per unit of any supplier quote",
    footer: "GST credit, freight and minimum order included · aslirate.in",
  });
}
