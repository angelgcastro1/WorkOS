"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DueItem = { id: string; title: string };

// Latest occurrence reminder timestamp (ms) at or before now, honoring the repeat rule.
function latestDueMs(reminderIso: string, rule: string, nowMs: number): number | null {
  const baseMs = new Date(reminderIso).getTime();
  if (Number.isNaN(baseMs) || baseMs > nowMs) return null;
  if (rule === "daily") return baseMs + Math.floor((nowMs - baseMs) / 86400000) * 86400000;
  if (rule === "weekly") return baseMs + Math.floor((nowMs - baseMs) / 604800000) * 604800000;
  if (rule === "monthly") {
    const d = new Date(baseMs);
    for (let i = 0; i < 600; i++) {
      const n = new Date(d);
      n.setUTCMonth(n.getUTCMonth() + 1);
      if (n.getTime() > nowMs) break;
      d.setTime(n.getTime());
    }
    return d.getTime();
  }
  return baseMs;
}

export function ReminderAlerts() {
  const [toasts, setToasts] = useState<DueItem[]>([]);
  const alerted = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    const supabase = createClient();

    function notify(items: DueItem[]) {
      const fresh = items.filter((i) => !alerted.current.has(i.id));
      if (fresh.length === 0) return;
      for (const i of fresh) {
        alerted.current.add(i.id);
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("WorkCham reminder", { body: i.title });
          } catch {
            // notifications may be blocked; the in-app toast still shows
          }
        }
      }
      setToasts((prev) => [...prev, ...fresh]);
    }

    async function check() {
      const now = new Date();
      const nowIso = now.toISOString();
      const nowMs = now.getTime();

      const { data: remData } = await supabase.from("reminders").select("id, title").eq("done", false).lte("due_at", nowIso);
      const rems = (remData ?? []) as { id: string; title: string }[];
      notify(rems.map((r) => ({ id: `rem:${r.id}`, title: r.title })));

      const { data: evData } = await supabase
        .from("events")
        .select("id, title, start_time, reminder_at, reminder_channel, repeat_rule")
        .not("reminder_at", "is", null)
        .in("reminder_channel", ["both", "in_app"])
        .lte("reminder_at", nowIso);
      const evs = (evData ?? []) as { id: string; title: string; start_time: string | null; reminder_at: string; repeat_rule: string | null }[];
      const evItems: DueItem[] = [];
      for (const e of evs) {
        const dueMs = latestDueMs(e.reminder_at, e.repeat_rule ?? "none", nowMs);
        if (dueMs == null || nowMs - dueMs > 86400000) continue;
        evItems.push({ id: `ev:${e.id}:${dueMs}`, title: e.start_time ? `${e.title} · ${e.start_time.slice(0, 5)}` : e.title });
      }
      notify(evItems);
    }

    check();
    const id = window.setInterval(check, 60000);
    return () => window.clearInterval(id);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((r) => (
        <div key={r.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-lg">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
            <Bell className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground">Reminder due</p>
            <p className="text-sm font-medium">{r.title}</p>
          </div>
          <button onClick={() => dismiss(r.id)} aria-label="Dismiss" className="text-muted-foreground/60 transition hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
