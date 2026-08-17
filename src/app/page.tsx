import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ListTodo, Folder, Flag, DollarSign, Send, Calendar, FileText, Check, Sparkles, Bell } from "lucide-react";
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
  LIVE_PROJECT_STATUSES,
} from "@/components/ui";
import { WeeklyTrend, StatusDonut } from "@/components/charts";
import { getWorkspace, getProfile } from "@/lib/queries";
import { deriveKpis, weeklyCompleted, tasksByStatus } from "@/lib/metrics";
import { toggleTask, seedSampleData } from "@/app/actions";
import { cn, formatMoney, formatDate, daysUntil } from "@/lib/utils";

// `href` sends each dashboard card to the section it summarises.
type Kpi = { label: string; value: string; icon: LucideIcon; accent: string; foot?: string; href: string };

export default async function DashboardPage() {
  const [workspace, profile] = await Promise.all([getWorkspace(), getProfile()]);
  const { projects, tasks, notes, contacts, reminders, events } = workspace;
  const isEmpty = projects.length === 0 && tasks.length === 0 && notes.length === 0 && contacts.length === 0;

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl text-white shadow-lg shadow-indigo-500/30">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome to WorkCham, {profile?.name ?? "there"}</h1>
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
    { label: "Open tasks", value: String(kpi.openTasks), icon: ListTodo, accent: "text-indigo-400 bg-indigo-500/10", foot: `${kpi.overdue} overdue`, href: "/tasks" },
    { label: "Done · 7 days", value: String(kpi.doneThisWeek), icon: Check, accent: "text-emerald-400 bg-emerald-500/10", foot: "this week", href: "/tasks" },
    { label: "Active projects", value: String(kpi.activeProjects), icon: Folder, accent: "text-violet-400 bg-violet-500/10", foot: `${projects.length} total`, href: "/projects" },
    { label: "Overdue", value: String(kpi.overdue), icon: Flag, accent: "text-red-400 bg-red-500/10", foot: kpi.overdue ? "needs attention" : "all clear", href: "/tasks" },
    { label: "Income · month", value: formatMoney(kpi.incomeThisMonth), icon: DollarSign, accent: "text-emerald-400 bg-emerald-500/10", foot: `${formatMoney(kpi.outstanding)} outstanding`, href: "/invoices" },
    { label: "Applications", value: String(kpi.applicationsCount), icon: Send, accent: "text-sky-400 bg-sky-500/10", foot: `${kpi.interviews} interviews`, href: "/jobs" },
  ];

  const activeProjects = projects.filter((p) => LIVE_PROJECT_STATUSES.includes(p.status));
  const todays = tasks
    .filter((t) => t.status !== "done" && t.due && (daysUntil(t.due) ?? 99) <= 0)
    .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""));
  const upcoming = [...projects]
    .filter((p) => p.status !== "done" && p.status !== "cancelled" && p.deadline)
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))
    .slice(0, 4);
  const recentNotes = notes.slice(0, 4);
  // eslint-disable-next-line react-hooks/purity -- server component renders once per request
  const nowMs = Date.now();
  const openReminders = [...reminders]
    .filter((r) => !r.done)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const upcomingReminders = openReminders.slice(0, 4);
  const overdueReminders = openReminders.filter((r) => new Date(r.dueAt).getTime() < nowMs).length;

  const todayIso = new Date(nowMs).toISOString().slice(0, 10);
  const eventOccursOn = (ev: (typeof events)[number], iso: string) => {
    if (iso < ev.date) return false;
    if (ev.repeatRule === "daily") return true;
    if (ev.repeatRule === "weekly") return new Date(iso).getUTCDay() === new Date(ev.date).getUTCDay();
    if (ev.repeatRule === "monthly") return iso.slice(8, 10) === ev.date.slice(8, 10);
    return iso === ev.date;
  };
  const weekSchedule: { iso: string; ev: (typeof events)[number] }[] = [];
  for (let i = 0; i < 7; i++) {
    const iso = new Date(nowMs + i * 86400000).toISOString().slice(0, 10);
    for (const ev of events) if (eventOccursOn(ev, iso)) weekSchedule.push({ iso, ev });
  }
  weekSchedule.sort((a, b) => (a.iso === b.iso ? (a.ev.startTime ?? "").localeCompare(b.ev.startTime ?? "") : a.iso.localeCompare(b.iso)));
  const weekItems = weekSchedule.slice(0, 6);
  const todaysMeetings = weekSchedule.filter((w) => w.iso === todayIso).length;

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
            <Link
              key={k.label}
              href={k.href}
              aria-label={`${k.label} — open ${k.href === "/" ? "dashboard" : k.href.slice(1)}`}
              className="group rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card className="animate-fade-up h-full transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-md group-hover:shadow-indigo-500/10">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
                    <span className={cn("grid h-8 w-8 place-items-center rounded-lg transition group-hover:scale-110", k.accent)}>
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{k.value}</p>
                  {k.foot ? <p className="mt-0.5 text-xs text-muted-foreground">{k.foot}</p> : null}
                </CardContent>
              </Card>
            </Link>
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
            <CardTitle>
              <Link href="/projects" className="transition hover:text-primary">Active projects</Link>
            </CardTitle>
            <Link href="/projects" className="text-xs text-primary transition hover:underline">
              {activeProjects.length} in motion
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeProjects.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No active projects.</p>
            ) : (
              activeProjects.map((p) => {
                const days = daysUntil(p.deadline);
                return (
                  <Link key={p.id} href="/projects" className="-mx-2 block space-y-2 rounded-lg px-2 py-1.5 transition hover:bg-muted">
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
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle>
              <Link href="/tasks" className="transition hover:text-primary">Today &amp; overdue</Link>
            </CardTitle>
            <Link href="/tasks" className="text-xs text-primary transition hover:underline">{todays.length} items</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {todays.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nothing due. Nice.</p>
            ) : (
              todays.map((t) => {
                const days = daysUntil(t.due);
                const overdue = days !== null && days < 0;
                return (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 transition hover:border-primary/40 hover:bg-muted">
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
                    <Link href="/tasks" className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      {t.project ? <p className="truncate text-xs text-muted-foreground">{t.project}</p> : null}
                    </Link>
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

      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Link href="/calendar" className="transition hover:text-primary">This week</Link>
          </CardTitle>
          <Link href="/calendar" className="text-xs text-primary transition hover:underline">
            {todaysMeetings > 0 ? `${todaysMeetings} today · ` : ""}Open calendar
          </Link>
        </CardHeader>
        <CardContent>
          {weekItems.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              Nothing scheduled.{" "}
              <Link href="/calendar" className="text-primary hover:underline">
                Add an event
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {weekItems.map(({ iso, ev }) => (
                <Link
                  key={`${ev.id}-${iso}`}
                  href="/calendar"
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 transition hover:border-primary/40 hover:bg-muted"
                >
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">{new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" })}</p>
                    <p className="text-base font-bold tabular-nums leading-none">{Number(iso.slice(8, 10))}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ev.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{ev.startTime ? `${ev.startTime.slice(0, 5)} · ` : ""}{ev.type.replace("_", " ")}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Link href="/reminders" className="transition hover:text-primary">Reminders</Link>
            </CardTitle>
            <Link href="/reminders" className="text-xs text-primary transition hover:underline">
              {overdueReminders > 0 ? `${overdueReminders} overdue` : "on track"}
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingReminders.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">No reminders set.</p>
            ) : (
              upcomingReminders.map((r) => {
                const diff = Math.round((new Date(r.dueAt).getTime() - nowMs) / 86400000);
                const isOver = new Date(r.dueAt).getTime() < nowMs;
                const label = diff < 0 ? "overdue" : diff === 0 ? "today" : `in ${diff}d`;
                return (
                  <Link key={r.id} href="/reminders" className="-mx-1 flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition hover:bg-muted">
                    <span className="truncate text-sm">{r.title}</span>
                    <span className={cn("shrink-0 text-xs", isOver ? "font-semibold text-red-400" : "text-muted-foreground")}>{label}</span>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Link href="/projects" className="transition hover:text-primary">Upcoming deadlines</Link>
            </CardTitle>
            <Link href="/projects" className="text-xs text-primary transition hover:underline">Open</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">No deadlines set.</p>
            ) : (
              upcoming.map((p) => {
                const days = daysUntil(p.deadline);
                return (
                  <Link key={p.id} href="/projects" className="-mx-1 flex items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-muted">
                    <span className="truncate text-sm">{p.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(p.deadline)}
                      {days !== null ? ` · ${days}d` : ""}
                    </span>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Link href="/notes" className="transition hover:text-primary">Recent notes</Link>
            </CardTitle>
            <Link href="/notes" className="text-xs text-primary transition hover:underline">Open</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentNotes.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              recentNotes.map((n) => (
                <Link key={n.id} href="/notes" className="-mx-1 flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition hover:bg-muted">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge className="bg-violet-500/15 text-violet-400">{n.type}</Badge>
                    <span className="truncate text-sm">{n.title}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(n.date)}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
