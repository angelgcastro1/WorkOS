import type { LucideIcon } from "lucide-react";
import { ListTodo, Folder, Flag, DollarSign, Activity, Calendar, FileText, Check, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
  priorityBadge,
  priorityLabel,
  projectStatusBadge,
  projectStatusLabel,
} from "@/components/ui";
import { WeeklyTrend, StatusDonut } from "@/components/charts";
import { getWorkspace, getProfile } from "@/lib/queries";
import { deriveKpis, weeklyCompleted, tasksByStatus } from "@/lib/metrics";
import { toggleTask, seedSampleData } from "@/app/actions";
import { cn, formatMoney, formatDate, daysUntil } from "@/lib/utils";

type Kpi = { label: string; value: string; icon: LucideIcon; accent: string; foot?: string };

export default async function DashboardPage() {
  const [workspace, profile] = await Promise.all([getWorkspace(), getProfile()]);
  const { projects, tasks, notes, contacts } = workspace;
  const isEmpty = projects.length === 0 && tasks.length === 0 && notes.length === 0 && contacts.length === 0;

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl text-white shadow-lg shadow-indigo-500/30">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome to WorkCHAM, {profile?.name ?? "there"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your workspace is empty. Load a realistic starter set to see everything in action — you can edit or clear it anytime.
        </p>
        <form action={seedSampleData} className="mt-6">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            <Sparkles className="h-4 w-4" /> Load sample data
          </button>
        </form>
        <p className="mt-4 text-xs text-muted-foreground">…or head to Tasks and add your own.</p>
      </div>
    );
  }

  const kpi = deriveKpis(workspace);
  const kpis: Kpi[] = [
    { label: "Open tasks", value: String(kpi.openTasks), icon: ListTodo, accent: "text-indigo-400 bg-indigo-500/10", foot: `${kpi.overdue} overdue` },
    { label: "Done · 7 days", value: String(kpi.doneThisWeek), icon: Check, accent: "text-emerald-400 bg-emerald-500/10", foot: "this week" },
    { label: "Active projects", value: String(kpi.activeProjects), icon: Folder, accent: "text-violet-400 bg-violet-500/10", foot: `${projects.length} total` },
    { label: "Overdue", value: String(kpi.overdue), icon: Flag, accent: "text-red-400 bg-red-500/10", foot: kpi.overdue ? "needs attention" : "all clear" },
    { label: "Completion", value: `${kpi.completionRate}%`, icon: Activity, accent: "text-amber-400 bg-amber-500/10", foot: "of all tasks" },
    { label: "Pipeline", value: formatMoney(kpi.pipelineValue), icon: DollarSign, accent: "text-sky-400 bg-sky-500/10", foot: `${formatMoney(kpi.wonValue)} won` },
  ];

  const activeProjects = projects.filter((p) => p.status === "active" || p.status === "planning");
  const todays = tasks
    .filter((t) => t.status !== "done" && t.due && (daysUntil(t.due) ?? 99) <= 0)
    .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""));
  const upcoming = [...projects]
    .filter((p) => p.status !== "done" && p.deadline)
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))
    .slice(0, 4);
  const recentNotes = notes.slice(0, 4);

  return (
    <div className="space-y-6">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Good to see you, {profile?.name ?? "there"}</h1>
        <p className="text-sm text-muted-foreground">
          {todays.length} due today and {kpi.activeProjects} active projects.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="animate-fade-up">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
                  <span className={cn("grid h-8 w-8 place-items-center rounded-lg", k.accent)}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{k.value}</p>
                {k.foot ? <p className="mt-0.5 text-xs text-muted-foreground">{k.foot}</p> : null}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2">
          <CardHeader>
            <CardTitle>Tasks completed</CardTitle>
            <span className="text-xs text-muted-foreground">last 8 weeks</span>
          </CardHeader>
          <CardContent>
            <WeeklyTrend data={weeklyCompleted(tasks)} />
          </CardContent>
        </Card>
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle>Tasks by status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDonut data={tasksByStatus(tasks)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle>Active projects</CardTitle>
            <span className="text-xs text-muted-foreground">{activeProjects.length} in motion</span>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeProjects.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No active projects.</p>
            ) : (
              activeProjects.map((p) => {
                const days = daysUntil(p.deadline);
                return (
                  <div key={p.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium">{p.name}</span>
                        <Badge className={projectStatusBadge[p.status]}>{projectStatusLabel[p.status]}</Badge>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {p.tasksDone}/{p.tasksTotal}
                        {days !== null ? ` · ${days >= 0 ? `${days}d left` : "overdue"}` : ""}
                      </span>
                    </div>
                    <Progress value={p.progress} />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle>Today &amp; overdue</CardTitle>
            <span className="text-xs text-muted-foreground">{todays.length} items</span>
          </CardHeader>
          <CardContent className="space-y-2">
            {todays.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nothing due. Nice.</p>
            ) : (
              todays.map((t) => {
                const days = daysUntil(t.due);
                const overdue = days !== null && days < 0;
                return (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <form action={toggleTask}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="done" value="false" />
                      <button
                        type="submit"
                        aria-label="Complete task"
                        className="grid h-5 w-5 place-items-center rounded-md border-2 border-muted-foreground/50 text-transparent transition hover:border-emerald-400 hover:text-emerald-400"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </form>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      {t.project ? <p className="truncate text-xs text-muted-foreground">{t.project}</p> : null}
                    </div>
                    <Badge className={priorityBadge[t.priority]}>{priorityLabel[t.priority]}</Badge>
                    <span className={cn("shrink-0 text-xs", overdue ? "font-semibold text-red-400" : "text-muted-foreground")}>
                      {overdue ? `${Math.abs(days as number)}d late` : "Today"}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Upcoming deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">No deadlines set.</p>
            ) : (
              upcoming.map((p) => {
                const days = daysUntil(p.deadline);
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-lg px-1 py-1.5">
                    <span className="truncate text-sm">{p.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(p.deadline)}
                      {days !== null ? ` · ${days}d` : ""}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" /> Recent notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentNotes.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              recentNotes.map((n) => (
                <div key={n.id} className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge className="bg-violet-500/15 text-violet-400">{n.type}</Badge>
                    <span className="truncate text-sm">{n.title}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(n.date)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
