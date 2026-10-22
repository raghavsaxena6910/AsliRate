/**
 * Guides for buyers at Indian small businesses. Written for search: each one
 * answers a question people type into Google, opens with the direct answer,
 * and links to the others and to the product.
 *
 * Inline text supports **bold** and [link text](/path). Worked examples use
 * the same three box quotes as the demo, so the numbers match the engine.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string; id?: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; caption?: string; head: string[]; rows: string[][]; numeric?: number[] }
  | { type: "note"; title?: string; text: string };

export interface Post {
  slug: string;
  title: string;
  /** Meta description, under ~155 characters. */
  description: string;
  /** One-paragraph direct answer shown at the top. */
  answer: string;
  published: string; // YYYY-MM-DD
  updated?: string;
  tags: string[];
  body: Block[];
  faq?: { q: string; a: string }[];
}

export const AUTHOR = {
  name: "Raghav Saxena",
  role: "founder of AsliRate, former audit associate at KPMG",
  url: "https://www.linkedin.com/in/raghav-saxena-",
};

export const POSTS: Post[] = [
  {
    slug: "how-to-compare-supplier-quotations",
    title: "How to compare supplier quotations: a 7-point checklist for Indian businesses",
    description:
      "Compare supplier quotes on the real cost of the order: GST credit, freight, minimum order, pack size, validity and delivery. A checklist with a worked example.",
    answer:
      "Compare quotations on what the whole order will cost you, not on the rate per piece. Put every quote on the same basis (same item, same unit, GST treated the same way), then add freight and other charges, apply the minimum order and pack size to your real quantity, and take off any GST you can claim back. The lowest total wins, provided it arrives in time and is still valid.",
    published: "2026-10-22",
    tags: ["Purchasing", "Quotations"],
    body: [
      {
        type: "p",
        text: "Most small businesses compare quotes the quick way: line up the rate per piece and pick the lowest. It feels sensible, and it is often wrong. Quotes arrive as a PDF from one supplier, a WhatsApp message from another and an Excel rate list from a third. Each one hides its costs in a different place.",
      },
      {
        type: "p",
        text: "Here is the checklist we use, with a real-looking example: a brand that needs **5,000 shipping boxes** and has three quotes.",
      },
      {
        type: "table",
        caption: "The three quotes as they arrived",
        head: ["Supplier", "Rate per box", "GST", "Freight", "Minimum order"],
        rows: [
          ["A (PDF)", "₹18.00", "18% extra", "₹6,000 extra", "2,000"],
          ["B (WhatsApp)", "₹19.50", "Included", "Included", "None"],
          ["C (Excel)", "₹17.20", "18% extra", "₹9,000 extra", "10,000"],
        ],
      },
      { type: "p", text: "On rate alone, C looks cheapest and B looks most expensive. Work through the checklist and the order flips." },
      { type: "h2", text: "1. Check it is the same item" },
      {
        type: "p",
        text: "A 5-ply box is not a cheaper 3-ply box. Before comparing prices, match the specification line by line: size, material, grade, GSM, finish, printing. If one quote is for something different, either ask for a revised quote or note the difference next to the price.",
      },
      { type: "h2", text: "2. Put every price on the same unit" },
      {
        type: "p",
        text: "Rates come per piece, per 100, per dozen, per kg or per sheet. Convert them all to the unit you will actually order in. A rate of \"₹1,800 per 100\" is ₹18 per piece. Check that nobody has quoted a smaller pack or a lighter weight to make the rate look lower.",
      },
      { type: "h2", text: "3. Find out whether GST is included or extra" },
      {
        type: "p",
        text: "\"All inclusive\" and \"+ GST\" prices cannot be compared directly. If you are GST-registered and the supplier gives you a proper tax invoice, the GST is usually money you claim back, so the price that matters is the price **before** GST. Our guide on [GST inclusive vs exclusive prices](/blog/gst-inclusive-vs-exclusive-price) walks through this with numbers.",
      },
      { type: "h2", text: "4. Check the supplier's GSTIN and your own credit" },
      {
        type: "p",
        text: "GST is only a pass-through cost when you can actually claim it. That needs a registered supplier, a valid tax invoice, and the invoice showing up in your GSTR-2B. A supplier without a GSTIN, or one on the composition scheme, cannot give you input tax credit, so every rupee you pay is cost. See [input tax credit on purchases](/blog/input-tax-credit-on-purchases) for the full conditions.",
      },
      { type: "h2", text: "5. Add freight and other charges" },
      {
        type: "p",
        text: "Delivery, loading, packing and printing plates all land on the same bill. A quote that is silent on freight is not a quote with free freight: ask. Terms like \"ex-works\" and \"FOR destination\" change who pays for transport. Our guide to [freight terms in quotations](/blog/freight-terms-in-quotations) explains each one.",
      },
      { type: "h2", text: "6. Apply the minimum order and pack size" },
      {
        type: "p",
        text: "If you need 5,000 and the minimum is 10,000, you pay for 10,000. If boxes come in bundles of 25, you round up to the next bundle. Work out what you will really have to buy, then divide the total by the quantity **you need**. That is the real rate. More on this in [MOQ and the real price](/blog/minimum-order-quantity-moq-real-price).",
      },
      { type: "h2", text: "7. Check validity and delivery time" },
      {
        type: "p",
        text: "A cheap quote that expired last week, or that arrives after your launch date, is not an option. Note the validity date and the promised lead time against the date you need the goods.",
      },
      { type: "h2", text: "The example, worked through" },
      {
        type: "table",
        caption: "Real cost for 5,000 boxes, for a GST-registered buyer",
        head: ["Supplier", "You buy", "Cost after GST credit", "Real rate per box needed"],
        rows: [
          ["B", "5,000", "₹82,627.12", "₹16.53"],
          ["A", "5,000", "₹96,000.00", "₹19.20"],
          ["C", "10,000", "₹1,81,000.00", "₹36.20"],
        ],
        numeric: [1, 2, 3],
      },
      {
        type: "p",
        text: "B, the quote that looked most expensive, is the cheapest by ₹13,372.88. Its ₹19.50 already includes GST you can claim back and delivery. C, the one that looked cheapest, costs more than double, because the minimum order forces you to buy 5,000 boxes you don't need.",
      },
      {
        type: "note",
        title: "Do this in two minutes",
        text: "AsliRate reads PDF, Excel, Word and WhatsApp quotes, shows you the numbers to confirm, and ranks suppliers by this real cost. [Open the demo](/demo) to see this exact example, or [compare your own quotes free](/signup).",
      },
    ],
    faq: [
      {
        q: "What is the best way to compare quotations from suppliers?",
        a: "Convert every quote to the same item, unit and GST treatment, add freight and other charges, apply the minimum order and pack size to your real quantity, and subtract GST you can claim back. Then compare the total cost of the order.",
      },
      {
        q: "Should I compare quotes with or without GST?",
        a: "If you are GST-registered and the supplier issues a valid tax invoice, compare prices before GST, because you can usually claim the GST back. If you are not registered, or the supplier cannot give you credit, compare the full amount including GST.",
      },
    ],
  },

  {
    slug: "gst-inclusive-vs-exclusive-price",
    title: "GST inclusive vs exclusive price: which supplier quote is really cheaper?",
    description:
      "How to compare a price that includes GST with one that adds GST on top, with worked examples for GST-registered and unregistered buyers.",
    answer:
      "To compare a GST-inclusive price with a GST-exclusive one, take the GST out of the inclusive price: divide it by (1 + GST rate). At 18%, ₹118 inclusive is ₹100 before GST. If you are GST-registered and can claim the credit, compare the before-GST figures. If you can't claim it, compare the full amounts you will pay.",
    published: "2026-10-22",
    tags: ["GST", "Quotations"],
    body: [
      {
        type: "p",
        text: "One supplier writes \"₹100 + GST\". Another writes \"₹115, GST included\". The first looks ₹15 cheaper. For most GST-registered businesses, it is actually the more expensive one.",
      },
      { type: "h2", text: "Step 1: take the GST out of the inclusive price" },
      {
        type: "p",
        text: "An inclusive price already contains the tax. To find the price before GST, divide by (1 + rate). At 18%, divide by 1.18. The GST inside the price is the difference.",
      },
      {
        type: "table",
        caption: "Removing 18% GST from inclusive prices",
        head: ["Inclusive price", "÷ 1.18", "GST inside it"],
        rows: [
          ["₹115.00", "₹97.46", "₹17.54"],
          ["₹118.00", "₹100.00", "₹18.00"],
          ["₹19.50", "₹16.53", "₹2.97"],
        ],
        numeric: [0, 1, 2],
      },
      {
        type: "p",
        text: "A common mistake is to take 18% **off** the inclusive price (₹115 × 0.82 = ₹94.30). That understates the price. GST is charged on the before-tax price, so you have to divide.",
      },
      { type: "h2", text: "Step 2: decide whether the GST is a cost for you" },
      {
        type: "p",
        text: "If your business is GST-registered and the purchase is for your business, the GST you pay a registered supplier is usually claimed back as [input tax credit](/blog/input-tax-credit-on-purchases). It leaves your bank account and comes back as a reduction in the GST you owe. So the real cost is the price **before** GST.",
      },
      {
        type: "p",
        text: "If you are not registered, or the supplier can't give you a valid tax invoice, the GST is simply part of the price. Then the full amount you pay is the cost.",
      },
      { type: "h2", text: "Worked example" },
      {
        type: "table",
        caption: "Quote X: ₹100 + 18% GST. Quote Y: ₹115 including 18% GST.",
        head: ["", "Quote X", "Quote Y", "Cheaper"],
        rows: [
          ["You pay the supplier", "₹118.00", "₹115.00", "Y"],
          ["Registered buyer, after credit", "₹100.00", "₹97.46", "Y"],
          ["Unregistered buyer", "₹118.00", "₹115.00", "Y"],
          ["Comparing the numbers as written", "₹100", "₹115", "X (wrong)"],
        ],
      },
      {
        type: "p",
        text: "Quote Y is cheaper for everyone. The only way X looks cheaper is by comparing a before-tax price with an after-tax one, which is what happens when quotes are lined up as written.",
      },
      { type: "h2", text: "When an \"inclusive\" price needs a closer look" },
      {
        type: "ul",
        items: [
          "**No GSTIN on the quote.** An unregistered supplier can't charge GST, so there is no credit to claim. Treat the whole price as cost and ask whether they will issue a tax invoice.",
          "**Composition scheme suppliers** issue a bill of supply, not a tax invoice. You can't claim credit on their price.",
          "**Wrong rate assumed.** GST rates were restructured in September 2025 into mainly 5% and 18%, with 40% for a narrow list of goods. Check the current rate for the item's HSN code before you divide.",
          "**Freight inside the price.** \"Including GST and delivery\" means freight is in there too. Good, but compare it with quotes where freight is extra by adding their freight before comparing.",
        ],
      },
      {
        type: "note",
        title: "Let the calculator do the division",
        text: "Our free [landed cost calculator](/tools/landed-cost-calculator) takes a price, says whether GST is in it, and shows the real cost per unit with or without credit. To compare several quotes at once, [try AsliRate free](/signup).",
      },
    ],
    faq: [
      {
        q: "How do I calculate the price without GST from an inclusive price?",
        a: "Divide the inclusive price by (1 + GST rate). At 18%, divide by 1.18: ₹118 becomes ₹100, and the GST inside it is ₹18.",
      },
      {
        q: "Is a GST-inclusive quote more expensive?",
        a: "Not necessarily. ₹115 including 18% GST is ₹97.46 before GST, which is cheaper than ₹100 + GST. Always convert both quotes to the same basis before comparing.",
      },
    ],
  },

  {
    slug: "input-tax-credit-on-purchases",
    title: "Input tax credit on purchases: when supplier GST is (and isn't) a real cost",
    description:
      "When can a business claim input tax credit on purchases? The Section 16 conditions, suppliers that can't give credit, and how it changes the cheapest quote.",
    answer:
      "A GST-registered business can usually claim the GST it pays on business purchases as input tax credit, if it holds a valid tax invoice, has received the goods, the supplier has filed the invoice so it shows in GSTR-2B, the supplier has paid the tax, and the buyer has filed its own return. When those hold, GST is not a cost of the purchase. When they don't, it is.",
    published: "2026-10-22",
    tags: ["GST", "Input tax credit"],
    body: [
      {
        type: "p",
        text: "Input tax credit (ITC) is why the same quote can cost two businesses different amounts. For a registered buyer who can claim it, supplier GST comes back. For anyone else, it is part of the price. Getting this right is often the difference between picking the right supplier and the wrong one.",
      },
      { type: "h2", text: "The conditions for claiming credit" },
      {
        type: "p",
        text: "Section 16(2) of the CGST Act sets out the conditions. In plain terms, you can claim credit on a purchase when all of these are true:",
      },
      {
        type: "ol",
        items: [
          "**You hold a tax invoice** (or debit note) from a registered supplier.",
          "**The invoice appears in your GSTR-2B**, which happens when the supplier reports it in their GSTR-1.",
          "**You have received the goods.** If they come in instalments, credit is available when the last lot arrives.",
          "**The supplier has paid the tax** to the government.",
          "**You have filed your own GST return.**",
        ],
      },
      {
        type: "p",
        text: "Two more rules matter for buyers. If you don't pay the supplier within **180 days** of the invoice date, the credit on the unpaid amount has to be reversed (it can be reclaimed when you pay). And there is a **time limit**: credit for an invoice can't be taken after 30 November following the end of the financial year, or after you file the annual return, whichever is earlier.",
      },
      { type: "h2", text: "Suppliers whose GST you can't claim" },
      {
        type: "ul",
        items: [
          "**Unregistered suppliers.** They can't charge GST. The price is your cost.",
          "**Composition scheme suppliers.** They issue a bill of supply and can't pass on credit.",
          "**Suppliers who don't file.** If your invoice never reaches your GSTR-2B, you can't claim it until it does.",
        ],
      },
      {
        type: "p",
        text: "Some purchases are also blocked from credit under Section 17(5), for example goods for personal use. If a purchase falls in a blocked category, treat the GST as cost.",
      },
      { type: "h2", text: "How credit changes which quote wins" },
      {
        type: "p",
        text: "Take a WhatsApp quote of ₹19.50 per box, GST and delivery included, from a supplier with a GSTIN. For 5,000 boxes you pay ₹97,500. If you can claim credit, the GST inside it (₹14,872.88) comes back, and the real cost is ₹82,627.12, or ₹16.53 a box.",
      },
      {
        type: "p",
        text: "Now suppose the same supplier had no GSTIN. There is no credit, so the cost is the full ₹97,500, or ₹19.50 a box. Against a competitor at ₹18 + GST with ₹6,000 freight (₹96,000 after credit), the ranking flips.",
      },
      {
        type: "table",
        caption: "5,000 boxes, registered buyer",
        head: ["Quote", "Supplier has GSTIN", "Real cost"],
        rows: [
          ["₹19.50 all inclusive", "Yes", "₹82,627.12"],
          ["₹18.00 + GST, ₹6,000 freight", "Yes", "₹96,000.00"],
          ["₹19.50 all inclusive", "No", "₹97,500.00"],
        ],
        numeric: [2],
      },
      {
        type: "note",
        title: "This is general information, not tax advice",
        text: "The rules have conditions and exceptions. Confirm how credit applies to your business with your chartered accountant. AsliRate asks whether you're registered and whether each supplier has a GSTIN, and flags quotes where credit is uncertain. [See how it works](/demo).",
      },
    ],
    faq: [
      {
        q: "Can I claim input tax credit if the supplier is not registered under GST?",
        a: "No. An unregistered supplier can't charge GST, so there is no tax to claim. The price you pay is the full cost.",
      },
      {
        q: "What is the time limit for claiming input tax credit?",
        a: "Under Section 16(4), by 30 November following the end of the financial year the invoice belongs to, or the date you file the annual return, whichever is earlier.",
      },
    ],
  },

  {
    slug: "landed-cost-calculation",
    title: "Landed cost: how to calculate the real cost of a purchase order",
    description:
      "Landed cost is what an order really costs once freight, charges, GST credit and minimum order are counted. The formula, a worked example, and a free calculator.",
    answer:
      "Landed cost = cost of the goods you actually have to buy + freight + other charges + any GST you can't claim back. Divide it by the quantity you need to get the real rate per unit. For a GST-registered buyer with valid tax invoices, GST usually drops out because it's claimed as credit.",
    published: "2026-10-22",
    tags: ["Costing", "Purchasing"],
    body: [
      {
        type: "p",
        text: "The rate on a quotation is where the cost starts, not where it ends. Landed cost is the total it takes to get the goods to your door and into use. It is the fairest single number for comparing suppliers.",
      },
      { type: "h2", text: "The formula" },
      {
        type: "ol",
        items: [
          "**Quantity you must buy** = your need, rounded up to the minimum order and to whole packs.",
          "**Goods cost** = quantity you must buy × rate before GST.",
          "**Add** freight, loading, packing, printing plates and any other charges (before GST).",
          "**Add GST** on the total, unless you can claim it back as credit.",
          "**Real rate** = landed cost ÷ quantity you need.",
        ],
      },
      {
        type: "p",
        text: "When a supplier delivers and bills freight on the same invoice, GST normally applies to the freight at the same rate as the goods, and it is claimable the same way.",
      },
      { type: "h2", text: "Worked example: 5,000 boxes" },
      {
        type: "p",
        text: "Supplier A quotes ₹18 per box, GST 18% extra, freight ₹6,000 extra, minimum order 2,000. You need 5,000 and you are GST-registered.",
      },
      {
        type: "table",
        head: ["Line", "Amount"],
        rows: [
          ["Goods: 5,000 × ₹18.00", "₹90,000.00"],
          ["Freight", "₹6,000.00"],
          ["Subtotal before GST", "₹96,000.00"],
          ["GST at 18%", "₹17,280.00"],
          ["You pay the supplier", "₹1,13,280.00"],
          ["Less GST credit", "− ₹17,280.00"],
          ["Landed cost", "₹96,000.00"],
          ["Real rate per box", "₹19.20"],
        ],
        numeric: [1],
      },
      {
        type: "p",
        text: "The quoted ₹18 becomes ₹19.20 once freight is spread across the order. If you were not registered, the GST would stay in, and the real rate would be ₹22.66.",
      },
      { type: "h2", text: "What people forget" },
      {
        type: "ul",
        items: [
          "**The minimum order.** Buying 10,000 to get a lower rate can double your cost if you only need 5,000. See [MOQ and the real price](/blog/minimum-order-quantity-moq-real-price).",
          "**Freight that isn't on the quote.** If it's not mentioned, ask. \"Ex-works\" means you arrange the truck. See [freight terms in quotations](/blog/freight-terms-in-quotations).",
          "**GST you can't claim.** Unregistered and composition suppliers can't give credit. See [input tax credit on purchases](/blog/input-tax-credit-on-purchases).",
          "**Small charges.** Packing, loading, cylinder or plate charges are often written at the bottom of the quote.",
        ],
      },
      {
        type: "note",
        title: "Calculate it for your quote",
        text: "The free [landed cost calculator](/tools/landed-cost-calculator) does this for one quote. To rank several suppliers side by side, [compare your quotes on AsliRate](/signup).",
      },
    ],
    faq: [
      {
        q: "What is included in landed cost?",
        a: "The cost of the goods you must buy (after minimum order and pack size), freight, loading and other charges, and any GST you can't claim back as input tax credit.",
      },
      {
        q: "Is GST part of landed cost?",
        a: "For a GST-registered business that can claim input tax credit, usually not, because the GST is recovered. If you can't claim it, GST is part of the landed cost.",
      },
    ],
  },

  {
    slug: "minimum-order-quantity-moq-real-price",
    title: "MOQ meaning: how a minimum order quantity changes the real price",
    description:
      "MOQ is the smallest quantity a supplier will sell. When it's more than you need, the cheapest rate can be the costliest order. An example and what to do.",
    answer:
      "MOQ (minimum order quantity) is the smallest amount a supplier will sell in one order. If the MOQ is higher than what you need, you pay for the extra units, so divide the total cost by the quantity you actually need to see the real rate. A low rate with a high MOQ is often the most expensive option.",
    published: "2026-10-22",
    tags: ["Purchasing", "MOQ"],
    body: [
      {
        type: "p",
        text: "Suppliers set a minimum order because each production run has fixed setup costs. That is fair. The problem is comparing their rate with a supplier who will sell you exactly what you need.",
      },
      { type: "h2", text: "The MOQ trap, in numbers" },
      {
        type: "p",
        text: "You need 5,000 shipping boxes. Supplier C offers the lowest rate on the table: ₹17.20 per box + GST, freight ₹9,000. Their minimum order is 10,000.",
      },
      {
        type: "table",
        caption: "Supplier C, for a GST-registered buyer",
        head: ["Line", "Amount"],
        rows: [
          ["You must buy", "10,000 boxes"],
          ["Goods: 10,000 × ₹17.20", "₹1,72,000.00"],
          ["Freight", "₹9,000.00"],
          ["Cost after GST credit", "₹1,81,000.00"],
          ["Spent on boxes you don't need", "₹90,500.00"],
          ["Real rate per box you need", "₹36.20"],
        ],
        numeric: [1],
      },
      {
        type: "p",
        text: "The ₹17.20 rate becomes ₹36.20 per box you actually need. Against another supplier at ₹19.50 all inclusive, which comes to ₹16.53 after GST credit, C costs more than twice as much.",
      },
      { type: "h2", text: "Pack size works the same way" },
      {
        type: "p",
        text: "Some items are sold in fixed packs: bundles of 25, rolls of 500 metres, bags of 50 kg. If you need 1,010 and the pack is 25, you buy 1,025. The effect is smaller than an MOQ, but on expensive items it adds up.",
      },
      { type: "h2", text: "When buying more can still make sense" },
      {
        type: "ul",
        items: [
          "You are sure to use the extra stock soon, and it won't expire or go out of design.",
          "You have the storage space and the cash to tie up.",
          "The total for the larger order is still lower than the alternative for the quantity you need.",
        ],
      },
      {
        type: "p",
        text: "If any of these fail, the extra units are a cost, not a saving.",
      },
      { type: "h2", text: "What to do with a high MOQ" },
      {
        type: "ul",
        items: [
          "Ask the supplier for a rate at your quantity. Many will quote one, at a slightly higher rate.",
          "Ask for a split delivery: one order, delivered and invoiced in two lots.",
          "Ask for slab pricing (for example, one rate up to 5,000 and a lower one above).",
          "Compare every quote on the real rate per unit you need, as in [our quote comparison checklist](/blog/how-to-compare-supplier-quotations).",
        ],
      },
      {
        type: "note",
        title: "See the MOQ effect instantly",
        text: "Enter the MOQ in the free [landed cost calculator](/tools/landed-cost-calculator), or upload your quotes to [AsliRate](/signup) and it will flag every quote whose minimum is above your need.",
      },
    ],
    faq: [
      {
        q: "What does MOQ mean in a quotation?",
        a: "MOQ stands for minimum order quantity: the smallest quantity the supplier will sell in a single order.",
      },
      {
        q: "How do I compare quotes with different MOQs?",
        a: "Work out what each supplier forces you to buy, calculate the total cost of that order, and divide it by the quantity you actually need. Compare that real rate per unit.",
      },
    ],
  },

  {
    slug: "freight-terms-in-quotations",
    title: "Freight terms in quotations: ex-works, FOR destination and \"freight extra\" explained",
    description:
      "What ex-works, FOR destination, freight extra, to-pay and freight at actuals mean on an Indian supplier quote, who pays for transport, and how to compare them.",
    answer:
      "Freight terms say who arranges and pays for transport. Ex-works means you collect from the supplier's premises and pay for transport yourself. FOR destination means the supplier delivers to your location and the price includes freight. \"Freight extra\" or \"to pay\" means the supplier sends it but you pay the transport cost. To compare quotes fairly, add the freight to every quote that doesn't include it.",
    published: "2026-10-22",
    tags: ["Freight", "Quotations"],
    body: [
      {
        type: "p",
        text: "Freight can be the difference between two close quotes, and it is the cost suppliers most often leave vague. Here is what the common terms on Indian quotations mean.",
      },
      {
        type: "table",
        head: ["Term on the quote", "Who arranges transport", "Who pays", "What to add when comparing"],
        rows: [
          ["Ex-works / ex-factory / ex-godown", "You", "You", "Your transporter's rate, plus your time"],
          ["FOR destination / door delivery", "Supplier", "Supplier (in the price)", "Nothing"],
          ["FOR supplier's city", "Supplier, to their local transporter", "You, from there", "Transport from their city to you"],
          ["Freight extra / to pay", "Supplier", "You", "The freight amount (ask for it)"],
          ["Freight at actuals", "Supplier", "You, whatever it costs", "An estimate, and ask for a cap"],
          ["Nothing written", "Unclear", "Unclear", "Ask before you compare"],
        ],
      },
      { type: "h2", text: "GST on freight" },
      {
        type: "p",
        text: "When the supplier delivers the goods and bills freight on the same invoice, the freight is usually treated as part of the supply of the goods, so GST applies to it at the goods' rate. If you can claim credit on the goods, you can normally claim it on that freight too.",
      },
      {
        type: "p",
        text: "If you hire a transporter yourself, a goods transport agency (GTA) has its own GST rules, often under reverse charge. Ask your accountant how it applies to you before counting it in your comparison.",
      },
      { type: "h2", text: "How to compare quotes with different freight terms" },
      {
        type: "ol",
        items: [
          "Ask every supplier for the freight amount to your location for your quantity.",
          "For ex-works quotes, get a rate from your own transporter.",
          "Add freight (before GST) to each quote's goods cost.",
          "Spread the total over the quantity you need to get a real rate per unit.",
        ],
      },
      {
        type: "p",
        text: "In our running example, Supplier A at ₹18 per box with ₹6,000 freight on 5,000 boxes comes to ₹19.20 per box before GST. Supplier B's ₹19.50 includes delivery and GST, and works out cheaper. The full comparison is in the [quotation checklist](/blog/how-to-compare-supplier-quotations).",
      },
      {
        type: "note",
        title: "Never assume freight is free",
        text: "When a quote doesn't mention freight, AsliRate flags it instead of treating it as zero, so you know which supplier to call. [Compare your quotes free](/signup).",
      },
    ],
    faq: [
      {
        q: "What does FOR destination mean in a quotation?",
        a: "FOR (free on road) destination means the supplier delivers the goods to your location and the quoted price includes transport to there.",
      },
      {
        q: "What does ex-works mean in a quotation?",
        a: "Ex-works means the price is for goods collected at the supplier's premises. You arrange and pay for transport yourself.",
      },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Rough reading time in minutes (220 words a minute). */
export function readingMinutes(post: Post): number {
  const text = [post.answer, ...post.body.map((b) => ("text" in b ? b.text : "items" in b ? b.items.join(" ") : "rows" in b ? b.rows.flat().join(" ") : ""))].join(" ");
  return Math.max(1, Math.round(text.split(/\s+/).length / 220));
}
