"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { createTimeEntry } from "@/app/actions";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

const fieldClass =
  "rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

function fmtClock(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function TimeTracker({ projects }: { projects: { id: string; name: string }[] }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [minutesInput, setMinutesInput] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const stop = () => {
    setRunning(false);
    setMinutesInput(String(Math.max(1, Math.round(seconds / 60))));
  };
  const reset = () => {
    setRunning(false);
    setSeconds(0);
  };

  const logAction = async (formData: FormData) => {
    await createTimeEntry(formData);
    formRef.current?.reset();
    setMinutesInput("");
    setSeconds(0);
    setRunning(false);
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-2xl font-bold tabular-nums">{fmtClock(seconds)}</span>
        {running ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-1.5 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/25"
          >
            <Pause className="h-4 w-4" /> Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setRunning(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/25"
          >
            <Play className="h-4 w-4" /> Start
          </button>
        )}
        <button type="button" onClick={reset} aria-label="Reset" className="rounded-lg p-1.5 text-muted-foreground transition hover:text-foreground">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <form ref={formRef} action={logAction} className="flex flex-wrap items-center gap-2">
        <select name="project_id" defaultValue="" className={fieldClass} aria-label="Project">
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input name="description" placeholder="What did you work on?" className={cn(fieldClass, "min-w-44 flex-1")} />
        <input
          name="minutes"
          type="number"
          min="1"
          placeholder="Min"
          value={minutesInput}
          onChange={(e) => setMinutesInput(e.target.value)}
          className={cn(fieldClass, "w-24")}
        />
        <input name="entry_date" type="date" className={fieldClass} aria-label="Date (defaults to today)" />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
        >
          Log time
        </button>
      </form>
    </Card>
  );
}
