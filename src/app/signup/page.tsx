import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto grid max-w-5xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-16">
          <div className="max-w-lg">
            <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink">Create your AsliRate account</h1>
            <p className="mt-2 mb-8 text-lg text-ink-2">Free during beta. Compare up to 6 supplier quotes at a time.</p>
            <SignupForm />
          </div>
          <aside className="self-start rounded-xl bg-paper-2 p-7">
            <h2 className="text-xl font-bold text-ink">What happens next</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 leading-relaxed text-ink-2">
              <li>Confirm your email, then tell us about your company so GST credit is counted correctly.</li>
              <li>Describe what you&rsquo;re buying and add 2 to 6 quotes in any format.</li>
              <li>Check the numbers we read, then see which supplier is really cheapest, and why.</li>
            </ol>
            <p className="mt-5 text-sm text-ink-3">
              Your quotes are stored privately and are never shared with suppliers.
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
