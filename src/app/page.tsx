import type { LucideIcon } from "lucide-react";
import {
  ListTodo,
  Folder,
  Send,
  Users,
  Eye,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  Clock,
  FileText,
  CalendarClock,
} from "lucide-react";
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
import { WeeklyTrend } from "@/components/charts";
import {
  metrics,
  projects,
  tasks,
  notes,
  activity,
  aiSuggestions,
  weeklyProgress,
  profile,
} from "@/lib/data";
import { cn, formatMoney, formatDate, daysUntil } from "@/lib/utils";

const visitsDelta = Math.round(
  ((metrics.portfolioVisits - metrics.portfolioVisitsPrev) / metrics.portfolioVisitsPrev) * 100,
);
const weekDelta = metrics.tasksDoneWeek - metrics.tasksDoneWeekPrev;

type Kpi = { label: string; value: string; delta?: string; icon: LucideIcon; accent: string };

const kpis: Kpi[] = [
  { label: "Done this week", value: String(metrics.tasksDoneWeek), delta: `+${weekDelta} vs last week`, icon: ListTodo, accent: "text-emerald-400 bg-emerald-500/10" },
  { label: "Active projects", value: String(metrics.activeProjects), icon: Folder, accent: "text-indigo-400 bg-indigo-500/10" },
  { label: "Applications sent", value: String(metrics.applicationsSent), delta: `${metrics.interviewsBooked} interviews`, icon: Send, accent: "text-sky-400 bg-sky-500/10" },
  { label: "Leads contacted", value: String(metrics.leadsContacted), icon: Users, accent: "text-violet-400 bg-violet-500/10" },
  { label: "Portfolio visits", value: metrics.portfolioVisits.toLocaleString(), delta: `+${visitsDelta}% this week`, icon: Eye, accent: "text-amber-400 bg-amber-500/10" },
  { label: "Income · June", value: formatMoney(metrics.incomeMonth), delta: `of ${formatMoney(metrics.incomeGoal)} goal`, icon: DollarSign, accent: "text-emerald-400 bg-emerald-500/10" },
];

const todaysFocus = tasks
  .filter((t) => t.status !== "done" && t.due && (daysUntil(t.due) ?? 99) <= 0)
  .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""));

const upcoming = [...projects]
  .filter((p) => p.status !== "done")
  .sort((a, b) => a.deadline.localeCompare(b.deadline))
  .slice(0, 4);

const activeProjects = projects.filter((p) => p.status === "active" || p.status === "planning");
const recentNotes = [...notes].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
const incomePct = Math.round((metrics.incomeMonth / metrics.incomeGoal) * 100);

const activityDot: Record<string, string> = {
  task: "bg-emerald-400",
  job: "bg-sky-400",
  lead: "bg-violet-400",
  content: "bg-amber-400",
  income: "bg-green-400",
};

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  return (
    <Card className="animate-fade-up">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
          <span className={cn("grid h-8 w-8 place-items-center rounded-lg", kpi.accent)}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{kpi.value}</p>
        {kpi.delta ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowUpRight className="h-3 w-3 text-emerald-400" />
            {kpi.delta}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Good morning, {profile.name} 👋</h1>
        <p className="text-sm text-muted-foreground">
          You have {todaysFocus.length} items due today and {metrics.activeProjects} active projects. Here&apos;s your day.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="animate-fade-up">
            <CardHeader>
              <CardTitle>Weekly progress</CardTitle>
              <span className="text-xs text-muted-foreground">Tasks completed &amp; applications · last 8 weeks</span>
            </CardHeader>
            <CardContent>
              <WeeklyTrend data={weeklyProgress} />
            </CardContent>
          </Card>

          <Card className="animate-fade-up">
            <CardHeader>
              <CardTitle>Active projects</CardTitle>
              <span className="text-xs text-muted-foreground">{activeProjects.length} in motion</span>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeProjects.map((p) => {
                const days = daysUntil(p.deadline);
                return (
                  <div key={p.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium">{p.name}</span>
                        <Badge className={projectStatusBadge[p.status]}>{projectStatusLabel[p.status]}</Badge>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {p.tasksDone}/{p.tasksTotal} · {days !== null && days >= 0 ? `${days}d left` : "due"}
                      </span>
                    </div>
                    <Progress value={p.progress} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="animate-fade-up overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">June income goal</span>
                <span className="text-xs font-semibold text-emerald-400">{incomePct}%</span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {formatMoney(metrics.incomeMonth)}
                <span className="text-sm font-normal text-muted-foreground"> / {formatMoney(metrics.incomeGoal)}</span>
              </p>
              <Progress className="mt-3" value={incomePct} barClassName="bg-gradient-to-r from-emerald-500 to-green-400" />
            </CardContent>
          </Card>

          <Card className="animate-fade-up border-violet-500/20 bg-gradient-to-b from-violet-500/[0.07] to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" /> AI suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {aiSuggestions.slice(0, 3).map((s) => (
                <p key={s} className="text-sm leading-snug text-muted-foreground">
                  {s}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="animate-fade-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Today&apos;s focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todaysFocus.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Nothing due today. 🎉</p>
              ) : (
                todaysFocus.map((t) => {
                  const days = daysUntil(t.due);
                  const overdue = days !== null && days < 0;
                  return (
                    <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
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
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" /> Upcoming deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map((p) => {
              const days = daysUntil(p.deadline);
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg px-1 py-1.5">
                  <span className="truncate text-sm">{p.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(p.deadline)} · {days}d
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" /> Recent notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentNotes.map((n) => (
              <div key={n.id} className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge className="bg-violet-500/15 text-violet-400">{n.type}</Badge>
                  <span className="truncate text-sm">{n.title}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(n.date)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {activity.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-1.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", activityDot[a.kind])} />
              <span className="flex-1 text-sm">{a.text}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{a.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
