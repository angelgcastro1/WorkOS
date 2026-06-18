"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Paperclip } from "lucide-react";
import type { Note, NoteType, Attachment } from "@/lib/data";
import { Card, Badge } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";
import { updateNote, deleteNote } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";

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

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type Props = { note: Note; projects: { id: string; name: string }[]; userId: string };

export function NoteCard({ note, projects, userId }: Props) {
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${userId}/${note.id}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("attachments").upload(path, file);
    if (!error) {
      await supabase.from("note_attachments").insert({ note_id: note.id, name: file.name, path, mime: file.type, size: file.size });
      router.refresh();
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleDownload(att: Attachment) {
    const { data } = await supabase.storage.from("attachments").createSignedUrl(att.path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function handleRemoveAttachment(att: Attachment) {
    await supabase.storage.from("attachments").remove([att.path]);
    await supabase.from("note_attachments").delete().eq("id", att.id);
    router.refresh();
  }

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
          <textarea name="body" defaultValue={note.body ?? ""} rows={4} className={cn(fieldClass, "resize-y")} placeholder="Write your note…" />
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              onClick={() => setEditing(false)}
              className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-border px-3 py-1.5 text-sm transition hover:bg-muted">
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Attachments</p>
          {note.attachments.length > 0 ? (
            <div className="space-y-1.5">
              {note.attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2 text-sm">
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <button type="button" onClick={() => handleDownload(att)} className="min-w-0 flex-1 truncate text-left hover:text-primary">
                    {att.name}
                  </button>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatSize(att.size)}</span>
                  <button type="button" onClick={() => handleRemoveAttachment(att)} aria-label="Remove attachment" className="shrink-0 text-muted-foreground/60 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium transition hover:bg-muted">
            <Paperclip className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Attach file"}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        <form action={deleteNote} className="mt-2 border-t border-border pt-2">
          <input type="hidden" name="id" value={note.id} />
          <button type="submit" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-red-400">
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
          <button type="button" onClick={() => setEditing(true)} aria-label="Edit note" className="text-muted-foreground/60 transition hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <h3 className="text-[15px] font-semibold leading-tight">{note.title}</h3>
      {note.body ? <p className="mt-1.5 whitespace-pre-wrap text-sm leading-snug text-muted-foreground">{note.body}</p> : null}
      {note.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
      {note.attachments.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {note.attachments.map((att) => (
            <button
              key={att.id}
              type="button"
              onClick={() => handleDownload(att)}
              className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground transition hover:text-primary"
            >
              <Paperclip className="h-3 w-3" /> {att.name}
            </button>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
