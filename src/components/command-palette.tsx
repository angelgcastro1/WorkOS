"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createTask, createEvent, createNote } from "@/app/actions";
import { cn } from "@/lib/utils";

type CmdItem = { id: string; label: string; sub?: string; href: string; group: string; create?: "task" | "event" | "note" };

const GROUP_ORDER = ["Go to", "Create", "Tasks", "Projects", "Notes", "Clients", "Invoices", "Events", "Reminders"];

const NAV: CmdItem[] = [
  { id: "nav-dash", label: "Dashboard", href: "/", group: "Go to" },
  { id: "nav-proj", label: "Projects", href: "/projects", group: "Go to" },
  { id: "nav-tasks", label: "Tasks", href: "/tasks", group: "Go to" },
  { id: "nav-rem", label: "Reminders", href: "/reminders", group: "Go to" },
  { id: "nav-cal", label: "Calendar", href: "/calendar", group: "Go to" },
  { id: "nav-jobs", label: "Jobs", href: "/jobs", group: "Go to" },
  { id: "nav-inv", label: "Invoices", href: "/invoices", group: "Go to" },
  { id: "nav-time", label: "Time", href: "/time", group: "Go to" },
  { id: "nav-metrics", label: "Metrics", href: "/metrics", group: "Go to" },
  { id: "nav-notes", label: "Notes", href: "/notes", group: "Go to" },
  { id: "nav-wb", label: "Whiteboards", href: "/whiteboards", group: "Go to" },
  { id: "nav-set", label: "Settings", href: "/settings", group: "Go to" },
];

const CREATE: CmdItem[] = [
  { id: "new-event", label: "New event", href: "/calendar", group: "Create" },
  { id: "new-invoice", label: "New invoice", href: "/invoices/new", group: "Create" },
  { id: "new-task", label: "New task", href: "/tasks", group: "Create" },
  { id: "new-client", label: "New client", href: "/clients", group: "Create" },
];

type Data = {
  tasks: { id: string; title: string }[];
  projects: { id: string; name: string }[];
  notes: { id: string; title: string }[];
  clients: { id: string; name: string; company: string | null }[];
  invoices: { id: string; invoice_number: string | null; client: string | null }[];
  events: { id: string; title: string; event_date: string }[];
  reminders: { id: string; title: string }[];
};

const EMPTY: Data = { tasks: [], projects: [], notes: [], clients: [], invoices: [], events: [], reminders: [] };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<Data>(EMPTY);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open || loaded) return;
    let active = true;
    (async () => {
      const supabase = createClient();
      const [t, p, n, c, inv, ev, rem] = await Promise.all([
        supabase.from("tasks").select("id, title").limit(50),
        supabase.from("projects").select("id, name").limit(50),
        supabase.from("notes").select("id, title").limit(50),
        supabase.from("clients").select("id, name, company").limit(50),
        supabase.from("invoices").select("id, invoice_number, client").limit(50),
        supabase.from("events").select("id, title, event_date").limit(50),
        supabase.from("reminders").select("id, title").eq("done", false).limit(50),
      ]);
      if (!active) return;
      setData({
        tasks: (t.data ?? []) as Data["tasks"],
        projects: (p.data ?? []) as Data["projects"],
        notes: (n.data ?? []) as Data["notes"],
        clients: (c.data ?? []) as Data["clients"],
        invoices: (inv.data ?? []) as Data["invoices"],
        events: (ev.data ?? []) as Data["events"],
        reminders: (rem.data ?? []) as Data["reminders"],
      });
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [open, loaded]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    if (el) (el as HTMLElement).scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, query]);

  function close() {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  async function go(it: CmdItem) {
    if (it.create) {
      const fd = new FormData();
      fd.set("title", query.trim());
      if (it.create === "event") fd.set("event_date", new Date().toISOString().slice(0, 10));
      const fn = it.create === "task" ? createTask : it.create === "event" ? createEvent : createNote;
      await fn(fd);
    }
    close();
    router.push(it.href);
    router.refresh();
  }

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const dyn: CmdItem[] = [
    ...data.tasks.map((x) => ({ id: `t-${x.id}`, label: x.title, href: "/tasks", group: "Tasks" })),
    ...data.projects.map((x) => ({ id: `p-${x.id}`, label: x.name, href: "/projects", group: "Projects" })),
    ...data.notes.map((x) => ({ id: `n-${x.id}`, label: x.title, href: "/notes", group: "Notes" })),
    ...data.clients.map((x) => ({ id: `c-${x.id}`, label: x.name, sub: x.company ?? undefined, href: "/clients", group: "Clients" })),
    ...data.invoices.map((x) => ({ id: `i-${x.id}`, label: x.invoice_number ?? "Invoice", sub: x.client ?? undefined, href: `/invoices/${x.id}`, group: "Invoices" })),
    ...data.events.map((x) => ({ id: `e-${x.id}`, label: x.title, sub: x.event_date, href: "/calendar", group: "Events" })),
    ...data.reminders.map((x) => ({ id: `r-${x.id}`, label: x.title, href: "/reminders", group: "Reminders" })),
  ];

  const trimmed = query.trim();
  const createGroup: CmdItem[] = trimmed
    ? [
        { id: "mk-task", label: `Create task “${trimmed}”`, href: "/tasks", group: "Create", create: "task" },
        { id: "mk-event", label: `Create event “${trimmed}” today`, href: "/calendar", group: "Create", create: "event" },
        { id: "mk-note", label: `Create note “${trimmed}”`, href: "/notes", group: "Create", create: "note" },
      ]
    : CREATE;
  const all = q ? [...NAV, ...createGroup, ...dyn] : [...NAV, ...createGroup];
  const pool = all
    .filter((it) => !q || it.label.toLowerCase().includes(q) || (it.sub ? it.sub.toLowerCase().includes(q) : false))
    .sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group))
    .slice(0, 40);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, pool.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = pool[activeIndex];
      if (it) go(it);
    } else if (e.key === "Escape") {
      close();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={close}>
      <div className="mt-[10vh] w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search or jump to…"
            className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {pool.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No matches{loaded ? "" : " — loading…"}</p>
          ) : (
            pool.map((it, i) => {
              const showHeader = i === 0 || pool[i - 1].group !== it.group;
              return (
                <Fragment key={it.id}>
                  {showHeader ? <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{it.group}</p> : null}
                  <button
                    data-idx={i}
                    onMouseMove={() => setActiveIndex(i)}
                    onClick={() => go(it)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition",
                      i === activeIndex ? "bg-primary/15" : "hover:bg-muted",
                    )}
                  >
                    {it.group === "Create" ? (
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{it.label}</span>
                    {it.sub ? <span className="shrink-0 truncate text-xs text-muted-foreground">{it.sub}</span> : null}
                    {i === activeIndex ? <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
                  </button>
                </Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
