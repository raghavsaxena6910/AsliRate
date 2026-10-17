"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Height of the sticky site header the layers tuck under. */
const HEADER_PX = 64;
/** Only stack on screens big enough for it to read well. */
const STACK_QUERY = "(min-width: 768px) and (min-height: 640px)";

/**
 * A landing-page section that pins in place while the next section slides
 * over it, like sheets of paper. Pure scrolling: nothing animates on its own.
 *
 * A section taller than the screen pins by its bottom edge instead of its top,
 * so all of its content scrolls into view before the next sheet covers it.
 * On phones and short screens the sections scroll normally.
 */
export function Layer({
  index,
  id,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  /** Stacking order: later sections sit on top. 0 = the first sheet. */
  index: number;
  id?: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia(STACK_QUERY);

    const apply = () => {
      if (!mq.matches) {
        el.style.position = "";
        el.style.top = "";
        el.style.zIndex = "";
        return;
      }
      const top = Math.min(HEADER_PX, window.innerHeight - el.offsetHeight);
      el.style.position = "sticky";
      el.style.top = `${top}px`;
      el.style.zIndex = String(index + 1);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    mq.addEventListener("change", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
      mq.removeEventListener("change", apply);
    };
  }, [index]);

  return (
    <section
      ref={ref}
      id={id}
      aria-label={ariaLabel}
      className={cn(
        "relative",
        // Every sheet after the first gets a rounded top edge and a soft shadow cast upward.
        index > 0 && "md:rounded-t-[32px] md:shadow-[0_-28px_56px_-30px_rgba(5,77,39,0.28)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
