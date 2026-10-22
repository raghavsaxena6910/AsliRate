import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Blocks, slugify } from "@/components/blog/rich-text";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { Button } from "@/components/ui/button";
import { AUTHOR, POSTS, getPost, readingMinutes } from "@/lib/blog/posts";

const SITE = "https://www.aslirate.in";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${SITE}/blog/${post.slug}`,
      publishedTime: post.published,
      modifiedTime: post.updated ?? post.published,
      authors: [AUTHOR.name],
    },
  };
}

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function BlogPost({ params }: PageProps<"/blog/[slug]">) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  const headings = post.body.filter((b) => b.type === "h2");
  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.published,
      dateModified: post.updated ?? post.published,
      author: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
      publisher: { "@type": "Organization", name: "AsliRate", url: SITE, logo: `${SITE}/icon.png` },
      mainEntityOfPage: `${SITE}/blog/${post.slug}`,
      inLanguage: "en-IN",
    },
    ...(post.faq?.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: post.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]
      : []),
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <article className="mx-auto max-w-[72ch] px-4 py-12 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-ink-3">
            <Link href="/blog" className="hover:text-ink hover:underline">
              Guides
            </Link>{" "}
            / {post.tags[0]}
          </nav>
          <h1 className="mt-3 text-[2.1rem] leading-[1.12] font-bold tracking-[-0.02em] text-balance text-ink sm:text-[2.5rem]">
            {post.title}
          </h1>
          <p className="mt-4 text-sm text-ink-3">
            By{" "}
            <a href={AUTHOR.url} target="_blank" rel="noopener noreferrer author" className="font-semibold text-ink-2 hover:underline">
              {AUTHOR.name}
            </a>
            , {AUTHOR.role} · {fmt(post.updated ?? post.published)} ·{" "}
            {readingMinutes(post)} min read
          </p>

          <div className="mt-7 rounded-xl border-l-4 border-brand bg-brand-2 px-5 py-4">
            <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">Short answer</p>
            <p className="mt-1.5 leading-relaxed text-ink">{post.answer}</p>
          </div>

          {headings.length > 3 && (
            <nav aria-label="On this page" className="mt-8 rounded-xl border border-line px-5 py-4">
              <p className="text-sm font-semibold text-ink">On this page</p>
              <ul className="mt-2 space-y-1 text-[15px]">
                {headings.map((h) => (
                  <li key={h.text}>
                    <a href={`#${slugify(h.text)}`} className="text-ink-2 hover:text-brand hover:underline">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="prose-guide mt-8">
            <Blocks blocks={post.body} />
          </div>

          {post.faq && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-ink">Common questions</h2>
              <dl className="mt-4 divide-y divide-line border-y border-line">
                {post.faq.map((f) => (
                  <div key={f.q} className="py-4">
                    <dt className="font-semibold text-ink">{f.q}</dt>
                    <dd className="mt-1.5 leading-relaxed text-ink-2">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="mt-12 rounded-2xl border-2 border-brand p-7">
            <h2 className="text-xl font-bold text-ink">Compare your own quotes in two minutes</h2>
            <p className="mt-2 leading-relaxed text-ink-2">
              Upload 2 to 6 quotes as PDF, Excel, Word, photos or WhatsApp text. AsliRate ranks suppliers by what the order
              really costs. 3 comparisons a month are free.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/signup">Start free</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/demo">See the demo</Link>
              </Button>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-lg font-bold text-ink">More guides</h2>
            <ul className="mt-3 space-y-2">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link href={`/blog/${p.slug}`} className="text-brand underline-offset-2 hover:underline">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
