import Link from "next/link";
import { Plus, X } from "lucide-react";
import { getWorkspace } from "@/lib/queries";
import { createTask } from "@/app/actions";
import { Card } from "@/components/ui";
import { TaskBoard } from "@/components/task-board";
import { cn } from "@/lib/utils";

const fieldClass =
  "rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ project?: string; task?: string }> }) {
  const sp = await searchParams;
  const { tasks, projects } = await getWorkspace();

  // ?project=<id> narrows the board to one project, and makes new tasks land in it.
  const focus = sp.project ? projects.find((p) => p.id === sp.project) ?? null : null;
  const shown = focus ? tasks.filter((t) => t.projectId === focus.id) : tasks;
  const open = shown.filter((t) => t.status !== "done").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          {focus ? `${open} open in this project` : `${open} open across all projects`}
        </p>
      </header>

      {focus ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-2.5">
          <p className="text-sm">
            Showing tasks for{" "}
            <Link href={`/projects#project-${focus.id}`} className="font-semibold text-primary hover:underline">
              {focus.name}
            </Link>
            . Anything you add below joins this project.
          </p>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" /> Show all tasks
          </Link>
        </div>
      ) : null}

      <Card>
        <form action={createTask} className="flex flex-wrap items-center gap-2 p-3">
          <input name="title" required placeholder="Add a task…" className={cn(fieldClass, "min-w-50 flex-1")} />
          <select name="priority" defaultValue="medium" className={fieldClass} aria-label="Priority">
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select name="project_id" defaultValue={focus?.id ?? ""} className={fieldClass} aria-label="Project">
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

      <TaskBoard tasks={shown} projects={projects} focusTaskId={sp.task ?? null} />
      <p className="text-xs text-muted-foreground">
        Double-click a card to edit it. Drag a card between columns to change its status. Click a project name on a card to jump to that project. Recurring tasks create the next one automatically when you complete them.
      </p>
    </div>
  );
}
