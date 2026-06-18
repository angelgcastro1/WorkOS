import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getWorkspace } from "@/lib/queries";
import { InvoiceEditor } from "@/components/invoice-editor";

export default async function NewInvoicePage() {
  const { clients, invoices } = await getWorkspace();
  const defaultNumber = `INV-${String(invoices.length + 1).padStart(4, "0")}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Invoices
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">New invoice</h1>
      <InvoiceEditor clients={clients} defaultNumber={defaultNumber} />
    </div>
  );
}
