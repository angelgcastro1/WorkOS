"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, Check } from "lucide-react";
import { importIcsEvents } from "@/app/actions";

export function IcsImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("working");
    setMsg("");
    try {
      const text = await file.text();
      const res = await importIcsEvents(text);
      if (res.imported > 0) {
        setStatus("done");
        setMsg(`Imported ${res.imported} event${res.imported === 1 ? "" : "s"}`);
        router.refresh();
      } else {
        setStatus("error");
        setMsg("No calendar events found in that file.");
      }
    } catch {
      setStatus("error");
      setMsg("Couldn't read that file. Make sure it's a .ics calendar file.");
    }
    if (inputRef.current) inputRef.current.value = "";
    setTimeout(() => setStatus("idle"), 5000);
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="file" accept=".ics,.ical,text/calendar" className="hidden" onChange={onFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "working"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
      >
        {status === "working" ? <Loader2 className="h-4 w-4 animate-spin" /> : status === "done" ? <Check className="h-4 w-4 text-emerald-500" /> : <CalendarPlus className="h-4 w-4" />}
        {status === "working" ? "Importing…" : "Import calendar"}
      </button>
      {msg ? <span className={`text-xs ${status === "error" ? "text-red-400" : "text-muted-foreground"}`}>{msg}</span> : null}
    </div>
  );
}
