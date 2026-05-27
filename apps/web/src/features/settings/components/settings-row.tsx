import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  description?: string;
  control?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function SettingsRow({
  label,
  description,
  control,
  children,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-col gap-3 px-4 py-3", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {control && <div className="shrink-0">{control}</div>}
      </div>
      {children}
    </div>
  );
}
