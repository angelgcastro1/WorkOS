"use client";

import { useState } from "react";
import { Check, Trash2, RotateCcw, Repeat } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/data";
import { setTaskStatus, deleteTask } from "@/app/actions";
import { Badge, priorityBadge, priorityLabel, taskStatusMeta } from "@/components/ui";
import { cn, formatDate, daysUntil } from "@/lib/utils";

const columns: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];

export function TaskBoard({ tasks }: { tasks: Task[] }) {
  const [overrides, setOverrides] = useState<Record<string, TaskStatus>>({});
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

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

  const visible = tasks.filter((t) => !deleted.has(t.id));

  return (
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
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => setDragId(null)}
                      className={cn(
                        "cursor-grab rounded-xl border border-border bg-card p-3 shadow-sm transition active:cursor-grabbing",
                        dragId === t.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => void move(t.id, isDone ? "todo" : "done")}
                          aria-label={isDone ? "Reopen task" : "Complete task"}
                          className={cn(
                            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition",
                            isDone ? "border-emerald-400 bg-emerald-400 text-white" : "border-muted-foreground/50 text-transparent hover:border-emerald-400 hover:text-emerald-400",
                          )}
                        >
                          {isDone ? <RotateCcw className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                        </button>
                        <p className={cn("flex-1 text-sm font-medium", isDone && "text-muted-foreground line-through")}>{t.title}</p>
                        <button type="button" onClick={() => void remove(t.id)} aria-label="Delete task" className="text-muted-foreground/60 transition hover:text-red-400">
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
                        {t.project ? <span className="truncate text-xs text-muted-foreground">· {t.project}</span> : null}
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
  );
}
