import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getWorkspace, getProfile } from "@/lib/queries";
import { InvoiceEditor } from "@/components/invoice-editor";

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const [{ clients, invoices }, profile] = await Promise.all([getWorkspace(["clients","invoices"]), getProfile()]);
  const { client } = await searchParams;
  const quoteCount = invoices.filter((i) => i.kind === "quote").length;
  const defaultNumber = `Q-${String(quoteCount + 1).padStart(4, "0")}`;
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/quotes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Quotes
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">New quote</h1>
      <InvoiceEditor
        clients={clients}
        kind="quote"
        defaultClientId={client}
        defaultNumber={defaultNumber}
        businessName={profile?.businessName || profile?.name || null}
        businessContactName={profile?.businessContactName ?? null}
        businessEmail={profile?.businessEmail ?? null}
        businessAddress={profile?.businessAddress ?? null}
        businessPhone={profile?.businessPhone ?? null}
        todayIso={todayIso}
      />
    </div>
  );
}
