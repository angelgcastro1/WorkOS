"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DueItem = { id: string; title: string };

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
      const dayAgoIso = new Date(now.getTime() - 86400000).toISOString();

      const { data: remData } = await supabase.from("reminders").select("id, title").eq("done", false).lte("due_at", nowIso);
      const rems = (remData ?? []) as { id: string; title: string }[];
      notify(rems.map((r) => ({ id: `rem:${r.id}`, title: r.title })));

      const { data: evData } = await supabase
        .from("events")
        .select("id, title, start_time, reminder_at, reminder_channel")
        .not("reminder_at", "is", null)
        .in("reminder_channel", ["both", "in_app"])
        .lte("reminder_at", nowIso)
        .gte("reminder_at", dayAgoIso);
      const evs = (evData ?? []) as { id: string; title: string; start_time: string | null }[];
      notify(evs.map((e) => ({ id: `ev:${e.id}`, title: e.start_time ? `${e.title} · ${e.start_time.slice(0, 5)}` : e.title })));
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
