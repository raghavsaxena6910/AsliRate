import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <LegalPage title="Contact" updated="22 October 2026">
      <p>
        AsliRate is built and run by Raghav Saxena in Gurugram, India. For help with your account, billing, refunds or
        anything else, email:
      </p>
      <p>
        <a href="mailto:raghavjsaxena@gmail.com" className="text-lg font-semibold text-brand underline">
          raghavjsaxena@gmail.com
        </a>
      </p>
      <p>We reply within 2 working days. For billing questions, include the email address on your AsliRate account.</p>
    </LegalPage>
  );
}
