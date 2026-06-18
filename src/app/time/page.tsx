import { Trash2 } from "lucide-react";
import { getWorkspace } from "@/lib/queries";
import { deleteTimeEntry } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { timeByProject } from "@/lib/metrics";
import { formatDate } from "@/lib/utils";
import { TimeTracker } from "@/components/time-tracker";

function fmtMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h}h ${mm}m` : `${mm}m`;
}

export default async function TimePage() {
  const { timeEntries, projects } = await getWorkspace();
  const byProject = timeByProject(timeEntries, projects).sort((a, b) => b.minutes - a.minutes);
  const totalMinutes = timeEntries.reduce((s, t) => s + t.minutes, 0);
  const projectName = new Map(projects.map((p) => [p.id, p.name]));
  const recent = timeEntries.slice(0, 20);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Time Tracking</h1>
        <p className="text-sm text-muted-foreground">Run the stopwatch or log time manually. {fmtMinutes(totalMinutes)} logged in total.</p>
      </header>

      <TimeTracker projects={projects.map((p) => ({ id: p.id, name: p.name }))} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Time by project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {byProject.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">No time logged yet.</p>
            ) : (
              byProject.map((b) => (
                <div key={b.name} className="flex items-center justify-between rounded-lg px-1 py-1.5 text-sm">
                  <span className="truncate">{b.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{fmtMinutes(b.minutes)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {recent.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">Nothing logged yet.</p>
            ) : (
              recent.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{t.description || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.projectId ? `${projectName.get(t.projectId) ?? ""} · ` : ""}
                      {formatDate(t.entryDate)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums">{fmtMinutes(t.minutes)}</span>
                  <form action={deleteTimeEntry}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" aria-label="Delete entry" className="text-muted-foreground/60 transition hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
