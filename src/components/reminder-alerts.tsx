"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DueReminder = { id: string; title: string };

export function ReminderAlerts() {
  const [toasts, setToasts] = useState<DueReminder[]>([]);
  const alerted = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    const supabase = createClient();

    async function check() {
      const nowIso = new Date().toISOString();
      const { data } = await supabase.from("reminders").select("id, title").eq("done", false).lte("due_at", nowIso);
      const due = (data ?? []) as DueReminder[];
      const fresh = due.filter((r) => !alerted.current.has(r.id));
      if (fresh.length === 0) return;
      for (const r of fresh) {
        alerted.current.add(r.id);
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("WorkCham reminder", { body: r.title });
          } catch {
            // notifications may be blocked; the in-app toast still shows
          }
        }
      }
      setToasts((prev) => [...prev, ...fresh]);
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
