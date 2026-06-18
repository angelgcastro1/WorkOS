"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Note, NoteType } from "@/lib/data";
import { Card, Badge } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";
import { updateNote, deleteNote } from "@/app/actions";

const noteTypeStyle: Record<NoteType, string> = {
  Idea: "bg-amber-500/15 text-amber-400",
  Meeting: "bg-sky-500/15 text-sky-400",
  Client: "bg-emerald-500/15 text-emerald-400",
  SOP: "bg-violet-500/15 text-violet-400",
  Prompt: "bg-pink-500/15 text-pink-400",
  Note: "bg-slate-500/15 text-slate-400",
};

const fieldClass =
  "w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

type Props = { note: Note; projects: { id: string; name: string }[] };

export function NoteCard({ note, projects }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Card className="mb-4 break-inside-avoid p-4">
        <form action={updateNote} className="space-y-2">
          <input type="hidden" name="id" value={note.id} />
          <input name="title" defaultValue={note.title} required className={fieldClass} placeholder="Title" />
          <div className="flex gap-2">
            <select name="type" defaultValue={note.type} className={fieldClass} aria-label="Type">
              <option>Note</option>
              <option>Idea</option>
              <option>Meeting</option>
              <option>Client</option>
              <option>SOP</option>
              <option>Prompt</option>
            </select>
            <select name="project_id" defaultValue={note.projectId ?? ""} className={fieldClass} aria-label="Project">
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            name="body"
            defaultValue={note.body ?? ""}
            rows={4}
            className={cn(fieldClass, "resize-y")}
            placeholder="Write your note…"
          />
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              onClick={() => setEditing(false)}
              className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm transition hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
        <form action={deleteNote} className="mt-2 border-t border-border pt-2">
          <input type="hidden" name="id" value={note.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete note
          </button>
        </form>
      </Card>
    );
  }

  return (
    <Card className="mb-4 break-inside-avoid p-5">
      <div className="mb-2 flex items-center justify-between">
        <Badge className={noteTypeStyle[note.type] ?? noteTypeStyle.Note}>{note.type}</Badge>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{formatDate(note.date)}</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit note"
            className="text-muted-foreground/60 transition hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <h3 className="text-[15px] font-semibold leading-tight">{note.title}</h3>
      {note.body ? (
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-snug text-muted-foreground">{note.body}</p>
      ) : null}
      {note.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
