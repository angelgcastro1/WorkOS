"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DueItem = { id: string; title: string };

// How often a still-due reminder re-surfaces to nudge you again.
const RENAG_MS = 30 * 60 * 1000;

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
  // The mascot stays hidden until its animation has loaded, so it starts walking in sync.
  const [chamReady, setChamReady] = useState(false);
  // id -> last time (ms) we surfaced it; used to re-nag every RENAG_MS.
  const lastShown = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    const supabase = createClient();

    function notify(items: DueItem[]) {
      const nowMs = Date.now();
      const due = items.filter((i) => nowMs - (lastShown.current.get(i.id) ?? 0) >= RENAG_MS);
      if (due.length === 0) return;
      for (const i of due) {
        lastShown.current.set(i.id, nowMs);
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("WorkCham reminder", { body: i.title });
          } catch {
            // notifications may be blocked; the in-app toast still shows
          }
        }
      }
      // Add a toast for any that isn't already on screen (dismissed ones re-appear).
      setToasts((prev) => {
        const existing = new Set(prev.map((t) => t.id));
        const add = due.filter((i) => !existing.has(i.id));
        return add.length ? [...prev, ...add] : prev;
      });
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

  async function snooze(id: string, when: number | "tomorrow") {
    const target = new Date();
    if (when === "tomorrow") {
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    } else {
      target.setMinutes(target.getMinutes() + when);
    }
    const whenIso = target.toISOString();
    const supabase = createClient();
    if (id.startsWith("rem:")) {
      await supabase.from("reminders").update({ due_at: whenIso, notified: false }).eq("id", id.slice(4));
    } else if (id.startsWith("ev:")) {
      await supabase.from("events").update({ reminder_at: whenIso, reminded_at: null }).eq("id", id.split(":")[1]);
    }
    // Clear its nag timer so it can alert again once the snooze window passes.
    lastShown.current.delete(id);
    dismiss(id);
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      <div className="pointer-events-none z-10 -mb-3 flex">
        {/* Angel's chameleon animation — full choreography, transparent animated WebP.
            It only starts walking once the clip has loaded, so the CSS travel path
            stays in step with the animation's own turns. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cham-walk.webp"
          alt=""
          width={176}
          height={101}
          onLoad={() => setChamReady(true)}
          className={`reminder-cham drop-shadow-lg${chamReady ? " is-walking" : ""}`}
        />
      </div>
      {toasts.map((r) => (
        <div key={r.id} className="reminder-toast flex items-start gap-3 rounded-xl border border-primary/40 bg-card p-3 shadow-lg shadow-indigo-500/20">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
            <Bell className="bell-ring h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground">Reminder due</p>
            <p className="text-sm font-medium">{r.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Snooze</span>
              <button
                onClick={() => snooze(r.id, 60)}
                className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium transition hover:bg-muted"
              >
                1h
              </button>
              <button
                onClick={() => snooze(r.id, 180)}
                className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium transition hover:bg-muted"
              >
                3h
              </button>
              <button
                onClick={() => snooze(r.id, "tomorrow")}
                className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium transition hover:bg-muted"
              >
                Tomorrow
              </button>
            </div>
          </div>
          <button onClick={() => dismiss(r.id)} aria-label="Dismiss" className="text-muted-foreground/60 transition hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
