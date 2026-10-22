import { getPost } from "@/lib/blog/posts";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "AsliRate guide";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  return ogCard({
    eyebrow: post ? `Guide · ${post.tags[0]}` : "Guide",
    title: post?.title ?? "Buyer guides",
    footer: "aslirate.in · Compare supplier quotes. Find the real rate.",
  });
}
