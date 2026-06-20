import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { getWorkspace, getProfile } from "@/lib/queries";
import { PrintButton } from "@/components/print-button";
import { InvoicePaper } from "@/components/invoice-paper";
import { InvoiceShareButtons } from "@/components/invoice-share-buttons";

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [workspace, profile] = await Promise.all([getWorkspace(), getProfile()]);
  const invoice = workspace.invoices.find((i) => i.id === id);
  if (!invoice) redirect("/invoices");

  const client = invoice.clientId ? workspace.clients.find((c) => c.id === invoice.clientId) ?? null : null;

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
        <InvoiceShareButtons
          token={invoice.publicToken}
          invoiceNumber={invoice.invoiceNumber}
          businessName={profile?.businessName || profile?.name || null}
          clientEmail={client?.email ?? null}
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
