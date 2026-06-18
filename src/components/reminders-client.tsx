"use client";

import { useRef, useSyncExternalStore } from "react";
import { Plus, Check, RotateCcw, Trash2, Clock } from "lucide-react";
import type { Reminder } from "@/lib/data";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { createReminder, toggleReminder, deleteReminder } from "@/app/actions";

const fieldClass =
  "rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function Row({ reminder, overdue }: { reminder: Reminder; overdue: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <form action={toggleReminder}>
        <input type="hidden" name="id" value={reminder.id} />
        <input type="hidden" name="done" value={String(reminder.done)} />
        <button
          type="submit"
          aria-label={reminder.done ? "Mark not done" : "Mark done"}
          className={cn(
            "grid h-5 w-5 place-items-center rounded-md border-2 transition",
            reminder.done
              ? "border-emerald-400 bg-emerald-400 text-white"
              : "border-muted-foreground/50 text-transparent hover:border-emerald-400 hover:text-emerald-400",
          )}
        >
          {reminder.done ? <RotateCcw className="h-3 w-3" /> : <Check className="h-3 w-3" />}
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", reminder.done && "text-muted-foreground line-through")}>{reminder.title}</p>
        <p className={cn("flex items-center gap-1 text-xs", overdue && !reminder.done ? "font-semibold text-red-400" : "text-muted-foreground")}>
          <Clock className="h-3 w-3" /> {formatWhen(reminder.dueAt)}
          {reminder.note ? <span className="text-muted-foreground"> · {reminder.note}</span> : null}
        </p>
      </div>
      <form action={deleteReminder}>
        <input type="hidden" name="id" value={reminder.id} />
        <button type="submit" aria-label="Delete reminder" className="text-muted-foreground/60 transition hover:text-red-400">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

export function RemindersClient({ reminders }: { reminders: Reminder[] }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const formRef = useRef<HTMLFormElement>(null);

  async function addAction(formData: FormData) {
    const local = formData.get("due_local")?.toString();
    if (local) formData.set("due_at", new Date(local).toISOString());
    await createReminder(formData);
    formRef.current?.reset();
  }

  // eslint-disable-next-line react-hooks/purity -- one-time "now" for grouping; recomputing on render is harmless here
  const now = Date.now();
  const active = reminders.filter((r) => !r.done);
  const overdue = active.filter((r) => new Date(r.dueAt).getTime() < now);
  const upcoming = active.filter((r) => new Date(r.dueAt).getTime() >= now);
  const done = reminders.filter((r) => r.done);

  return (
    <div className="space-y-5">
      <Card>
        <form ref={formRef} action={addAction} className="flex flex-wrap items-end gap-2 p-3">
          <input name="title" required placeholder="Remind me to…" className={cn(fieldClass, "min-w-50 flex-1")} />
          <input name="due_local" type="datetime-local" required className={fieldClass} aria-label="When" />
          <input name="note" placeholder="Note (optional)" className={cn(fieldClass, "w-40")} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
      </Card>

      {!mounted ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading reminders…</p>
      ) : reminders.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No reminders yet — add one above.</p>
      ) : (
        <div className="space-y-5">
          {overdue.length > 0 ? (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-400">Overdue · {overdue.length}</h2>
              <div className="space-y-2">
                {overdue.map((r) => (
                  <Row key={r.id} reminder={r} overdue />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upcoming · {upcoming.length}</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing coming up.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((r) => (
                  <Row key={r.id} reminder={r} overdue={false} />
                ))}
              </div>
            )}
          </section>

          {done.length > 0 ? (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Done · {done.length}</h2>
              <div className="space-y-2">
                {done.map((r) => (
                  <Row key={r.id} reminder={r} overdue={false} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
