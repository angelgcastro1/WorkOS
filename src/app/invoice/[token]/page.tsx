import { createClient } from "@/lib/supabase/server";
import { InvoicePaper } from "@/components/invoice-paper";
import { PrintButton } from "@/components/print-button";
import { PublicPayPanel } from "@/components/public-pay-panel";
import { formatMoney } from "@/lib/utils";
import type { LineItem } from "@/lib/data";

type PublicInvoice = {
  id: string;
  invoiceNumber: string | null;
  status: string;
  amount: number;
  issuedOn: string | null;
  dueOn: string | null;
  paidOn: string | null;
  lineItems: LineItem[];
  taxRate: number;
  notes: string | null;
  client: { name: string; company: string | null; email: string | null; address: string | null } | null;
  business: { name: string | null; contactName: string | null; email: string | null; address: string | null; phone: string | null };
};

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_invoice", { p_token: token });
  const inv = (data ?? null) as PublicInvoice | null;

  if (!inv) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-bold">Invoice not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This link may be invalid, or the invoice was removed.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:py-10">
      <InvoicePaper
        businessName={inv.business.name}
        businessContactName={inv.business.contactName}
        businessEmail={inv.business.email}
        businessAddress={inv.business.address}
        businessPhone={inv.business.phone}
        invoiceNumber={inv.invoiceNumber}
        issuedOn={inv.issuedOn}
        dueOn={inv.dueOn}
        status={inv.status}
        client={inv.client}
        lineItems={inv.lineItems}
        taxRate={inv.taxRate}
        notes={inv.notes}
      />
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <PrintButton />
        <PublicPayPanel token={token} status={inv.status} amountLabel={formatMoney(inv.amount)} sessionId={sp.session ?? null} />
      </div>
    </div>
  );
}
