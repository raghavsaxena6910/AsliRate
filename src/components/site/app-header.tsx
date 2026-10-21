import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { Wordmark } from "./site-chrome";

/** Header for signed-in pages. Static, so it renders instantly. */
export function AppHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Wordmark />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link href="/dashboard" className="rounded-md px-3 py-2 text-[15px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink">
            Comparisons
          </Link>
          <Link
            href="/onboarding"
            className="hidden rounded-md px-3 py-2 text-[15px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink sm:inline-block"
          >
            Company
          </Link>
          <Link href="/billing" className="hidden rounded-md px-3 py-2 text-[15px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink sm:inline-block">
            Plan
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md px-3 py-2 text-[15px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink"
            >
              Log out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
