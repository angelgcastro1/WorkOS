import { Plus, Check, Trash2, RotateCcw } from "lucide-react";
import type { TaskStatus } from "@/lib/data";
import { getWorkspace } from "@/lib/queries";
import { createTask, toggleTask, deleteTask } from "@/app/actions";
import { Card, Badge, priorityBadge, priorityLabel, taskStatusMeta } from "@/components/ui";
import { cn, formatDate, daysUntil } from "@/lib/utils";

const columns: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];
const fieldClass =
  "rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

export default async function TasksPage() {
  const { tasks, projects } = await getWorkspace();
  const open = tasks.filter((t) => t.status !== "done").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground">{open} open across all projects</p>
      </header>

      <Card>
        <form action={createTask} className="flex flex-wrap items-center gap-2 p-3">
          <input name="title" required placeholder="Add a task…" className={cn(fieldClass, "min-w-50 flex-1")} />
          <select name="priority" defaultValue="medium" className={fieldClass} aria-label="Priority">
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select name="project_id" defaultValue="" className={fieldClass} aria-label="Project">
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input name="due" type="date" className={fieldClass} aria-label="Due date" />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
      </Card>

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
                    const isDone = t.status === "done";
                    return (
                      <Card key={t.id} className="p-3">
                        <div className="flex items-start gap-2">
                          <form action={toggleTask} className="pt-0.5">
                            <input type="hidden" name="id" value={t.id} />
                            <input type="hidden" name="done" value={String(isDone)} />
                            <button
                              type="submit"
                              aria-label={isDone ? "Reopen task" : "Complete task"}
                              className={cn(
                                "grid h-5 w-5 place-items-center rounded-md border-2 transition",
                                isDone
                                  ? "border-emerald-400 bg-emerald-400 text-white"
                                  : "border-muted-foreground/50 text-transparent hover:border-emerald-400 hover:text-emerald-400",
                              )}
                            >
                              {isDone ? <RotateCcw className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                            </button>
                          </form>
                          <p className={cn("flex-1 text-sm font-medium", isDone && "text-muted-foreground line-through")}>
                            {t.title}
                          </p>
                          <form action={deleteTask}>
                            <input type="hidden" name="id" value={t.id} />
                            <button
                              type="submit"
                              aria-label="Delete task"
                              className="text-muted-foreground/60 transition hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-7">
                          <Badge className={priorityBadge[t.priority]}>{priorityLabel[t.priority]}</Badge>
                          {t.due ? (
                            <span className={cn("text-xs", overdue ? "font-semibold text-red-400" : "text-muted-foreground")}>
                              {overdue ? `${Math.abs(days as number)}d late` : formatDate(t.due)}
                            </span>
                          ) : null}
                          {t.project ? <span className="truncate text-xs text-muted-foreground">· {t.project}</span> : null}
                        </div>
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
