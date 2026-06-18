import { Plus } from "lucide-react";
import type { NoteType } from "@/lib/data";
import { getWorkspace } from "@/lib/queries";
import { createNote } from "@/app/actions";
import { Card, Badge } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";

const noteTypeStyle: Record<NoteType, string> = {
  Idea: "bg-amber-500/15 text-amber-400",
  Meeting: "bg-sky-500/15 text-sky-400",
  Client: "bg-emerald-500/15 text-emerald-400",
  SOP: "bg-violet-500/15 text-violet-400",
  Prompt: "bg-pink-500/15 text-pink-400",
  Note: "bg-slate-500/15 text-slate-400",
};

const fieldClass =
  "rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

export default async function NotesPage() {
  const { notes, projects } = await getWorkspace();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Notes &amp; Knowledge Base</h1>
        <p className="text-sm text-muted-foreground">Ideas, meeting notes, client notes, SOPs, and AI prompts.</p>
      </header>

      <Card>
        <form action={createNote} className="space-y-2 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input name="title" required placeholder="Note title…" className={cn(fieldClass, "min-w-50 flex-1")} />
            <select name="type" defaultValue="Note" className={fieldClass} aria-label="Type">
              <option>Note</option>
              <option>Idea</option>
              <option>Meeting</option>
              <option>Client</option>
              <option>SOP</option>
              <option>Prompt</option>
            </select>
            <select name="project_id" defaultValue="" className={fieldClass} aria-label="Project">
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          <textarea name="body" placeholder="Write your note…" rows={2} className={cn(fieldClass, "w-full resize-y")} />
        </form>
      </Card>

      {notes.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No notes yet — capture your first above.</div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {notes.map((n) => (
            <Card key={n.id} className="break-inside-avoid p-5">
              <div className="mb-2 flex items-center justify-between">
                <Badge className={noteTypeStyle[n.type] ?? noteTypeStyle.Note}>{n.type}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(n.date)}</span>
              </div>
              <h3 className="text-[15px] font-semibold leading-tight">{n.title}</h3>
              {n.body ? <p className="mt-1.5 whitespace-pre-wrap text-sm leading-snug text-muted-foreground">{n.body}</p> : null}
              {n.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {n.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
