"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, Calendar, ListTodo, Plus, Check, RotateCcw, ChevronDown } from "lucide-react";
import type { Project, Task } from "@/lib/data";
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
import { updateProject, deleteProject, createTask, setTaskStatus } from "@/app/actions";

const fieldClass =
  "rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

export function ProjectCard({
  project,
  tasks = [],
  spine = null,
  dimmed = false,
}: {
  project: Project;
  tasks?: Task[];
  /** Colour of the bar down the left edge, or null for no bar. */
  spine?: string | null;
  /** Finished projects can be faded back so the live ones stand out. */
  dimmed?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [showTasks, setShowTasks] = useState(true);
  const [showDone, setShowDone] = useState(false);

  async function handleSave(formData: FormData) {
    await updateProject(formData);
    setEditing(false);
  }

  if (editing) {
    return (
      <Card className="animate-fade-up">
        <CardContent className="space-y-2 p-5">
          <form action={handleSave} className="space-y-2">
            <input type="hidden" name="id" value={project.id} />
            <input name="name" defaultValue={project.name} required placeholder="Project name" className={cn(fieldClass, "w-full font-medium")} />
            <div className="flex flex-wrap gap-2">
              <select name="status" defaultValue={project.status} className={fieldClass} aria-label="Status">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="in_progress">In progress</option>
                <option value="in_review">In review</option>
                <option value="waiting_client">Waiting on client</option>
                <option value="on_hold">On hold</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
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
  const openTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");
  return (
    <Card
      className={cn(
        "animate-fade-up relative overflow-hidden transition",
        dimmed && "opacity-50 hover:opacity-100",
      )}
    >
      {spine ? <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: spine }} /> : null}
      <CardContent className={cn("space-y-3 p-5", spine && "pl-6")}>
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
            <Link
              href={`/tasks?project=${project.id}`}
              className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 font-medium text-primary transition hover:bg-primary/10"
              title="See and add tasks for this project"
            >
              <ListTodo className="h-3.5 w-3.5" />
              {project.tasksDone}/{project.tasksTotal} tasks
            </Link>
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

        {/* This project's own task list, right on the card. */}
        <div className="border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setShowTasks((v) => !v)}
            className="flex w-full items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !showTasks && "-rotate-90")} />
            Tasks
            <span className="ml-auto font-normal">
              {openTasks.length} open{doneTasks.length ? ` · ${doneTasks.length} done` : ""}
            </span>
          </button>

          {showTasks ? (
            <div className="mt-2 space-y-1">
              {openTasks.length === 0 && doneTasks.length === 0 ? (
                <p className="py-1.5 text-xs text-muted-foreground/70">No tasks yet — add the first one below.</p>
              ) : null}

              {openTasks.map((t) => (
                <TaskLine key={t.id} task={t} projectId={project.id} />
              ))}

              {doneTasks.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowDone((v) => !v)}
                    className="px-0.5 py-1 text-[11px] text-muted-foreground transition hover:text-foreground"
                  >
                    {showDone ? "Hide" : "Show"} {doneTasks.length} completed
                  </button>
                  {showDone ? doneTasks.map((t) => <TaskLine key={t.id} task={t} projectId={project.id} />) : null}
                </>
              ) : null}

              <AddTaskLine projectId={project.id} />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

/** One task row inside a project card: tick it off, or open it on the task board. */
function TaskLine({ task, projectId }: { task: Task; projectId: string }) {
  const [pending, start] = useTransition();
  const isDone = task.status === "done";
  const days = daysUntil(task.due);
  const overdue = days !== null && days < 0 && !isDone;

  function toggle() {
    const fd = new FormData();
    fd.set("id", task.id);
    fd.set("status", isDone ? "todo" : "done");
    start(() => {
      void setTaskStatus(fd);
    });
  }

  return (
    <div className={cn("group flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-muted", pending && "opacity-50")}>
      <button
        type="button"
        onClick={toggle}
        aria-label={isDone ? "Reopen task" : "Complete task"}
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center rounded border-2 transition",
          isDone ? "border-emerald-400 bg-emerald-400 text-white" : "border-muted-foreground/50 text-transparent hover:border-emerald-400 hover:text-emerald-400",
        )}
      >
        {isDone ? <RotateCcw className="h-2.5 w-2.5" /> : <Check className="h-2.5 w-2.5" />}
      </button>
      <Link
        href={`/tasks?project=${projectId}&task=${task.id}`}
        title="Open this task on the board"
        className={cn(
          "min-w-0 flex-1 truncate text-xs underline-offset-2 transition hover:text-primary hover:underline",
          isDone && "text-muted-foreground line-through",
        )}
      >
        {task.title}
      </Link>
      {task.due && !isDone ? (
        <span className={cn("shrink-0 text-[11px]", overdue ? "font-semibold text-red-400" : "text-muted-foreground")}>
          {overdue ? `${Math.abs(days as number)}d late` : formatDate(task.due)}
        </span>
      ) : null}
    </div>
  );
}

/** Add as many tasks as you like without leaving the project. */
function AddTaskLine({ projectId }: { projectId: string }) {
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;
    start(async () => {
      await createTask(formData);
      // Clear it so you can type the next one straight away.
      if (inputRef.current) inputRef.current.value = "";
      inputRef.current?.focus();
    });
  }

  return (
    <form action={submit} className="flex items-center gap-1.5 pt-1">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="priority" value="medium" />
      <input
        ref={inputRef}
        name="title"
        placeholder="Add a task to this project…"
        className="min-w-0 flex-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
      <button
        type="submit"
        disabled={pending}
        aria-label="Add task"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
