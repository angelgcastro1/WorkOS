import Link from "next/link";
import { Plus, Trash2, Check, Users } from "lucide-react";
import type { InvoiceStatus } from "@/lib/data";
import { getWorkspace } from "@/lib/queries";
import { setInvoiceStatus, deleteInvoice } from "@/app/actions";
import { Card, CardContent } from "@/components/ui";
import { cn, formatMoney, formatDate } from "@/lib/utils";

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft: "bg-slate-500/15 text-slate-400",
  sent: "bg-blue-500/15 text-blue-400",
  paid: "bg-emerald-500/15 text-emerald-400",
  overdue: "bg-red-500/15 text-red-400",
};

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function InvoicesPage() {
  const { invoices, clients } = await getWorkspace();
  const ym = monthKey();
  const paidThisMonth = invoices.filter((i) => i.status === "paid" && (i.paidOn ?? "").slice(0, 7) === ym).reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  const stats = [
    { label: "Paid this month", value: formatMoney(paidThisMonth), accent: "text-emerald-400" },
    { label: "Outstanding", value: formatMoney(outstanding), accent: "text-amber-400" },
    { label: "Total collected", value: formatMoney(totalPaid), accent: "text-foreground" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Create a clean invoice in seconds, then export a polished PDF.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium transition hover:bg-muted"
          >
            <Users className="h-4 w-4" /> Clients
          </Link>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> New invoice
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

      {invoices.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No invoices yet — hit “New invoice” to create your first.</div>
      ) : (
        <div className="space-y-2">
          {invoices.map((i) => {
            const name = i.clientId ? clientName.get(i.clientId) ?? i.client ?? "—" : i.client ?? "—";
            return (
              <Card key={i.id} className="flex flex-wrap items-center gap-3 p-3">
                <Link href={`/invoices/${i.id}`} className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {i.invoiceNumber || "Invoice"}
                    <span className="font-normal text-muted-foreground"> · {name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {i.dueOn ? `Due ${formatDate(i.dueOn)}` : "No due date"}
                    {i.status === "paid" && i.paidOn ? ` · Paid ${formatDate(i.paidOn)}` : ""}
                  </p>
                </Link>
                <span className="text-sm font-bold tabular-nums">{formatMoney(i.amount)}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_BADGE[i.status])}>{i.status}</span>
                {i.status !== "paid" ? (
                  <form action={setInvoiceStatus}>
                    <input type="hidden" name="id" value={i.id} />
                    <input type="hidden" name="status" value="paid" />
                    <button type="submit" className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs transition hover:bg-muted">
                      <Check className="h-3 w-3" /> Paid
                    </button>
                  </form>
                ) : null}
                <form action={deleteInvoice}>
                  <input type="hidden" name="id" value={i.id} />
                  <button type="submit" aria-label="Delete invoice" className="text-muted-foreground/60 transition hover:text-red-400">
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
