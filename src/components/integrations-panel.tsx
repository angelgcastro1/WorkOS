"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Check, RefreshCw, Video, X } from "lucide-react";
import { disconnectGoogle, syncGoogleNow } from "@/app/actions";

type Props = {
  google: { connected: boolean; email: string | null; lastSyncedAt: string | null; configured: boolean };
  zoom: { configured: boolean };
};

function ago(iso: string | null): string {
  if (!iso) return "never";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function IntegrationsPanel({ google, zoom }: Props) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  function sync() {
    setNote(null);
    startTransition(async () => {
      const r = await syncGoogleNow();
      setNote(
        r.ok
          ? `Synced — ${r.added} new, ${r.updated} updated${r.removed ? `, ${r.removed} removed` : ""}.`
          : r.error ?? "Sync failed.",
      );
    });
  }

  return (
    <div className="space-y-3">
      {/* Google Calendar */}
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-sky-400" />
            <div>
              <p className="text-sm font-medium">Google Calendar</p>
              {google.connected ? (
                <p className="text-xs text-emerald-400">
                  <Check className="mr-1 inline h-3 w-3" />
                  {google.email ?? "Connected"} · synced {ago(google.lastSyncedAt)}
                </p>
              ) : google.configured ? (
                <p className="text-xs text-muted-foreground">Events sync both ways once connected.</p>
              ) : (
                <p className="text-xs text-amber-400">Add the Google keys in Vercel to enable this.</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {google.connected ? (
              <>
                <button
                  onClick={sync}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5${pending ? " animate-spin" : ""}`} /> Sync now
                </button>
                <button
                  onClick={() => startTransition(() => disconnectGoogle().then(() => setNote("Disconnected.")))}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" /> Disconnect
                </button>
              </>
            ) : (
              <a
                href="/api/google/connect"
                aria-disabled={!google.configured}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  google.configured
                    ? "bg-primary text-primary-foreground shadow-lg shadow-indigo-500/30 hover:brightness-110"
                    : "pointer-events-none border border-border text-muted-foreground opacity-60"
                }`}
              >
                Connect
              </a>
            )}
          </div>
        </div>
        {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
      </div>

      {/* Zoom */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5 text-blue-400" />
          <div>
            <p className="text-sm font-medium">Zoom</p>
            {zoom.configured ? (
              <p className="text-xs text-emerald-400">
                <Check className="mr-1 inline h-3 w-3" />
                Ready — use “Create Zoom meeting” when adding a calendar event.
              </p>
            ) : (
              <p className="text-xs text-amber-400">Add the three Zoom keys in Vercel to enable this.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
