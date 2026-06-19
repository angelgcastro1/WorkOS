"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Clock, Repeat, Bell } from "lucide-react";
import type { CalendarEvent, Client, Project, Invoice, Reminder, Task, EventType } from "@/lib/data";
import { createEvent, updateEvent, deleteEvent } from "@/app/actions";
import { cn } from "@/lib/utils";

type View = "month" | "week" | "day" | "agenda";

type Props = {
  events: CalendarEvent[];
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
  reminders: Reminder[];
  tasks: Task[];
  todayIso: string;
};

type EditorState = { mode: "new" | "edit"; date: string; event?: CalendarEvent };

type DayItem = {
  key: string;
  kind: "event" | "invoice" | "deadline" | "reminder" | "task";
  title: string;
  time: string | null;
  event?: CalendarEvent;
  href?: string;
  color: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TYPE_COLOR: Record<EventType, string> = {
  meeting: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  deadline: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  task: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  reminder: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  follow_up: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const TYPE_LABEL: Record<EventType, string> = {
  meeting: "Meeting",
  deadline: "Deadline",
  task: "Task",
  reminder: "Reminder",
  follow_up: "Follow-up",
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}
function jsDate(iso: string) {
  const { y, m, d } = parseIso(iso);
  return new Date(y, m - 1, d);
}
function isoFromDate(dt: Date) {
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}
function addDaysIso(iso: string, n: number) {
  const dt = jsDate(iso);
  dt.setDate(dt.getDate() + n);
  return isoFromDate(dt);
}
function addMonthsIso(iso: string, n: number) {
  const dt = jsDate(iso);
  dt.setMonth(dt.getMonth() + n);
  return isoFromDate(dt);
}
function startOfWeekIso(iso: string) {
  const dt = jsDate(iso);
  dt.setDate(dt.getDate() - dt.getDay());
  return isoFromDate(dt);
}
function weekdayOf(iso: string) {
  return jsDate(iso).getDay();
}
function monthLabel(iso: string) {
  return jsDate(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
function shortDate(iso: string) {
  return jsDate(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function weekdayLabel(iso: string) {
  return jsDate(iso).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
function fmtTime(t: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = Number(h);
  const ap = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${m} ${ap}`;
}

function occursOn(ev: CalendarEvent, iso: string): boolean {
  if (iso < ev.date) return false;
  if (ev.repeatRule === "daily") return true;
  if (ev.repeatRule === "weekly") return weekdayOf(iso) === weekdayOf(ev.date);
  if (ev.repeatRule === "monthly") return parseIso(iso).d === parseIso(ev.date).d;
  return iso === ev.date;
}

const fieldClass =
  "w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const labelClass = "mb-1 block text-xs font-medium text-muted-foreground";

export function CalendarClient({ events, clients, projects, invoices, reminders, tasks, todayIso }: Props) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState<string>(todayIso);
  const [editor, setEditor] = useState<EditorState | null>(null);

  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  function itemsForDate(iso: string): DayItem[] {
    const items: DayItem[] = [];
    for (const ev of events) {
      if (occursOn(ev, iso)) {
        items.push({
          key: `e-${ev.id}-${iso}`,
          kind: "event",
          title: ev.title,
          time: ev.startTime,
          event: ev,
          color: TYPE_COLOR[ev.type] ?? TYPE_COLOR.meeting,
        });
      }
    }
    for (const inv of invoices) {
      if (inv.dueOn === iso && inv.status !== "paid") {
        const who = inv.clientId ? clientName.get(inv.clientId) : inv.client;
        items.push({
          key: `inv-${inv.id}`,
          kind: "invoice",
          title: `${inv.invoiceNumber ?? "Invoice"} due${who ? ` · ${who}` : ""}`,
          time: null,
          href: `/invoices/${inv.id}`,
          color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        });
      }
    }
    for (const p of projects) {
      if (p.deadline === iso && p.status !== "done") {
        items.push({
          key: `proj-${p.id}`,
          kind: "deadline",
          title: `${p.name} (deadline)`,
          time: null,
          href: "/projects",
          color: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        });
      }
    }
    for (const r of reminders) {
      if (!r.done && (r.dueAt ?? "").slice(0, 10) === iso) {
        items.push({
          key: `rem-${r.id}`,
          kind: "reminder",
          title: r.title,
          time: r.dueAt.length > 10 ? r.dueAt.slice(11, 16) : null,
          href: "/reminders",
          color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        });
      }
    }
    for (const t of tasks) {
      if (t.due === iso && t.status !== "done") {
        items.push({
          key: `task-${t.id}`,
          kind: "task",
          title: t.title,
          time: null,
          href: "/tasks",
          color: "bg-sky-500/15 text-sky-300 border-sky-500/30",
        });
      }
    }
    items.sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
    return items;
  }

  function shift(dir: number) {
    if (view === "month") setCursor(addMonthsIso(cursor, dir));
    else if (view === "week") setCursor(addDaysIso(cursor, dir * 7));
    else if (view === "day") setCursor(addDaysIso(cursor, dir));
    else setCursor(addDaysIso(cursor, dir * 14));
  }

  const headerLabel =
    view === "month"
      ? monthLabel(cursor)
      : view === "week"
        ? `Week of ${shortDate(startOfWeekIso(cursor))}`
        : view === "day"
          ? weekdayLabel(cursor)
          : `Agenda from ${shortDate(cursor)}`;

  async function handleSave(formData: FormData) {
    if (editor?.mode === "edit" && editor.event) formData.set("id", editor.event.id);
    // Precompute the reminder timestamp in the browser's local time so it fires correctly.
    const date = String(formData.get("event_date") ?? "");
    const rmStr = String(formData.get("reminder_minutes") ?? "");
    const startStr = String(formData.get("start_time") ?? "");
    let reminderAt = "";
    if (date && rmStr !== "") {
      const startLocal = new Date(`${date}T${startStr || "09:00"}:00`);
      if (!Number.isNaN(startLocal.getTime())) {
        reminderAt = new Date(startLocal.getTime() - Number(rmStr) * 60000).toISOString();
      }
    }
    formData.set("reminder_at", reminderAt);
    await (editor?.mode === "edit" ? updateEvent : createEvent)(formData);
    setEditor(null);
  }

  async function handleDelete() {
    if (!editor?.event) return;
    const fd = new FormData();
    fd.set("id", editor.event.id);
    await deleteEvent(fd);
    setEditor(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <button onClick={() => shift(-1)} aria-label="Previous" className="grid h-9 w-9 place-items-center rounded-lg border border-border transition hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => shift(1)} aria-label="Next" className="grid h-9 w-9 place-items-center rounded-lg border border-border transition hover:bg-muted">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={() => setCursor(todayIso)} className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted">
            Today
          </button>
        </div>
        <h2 className="text-lg font-semibold">{headerLabel}</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5 text-sm">
            {(["month", "week", "day", "agenda"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn("rounded-md px-3 py-1.5 capitalize transition", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setEditor({ mode: "new", date: cursor })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> New event
          </button>
        </div>
      </div>

      {view === "month" ? <MonthView cursor={cursor} todayIso={todayIso} itemsForDate={itemsForDate} onAdd={(d) => setEditor({ mode: "new", date: d })} onEdit={(ev) => setEditor({ mode: "edit", date: ev.date, event: ev })} onMore={(d) => { setCursor(d); setView("agenda"); }} /> : null}
      {view === "week" ? <WeekView cursor={cursor} todayIso={todayIso} itemsForDate={itemsForDate} onAdd={(d) => setEditor({ mode: "new", date: d })} onEdit={(ev) => setEditor({ mode: "edit", date: ev.date, event: ev })} /> : null}
      {view === "day" ? <DayView cursor={cursor} todayIso={todayIso} itemsForDate={itemsForDate} onAdd={(d) => setEditor({ mode: "new", date: d })} onEdit={(ev) => setEditor({ mode: "edit", date: ev.date, event: ev })} /> : null}
      {view === "agenda" ? <AgendaView cursor={cursor} todayIso={todayIso} itemsForDate={itemsForDate} onEdit={(ev) => setEditor({ mode: "edit", date: ev.date, event: ev })} /> : null}

      {editor ? (
        <EventEditor
          editor={editor}
          clients={clients}
          projects={projects}
          onClose={() => setEditor(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  );
}

function Chip({ item, onEdit }: { item: DayItem; onEdit: (ev: CalendarEvent) => void }) {
  const content = (
    <span className="flex items-center gap-1 truncate">
      {item.time ? <span className="tabular-nums opacity-80">{fmtTime(item.time)}</span> : null}
      <span className="truncate">{item.title}</span>
    </span>
  );
  if (item.event) {
    return (
      <button onClick={() => onEdit(item.event!)} className={cn("w-full truncate rounded border px-1.5 py-0.5 text-left text-[11px] leading-tight transition hover:brightness-125", item.color)}>
        {content}
      </button>
    );
  }
  return (
    <Link href={item.href ?? "#"} className={cn("block w-full truncate rounded border px-1.5 py-0.5 text-[11px] leading-tight transition hover:brightness-125", item.color)}>
      {content}
    </Link>
  );
}

function MonthView({
  cursor,
  todayIso,
  itemsForDate,
  onAdd,
  onEdit,
  onMore,
}: {
  cursor: string;
  todayIso: string;
  itemsForDate: (iso: string) => DayItem[];
  onAdd: (iso: string) => void;
  onEdit: (ev: CalendarEvent) => void;
  onMore: (iso: string) => void;
}) {
  const { y, m } = parseIso(cursor);
  const firstIso = `${y}-${pad2(m)}-01`;
  const gridStart = startOfWeekIso(firstIso);
  const cells: string[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDaysIso(gridStart, i));

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((iso) => {
          const inMonth = parseIso(iso).m === m;
          const isToday = iso === todayIso;
          const items = itemsForDate(iso);
          const shown = items.slice(0, 3);
          const extra = items.length - shown.length;
          return (
            <div key={iso} className={cn("min-h-24 border-b border-r border-border p-1 last:border-r-0", !inMonth && "bg-muted/20")}>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onAdd(iso)}
                  className={cn(
                    "grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs transition hover:bg-muted",
                    isToday ? "bg-primary font-bold text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground/50",
                  )}
                  aria-label={`Add event on ${iso}`}
                >
                  {parseIso(iso).d}
                </button>
              </div>
              <div className="mt-1 space-y-0.5">
                {shown.map((it) => (
                  <Chip key={it.key} item={it} onEdit={onEdit} />
                ))}
                {extra > 0 ? (
                  <button onClick={() => onMore(iso)} className="w-full rounded px-1.5 text-left text-[11px] text-muted-foreground transition hover:text-foreground">
                    +{extra} more
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  cursor,
  todayIso,
  itemsForDate,
  onAdd,
  onEdit,
}: {
  cursor: string;
  todayIso: string;
  itemsForDate: (iso: string) => DayItem[];
  onAdd: (iso: string) => void;
  onEdit: (ev: CalendarEvent) => void;
}) {
  const start = startOfWeekIso(cursor);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) days.push(addDaysIso(start, i));

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
      {days.map((iso) => {
        const isToday = iso === todayIso;
        const items = itemsForDate(iso);
        return (
          <div key={iso} className={cn("rounded-xl border border-border p-2", isToday && "border-primary/50 bg-primary/5")}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-muted-foreground">{WEEKDAYS[weekdayOf(iso)]}</span>{" "}
                <span className={cn("font-semibold", isToday && "text-primary")}>{parseIso(iso).d}</span>
              </div>
              <button onClick={() => onAdd(iso)} aria-label={`Add event on ${iso}`} className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              {items.length === 0 ? <p className="px-1 py-2 text-[11px] text-muted-foreground/60">—</p> : items.map((it) => <Chip key={it.key} item={it} onEdit={onEdit} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgendaView({
  cursor,
  todayIso,
  itemsForDate,
  onEdit,
}: {
  cursor: string;
  todayIso: string;
  itemsForDate: (iso: string) => DayItem[];
  onEdit: (ev: CalendarEvent) => void;
}) {
  const days: { iso: string; items: DayItem[] }[] = [];
  for (let i = 0; i < 45; i++) {
    const iso = addDaysIso(cursor, i);
    const items = itemsForDate(iso);
    if (items.length > 0) days.push({ iso, items });
  }

  if (days.length === 0) {
    return <p className="rounded-xl border border-border py-12 text-center text-sm text-muted-foreground">Nothing scheduled in the next 45 days.</p>;
  }

  return (
    <div className="space-y-3">
      {days.map(({ iso, items }) => (
        <div key={iso} className="rounded-xl border border-border p-3">
          <p className={cn("mb-2 text-sm font-semibold", iso === todayIso && "text-primary")}>{iso === todayIso ? "Today · " : ""}{weekdayLabel(iso)}</p>
          <div className="space-y-1.5">
            {items.map((it) =>
              it.event ? (
                <button key={it.key} onClick={() => onEdit(it.event!)} className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-left transition hover:bg-muted">
                  <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide", it.color)}>{it.event ? TYPE_LABEL[it.event.type] : ""}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{it.title}</span>
                  {it.time ? <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{fmtTime(it.time)}</span> : null}
                </button>
              ) : (
                <Link key={it.key} href={it.href ?? "#"} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 transition hover:bg-muted">
                  <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide", it.color)}>{it.kind}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{it.title}</span>
                </Link>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DayView({
  cursor,
  todayIso,
  itemsForDate,
  onAdd,
  onEdit,
}: {
  cursor: string;
  todayIso: string;
  itemsForDate: (iso: string) => DayItem[];
  onAdd: (iso: string) => void;
  onEdit: (ev: CalendarEvent) => void;
}) {
  const items = itemsForDate(cursor);
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className={cn("text-sm font-semibold", cursor === todayIso && "text-primary")}>{cursor === todayIso ? "Today · " : ""}{weekdayLabel(cursor)}</p>
        <button onClick={() => onAdd(cursor)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-muted">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nothing scheduled this day.</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((it) =>
            it.event ? (
              <button key={it.key} onClick={() => onEdit(it.event!)} className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-left transition hover:bg-muted">
                <span className="w-16 shrink-0 text-xs tabular-nums text-muted-foreground">{it.time ? fmtTime(it.time) : "all day"}</span>
                <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide", it.color)}>{TYPE_LABEL[it.event.type]}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{it.title}</span>
              </button>
            ) : (
              <Link key={it.key} href={it.href ?? "#"} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 transition hover:bg-muted">
                <span className="w-16 shrink-0 text-xs text-muted-foreground">{it.time ? fmtTime(it.time) : "—"}</span>
                <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide", it.color)}>{it.kind}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{it.title}</span>
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function EventEditor({
  editor,
  clients,
  projects,
  onClose,
  onSave,
  onDelete,
}: {
  editor: EditorState;
  clients: Client[];
  projects: Project[];
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const ev = editor.event;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="mt-10 w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{editor.mode === "edit" ? "Edit event" : "New event"}</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground/70 transition hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={onSave} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Title</label>
            <input name="title" defaultValue={ev?.title ?? ""} required placeholder="e.g. Client kickoff call" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select name="type" defaultValue={ev?.type ?? "meeting"} className={fieldClass}>
              <option value="meeting">Meeting</option>
              <option value="deadline">Deadline</option>
              <option value="task">Task</option>
              <option value="reminder">Reminder</option>
              <option value="follow_up">Follow-up</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input name="event_date" type="date" defaultValue={ev?.date ?? editor.date} required className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Start time</label>
            <input name="start_time" type="time" defaultValue={(ev?.startTime ?? "").slice(0, 5)} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>End time</label>
            <input name="end_time" type="time" defaultValue={(ev?.endTime ?? "").slice(0, 5)} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Client</label>
            <select name="client_id" defaultValue={ev?.clientId ?? ""} className={fieldClass}>
              <option value="">— None —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Project</label>
            <select name="project_id" defaultValue={ev?.projectId ?? ""} className={fieldClass}>
              <option value="">— None —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Repeat</label>
            <select name="repeat_rule" defaultValue={ev?.repeatRule ?? "none"} className={fieldClass}>
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Reminder</label>
            <select name="reminder_minutes" defaultValue={ev?.reminderMinutes == null ? "" : String(ev.reminderMinutes)} className={fieldClass}>
              <option value="">No reminder</option>
              <option value="0">At time of event</option>
              <option value="10">10 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="1440">1 day before</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Remind via</label>
            <select name="reminder_channel" defaultValue={ev?.reminderChannel ?? "both"} className={fieldClass}>
              <option value="both">Email + in-app</option>
              <option value="email">Email only</option>
              <option value="in_app">In-app only</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Meeting link</label>
            <input name="meeting_link" type="url" defaultValue={ev?.meetingLink ?? ""} placeholder="https://meet.google.com/…" className={fieldClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea name="notes" defaultValue={ev?.notes ?? ""} rows={2} placeholder="Any extra details…" className={cn(fieldClass, "resize-y")} />
          </div>

          <div className="mt-1 border-t border-border pt-3 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meeting details</p>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Attendees</label>
            <input name="attendees" defaultValue={ev?.attendees ?? ""} placeholder="Comma-separated names or emails" className={fieldClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Agenda</label>
            <textarea name="agenda" defaultValue={ev?.agenda ?? ""} rows={2} placeholder="What you'll cover" className={cn(fieldClass, "resize-y")} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Action items</label>
            <textarea name="action_items" defaultValue={ev?.actionItems ?? ""} rows={2} placeholder="One per line" className={cn(fieldClass, "resize-y")} />
          </div>

          <div className="mt-1 flex items-center gap-2 sm:col-span-2">
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110">
              {editor.mode === "edit" ? "Save changes" : "Create event"}
            </button>
            {editor.mode === "edit" ? (
              <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            ) : null}
            <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Repeat className="h-3.5 w-3.5" /> repeat</span>
              <span className="flex items-center gap-1"><Bell className="h-3.5 w-3.5" /> reminders</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> times</span>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
