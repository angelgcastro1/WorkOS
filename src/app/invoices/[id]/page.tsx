import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { getWorkspace, getProfile } from "@/lib/queries";
import { formatMoney, formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/print-button";

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [workspace, profile] = await Promise.all([getWorkspace(), getProfile()]);
  const invoice = workspace.invoices.find((i) => i.id === id);
  if (!invoice) redirect("/invoices");

  const client = invoice.clientId ? workspace.clients.find((c) => c.id === invoice.clientId) ?? null : null;
  const subtotal = invoice.lineItems.reduce((s, li) => s + li.quantity * li.rate, 0);
  const tax = (subtotal * invoice.taxRate) / 100;
  const total = subtotal + tax;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="no-print flex items-center gap-3">
        <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Invoices
        </Link>
        <span className="flex-1" />
        <Link
          href={`/invoices/${invoice.id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted"
        >
          <Pencil className="h-4 w-4" /> Edit
        </Link>
        <PrintButton />
      </div>

      <div className="print-area rounded-2xl bg-white p-8 text-slate-900 shadow-sm sm:p-10">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-lg font-bold">{profile?.businessName || profile?.name || "Your business"}</p>
            {profile?.businessEmail ? <p className="text-sm text-slate-500">{profile.businessEmail}</p> : null}
            {profile?.businessAddress ? <p className="whitespace-pre-line text-sm text-slate-500">{profile.businessAddress}</p> : null}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight">INVOICE</p>
            {invoice.invoiceNumber ? <p className="text-sm text-slate-500">{invoice.invoiceNumber}</p> : null}
            <p className="mt-2 text-xs text-slate-500">Issued {formatDate(invoice.issuedOn)}</p>
            {invoice.dueOn ? <p className="text-xs text-slate-500">Due {formatDate(invoice.dueOn)}</p> : null}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to</p>
          {client ? (
            <div className="mt-1 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{client.name}</p>
              {client.company ? <p>{client.company}</p> : null}
              {client.email ? <p>{client.email}</p> : null}
              {client.address ? <p className="whitespace-pre-line">{client.address}</p> : null}
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-400">No client selected</p>
          )}
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2 font-semibold">Description</th>
              <th className="py-2 text-right font-semibold">Qty</th>
              <th className="py-2 text-right font-semibold">Rate</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-400">
                  No line items
                </td>
              </tr>
            ) : (
              invoice.lineItems.map((li, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-2.5 text-slate-700">{li.description}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-700">{li.quantity}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-700">{formatMoney(li.rate)}</td>
                  <td className="py-2.5 text-right font-medium tabular-nums text-slate-900">{formatMoney(li.quantity * li.rate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-[220px] space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMoney(subtotal)}</span>
            </div>
            {invoice.taxRate > 0 ? (
              <div className="flex justify-between text-slate-500">
                <span>Tax ({invoice.taxRate}%)</span>
                <span className="tabular-nums">{formatMoney(tax)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-bold text-slate-900">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(total)}</span>
            </div>
          </div>
        </div>

        {invoice.notes ? (
          <div className="mt-8 border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{invoice.notes}</p>
          </div>
        ) : null}

        {invoice.status === "paid" ? (
          <p className="mt-6 inline-block rounded-md border-2 border-emerald-500 px-3 py-1 text-sm font-bold uppercase tracking-wide text-emerald-600">
            Paid
          </p>
        ) : null}
      </div>
    </div>
  );
}
