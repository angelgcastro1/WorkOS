import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Plus, Mail, Phone, MapPin, PhoneCall, Pencil, FileText, Receipt, Briefcase, Paperclip, Link2 } from "lucide-react";
import { getWorkspace, getProfile, getClientNotes, getIntakeSubmissions } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { createReminder } from "@/app/actions";
import { Card, CardContent } from "@/components/ui";
import { ClientStageSelect } from "@/components/client-stage-select";
import { ClientNotesPanel } from "@/components/client-notes-panel";
import { AttachmentGallery } from "@/components/attachment-gallery";
import { FollowUpButton } from "@/components/follow-up-button";
import { cn, formatMoney, formatDate } from "@/lib/utils";

function renderLinks(text: string): ReactNode[] {
  return text.split(/(\s+)/).map((tok, i) => {
    if (/^https?:\/\/[^\s]+$/i.test(tok)) {
      return (
        <a key={i} href={tok} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline underline-offset-2">
          {tok}
        </a>
      );
    }
    return <span key={i}>{tok}</span>;
  });
}

const DOC_BADGE: Record<string, string> = {
  draft: "bg-slate-500/15 text-slate-400",
  sent: "bg-blue-500/15 text-blue-400",
  paid: "bg-emerald-500/15 text-emerald-400",
  overdue: "bg-red-500/15 text-red-400",
  accepted: "bg-emerald-500/15 text-emerald-400",
  declined: "bg-red-500/15 text-red-400",
};

