import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getWorkspace } from "@/lib/queries";
import { InvoiceEditor } from "@/components/invoice-editor";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { clients, invoices } = await getWorkspace();
  const invoice = invoices.find((i) => i.id === id);
  if (!invoice) redirect("/invoices");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href={`/invoices/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to invoice
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Edit invoice</h1>
      <InvoiceEditor clients={clients} invoice={invoice} defaultNumber={invoice.invoiceNumber ?? ""} />
    </div>
  );
}
