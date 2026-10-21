import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import mark from "@/assets/aslirate-mark.png";

/** Logo mark + two-tone wordmark, echoing the logo's "Asli" / "Rate" split. */
export function Wordmark({ className = "", size = 42 }: { className?: string; size?: number }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`} aria-label="AsliRate home">
      <Image src={mark} alt="" width={size} height={size} priority className="shrink-0" />
      <span className="text-[21px] leading-none font-extrabold tracking-[-0.02em]">
        <span className="text-ink">Asli</span>
        <span className="text-brand">Rate</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ showDemoCta = true }: { showDemoCta?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Wordmark />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/#how-it-works">How it works</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/pricing">Pricing</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          {showDemoCta && (
            <Button asChild size="sm">
              <Link href="/demo">
                <span className="sm:hidden">Demo</span>
                <span className="hidden sm:inline">Try the demo</span>
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-paper-2">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Wordmark size={30} />
          <span>Compare supplier quotes. Find the real rate.</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/demo" className="hover:text-ink">
            Demo
          </Link>
          <Link href="/pricing" className="hover:text-ink">
            Pricing
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/refunds" className="hover:text-ink">
            Refunds
          </Link>
          <Link href="/contact" className="hover:text-ink">
            Contact
          </Link>
          <span>© 2026 AsliRate</span>
        </nav>
      </div>
    </footer>
  );
}
