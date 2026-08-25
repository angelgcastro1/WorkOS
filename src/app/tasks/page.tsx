import { Plus } from "lucide-react";
import { getWorkspace } from "@/lib/queries";
import { createTask } from "@/app/actions";
import { Card } from "@/components/ui";
import { TaskBoard } from "@/components/task-board";
import { cn } from "@/lib/utils";

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
          <select name="repeat_rule" defaultValue="none" className={fieldClass} aria-label="Repeat">
            <option value="none">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
      </Card>

      <TaskBoard tasks={tasks} />
      <p className="text-xs text-muted-foreground">
        Drag a card between columns to change its status. Recurring tasks create the next one automatically when you complete them.
      </p>
    </div>
  );
}
