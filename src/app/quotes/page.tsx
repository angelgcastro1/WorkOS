import Link from "next/link";
import { Plus, Trash2, FileText, ArrowRight } from "lucide-react";
import { getWorkspace } from "@/lib/queries";
import { convertQuoteToInvoice, deleteInvoice } from "@/app/actions";
import { Card, CardContent } from "@/components/ui";
import { cn, formatMoney, formatDate } from "@/lib/utils";

const QUOTE_BADGE: Record<string, string> = {
  draft: "bg-slate-500/15 text-slate-400",
  sent: "bg-blue-500/15 text-blue-400",
  accepted: "bg-emerald-500/15 text-emerald-400",
  declined: "bg-red-500/15 text-red-400",
};

export default async function QuotesPage() {
  const { invoices, clients } = await getWorkspace();
  const quotes = invoices.filter((i) => i.kind === "quote");
  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  const accepted = quotes.filter((q) => q.status === "accepted").reduce((s, q) => s + q.amount, 0);
  const pending = quotes.filter((q) => q.status === "draft" || q.status === "sent").reduce((s, q) => s + q.amount, 0);
  const winRate =
    quotes.length > 0
      ? Math.round((quotes.filter((q) => q.status === "accepted").length / quotes.length) * 100)
      : 0;

  const stats = [
    { label: "Accepted value", value: formatMoney(accepted), accent: "text-emerald-400" },
    { label: "Pending value", value: formatMoney(pending), accent: "text-amber-400" },
    { label: "Win rate", value: `${winRate}%`, accent: "text-foreground" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
          <p className="text-sm text-muted-foreground">Send a polished quote, then convert it to an invoice when it&rsquo;s accepted.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium transition hover:bg-muted"
          >
            <FileText className="h-4 w-4" /> Invoices
          </Link>
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> New quote
          </Link>
        </div>
      </header>

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

      {quotes.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No quotes yet — hit “New quote” to create your first.</div>
      ) : (
        <div className="space-y-2">
          {quotes.map((q) => {
            const name = q.clientId ? clientName.get(q.clientId) ?? q.client ?? "—" : q.client ?? "—";
            return (
              <Card key={q.id} className="flex flex-wrap items-center gap-3 p-3">
                <Link href={`/invoices/${q.id}`} className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {q.invoiceNumber || "Quote"}
                    <span className="font-normal text-muted-foreground"> · {name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {q.dueOn ? `Valid until ${formatDate(q.dueOn)}` : "No expiry"}
                  </p>
                </Link>
                <span className="text-sm font-bold tabular-nums">{formatMoney(q.amount)}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", QUOTE_BADGE[q.status] ?? QUOTE_BADGE.draft)}>{q.status}</span>
                {q.status === "accepted" ? (
                  <form action={convertQuoteToInvoice}>
                    <input type="hidden" name="id" value={q.id} />
                    <button type="submit" className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs transition hover:bg-muted">
                      <ArrowRight className="h-3 w-3" /> To invoice
                    </button>
                  </form>
                ) : null}
                <form action={deleteInvoice}>
                  <input type="hidden" name="id" value={q.id} />
                  <button type="submit" aria-label="Delete quote" className="text-muted-foreground/60 transition hover:text-red-400">
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
