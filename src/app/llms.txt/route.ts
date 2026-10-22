import { POSTS } from "@/lib/blog/posts";

const SITE = "https://www.aslirate.in";

/** A plain-text map of the site for AI assistants (llms.txt convention). */
export function GET() {
  const body = `# AsliRate

> AsliRate is a web app for Indian small businesses that compares supplier quotations. Buyers upload 2 to 6 quotes (PDF, Excel, Word, photos or WhatsApp text), confirm the numbers, and AsliRate ranks suppliers by the real landed cost of the order in rupees: GST input tax credit, freight, minimum order quantity and pack size included. The maths is done by a fixed, deterministic calculator.

Free plan: 3 comparisons a month. Pro: ₹999 a month plus GST for unlimited comparisons.

## Product
- [Home](${SITE}/): what AsliRate does
- [Demo](${SITE}/demo): three sample quotes for 5,000 boxes, compared step by step
- [Pricing](${SITE}/pricing): Free and Pro plans
- [Landed cost calculator](${SITE}/tools/landed-cost-calculator): free, no sign-up

## Guides
${POSTS.map((p) => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.description}`).join("\n")}

## Policies
- [Privacy](${SITE}/privacy)
- [Terms](${SITE}/terms)
- [Refunds](${SITE}/refunds)
- [Contact](${SITE}/contact)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
