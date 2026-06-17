import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { WeeklyTrend, IncomeBars, CategoryBars, StatusDonut, FunnelBars } from "@/components/charts";
import { metrics, weeklyProgress, incomeByMonth, contentByCategory, jobFunnel, tasks } from "@/lib/data";
import { formatMoney } from "@/lib/utils";

const statusData = [
  { name: "Done", value: tasks.filter((t) => t.status === "done").length, color: "#10b981" },
  { name: "In progress", value: tasks.filter((t) => t.status === "in_progress").length, color: "#6366f1" },
  { name: "To do", value: tasks.filter((t) => t.status === "todo").length, color: "#64748b" },
  { name: "Blocked", value: tasks.filter((t) => t.status === "blocked").length, color: "#ef4444" },
];

const stats: { label: string; value: string; sub?: string }[] = [
  { label: "Applications sent", value: String(metrics.applicationsSent), sub: "all time" },
  { label: "Interviews booked", value: String(metrics.interviewsBooked), sub: "from 27 applications" },
  { label: "Portfolio visits", value: metrics.portfolioVisits.toLocaleString(), sub: "this month" },
  { label: "Content posted", value: String(metrics.contentPosted), sub: "this month" },
  { label: "Completion rate", value: `${metrics.completionRate}%`, sub: "weekly tasks" },
  { label: "Income · June", value: formatMoney(metrics.incomeMonth), sub: `of ${formatMoney(metrics.incomeGoal)}` },
];

function ChartCard({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function MetricsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Metrics</h1>
        <p className="text-sm text-muted-foreground">How your work, job search, and business are trending.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="animate-fade-up">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{s.value}</p>
              {s.sub ? <p className="text-xs text-muted-foreground">{s.sub}</p> : null}
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Tasks completed & applications" hint="last 8 weeks">
          <WeeklyTrend data={weeklyProgress} />
        </ChartCard>
        <ChartCard title="Monthly income vs goal" hint="2026">
          <IncomeBars data={incomeByMonth} />
        </ChartCard>
        <ChartCard title="Creative output by type" hint="this month">
          <CategoryBars data={contentByCategory} />
        </ChartCard>
        <ChartCard title="Tasks by status">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <StatusDonut data={statusData} />
            </div>
            <div className="flex flex-col gap-2">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="ml-auto font-semibold tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
        <ChartCard title="Job search funnel" hint="applied → offer">
          <FunnelBars data={jobFunnel} />
        </ChartCard>
        <ChartCard title="This week at a glance">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-3xl font-bold tabular-nums text-emerald-400">{metrics.tasksDoneWeek}</p>
              <p className="text-xs text-muted-foreground">tasks completed</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-3xl font-bold tabular-nums text-indigo-400">{metrics.completionRate}%</p>
              <p className="text-xs text-muted-foreground">completion rate</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-3xl font-bold tabular-nums text-sky-400">{metrics.leadsContacted}</p>
              <p className="text-xs text-muted-foreground">leads contacted</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-3xl font-bold tabular-nums text-amber-400">+{Math.round(((metrics.portfolioVisits - metrics.portfolioVisitsPrev) / metrics.portfolioVisitsPrev) * 100)}%</p>
              <p className="text-xs text-muted-foreground">portfolio traffic</p>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
