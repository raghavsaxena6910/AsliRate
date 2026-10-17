import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="17 October 2026">
      <p>
        AsliRate helps businesses compare supplier quotes. This page explains what we collect, why, and what you can ask us
        to do with it. AsliRate is in beta and is run as a student project from Gurugram, India.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Account details: your name, email address and company name.</li>
        <li>Company details you choose to give: GSTIN, city, business type, cost of funds and purchasing priorities.</li>
        <li>Quotes you upload or paste, and the numbers you confirm from them.</li>
        <li>
          Usage analytics: pages visited and buttons used, through PostHog. We don&rsquo;t record your screen, and analytics
          never includes the contents of your quotes.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To read your quotes and calculate the real cost of each supplier.</li>
        <li>To keep your comparisons so you can come back to them.</li>
        <li>To understand which parts of the product people use, so we can improve it.</li>
      </ul>
      <p>We don&rsquo;t sell your data, share it with your suppliers, or use your quotes to train AI models.</p>

      <h2>Who processes it</h2>
      <ul>
        <li>Supabase stores accounts, data and files, in Mumbai, India.</li>
        <li>Vercel hosts the website.</li>
        <li>PostHog records usage analytics.</li>
        <li>Anthropic (Claude) reads uploaded quotes to extract the numbers, when that feature is switched on.</li>
      </ul>

      <h2>How it&rsquo;s protected</h2>
      <p>
        Quote files are kept in private storage. Database rules ensure each account can only see its own data. Connections
        are encrypted.
      </p>

      <h2>Your choices</h2>
      <p>
        You can update your company details at any time. To get a copy of your data or delete your account and everything
        in it, email the address below and we&rsquo;ll do it within 30 days.
      </p>

      <h2>Contact</h2>
      <p>Raghav Saxena, raghavjsaxena@gmail.com</p>
    </LegalPage>
  );
}
