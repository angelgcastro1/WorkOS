import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Priority, ProjectStatus, TaskStatus } from "@/lib/data";

type WithChildren = { className?: string; children?: ReactNode };

export function Card({ className, children }: WithChildren) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card text-card-foreground shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: WithChildren) {
  return <div className={cn("flex items-center justify-between gap-3 p-5 pb-2", className)}>{children}</div>;
}

export function CardTitle({ className, children }: WithChildren) {
  return <h3 className={cn("text-sm font-semibold tracking-tight", className)}>{children}</h3>;
}

export function CardContent({ className, children }: WithChildren) {
  return <div className={cn("p-5 pt-2", className)}>{children}</div>;
}

type BadgeProps = { className?: string; children: ReactNode };
export function Badge({ className, children }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}>
      {children}
    </span>
  );
}

type ProgressProps = { value: number; className?: string; barClassName?: string };
export function Progress({ value, className, barClassName }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full bg-primary transition-[width] duration-700 ease-out", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export const priorityBadge: Record<Priority, string> = {
  urgent: "bg-red-500/15 text-red-500",
  high: "bg-amber-500/15 text-amber-500",
  medium: "bg-blue-500/15 text-blue-400",
  low: "bg-slate-500/15 text-slate-400",
};
export const priorityLabel: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const taskStatusMeta: Record<TaskStatus, { label: string; dot: string }> = {
  todo: { label: "To do", dot: "bg-slate-400" },
  in_progress: { label: "In progress", dot: "bg-indigo-400" },
  blocked: { label: "Blocked", dot: "bg-red-400" },
  done: { label: "Done", dot: "bg-emerald-400" },
};

export const projectStatusBadge: Record<ProjectStatus, string> = {
  planning: "bg-violet-500/15 text-violet-400",
  active: "bg-emerald-500/15 text-emerald-400",
  on_hold: "bg-amber-500/15 text-amber-500",
  done: "bg-slate-500/15 text-slate-400",
};
export const projectStatusLabel: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  done: "Done",
};
