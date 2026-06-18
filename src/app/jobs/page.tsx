import { Plus, Trash2, ExternalLink } from "lucide-react";
import type { ApplicationStage } from "@/lib/data";
import { getWorkspace } from "@/lib/queries";
import { createApplication, setApplicationStage, deleteApplication } from "@/app/actions";
import { Card, Badge } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";

const STAGES: { key: ApplicationStage; label: string; badge: string; dot: string }[] = [
  { key: "applied", label: "Applied", badge: "bg-slate-500/15 text-slate-400", dot: "bg-slate-400" },
  { key: "screening", label: "Screening", badge: "bg-blue-500/15 text-blue-400", dot: "bg-blue-400" },
  { key: "interview", label: "Interview", badge: "bg-violet-500/15 text-violet-400", dot: "bg-violet-400" },
  { key: "offer", label: "Offer", badge: "bg-emerald-500/15 text-emerald-400", dot: "bg-emerald-400" },
  { key: "rejected", label: "Rejected", badge: "bg-red-500/15 text-red-400", dot: "bg-red-400" },
];

const fieldClass =
  "rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

function stageMeta(stage: string) {
  return STAGES.find((s) => s.key === stage) ?? STAGES[0];
}

export default async function JobsPage() {
  const { applications } = await getWorkspace();
  const counts = STAGES.map((s) => ({ ...s, n: applications.filter((a) => a.stage === s.key).length }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Job Applications</h1>
        <p className="text-sm text-muted-foreground">Track every application from applied to offer.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {counts.map((s) => (
          <span key={s.key} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium", s.badge)}>
            {s.label} · {s.n}
          </span>
        ))}
      </div>

      <Card>
        <form action={createApplication} className="flex flex-wrap items-center gap-2 p-3">
          <input name="company" required placeholder="Company" className={cn(fieldClass, "w-40")} />
          <input name="role" placeholder="Role" className={cn(fieldClass, "flex-1")} />
          <input name="link" placeholder="Posting link" className={cn(fieldClass, "w-44")} />
          <select name="stage" defaultValue="applied" className={fieldClass} aria-label="Stage">
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <input name="next_step" type="date" className={fieldClass} aria-label="Next step" />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
      </Card>

      {applications.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No applications yet — add your first above.</div>
      ) : (
        <div className="space-y-2">
          {applications.map((a) => {
            const meta = stageMeta(a.stage);
            const safeLink = a.link && /^https?:\/\//i.test(a.link) ? a.link : null;
            return (
              <Card key={a.id} className="flex flex-wrap items-center gap-3 p-3">
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", meta.dot)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {a.company}
                    {a.role ? <span className="font-normal text-muted-foreground"> — {a.role}</span> : null}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    {a.appliedOn ? <span>Applied {formatDate(a.appliedOn)}</span> : null}
                    {a.nextStep ? <span>· Next {formatDate(a.nextStep)}</span> : null}
                    {safeLink ? (
                      <a href={safeLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                        <ExternalLink className="h-3 w-3" /> posting
                      </a>
                    ) : null}
                  </p>
                </div>
                <Badge className={meta.badge}>{meta.label}</Badge>
                <form action={setApplicationStage} className="flex items-center gap-1.5">
                  <input type="hidden" name="id" value={a.id} />
                  <select name="stage" defaultValue={a.stage} className={cn(fieldClass, "py-1")} aria-label="Move stage">
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-lg border border-border px-2 py-1 text-xs transition hover:bg-muted">
                    Move
                  </button>
                </form>
                <form action={deleteApplication}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" aria-label="Delete application" className="text-muted-foreground/60 transition hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
