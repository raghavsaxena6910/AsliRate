import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="22 October 2026">
      <p>By creating an account or using AsliRate, you agree to these terms.</p>

      <h2>What AsliRate is</h2>
      <p>
        A tool that compares supplier quotes and estimates the real cost of each, including GST credit, freight and minimum
        order quantities. It is in beta.
      </p>

      <h2>Plans and payment</h2>
      <p>
        The Free plan includes 3 comparisons a month. Pro costs ₹999 a month plus GST, renews monthly until you cancel, and
        includes unlimited comparisons. Payments are processed by Dodo Payments, which acts as merchant of record. Cancelling
        and refunds are covered by our <Link href="/refunds">refund and cancellation policy</Link>. If we change the price, we&rsquo;ll
        tell Pro customers by email at least 30 days before it applies to them.
      </p>

      <h2>It supports your decision; it doesn&rsquo;t make it</h2>
      <p>
        Results depend on the quotes and numbers you provide and confirm. AI can misread documents, which is why you check
        every value before results are calculated. AsliRate is not tax, legal or financial advice: confirm GST treatment with
        your accountant, and verify supplier details (such as GSTINs) before you pay anyone.
      </p>

      <h2>Your content</h2>
      <p>
        You keep ownership of everything you upload. You give us permission to store and process it only to provide the
        service. Only upload quotes you are entitled to share with a service like this.
      </p>

      <h2>Fair use</h2>
      <ul>
        <li>Don&rsquo;t try to access other people&rsquo;s accounts or data.</li>
        <li>Don&rsquo;t upload malware or attempt to disrupt the service.</li>
        <li>Don&rsquo;t use automated means to create accounts or run comparisons in bulk.</li>
      </ul>

      <h2>Availability and liability</h2>
      <p>
        We provide AsliRate as it is, during beta, without guarantees that it will always be available or error-free. To the
        extent the law allows, we aren&rsquo;t liable for purchasing decisions made using it.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms; we&rsquo;ll change the date above when we do. Questions: raghavjsaxena@gmail.com. These
        terms are governed by the laws of India.
      </p>
    </LegalPage>
  );
}
