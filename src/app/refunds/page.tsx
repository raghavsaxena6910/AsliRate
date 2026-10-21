import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Refund and cancellation policy" };

export default function RefundsPage() {
  return (
    <LegalPage title="Refund and cancellation policy" updated="22 October 2026">
      <p>
        This policy covers AsliRate Pro, a monthly subscription of ₹999 plus GST. Payments are processed by Dodo Payments, our
        payment partner and merchant of record.
      </p>

      <h2>Cancelling</h2>
      <ul>
        <li>You can cancel at any time. Log in, open your Plan page (from the top bar or your dashboard), and choose Manage billing and invoices.</li>
        <li>After you cancel, you won&rsquo;t be charged again. Pro stays on until the end of the month you&rsquo;ve paid for.</li>
        <li>Your account, comparisons and results stay available on the Free plan after Pro ends.</li>
      </ul>

      <h2>Refunds</h2>
      <ul>
        <li>
          <strong>First payment:</strong> if Pro isn&rsquo;t right for you, ask within 7 days of your first payment and we&rsquo;ll
          refund it in full.
        </li>
        <li>
          <strong>Mistakes:</strong> if you were charged twice, charged after cancelling, or charged the wrong amount, we&rsquo;ll
          refund the extra amount in full.
        </li>
        <li>
          <strong>Renewals:</strong> monthly renewals aren&rsquo;t refunded for part-used months. Cancel before the renewal date to
          avoid the next charge.
        </li>
      </ul>

      <h2>How to ask for a refund</h2>
      <p>
        Email raghavjsaxena@gmail.com from the address on your account, with the date of the payment. We reply within 2
        working days. Approved refunds go back to the original payment method; banks usually take 5 to 10 working days to show
        them.
      </p>
    </LegalPage>
  );
}
