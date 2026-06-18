import Link from "next/link";
import { Plus, Trash2, Shapes } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createWhiteboard, deleteWhiteboard } from "@/app/actions";
import { Card } from "@/components/ui";
import { formatDate } from "@/lib/utils";

interface BoardRow {
  id: string;
  title: string;
  updated_at: string | null;
}

export default async function WhiteboardsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("whiteboards").select("id, title, updated_at").order("updated_at", { ascending: false });
  const boards = (data ?? []) as BoardRow[];

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Whiteboards</h1>
          <p className="text-sm text-muted-foreground">Infinite canvases for sketching, diagrams, and brainstorms.</p>
        </div>
        <form action={createWhiteboard}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> New board
          </button>
        </form>
      </header>

      {boards.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No boards yet — create your first.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <Card key={b.id} className="group relative p-5 transition-transform hover:-translate-y-0.5">
              <Link href={`/whiteboards/${b.id}`} className="block">
                <div className="mb-4 grid h-28 place-items-center rounded-xl bg-muted/50 text-muted-foreground">
                  <Shapes className="h-8 w-8" />
                </div>
                <p className="truncate text-[15px] font-semibold">{b.title}</p>
                <p className="text-xs text-muted-foreground">Edited {formatDate(b.updated_at ? b.updated_at.slice(0, 10) : null)}</p>
              </Link>
              <form action={deleteWhiteboard} className="absolute right-3 top-3">
                <input type="hidden" name="id" value={b.id} />
                <button
                  type="submit"
                  aria-label="Delete board"
                  className="text-muted-foreground/50 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
