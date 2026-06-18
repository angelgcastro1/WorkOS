import type { Workspace, Task, Contact, Project, Invoice, Application, TimeEntry } from "@/lib/data";

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface Kpis {
  openTasks: number;
  doneThisWeek: number;
  overdue: number;
  activeProjects: number;
  completionRate: number;
  pipelineValue: number;
  wonValue: number;
  contacts: number;
  incomeThisMonth: number;
  outstanding: number;
  applicationsCount: number;
  interviews: number;
  offers: number;
}

export function deriveKpis(w: Workspace): Kpis {
  const t0 = today();
  const todayIso = isoDay(t0);
  const weekAgo = new Date(t0);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = isoDay(weekAgo);
  const ym = monthKey(t0);

  const total = w.tasks.length;
  const done = w.tasks.filter((t) => t.status === "done").length;

  return {
    openTasks: w.tasks.filter((t) => t.status !== "done").length,
    doneThisWeek: w.tasks.filter((t) => t.status === "done" && t.completedAt !== null && t.completedAt >= weekAgoIso).length,
    overdue: w.tasks.filter((t) => t.status !== "done" && t.due !== null && t.due < todayIso).length,
    activeProjects: w.projects.filter((p) => p.status === "active").length,
    completionRate: total ? Math.round((done / total) * 100) : 0,
    pipelineValue: w.contacts.filter((c) => c.stage !== "won" && c.stage !== "lost").reduce((s, c) => s + c.value, 0),
    wonValue: w.contacts.filter((c) => c.stage === "won").reduce((s, c) => s + c.value, 0),
    contacts: w.contacts.length,
    incomeThisMonth: w.invoices
      .filter((i) => i.status === "paid" && (i.paidOn ?? "").slice(0, 7) === ym)
      .reduce((s, i) => s + i.amount, 0),
    outstanding: w.invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0),
    applicationsCount: w.applications.length,
    interviews: w.applications.filter((a) => a.stage === "interview" || a.stage === "offer").length,
    offers: w.applications.filter((a) => a.stage === "offer").length,
  };
}

export function weeklyCompleted(tasks: Task[], weeks = 8): { week: string; completed: number }[] {
  const t0 = today();
  const out: { week: string; completed: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(t0);
    end.setDate(end.getDate() - 7 * i);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const startIso = isoDay(start);
    const endIso = isoDay(end);
    const completed = tasks.filter((t) => t.completedAt !== null && t.completedAt >= startIso && t.completedAt <= endIso).length;
    out.push({ week: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }), completed });
  }
  return out;
}

const STATUS_META = [
  { key: "done", name: "Done", color: "#10b981" },
  { key: "in_progress", name: "In progress", color: "#6366f1" },
  { key: "todo", name: "To do", color: "#64748b" },
  { key: "blocked", name: "Blocked", color: "#ef4444" },
] as const;

export function tasksByStatus(tasks: Task[]): { name: string; value: number; color: string }[] {
  return STATUS_META.map((s) => ({
    name: s.name,
    value: tasks.filter((t) => t.status === s.key).length,
    color: s.color,
  }));
}

export function projectsByCategory(projects: Project[]): { category: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of projects) {
    const c = p.category || "Other";
    map.set(c, (map.get(c) ?? 0) + 1);
  }
  return Array.from(map, ([category, count]) => ({ category, count }));
}

const STAGE_META = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "discussion", label: "In discussion" },
  { key: "won", label: "Won" },
];

export function pipelineByStage(contacts: Contact[]): { stage: string; value: number }[] {
  return STAGE_META.map((s) => ({
    stage: s.label,
    value: contacts.filter((c) => c.stage === s.key).length,
  }));
}

export function incomeByMonth(invoices: Invoice[], months = 6): { month: string; income: number }[] {
  const base = today();
  const out: { month: string; income: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const ym = monthKey(d);
    const income = invoices
      .filter((inv) => inv.status === "paid" && (inv.paidOn ?? "").slice(0, 7) === ym)
      .reduce((s, inv) => s + inv.amount, 0);
    out.push({ month: d.toLocaleDateString(undefined, { month: "short" }), income });
  }
  return out;
}

const APP_STAGES = [
  { key: "applied", label: "Applied" },
  { key: "screening", label: "Screening" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
];

export function applicationsFunnel(applications: Application[]): { stage: string; value: number }[] {
  return APP_STAGES.map((s) => ({
    stage: s.label,
    value: applications.filter((a) => a.stage === s.key).length,
  }));
}

export function timeByProject(timeEntries: TimeEntry[], projects: Project[]): { name: string; minutes: number }[] {
  const nameById = new Map(projects.map((p) => [p.id, p.name]));
  const map = new Map<string, number>();
  for (const te of timeEntries) {
    const key = te.projectId ? nameById.get(te.projectId) ?? "Other" : "No project";
    map.set(key, (map.get(key) ?? 0) + te.minutes);
  }
  return Array.from(map, ([name, minutes]) => ({ name, minutes }));
}
