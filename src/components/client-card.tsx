"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Mail, Phone, UserCheck, Undo2, Clock } from "lucide-react";
import type { Client, ClientStage } from "@/lib/data";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { updateClient, deleteClient, setClientStage } from "@/app/actions";

const fieldClass =
  "w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

const STAGE_BADGE: Record<ClientStage, { label: string; className: string }> = {
  lead: { label: "Lead", className: "bg-slate-500/15 text-slate-400" },
  quoted: { label: "Quoted", className: "bg-blue-500/15 text-blue-400" },
  won: { label: "Won", className: "bg-emerald-500/15 text-emerald-400" },
  lost: { label: "Lost", className: "bg-red-500/15 text-red-400" },
};

// When the lead/client landed in WorkCham (created_at), shown in the viewer's local time.
function formatReceived(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ClientCard({ client }: { client: Client }) {
  const [editing, setEditing] = useState(false);

  async function handleSave(formData: FormData) {
    await updateClient(formData);
    setEditing(false);
  }

  if (editing) {
    return (
      <Card>
        <CardContent className="space-y-2 p-5">
          <form action={handleSave} className="space-y-2">
            <input type="hidden" name="id" value={client.id} />
            <input name="name" defaultValue={client.name} required placeholder="Name" className={fieldClass} />
            <input name="company" defaultValue={client.company ?? ""} placeholder="Company" className={fieldClass} />
            <input name="email" defaultValue={client.email ?? ""} placeholder="Email" className={fieldClass} />
            <input name="phone" defaultValue={client.phone ?? ""} placeholder="Phone" className={fieldClass} />
            <textarea name="address" defaultValue={client.address ?? ""} rows={2} placeholder="Billing address" className={cn(fieldClass, "resize-y")} />
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-border px-3 py-1.5 text-sm transition hover:bg-muted">
                Cancel
              </button>
            </div>
          </form>
          <form action={deleteClient} className="border-t border-border pt-2">
            <input type="hidden" name="id" value={client.id} />
            <button type="submit" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-red-400">
              <Trash2 className="h-3.5 w-3.5" /> Delete client
            </button>
          </form>
        </CardContent>
      </Card>
    );
  }

  const stage = STAGE_BADGE[client.stage] ?? STAGE_BADGE.lead;
  const submittedLabel = formatReceived(client.submittedAt);
  const receivedLabel = formatReceived(client.createdAt);
  // Prefer the real form-submission time; fall back to when it entered WorkCham.
  const dateLabel = submittedLabel ?? receivedLabel;
  const datePrefix = submittedLabel ? "Submitted" : "Received";

  return (
    <Card className="transition-transform hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/clients/${client.id}`} className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold hover:underline">{client.name}</p>
            {client.company ? <p className="truncate text-xs text-muted-foreground">{client.company}</p> : null}
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", stage.className)}>{stage.label}</span>
            <button type="button" onClick={() => setEditing(true)} aria-label="Edit client" className="text-muted-foreground/60 transition hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          {client.email ? (
            <p className="flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> {client.email}
            </p>
          ) : null}
          {client.phone ? (
            <p className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" /> {client.phone}
            </p>
          ) : null}
          {client.address ? <p className="whitespace-pre-line">{client.address}</p> : null}
          {dateLabel ? (
            <p suppressHydrationWarning className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> {datePrefix} {dateLabel}
            </p>
          ) : null}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Link
            href={`/clients/${client.id}`}
            className="text-xs font-medium text-primary transition hover:underline"
          >
            View customer →
          </Link>
          {client.stage === "lead" ? (
            <form action={setClientStage}>
              <input type="hidden" name="id" value={client.id} />
              <input type="hidden" name="stage" value="won" />
              <button
                type="submit"
                title="Move this lead into your clients"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
              >
                <UserCheck className="h-3.5 w-3.5" /> Move to client
              </button>
            </form>
          ) : (
            <form action={setClientStage}>
              <input type="hidden" name="id" value={client.id} />
              <input type="hidden" name="stage" value="lead" />
              <button
                type="submit"
                title="Move this client back to your leads"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Undo2 className="h-3.5 w-3.5" /> Move to leads
              </button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
