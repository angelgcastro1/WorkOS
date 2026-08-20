"use client";

import Link, { useLinkStatus } from "next/link";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// A sidebar link that answers you immediately.
//
// Pages here are rendered on the server, so a click can take a moment before the new
// page appears. Without feedback that reads as a dead tap. Three things fix it:
//   1. `active:` styles fire on touch-down, before anything else happens,
//   2. useLinkStatus tells us the moment navigation starts, so the row lights up and
//      the icon becomes a spinner while the page is on its way,
//   3. touch-action / tap-highlight rules stop mobile browsers adding their own delay
//      and grey flash on top.

function NavBody({
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
}) {
  const { pending } = useLinkStatus();
  const lit = active || pending;

  return (
    <span
      className={cn(
        "flex w-full items-center rounded-lg text-sm font-medium transition-colors duration-75",
        collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2",
        lit ? "bg-accent text-accent-foreground" : "text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
        // Pressed state, the instant a finger or mouse goes down.
        "group-active:bg-muted group-active:text-foreground",
      )}
    >
      {pending ? (
        <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin" />
      ) : (
        <Icon className="h-[18px] w-[18px] shrink-0" />
      )}
      {collapsed ? null : <span className="truncate">{label}</span>}
    </span>
  );
}

export function NavLink({
  href,
  label,
  icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className="group block touch-manipulation rounded-lg outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-primary"
    >
      <NavBody label={label} icon={icon} active={active} collapsed={collapsed} />
    </Link>
  );
}
