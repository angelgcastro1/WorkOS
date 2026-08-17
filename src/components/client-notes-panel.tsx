"use client";

import { useState } from "react";
import { Check, Pencil, Send, Trash2, X } from "lucide-react";
import type { ClientNote } from "@/lib/data";
import { addClientNote, deleteClientNote, updateClientNote } from "@/app/actions";
import { formatDate } from "@/lib/utils";
import { Linkify } from "@/components/linkify";

type Props = { clientId: string; notes: ClientNote[] };

const textareaClass =
  "w-full resize-y rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

export function ClientNotesPanel({ clientId, notes }: Props) {
  const [body, setBody] = useState("");
  // id of the note currently open for editing (double-click or the pencil).
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    await addClientNote(formData);
    setBody("");
  }

  async function handleSave(formData: FormData) {
    await updateClientNote(formData);
    setEditingId(null);
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
          className={textareaClass}
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
          {notes.map((n) =>
            editingId === n.id ? (
              <li key={n.id} className="rounded-lg bg-muted/30 p-2">
                <form action={handleSave} className="space-y-2">
                  <input type="hidden" name="id" value={n.id} />
                  <textarea
                    name="body"
                    defaultValue={n.body}
                    rows={3}
                    autoFocus
                    onKeyDown={(e) => {
                      // Escape backs out; Cmd/Ctrl+Enter saves.
                      if (e.key === "Escape") setEditingId(null);
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
                    }}
                    className={textareaClass}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
                    >
                      <Check className="h-3.5 w-3.5" /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                    <span className="text-[11px] text-muted-foreground">{formatDate(n.createdAt)}</span>
                  </div>
                </form>
              </li>
            ) : (
              <li
                key={n.id}
                onDoubleClick={() => setEditingId(n.id)}
                title="Double-click to edit"
                className="group flex items-start justify-between gap-3 rounded-lg px-1 py-1.5 transition hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="whitespace-pre-line text-sm text-foreground">
                    <Linkify text={n.body} />
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setEditingId(n.id)}
                    aria-label="Edit note"
                    className="text-muted-foreground/60 transition hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <form action={deleteClientNote}>
                    <input type="hidden" name="id" value={n.id} />
                    <button type="submit" aria-label="Delete note" className="text-muted-foreground/50 transition hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
