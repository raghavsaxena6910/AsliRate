import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:py-16">
          <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink">Log in</h1>
          <p className="mt-2 mb-8 text-lg text-ink-2">Welcome back.</p>
          <Suspense fallback={<div className="h-72" aria-hidden />}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
