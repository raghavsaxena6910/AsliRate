import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 text-ink ${className}`} aria-label="AsliRate home">
      {/* A rubber-stamp ₹: the brand's single mark. */}
      <span
        aria-hidden
        className="grid size-8 -rotate-6 place-items-center rounded-md border-2 border-stamp text-[17px] font-bold text-stamp"
      >
        ₹
      </span>
      <span className="text-[19px] font-bold tracking-[-0.01em]">AsliRate</span>
    </Link>
  );
}

export function SiteHeader({ showDemoCta = true }: { showDemoCta?: boolean }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Wordmark />
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/#how-it-works">How it works</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          {showDemoCta && (
            <Button asChild size="sm">
              <Link href="/demo">Try the demo</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <Wordmark className="scale-90 origin-left" />
          <span>Compare supplier quotes. Find the real rate.</span>
        </div>
        <div className="flex gap-5">
          <Link href="/demo" className="hover:text-ink">
            Demo
          </Link>
          <span>© 2026 AsliRate</span>
        </div>
      </div>
    </footer>
  );
}