const PROJECT_BADGE: Record<string, string> = {
  planning: "bg-slate-500/15 text-slate-400",
  active: "bg-blue-500/15 text-blue-400",
  on_hold: "bg-amber-500/15 text-amber-400",
  done: "bg-emerald-500/15 text-emerald-400",
  completed: "bg-emerald-500/15 text-emerald-400",
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [workspace, profile, clientNotes, allIntake] = await Promise.all([
    getWorkspace(),
    getProfile(),
    getClientNotes(id),
    getIntakeSubmissions(),
  ]);
  const client = workspace.clients.find((c) => c.id === id);
  if (!client) redirect("/clients");

  // Files + links this client sent through the intake form.
  const intakeForClient = allIntake.filter((s) => s.clientId === id);
  const intakeAttachments = intakeForClient.flatMap((s) => s.attachments);
  const intakeLinks = intakeForClient.map((s) => s.links).filter((l): l is string => !!l && l.trim().length > 0);
  const signed = new Map<string, string>();
  if (intakeAttachments.length > 0) {
    const supabase = await createClient();
    const { data: signedList } = await supabase.storage
      .from("intake-uploads")
      .createSignedUrls(intakeAttachments.map((a) => a.path), 3600);
    for (const it of signedList ?? []) if (it.path && it.signedUrl) signed.set(it.path, it.signedUrl);
  }
  const hasIntake = intakeAttachments.length > 0 || intakeLinks.length > 0;

  const docs = workspace.invoices.filter((i) => i.clientId === id);
  const quotes = docs.filter((i) => i.kind === "quote");
  const invoices = docs.filter((i) => i.kind !== "quote");
  const reminders = workspace.reminders.filter((r) => r.clientId === id);
  const openReminders = reminders.filter((r) => !r.done);
  const projects = workspace.projects.filter((p) => p.clientId === id);

  const totalBilled = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const openBalance = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const acceptedQuotes = quotes.filter((q) => q.status === "accepted").length;

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(9, 0, 0, 0);
  const nextWeekIso = nextWeek.toISOString();

  const latestQuote = quotes[0] ?? null;
  const quoteRef = latestQuote ? `quote ${latestQuote.invoiceNumber ?? ""}`.trim() : null;

  const stats = [
    { label: "Total billed", value: formatMoney(totalBilled), accent: "text-emerald-400" },
    { label: "Open balance", value: formatMoney(openBalance), accent: "text-amber-400" },
    { label: "Quotes accepted", value: `${acceptedQuotes}/${quotes.length}`, accent: "text-foreground" },
  ];

  return (
    <div className="space-y-6">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Clients
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
          {client.company ? <p className="text-sm text-muted-foreground">{client.company}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Stage</span>
          <ClientStageSelect clientId={client.id} stage={client.stage} />
        </div>
      </header>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/quotes/new?client=${client.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> New quote
        </Link>
        <Link
          href={`/invoices/new?client=${client.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium transition hover:bg-muted"
        >
          <Receipt className="h-4 w-4" /> New invoice
        </Link>
        <form action={createReminder}>
          <input type="hidden" name="title" value={`Call ${client.name}`} />
          <input type="hidden" name="due_at" value={nextWeekIso} />
          <input type="hidden" name="client_id" value={client.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium transition hover:bg-muted"
          >
            <PhoneCall className="h-4 w-4" /> Call next week
          </button>
        </form>
        <FollowUpButton
          clientName={client.name}
          clientEmail={client.email}
          businessName={profile?.businessName || profile?.name || null}
          quoteRef={quoteRef}
        />
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <p className={cn("mt-1 text-2xl font-bold tabular-nums tracking-tight", s.accent)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Activity & notes log */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-sm font-semibold">Activity &amp; notes</h2>
          <ClientNotesPanel clientId={client.id} notes={clientNotes} />
        </CardContent>
      </Card>

      {/* Files & links from the intake form */}
      {hasIntake ? (
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <Paperclip className="h-4 w-4 text-muted-foreground" /> Files &amp; links from intake
            </h2>
            {intakeLinks.length > 0 ? (
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Link2 className="h-3.5 w-3.5" /> Links
                </p>
                {intakeLinks.map((l, i) => (
                  <p key={i} className="whitespace-pre-line break-words text-sm text-muted-foreground">
                    {renderLinks(l)}
                  </p>
                ))}
              </div>
            ) : null}
            {intakeAttachments.length > 0 ? (
              <AttachmentGallery files={intakeAttachments.map((a) => ({ path: a.path, name: a.name, url: signed.get(a.path) ?? null }))} />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Contact</h2>
              <Link href="/clients" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground">
                <Pencil className="h-3 w-3" /> Edit
              </Link>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              {client.email ? (
                <a href={`mailto:${client.email}`} className="flex items-center gap-2 transition hover:text-foreground">
                  <Mail className="h-4 w-4" /> {client.email}
                </a>
              ) : null}
              {client.phone ? (
                <a href={`tel:${client.phone}`} className="flex items-center gap-2 transition hover:text-foreground">
                  <Phone className="h-4 w-4" /> {client.phone}
                </a>
              ) : null}
              {client.address ? (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> <span className="whitespace-pre-line">{client.address}</span>
                </p>
              ) : null}
              {!client.email && !client.phone && !client.address ? (
                <p className="text-xs">No contact details yet — add them from the Clients page.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Reminders</h2>
              <Link href="/reminders" className="text-xs text-muted-foreground transition hover:text-foreground">
                All
              </Link>
            </div>
            {openReminders.length === 0 ? (
              <p className="text-xs text-muted-foreground">No open reminders. Use “Call next week” to set one.</p>
            ) : (
              <ul className="space-y-2">
                {openReminders.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">{r.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(r.dueAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quotes */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <FileText className="h-4 w-4 text-muted-foreground" /> Quotes
              </h2>
              <Link href={`/quotes/new?client=${client.id}`} className="text-xs text-primary transition hover:underline">
                + New
              </Link>
            </div>
            {quotes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No quotes yet.</p>
            ) : (
              <ul className="space-y-2">
                {quotes.map((q) => (
                  <li key={q.id}>
                    <Link href={`/invoices/${q.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-muted">
                      <span className="min-w-0 truncate font-medium">{q.invoiceNumber || "Quote"}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="tabular-nums">{formatMoney(q.amount)}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", DOC_BADGE[q.status] ?? DOC_BADGE.draft)}>{q.status}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Invoices / job history */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <Receipt className="h-4 w-4 text-muted-foreground" /> Invoices
              </h2>
              <Link href={`/invoices/new?client=${client.id}`} className="text-xs text-primary transition hover:underline">
                + New
              </Link>
            </div>
            {invoices.length === 0 ? (
              <p className="text-xs text-muted-foreground">No invoices yet.</p>
            ) : (
              <ul className="space-y-2">
                {invoices.map((i) => (
                  <li key={i.id}>
                    <Link href={`/invoices/${i.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-muted">
                      <span className="min-w-0 truncate font-medium">{i.invoiceNumber || "Invoice"}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="tabular-nums">{formatMoney(i.amount)}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", DOC_BADGE[i.status] ?? DOC_BADGE.draft)}>{i.status}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Jobs / projects */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <Briefcase className="h-4 w-4 text-muted-foreground" /> Jobs
              </h2>
              <Link href="/projects" className="text-xs text-muted-foreground transition hover:text-foreground">
                All projects
              </Link>
            </div>
            {projects.length === 0 ? (
              <p className="text-xs text-muted-foreground">No jobs linked yet. Set a project&rsquo;s client to track work here.</p>
            ) : (
              <ul className="space-y-2">
                {projects.map((p) => (
                  <li key={p.id}>
                    <Link href="/projects" className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-muted">
                      <span className="min-w-0 truncate font-medium">{p.name}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        {p.deadline ? <span className="text-xs text-muted-foreground">{formatDate(p.deadline)}</span> : null}
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", PROJECT_BADGE[p.status] ?? "bg-slate-500/15 text-slate-400")}>{p.status}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
