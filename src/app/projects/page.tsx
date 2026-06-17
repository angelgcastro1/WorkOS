import { Link2, Calendar, Plus } from "lucide-react";
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
import { projects } from "@/lib/data";
import { formatDate, daysUntil } from "@/lib/utils";

export default function ProjectsPage() {
  const active = projects.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {projects.length} projects · {active} active
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> New project
        </button>
      </header>

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
                  <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/80">{p.category}</span>
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

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(p.deadline)}
                    {days !== null ? <span className={days < 0 ? "text-red-400" : ""}>· {days}d</span> : null}
                  </div>
                  {p.links && p.links.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      {p.links.map((l) => (
                        <span
                          key={l.label}
                          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          <Link2 className="h-3 w-3" />
                          {l.label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
