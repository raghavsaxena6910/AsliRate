# AsliRate

Compare supplier quotes. Find the real rate. — [aslirate.in](https://aslirate.in)

Small Indian businesses upload 2–6 supplier quotes (PDF, WhatsApp screenshot, Excel or pasted text). AI reads them into a fixed structure, the user confirms the numbers, and a deterministic engine ranks suppliers by real landed cost in rupees, accounting for GST credit, freight and minimum order quantity.

## Ground rules

- **AI reads documents and writes explanations only. The engine does all maths.** Every rupee shown, including in explanations, comes from `src/lib/engine`.
- Money is integer paise; quantities are integer milli-units; division happens once, with round-half-up, in BigInt.
- API keys live only in Vercel/Supabase environment settings, never in code or chat.

## Project layout

| Path | What it is |
| --- | --- |
| `src/lib/engine/` | Calculation engine: `compare.ts` (rules, ranking, warnings), `money.ts` (paise, Indian number format), `schema.ts` (Zod input contract) |
| `src/lib/review/quote-form.ts` | Turns what people type on the review screen ("₹6,000/-") into engine input, with field errors |
| `src/lib/rationale/template.ts` | Plain-English explanation built only from engine output |
| `src/lib/demo/` | The three sample suppliers (engine reference case) and demo extraction data |
| `src/app/page.tsx` | Landing page |
| `src/app/demo/` + `src/components/demo/` | Demo mode: setup → upload (simulated) → review → results |
| `src/components/results/`, `src/components/review/` | Results and review UI, reused by the real flow later |
| `public/samples/` | Sample quotes: A (PDF), B (WhatsApp image), C (Excel); regenerate with `python3 scripts/generate-samples.py` |

## Supabase

Project `aslirate` (ref `ljqcnvulhdsfukglcyjq`, Mumbai). Schema and policies live in `supabase/migrations/`. The URL and publishable key are public by design and default in `src/lib/supabase/config.ts`; secret keys only ever go in Vercel/Supabase environment settings.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine + form + rationale tests (Vitest)
npm run typecheck
npm run lint
npm run build
```

## Engine reference case

5,000 boxes needed, buyer GST-registered, 18% GST:

| Supplier | Quote | Real cost | Per box | Rank |
| --- | --- | --- | --- | --- |
| B, Om Corrugators | ₹19.50 all-inclusive, GSTIN given | ₹82,627.12 | ₹16.53 | 1 |
| A, Shree Balaji Packaging | ₹18.00 + GST + ₹6,000 freight | ₹96,000.00 | ₹19.20 | 2 |
| C, Kanha Paper Products | ₹17.20 + GST + ₹9,000 freight, MOQ 10,000 | ₹1,81,000.00 (excess ₹90,500) | ₹36.20 | 3 |

Without B's GSTIN, B becomes ₹97,500.00 and the order is A, B, C.

## Build order

1. ✅ Calculation engine + tests
2. ✅ Landing page, demo mode, sample quote files
3. ✅ Deployed on Vercel at https://www.aslirate.in (aslirate.in redirects; DNS at GoDaddy: A @ 216.198.79.1, CNAME www → Vercel)
4. ✅ Supabase auth, database (RLS on all tables), private storage
5. AI extraction (server-only, Zod-validated) + review screen
6. Real results, AI rationale from engine numbers, Excel/PDF export, share link
7. Dashboard, pricing + Pro waitlist (₹999/month), privacy and terms
8. Launch checklist testing

## Later (out of v1 scope)

- GSTIN checksum validation (v1 checks format only)
- Different GST rate on freight than on goods (e.g. transport by a GTA); v1 applies the item's rate to the whole subtotal
- Quantity-break / slab pricing ("₹18 up to 5,000, ₹17 above")
- Cost of payment terms (advance vs 30-day credit)
- Multi-item quotes and comparing a basket of items
- "What if" toggles directly on the results page
- Hindi interface
- Hosting stays on Vercel Hobby. Before showing a paid price or taking payments, revisit: Hobby's fair-use terms are non-commercial only (options: confirm with Vercel support, waitlist without a price, or upgrade at first paying customer)

## Prototype

`prototype/aslirate-prototype.html` is a single-file clickable prototype of the full flow (sign up → company → dashboard → new comparison → upload → reading → review → analysis report). Its figures come from the engine:

```bash
npx tsx scripts/prototype-data.ts > prototype/data.json
python3 -c "s=open('prototype/src.html').read();d=open('prototype/data.json').read();open('prototype/aslirate-prototype.html','w').write(s.replace('__DATA__',d.replace('</','<\\\\/')))"
```

Payment-terms cost and the scorecard rules in `scripts/prototype-data.ts` are proposed; they move into `src/lib/engine` with tests when built.
