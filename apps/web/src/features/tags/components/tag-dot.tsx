"use client";

import { cn } from "@/lib/utils";

type Props = {
  label: string;
  color: string;
  className?: string;
};

export function TagDot({ label, color, className }: Props) {
  return (
    <span className={cn("group/tagdot relative inline-flex", className)}>
      <span
        className="pointer-events-auto block h-4 w-4 cursor-pointer rounded-full ring-1 ring-black/20"
        style={{ backgroundColor: color }}
        aria-label={label}
      />
      <span
        className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-0.5 text-xs font-medium text-background opacity-0 shadow-md transition-opacity duration-100 group-hover/tagdot:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

type OverflowProps = {
  count: number;
  hiddenTags: { name: string; color: string }[];
  className?: string;
};

export function TagOverflowDot({ count, hiddenTags, className }: OverflowProps) {
  return (
    <span className={cn("group/tagdot relative inline-flex", className)}>
      <span className="pointer-events-auto flex h-4 min-w-4 cursor-pointer items-center justify-center rounded-full bg-white/25 px-1 text-[10px] font-semibold leading-none text-white ring-1 ring-black/20 backdrop-blur-sm">
        +{count}
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 flex -translate-x-1/2 flex-col items-stretch gap-0.5 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-md transition-opacity duration-100 group-hover/tagdot:opacity-100">
        {hiddenTags.map((t) => (
          <span key={t.name} className="flex items-center gap-1.5">
            <span
              className="block h-2 w-2 shrink-0 rounded-full ring-1 ring-white/20"
              style={{ backgroundColor: t.color }}
            />
            {t.name}
          </span>
        ))}
      </span>
    </span>
  );
}
