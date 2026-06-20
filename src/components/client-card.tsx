"use client";

import { useState } from "react";
import { Pencil, Trash2, Mail, Phone } from "lucide-react";
import type { Client } from "@/lib/data";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { updateClient, deleteClient } from "@/app/actions";

const fieldClass =
  "w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

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

  return (
    <Card className="transition-transform hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{client.name}</p>
            {client.company ? <p className="truncate text-xs text-muted-foreground">{client.company}</p> : null}
          </div>
          <button type="button" onClick={() => setEditing(true)} aria-label="Edit client" className="text-muted-foreground/60 transition hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </button>
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
        </div>
      </CardContent>
    </Card>
  );
}
