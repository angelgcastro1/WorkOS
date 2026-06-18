import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { getWorkspace } from "@/lib/queries";
import { addClient } from "@/app/actions";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ClientCard } from "@/components/client-card";

const fieldClass =
  "rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

export default async function ClientsPage() {
  const { clients } = await getWorkspace();

  return (
    <div className="space-y-6">
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

      {clients.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No clients yet — add your first above (add their address via the edit pencil).</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <ClientCard key={c.id} client={c} />
          ))}
        </div>
      )}
    </div>
  );
}
