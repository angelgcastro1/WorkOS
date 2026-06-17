import { Plus } from "lucide-react";
import type { TaskStatus } from "@/lib/data";
import { tasks } from "@/lib/data";
import { Card, Badge, priorityBadge, priorityLabel, taskStatusMeta } from "@/components/ui";
import { cn, formatDate, daysUntil } from "@/lib/utils";

const columns: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];

export default function TasksPage() {
  const open = tasks.filter((t) => t.status !== "done").length;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">{open} open across all projects</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> New task
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => {
          const items = tasks.filter((t) => t.status === col);
          const meta = taskStatusMeta[col];
          return (
            <div key={col} className="rounded-2xl border border-border bg-card/40 p-3">
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
                <span className="text-sm font-semibold">{meta.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2.5">
                {items.length === 0 ? (
                  <p className="px-1 py-8 text-center text-xs text-muted-foreground">Nothing here</p>
                ) : (
                  items.map((t) => {
                    const days = daysUntil(t.due);
                    const overdue = days !== null && days < 0 && t.status !== "done";
                    return (
                      <Card key={t.id} className="cursor-grab p-3 transition-transform hover:-translate-y-0.5">
                        <p className={cn("text-sm font-medium", t.status === "done" && "text-muted-foreground line-through")}>
                          {t.title}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <Badge className={priorityBadge[t.priority]}>{priorityLabel[t.priority]}</Badge>
                          {t.due ? (
                            <span className={cn("text-xs", overdue ? "font-semibold text-red-400" : "text-muted-foreground")}>
                              {overdue ? `${Math.abs(days as number)}d late` : formatDate(t.due)}
                            </span>
                          ) : null}
                        </div>
                        {t.project ? <p className="mt-2 truncate text-xs text-muted-foreground">{t.project}</p> : null}
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
