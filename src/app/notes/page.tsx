import { Plus } from "lucide-react";
import { getWorkspace } from "@/lib/queries";
import { createNote } from "@/app/actions";
import { Card } from "@/components/ui";
import { NoteCard } from "@/components/note-card";
import { cn } from "@/lib/utils";

const fieldClass =
  "rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

export default async function NotesPage() {
  const { notes, projects } = await getWorkspace();
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Notes &amp; Knowledge Base</h1>
        <p className="text-sm text-muted-foreground">Ideas, meeting notes, client notes, SOPs, and AI prompts. Click the pencil on any note to edit it.</p>
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
              {projectOptions.map((p) => (
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
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} projects={projectOptions} />
          ))}
        </div>
      )}
    </div>
  );
}
