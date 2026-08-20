"use client";

import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut, X } from "lucide-react";
import type { Profile } from "@/lib/data";
import { BrandMark } from "@/components/brand-mark";
import { NavLink } from "@/components/nav-link";
import { signOut } from "@/app/actions";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon };

// The phone menu: a drawer that slides in from the left, holding the same list as the
// desktop sidebar. It closes when you pick something, tap outside, or press Escape.
export function MobileNav({
  items,
  pathname,
  profile,
  open,
  onClose,
}: {
  items: Item[];
  pathname: string;
  profile: Profile | null;
  open: boolean;
  onClose: () => void;
}) {
  // Escape closes it, and the page behind stops scrolling while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const initials = profile?.name?.trim()?.[0]?.toUpperCase() ?? "W";

  return (
    <div className={cn("md:hidden", open ? "" : "pointer-events-none")} aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-xs flex-col border-r border-border bg-sidebar shadow-2xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center gap-2.5 px-4 pb-4 pt-4">
          <BrandMark height={34} className="shadow-lg shadow-indigo-500/20" />
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-none">WorkCham</p>
            <p className="text-[11px] text-muted-foreground">Personal command center</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition active:bg-muted active:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Its own scroll area, so swiping the menu never drags the page behind it. */}
        <nav className="flex min-h-0 flex-1 touch-pan-y flex-col gap-1 overflow-y-auto overscroll-contain px-3 pb-3">
          {items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
              collapsed={false}
              onNavigate={onClose}
            />
          ))}
        </nav>

        <div className="mx-3 mb-3 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile?.name ?? "You"}</p>
            <p className="truncate text-xs text-muted-foreground">{profile?.role ?? "Member"}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition active:bg-muted active:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
