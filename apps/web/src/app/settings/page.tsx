import Link from "next/link";
import { SlidersHorizontalIcon, ZapIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  {
    href: "/settings/general",
    label: "General",
    description: "App behaviour and preferences",
    icon: SlidersHorizontalIcon,
    disabled: false,
  },
  {
    href: "/settings/wled",
    label: "WLED",
    description: "Devices and LED configuration",
    icon: ZapIcon,
    disabled: false,
  },
  {
    href: "#",
    label: "Coming soon",
    description: "More settings on the way",
    icon: null,
    disabled: true,
  },
  {
    href: "#",
    label: "Coming soon",
    description: "More settings on the way",
    icon: null,
    disabled: true,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <div className="grid grid-cols-2 gap-3">
        {categories.map(({ href, label, description, icon: Icon, disabled }, i) => {
          const card = (
            <div
              className={cn(
                "group rounded-xl border border-border bg-card p-5 flex flex-col gap-4 transition-colors",
                disabled
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-accent cursor-pointer"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                disabled ? "bg-muted" : "bg-primary/10"
              )}>
                {Icon && (
                  <Icon className={cn(
                    "h-5 w-5",
                    disabled ? "text-muted-foreground" : "text-primary"
                  )} />
                )}
              </div>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                {!disabled && (
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            </div>
          );

          return disabled ? (
            <div key={i}>{card}</div>
          ) : (
            <Link key={href} href={href}>{card}</Link>
          );
        })}
      </div>
    </div>
  );
}
