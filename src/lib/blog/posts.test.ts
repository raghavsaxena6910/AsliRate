import { describe, expect, it } from "vitest";
import { compareQuotes } from "@/lib/engine/compare";
import { formatINR } from "@/lib/engine/money";
import { sampleComparison } from "@/lib/demo/sample-quotes";
import { POSTS, getPost } from "./posts";

const all = (slug: string) => JSON.stringify(getPost(slug));

describe("blog worked examples match the engine", () => {
  const r = compareQuotes(sampleComparison("2026-10-22"));
  const by = (id: string) => r.results.find((x) => x.quote_id === id)!;

  it("uses the engine's real costs for A, B and C", () => {
    const text = all("how-to-compare-supplier-quotations");
    for (const id of ["A", "B", "C"]) {
      expect(text).toContain(formatINR(by(id).effective_cost_paise));
      expect(text).toContain(formatINR(by(id).effective_per_unit_paise));
    }
    expect(text).toContain(formatINR(r.savings_vs_runner_up_paise));
  });

  it("MOQ guide shows C's excess spend and real rate", () => {
    const text = all("minimum-order-quantity-moq-real-price");
    expect(text).toContain(formatINR(by("C").excess_value_paise));
    expect(text).toContain(formatINR(by("C").effective_per_unit_paise));
  });

  it("unregistered buyer rate in the landed cost guide matches", () => {
    const u = compareQuotes(sampleComparison("2026-10-22", { buyer_gst_registered: false }));
    const a = u.results.find((x) => x.quote_id === "A")!;
    expect(all("landed-cost-calculation")).toContain(formatINR(a.effective_per_unit_paise));
  });

  it("every post has unique slugs and short meta descriptions", () => {
    expect(new Set(POSTS.map((p) => p.slug)).size).toBe(POSTS.length);
    for (const p of POSTS) expect(p.description.length).toBeLessThanOrEqual(160);
  });
});
