"use client";

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
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/data";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/app/actions";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Folder },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/metrics", label: "Metrics", icon: BarChart3 },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/settings", label: "Settings", icon: Settings },
];

type Props = {
  profile: Profile | null;
  children: ReactNode;
};

export function AppShell({ profile, children }: Props) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;

  const initials = profile?.name?.trim()?.[0]?.toUpperCase() ?? "W";

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar p-4 md:flex">
        <div className="flex items-center gap-2.5 px-2 pb-6 pt-1">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
            W
          </div>
          <div>
            <p className="text-[15px] font-bold leading-none">WorkOS</p>
            <p className="text-[11px] text-muted-foreground">Personal command center</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </div>
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
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-5 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground">
            <Search className="h-4 w-4" />
            <input
              placeholder="Search…"
              className="w-32 bg-transparent text-sm outline-none placeholder:text-muted-foreground md:w-56"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" /> New
            </Link>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
