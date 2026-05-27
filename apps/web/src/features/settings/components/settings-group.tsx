import type { ReactNode } from "react";

type Props = {
  label?: string;
  description?: string;
  children: ReactNode;
};

export function SettingsGroup({ label, description, children }: Props) {
  return (
    <section className="space-y-2">
      {label && (
        <div className="px-3">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </h2>
        </div>
      )}
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {children}
      </div>
      {description && (
        <p className="px-3 text-xs text-muted-foreground">{description}</p>
      )}
    </section>
  );
}
