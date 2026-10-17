"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

/** A compact one-of-N picker (e.g. GST included / extra), built on Radix RadioGroup. */
function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  className,
  ...props
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      orientation="horizontal"
      className={cn("inline-flex w-full rounded-md border border-input bg-paper-2 p-0.5", className)}
      {...props}
    >
      {options.map((o) => (
        <RadioGroupPrimitive.Item
          key={o.value}
          value={o.value}
          className={cn(
            "flex-1 whitespace-nowrap rounded-[5px] px-2.5 py-1.5 text-sm font-medium text-ink-2 transition-colors",
            "data-[state=checked]:bg-white data-[state=checked]:text-ink data-[state=checked]:shadow-[0_0_0_1px_var(--line-2)]",
            "focus-visible:outline-2 focus-visible:outline-carbon",
          )}
        >
          {o.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}

export { Segmented };
