"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Trash2, RotateCcw, Repeat, X } from "lucide-react";
import type { Project, Task, TaskStatus } from "@/lib/data";
import { setTaskStatus, deleteTask, updateTask } from "@/app/actions";
import { Badge, priorityBadge, priorityLabel, taskStatusMeta } from "@/components/ui";
import { cn, formatDate, daysUntil } from "@/lib/utils";

const columns: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];

export function TaskBoard({
  tasks,
  projects = [],
  focusTaskId = null,
}: {
  tasks: Task[];
  projects?: Project[];
  /** Arrived from a project card: scroll this task into view and flash it. */
  focusTaskId?: string | null;
}) {
  const [overrides, setOverrides] = useState<Record<string, TaskStatus>>({});
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);
  // The task being edited, opened by double-clicking its card.
  const [editing, setEditing] = useState<Task | null>(null);
  const focusRef = useRef<HTMLDivElement>(null);

  // Scrolling the browser is an external side effect, so it belongs in an effect.
  useEffect(() => {
    if (focusTaskId && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusTaskId]);

  const statusOf = (t: Task): TaskStatus => overrides[t.id] ?? t.status;

  async function move(id: string, status: TaskStatus) {
    setOverrides((p) => ({ ...p, [id]: status }));
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    await setTaskStatus(fd);
  }

  async function remove(id: string) {
    setDeleted((p) => new Set(p).add(id));
    const fd = new FormData();
    fd.set("id", id);
    await deleteTask(fd);
  }

  async function saveEdit(formData: FormData) {
    await updateTask(formData);
    const nextStatus = String(formData.get("status") ?? "") as TaskStatus;
    const id = String(formData.get("id") ?? "");
    if (id && nextStatus) setOverrides((p) => ({ ...p, [id]: nextStatus }));
    setEditing(null);
  }

  const visible = tasks.filter((t) => !deleted.has(t.id));

  return (
    <>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => {
        const items = visible.filter((t) => statusOf(t) === col);
        const meta = taskStatusMeta[col];
        return (
          <div
            key={col}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(col);
            }}
            onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              setOverCol(null);
              if (dragId) void move(dragId, col);
              setDragId(null);
            }}
            className={cn("rounded-2xl border p-3 transition", overCol === col ? "border-primary bg-primary/5" : "border-border bg-card/40")}
          >
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
              <span className="text-sm font-semibold">{meta.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="space-y-2.5">
              {items.length === 0 ? (
                <p className="px-1 py-8 text-center text-xs text-muted-foreground">Drop here</p>
              ) : (
                items.map((t) => {
                  const days = daysUntil(t.due);
                  const isDone = statusOf(t) === "done";
                  const overdue = days !== null && days < 0 && !isDone;
                  return (
                    <div
                      key={t.id}
                      id={`task-${t.id}`}
                      ref={t.id === focusTaskId ? focusRef : undefined}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => setDragId(null)}
                      onDoubleClick={() => setEditing(t)}
                      title="Double-click to edit"
                      className={cn(
                        "cursor-grab select-none rounded-xl border border-border bg-card p-3 shadow-sm transition hover:border-primary/40 active:cursor-grabbing",
                        dragId === t.id && "opacity-50",
                        t.id === focusTaskId && "border-primary ring-2 ring-primary/40",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => void move(t.id, isDone ? "todo" : "done")}
                          onDoubleClick={(e) => e.stopPropagation()}
                          aria-label={isDone ? "Reopen task" : "Complete task"}
                          className={cn(
                            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition",
                            isDone ? "border-emerald-400 bg-emerald-400 text-white" : "border-muted-foreground/50 text-transparent hover:border-emerald-400 hover:text-emerald-400",
                          )}
                        >
                          {isDone ? <RotateCcw className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                        </button>
                        <p className={cn("flex-1 text-sm font-medium", isDone && "text-muted-foreground line-through")}>{t.title}</p>
                        <button type="button" onClick={() => void remove(t.id)} onDoubleClick={(e) => e.stopPropagation()} aria-label="Delete task" className="text-muted-foreground/60 transition hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-7">
                        <Badge className={priorityBadge[t.priority]}>{priorityLabel[t.priority]}</Badge>
                        {t.repeatRule !== "none" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Repeat className="h-3 w-3" /> {t.repeatRule}
                          </span>
                        ) : null}
                        {t.due ? (
                          <span className={cn("text-xs", overdue ? "font-semibold text-red-400" : "text-muted-foreground")}>
                            {overdue ? `${Math.abs(days as number)}d late` : formatDate(t.due)}
                          </span>
                        ) : null}
                        {t.project ? (
                          t.projectId ? (
                            <Link
                              href={`/projects#project-${t.projectId}`}
                              onDoubleClick={(e) => e.stopPropagation()}
                              title="Open this project"
                              className="truncate text-xs text-muted-foreground underline-offset-2 transition hover:text-primary hover:underline"
                            >
                              · {t.project}
                            </Link>
                          ) : (
                            <span className="truncate text-xs text-muted-foreground">· {t.project}</span>
                          )
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>

    {editing ? <TaskEditor task={editing} projects={projects} onClose={() => setEditing(null)} onSave={saveEdit} onDelete={() => { void remove(editing.id); setEditing(null); }} /> : null}
    </>
  );
}

const fieldClass =
  "w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const labelClass = "mb-1 block text-xs font-medium text-muted-foreground";

function TaskEditor({
  task,
  projects,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task;
  projects: Project[];
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="mt-16 w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Edit task</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground/70 transition hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={onSave} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={task.id} />
          <div className="sm:col-span-2">
            <label className={labelClass}>Title</label>
            <input name="title" defaultValue={task.title} required autoFocus className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select name="status" defaultValue={task.status} className={fieldClass}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select name="priority" defaultValue={task.priority} className={fieldClass}>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Due date</label>
            <input name="due" type="date" defaultValue={task.due ?? ""} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Repeat</label>
            <select name="repeat_rule" defaultValue={task.repeatRule} className={fieldClass}>
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Project</label>
            <select name="project_id" defaultValue={task.projectId ?? ""} className={fieldClass}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-1 flex items-center justify-between gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-red-400/50 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted">
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
