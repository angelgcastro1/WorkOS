"use client";

import { useState } from "react";
import { Pencil, Trash2, Calendar } from "lucide-react";
import type { Project } from "@/lib/data";
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
import { updateProject, deleteProject } from "@/app/actions";

const fieldClass =
  "rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

export function ProjectCard({ project }: { project: Project }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Card className="animate-fade-up">
        <CardContent className="space-y-2 p-5">
          <form action={updateProject} className="space-y-2">
            <input type="hidden" name="id" value={project.id} />
            <input name="name" defaultValue={project.name} required placeholder="Project name" className={cn(fieldClass, "w-full font-medium")} />
            <div className="flex flex-wrap gap-2">
              <select name="status" defaultValue={project.status} className={fieldClass} aria-label="Status">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On hold</option>
                <option value="done">Done</option>
              </select>
              <select name="priority" defaultValue={project.priority} className={fieldClass} aria-label="Priority">
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <input name="category" defaultValue={project.category ?? ""} placeholder="Category" className={cn(fieldClass, "min-w-28 flex-1")} />
              <input name="client" defaultValue={project.client ?? ""} placeholder="Client" className={cn(fieldClass, "min-w-28 flex-1")} />
            </div>
            <input name="deadline" type="date" defaultValue={project.deadline ?? ""} className={cn(fieldClass, "w-full")} aria-label="Deadline" />
            <textarea name="note" defaultValue={project.note ?? ""} rows={2} placeholder="Note" className={cn(fieldClass, "w-full resize-y")} />
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                onClick={() => setEditing(false)}
                className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-border px-3 py-1.5 text-sm transition hover:bg-muted">
                Cancel
              </button>
            </div>
          </form>
          <form action={deleteProject} className="border-t border-border pt-2">
            <input type="hidden" name="id" value={project.id} />
            <button type="submit" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-red-400">
              <Trash2 className="h-3.5 w-3.5" /> Delete project
            </button>
          </form>
        </CardContent>
      </Card>
    );
  }

  const days = daysUntil(project.deadline);
  return (
    <Card className="animate-fade-up transition-transform hover:-translate-y-0.5">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold leading-tight">{project.name}</h3>
          <div className="flex shrink-0 items-center gap-2">
            <Badge className={projectStatusBadge[project.status]}>{projectStatusLabel[project.status]}</Badge>
            <button type="button" onClick={() => setEditing(true)} aria-label="Edit project" className="text-muted-foreground/60 transition hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {project.category ? <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/80">{project.category}</span> : null}
          {project.client ? <span>· {project.client}</span> : null}
          <Badge className={priorityBadge[project.priority]}>{priorityLabel[project.priority]}</Badge>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {project.tasksDone}/{project.tasksTotal} tasks
            </span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} />
        </div>
        {project.note ? <p className="text-xs leading-snug text-muted-foreground">{project.note}</p> : null}
        {project.deadline ? (
          <div className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(project.deadline)}
            {days !== null ? <span className={days < 0 ? "text-red-400" : ""}>· {days}d</span> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
