"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Folder,
  ListTodo,
  BarChart3,
  StickyNote,
  Settings,
  Search,
  Plus,
  Menu,
  LogOut,
  Bell,
  Shapes,
  Briefcase,
  Receipt,
  Timer,
  CalendarDays,
  Sparkles,
  Users,
  Inbox,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/nav-link";
import { MobileNav } from "@/components/mobile-nav";
import type { Profile } from "@/lib/data";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReminderAlerts } from "@/components/reminder-alerts";
import { CommandPalette } from "@/components/command-palette";
import { BrandMark } from "@/components/brand-mark";
import { signOut } from "@/app/actions";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assistant", label: "Assistant", icon: Sparkles },
  { href: "/projects", label: "Projects", icon: Folder },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/intake", label: "Intake", icon: Inbox },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/time", label: "Time", icon: Timer },
  { href: "/metrics", label: "Metrics", icon: BarChart3 },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/whiteboards", label: "Whiteboards", icon: Shapes },
  { href: "/settings", label: "Settings", icon: Settings },
];

const COLLAPSE_KEY = "workcham-sidebar-collapsed";

type Props = {
  profile: Profile | null;
  children: ReactNode;
};

export function AppShell({ profile, children }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  // Phones have no room for the sidebar, so they get a drawer instead.
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the saved preference once on mount
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  if (pathname === "/login" || pathname.startsWith("/invoice/") || pathname.startsWith("/intake/form")) return <>{children}</>;

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // storage may be unavailable; the toggle still works for this session
      }
      return next;
    });
  }

  const initials = profile?.name?.trim()?.[0]?.toUpperCase() ?? "W";

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-200 md:flex",
          collapsed ? "w-[76px] p-3" : "w-64 p-4",
        )}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 pb-6 pt-1">
            <BrandMark height={34} className="shadow-lg shadow-indigo-500/20" />
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-2 pb-6 pt-1">
            <BrandMark height={36} className="shadow-lg shadow-indigo-500/20" />
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-none">WorkCham</p>
              <p className="text-[11px] text-muted-foreground">Personal command center</p>
            </div>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Its own scroll area with overscroll-contain, so swiping the menu on a tablet
            scrolls the menu instead of dragging the whole page up and down. */}
        <nav className="flex min-h-0 flex-1 touch-pan-y flex-col gap-1 overflow-y-auto overscroll-contain">
          {nav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="mt-3 shrink-0 space-y-2 border-t border-border pt-3">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{initials}</div>
              <form action={signOut}>
                <button
                  type="submit"
                  aria-label="Sign out"
                  title="Sign out"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{profile?.name ?? "You"}</p>
                <p className="truncate text-xs text-muted-foreground">{profile?.role ?? "Member"}</p>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  aria-label="Sign out"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-5 py-3 backdrop-blur md:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="grid h-10 w-10 shrink-0 touch-manipulation place-items-center rounded-lg border border-border bg-card text-foreground transition active:bg-muted [-webkit-tap-highlight-color:transparent] md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="flex touch-manipulation items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted active:bg-muted active:text-foreground [-webkit-tap-highlight-color:transparent]"
          >
            <Search className="h-4 w-4" />
            <span className="hidden text-left md:inline md:w-48">Search…</span>
            <kbd className="ml-1 hidden rounded border border-border px-1.5 text-[10px] md:inline">⌘K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/tasks"
              className="inline-flex touch-manipulation items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110 active:brightness-95 [-webkit-tap-highlight-color:transparent]"
            >
              <Plus className="h-4 w-4" /> New
            </Link>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">{children}</main>
      </div>
      <MobileNav items={nav} pathname={pathname} profile={profile} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <ReminderAlerts />
      <CommandPalette />
    </div>
  );
}
