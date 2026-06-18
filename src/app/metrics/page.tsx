import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { WeeklyTrend, CategoryBars, StatusDonut, FunnelBars, IncomeBars } from "@/components/charts";
import { getWorkspace } from "@/lib/queries";
import {
  deriveKpis,
  weeklyCompleted,
  tasksByStatus,
  projectsByCategory,
  applicationsFunnel,
  incomeByMonth,
} from "@/lib/metrics";
import { formatMoney } from "@/lib/utils";

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

export default async function MetricsPage() {
  const workspace = await getWorkspace();
  const { tasks, projects, applications, invoices } = workspace;
  const kpi = deriveKpis(workspace);
  const statusData = tasksByStatus(tasks);

  const stats: { label: string; value: string; sub?: string }[] = [
    { label: "Open tasks", value: String(kpi.openTasks), sub: `${kpi.overdue} overdue` },
    { label: "Done · 7 days", value: String(kpi.doneThisWeek), sub: "this week" },
    { label: "Income · month", value: formatMoney(kpi.incomeThisMonth), sub: `${formatMoney(kpi.outstanding)} outstanding` },
    { label: "Applications", value: String(kpi.applicationsCount), sub: `${kpi.interviews} interviews` },
    { label: "Active projects", value: String(kpi.activeProjects), sub: `${projects.length} total` },
    { label: "Completion", value: `${kpi.completionRate}%`, sub: "all tasks" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Metrics</h1>
        <p className="text-sm text-muted-foreground">Everything below is computed from your live data.</p>
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
        <ChartCard title="Tasks completed" hint="last 8 weeks">
          <WeeklyTrend data={weeklyCompleted(tasks)} />
        </ChartCard>

        <ChartCard title="Income" hint="paid, last 6 months">
          <IncomeBars data={incomeByMonth(invoices)} />
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
          {applications.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            <FunnelBars data={applicationsFunnel(applications)} />
          )}
        </ChartCard>

        <ChartCard title="Projects by category">
          {projects.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <CategoryBars data={projectsByCategory(projects)} />
          )}
        </ChartCard>

        <ChartCard title="This week at a glance">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-3xl font-bold tabular-nums text-emerald-400">{kpi.doneThisWeek}</p>
              <p className="text-xs text-muted-foreground">tasks completed</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-3xl font-bold tabular-nums text-indigo-400">{kpi.completionRate}%</p>
              <p className="text-xs text-muted-foreground">completion rate</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-3xl font-bold tabular-nums text-sky-400">{kpi.applicationsCount}</p>
              <p className="text-xs text-muted-foreground">applications</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-3xl font-bold tabular-nums text-amber-400">{formatMoney(kpi.outstanding)}</p>
              <p className="text-xs text-muted-foreground">outstanding</p>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
