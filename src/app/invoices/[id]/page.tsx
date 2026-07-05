import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Check, X, ArrowRight } from "lucide-react";
import { getWorkspace, getProfile } from "@/lib/queries";
import { setInvoiceStatus, convertQuoteToInvoice } from "@/app/actions";
import { PrintButton } from "@/components/print-button";
import { InvoicePaper } from "@/components/invoice-paper";
import { InvoiceShareButtons } from "@/components/invoice-share-buttons";

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [workspace, profile] = await Promise.all([getWorkspace(), getProfile()]);
  const invoice = workspace.invoices.find((i) => i.id === id);
  if (!invoice) redirect("/invoices");

  const client = invoice.clientId ? workspace.clients.find((c) => c.id === invoice.clientId) ?? null : null;
  const isQuote = invoice.kind === "quote";
  const backHref = isQuote ? "/quotes" : "/invoices";
  const backLabel = isQuote ? "Quotes" : "Invoices";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="no-print flex flex-wrap items-center gap-3">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <span className="flex-1" />

        {isQuote && invoice.status !== "accepted" ? (
          <form action={setInvoiceStatus}>
            <input type="hidden" name="id" value={invoice.id} />
            <input type="hidden" name="status" value="accepted" />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20"
            >
              <Check className="h-4 w-4" /> Mark accepted
            </button>
          </form>
        ) : null}
        {isQuote && invoice.status !== "declined" ? (
          <form action={setInvoiceStatus}>
            <input type="hidden" name="id" value={invoice.id} />
            <input type="hidden" name="status" value="declined" />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <X className="h-4 w-4" /> Declined
            </button>
          </form>
        ) : null}
        {isQuote && invoice.status === "accepted" ? (
          <form action={convertQuoteToInvoice}>
            <input type="hidden" name="id" value={invoice.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
            >
              <ArrowRight className="h-4 w-4" /> Convert to invoice
            </button>
          </form>
        ) : null}

        <Link
          href={`/invoices/${invoice.id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted"
        >
          <Pencil className="h-4 w-4" /> Edit
        </Link>
        <InvoiceShareButtons
          token={invoice.publicToken}
          invoiceNumber={invoice.invoiceNumber}
          businessName={profile?.businessName || profile?.name || null}
          clientEmail={client?.email ?? null}
          kind={invoice.kind}
        />
        <PrintButton />
      </div>

      <InvoicePaper
        businessName={profile?.businessName || profile?.name || null}
        businessContactName={profile?.businessContactName ?? null}
        businessEmail={profile?.businessEmail ?? null}
        businessAddress={profile?.businessAddress ?? null}
        businessPhone={profile?.businessPhone ?? null}
        invoiceNumber={invoice.invoiceNumber}
        issuedOn={invoice.issuedOn}
        dueOn={invoice.dueOn}
        status={invoice.status}
        kind={invoice.kind}
        client={
          client
            ? { name: client.name, company: client.company, email: client.email, address: client.address }
            : null
        }
        lineItems={invoice.lineItems}
        taxRate={invoice.taxRate}
        notes={invoice.notes}
      />
    </div>
  );
}
