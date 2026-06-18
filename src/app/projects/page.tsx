import { Plus } from "lucide-react";
import { getWorkspace } from "@/lib/queries";
import { createProject } from "@/app/actions";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/project-card";

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
          {projects.length} projects · {active} active · click the pencil on any card to edit
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
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
