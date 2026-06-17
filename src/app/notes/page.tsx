import { Plus } from "lucide-react";
import type { NoteType } from "@/lib/data";
import { notes } from "@/lib/data";
import { Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

const noteTypeStyle: Record<NoteType, string> = {
  Idea: "bg-amber-500/15 text-amber-400",
  Meeting: "bg-sky-500/15 text-sky-400",
  Client: "bg-emerald-500/15 text-emerald-400",
  SOP: "bg-violet-500/15 text-violet-400",
  Prompt: "bg-pink-500/15 text-pink-400",
  Note: "bg-slate-500/15 text-slate-400",
};

const categories: NoteType[] = ["Idea", "Meeting", "Client", "SOP", "Prompt"];

export default function NotesPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notes &amp; Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">Ideas, meeting notes, client notes, SOPs, and AI prompts.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> New note
        </button>
      </header>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-lg bg-primary/15 px-3 py-1.5 text-sm font-medium text-primary">All · {notes.length}</span>
        {categories.map((c) => {
          const count = notes.filter((n) => n.type === c).length;
          return (
            <span key={c} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
              {c} · {count}
            </span>
          );
        })}
      </div>

      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {notes.map((n) => (
          <Card key={n.id} className="break-inside-avoid p-5 transition-transform hover:-translate-y-0.5">
            <div className="mb-2 flex items-center justify-between">
              <Badge className={noteTypeStyle[n.type]}>{n.type}</Badge>
              <span className="text-xs text-muted-foreground">{formatDate(n.date)}</span>
            </div>
            <h3 className="text-[15px] font-semibold leading-tight">{n.title}</h3>
            <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{n.excerpt}</p>
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
    </div>
  );
}
