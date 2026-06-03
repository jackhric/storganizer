"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoxIcon, LinkIcon, SettingsIcon, TagIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { LogoMark } from "@/components/logo-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Items", icon: BoxIcon },
  { href: "/assignments", label: "Assignments", icon: LinkIcon },
  { href: "/tags", label: "Tags", icon: TagIcon },
];

export function AppSidebar() {
  const rawPathname = usePathname();
  // `trailingSlash: true` in next.config makes usePathname return e.g.
  // "/assignments/", so strip the trailing slash before comparing to hrefs.
  const pathname =
    rawPathname !== "/" ? rawPathname.replace(/\/$/, "") : rawPathname;

  return (
    <Sidebar collapsible="icon">
      <div
        aria-hidden
        className="sidebar-grid-mask pointer-events-none opacity-80 group-data-[collapsible=icon]:opacity-60"
      >
        <div className="sidebar-grid" />
      </div>
      <SidebarHeader className="px-4 py-5 flex flex-col items-center justify-center gap-2">
        <Link href="/">
          <Logo className="h-6 w-auto text-foreground group-data-[collapsible=icon]:hidden" />
          <LogoMark className="h-6 w-auto text-foreground hidden group-data-[collapsible=icon]:block" />
        </Link>
        <Badge
          variant="outline"
          className="text-[10px] font-mono text-muted-foreground/60 group-data-[collapsible=icon]:hidden gap-1.5"
        >
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75 animation-duration-[2s]" />
            <span className="relative inline-flex size-1.5 rounded-full bg-green-500" />
          </span>
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </Badge>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href} className="my-1">
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    isActive={pathname === href}
                    tooltip={label}
                    className="h-10 bg-sidebar/80 border border-sidebar-border backdrop-blur-sm"
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        pathname === href
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/settings" />}
              isActive={pathname === "/settings"}
              tooltip="Settings"
              className="h-10 bg-sidebar/80 border border-sidebar-border backdrop-blur-sm"
            >
              <SettingsIcon
                className={cn(
                  "h-4 w-4 shrink-0",
                  pathname === "/settings"
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
