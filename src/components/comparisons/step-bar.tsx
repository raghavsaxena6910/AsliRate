import { cn } from "@/lib/utils";

const STEPS = ["What you're buying", "Add quotes", "Check numbers", "Results"];

export function StepBar({ current }: { current: number }) {
  return (
    <nav aria-label="Progress" className="mb-10">
      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === current ? "step" : undefined}>
            <div className={cn("h-1 rounded-full", i <= current ? "bg-brand" : "bg-line")} />
            <p className={cn("mt-2 text-[12.5px] leading-tight sm:text-sm", i === current ? "font-semibold text-ink" : "text-ink-3")}>
              <span className="num">{i + 1}.</span> <span className="hidden sm:inline">{label}</span>
              <span className="sr-only sm:hidden">{label}</span>
            </p>
          </li>
        ))}
      </ol>
    </nav>
  );
}
