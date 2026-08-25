"use client";

import { useState } from "react";
import { Send, Trash2 } from "lucide-react";
import type { ClientNote } from "@/lib/data";
import { addClientNote, deleteClientNote } from "@/app/actions";
import { formatDate } from "@/lib/utils";

type Props = { clientId: string; notes: ClientNote[] };

export function ClientNotesPanel({ clientId, notes }: Props) {
  const [body, setBody] = useState("");

  async function handleAdd(formData: FormData) {
    await addClientNote(formData);
    setBody("");
  }

  return (
    <div className="space-y-3">
      <form action={handleAdd} className="space-y-2">
        <input type="hidden" name="client_id" value={clientId} />
        <textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Log a call, email, or note about this customer…"
          className="w-full resize-y rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={!body.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110 disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> Add note
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-xs text-muted-foreground">No activity logged yet. Notes you add here stay with this customer.</p>
      ) : (
        <ul className="space-y-2 border-t border-border pt-3">
          {notes.map((n) => (
            <li key={n.id} className="group flex items-start justify-between gap-3 rounded-lg px-1 py-1.5">
              <div className="min-w-0">
                <p className="whitespace-pre-line text-sm text-foreground">{n.body}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(n.createdAt)}</p>
              </div>
              <form action={deleteClientNote} className="shrink-0">
                <input type="hidden" name="id" value={n.id} />
                <button
                  type="submit"
                  aria-label="Delete note"
                  className="text-muted-foreground/50 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
