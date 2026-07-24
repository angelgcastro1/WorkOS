import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { getWorkspace, getIntakeSubmissions } from "@/lib/queries";
import { addClient } from "@/app/actions";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ClientsBrowser } from "@/components/clients-browser";
import { AutoRefresh } from "@/components/auto-refresh";

const fieldClass =
  "rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

export default async function ClientsPage() {
  const [workspace, intake] = await Promise.all([getWorkspace(), getIntakeSubmissions()]);
  const clients = workspace.clients;
  const intakeClientIds = intake.map((s) => s.clientId).filter((cid): cid is string => Boolean(cid));
  const newSince = new Date();
  newSince.setDate(newSince.getDate() - 1);
  const newSinceIso = newSince.toISOString();

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Invoices
      </Link>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-sm text-muted-foreground">People and companies you invoice. Saved clients fill in automatically on new invoices.</p>
      </header>

      <Card>
        <form action={addClient} className="flex flex-wrap items-center gap-2 p-3">
          <input name="name" required placeholder="Client name" className={cn(fieldClass, "w-44")} />
          <input name="company" placeholder="Company" className={cn(fieldClass, "w-40")} />
          <input name="email" placeholder="Email" className={cn(fieldClass, "min-w-44 flex-1")} />
          <input name="phone" placeholder="Phone" className={cn(fieldClass, "w-36")} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
      </Card>

      <ClientsBrowser clients={clients} newSince={newSinceIso} intakeClientIds={intakeClientIds} />
    </div>
  );
}
