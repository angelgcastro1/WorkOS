import { Plus, Calendar } from "lucide-react";
import { getWorkspace } from "@/lib/queries";
import { createProject } from "@/app/actions";
import {
  Card,
  CardContent,
  Badge,
  Progress,
  projectStatusBadge,
  projectStatusLabel,
  priorityBadge,
  priorityLabel,
} from "@/components/ui";
import { cn, formatDate, daysUntil } from "@/lib/utils";

const fieldClass =
  "rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

export default async function ProjectsPage() {
  const { projects } = await getWorkspace();
  const active = projects.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          {projects.length} projects · {active} active
        </p>
      </header>

      <Card>
        <form action={createProject} className="flex flex-wrap items-center gap-2 p-3">
          <input name="name" required placeholder="New project…" className={cn(fieldClass, "min-w-50 flex-1")} />
          <input name="category" placeholder="Category" className={cn(fieldClass, "w-32")} />
          <input name="client" placeholder="Client (optional)" className={cn(fieldClass, "w-36")} />
          <select name="status" defaultValue="planning" className={fieldClass} aria-label="Status">
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On hold</option>
            <option value="done">Done</option>
          </select>
          <select name="priority" defaultValue="medium" className={fieldClass} aria-label="Priority">
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input name="deadline" type="date" className={fieldClass} aria-label="Deadline" />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
      </Card>

      {projects.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No projects yet — add your first above.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const days = daysUntil(p.deadline);
            return (
              <Card key={p.id} className="animate-fade-up transition-transform hover:-translate-y-0.5">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-semibold leading-tight">{p.name}</h3>
                    <Badge className={projectStatusBadge[p.status]}>{projectStatusLabel[p.status]}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {p.category ? <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/80">{p.category}</span> : null}
                    {p.client ? <span>· {p.client}</span> : null}
                    <Badge className={priorityBadge[p.priority]}>{priorityLabel[p.priority]}</Badge>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {p.tasksDone}/{p.tasksTotal} tasks
                      </span>
                      <span>{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} />
                  </div>
                  {p.note ? <p className="text-xs leading-snug text-muted-foreground">{p.note}</p> : null}
                  {p.deadline ? (
                    <div className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(p.deadline)}
                      {days !== null ? <span className={days < 0 ? "text-red-400" : ""}>· {days}d</span> : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
