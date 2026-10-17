import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileForm } from "@/components/auth/profile-form";
import { AppHeader } from "@/components/site/app-header";
import { SiteFooter } from "@/components/site/site-chrome";
import { getProfile, requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Your company" };

export default function OnboardingPage() {
  return (
    <>
      <AppHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink">About your company</h1>
          <p className="mt-2 mb-8 max-w-[60ch] text-lg leading-relaxed text-ink-2">
            These details change the maths: GST credit depends on your registration, and the value of credit terms depends
            on what money costs you.
          </p>
          <Suspense fallback={<p className="text-ink-3">Loading your details…</p>}>
            <ProfileLoader />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

async function ProfileLoader() {
  const user = await requireUser("/onboarding");
  const profile = await getProfile(user.id);
  if (!profile) {
    return <p className="text-danger">We couldn&rsquo;t find your account details. Log out and log in again.</p>;
  }
  return <ProfileForm profile={profile} firstTime={!profile.onboarded_at} />;
}
