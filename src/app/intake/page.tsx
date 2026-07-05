import Link from "next/link";
import { Mail, Phone, ArrowRight, Inbox } from "lucide-react";
import { getIntakeSubmissions } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui";
import { IntakeLinkCard } from "@/components/intake-link-card";
import { formatDate } from "@/lib/utils";

export default async function IntakePage() {
  const submissions = await getIntakeSubmissions();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Intake</h1>
        <p className="text-sm text-muted-foreground">Share your form link and every response lands here — and in your inbox.</p>
      </header>

      <IntakeLinkCard />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Submissions</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{submissions.length}</span>
        </div>

        {submissions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <Inbox className="h-8 w-8 opacity-40" />
            No submissions yet — share the link above to start collecting leads.
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <Card key={s.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold">
                        {s.name}
                        {s.company ? <span className="font-normal text-muted-foreground"> · {s.company}</span> : null}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {s.email ? (
                          <a href={`mailto:${s.email}`} className="flex items-center gap-1 transition hover:text-foreground">
                            <Mail className="h-3 w-3" /> {s.email}
                          </a>
                        ) : null}
                        {s.phone ? (
                          <a href={`tel:${s.phone}`} className="flex items-center gap-1 transition hover:text-foreground">
                            <Phone className="h-3 w-3" /> {s.phone}
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(s.createdAt)}</span>
                  </div>

                  {s.services.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {s.services.map((svc) => (
                        <span key={svc} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {svc}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {s.budget || s.timeline || s.source ? (
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                      {s.budget ? (
                        <span className="text-muted-foreground">
                          Budget: <span className="text-foreground">{s.budget}</span>
                        </span>
                      ) : null}
                      {s.timeline ? (
                        <span className="text-muted-foreground">
                          Timeline: <span className="text-foreground">{s.timeline}</span>
                        </span>
                      ) : null}
                      {s.source ? (
                        <span className="text-muted-foreground">
                          Heard via: <span className="text-foreground">{s.source}</span>
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {s.details ? <p className="whitespace-pre-line border-t border-border pt-3 text-sm text-muted-foreground">{s.details}</p> : null}

                  {s.clientId ? (
                    <Link
                      href={`/clients/${s.clientId}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary transition hover:underline"
                    >
                      View lead in Clients <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
