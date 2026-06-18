import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getWorkspace, getProfile } from "@/lib/queries";
import { InvoiceEditor } from "@/components/invoice-editor";

export default async function NewInvoicePage() {
  const [{ clients, invoices }, profile] = await Promise.all([getWorkspace(), getProfile()]);
  const defaultNumber = `INV-${String(invoices.length + 1).padStart(4, "0")}`;
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Invoices
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">New invoice</h1>
      <InvoiceEditor
        clients={clients}
        defaultNumber={defaultNumber}
        businessName={profile?.businessName || profile?.name || null}
        businessEmail={profile?.businessEmail ?? null}
        businessAddress={profile?.businessAddress ?? null}
        todayIso={todayIso}
      />
    </div>
  );
}
