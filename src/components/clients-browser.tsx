"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, Inbox, Users, List, LayoutGrid } from "lucide-react";
import type { Client, ClientStage } from "@/lib/data";
import { ClientCard } from "@/components/client-card";
import { cn } from "@/lib/utils";

type StageFilter = ClientStage | "all";
type ViewMode = "cards" | "list";

const STAGE_TABS: { value: StageFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "lead", label: "Leads" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5">
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-label="List view"
        title="List view"
        className={cn("rounded-md px-2 py-1 transition", value === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
      >
        <List className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("cards")}
        aria-label="Card view"
        title="Card view"
        className={cn("rounded-md px-2 py-1 transition", value === "cards" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

type Props = { clients: Client[]; newSince?: string; intakeClientIds?: string[] };

export function ClientsBrowser({ clients, newSince, intakeClientIds = [] }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<StageFilter>("all");
  const [incomingView, setIncomingView] = useState<ViewMode>("cards");
  const [existingView, setExistingView] = useState<ViewMode>("cards");
  const intakeSet = useMemo(() => new Set(intakeClientIds), [intakeClientIds]);

  const counts = useMemo(() => {
    const c: Record<StageFilter, number> = { all: clients.length, lead: 0, quoted: 0, won: 0, lost: 0 };
    for (const client of clients) c[client.stage] = (c[client.stage] ?? 0) + 1;
    return c;
  }, [clients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients
      .filter((c) => {
        if (stage !== "all" && c.stage !== stage) return false;
        if (!q) return true;
        return [c.name, c.company, c.email].some((v) => (v ?? "").toLowerCase().includes(q));
      })
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }, [clients, query, stage]);

  const incoming = filtered.filter((c) => c.stage === "lead");
  const existing = filtered.filter((c) => c.stage !== "lead");

  const isNewClient = (c: Client) => !!newSince && !!c.createdAt && c.createdAt >= newSince;

  function renderItems(items: Client[], view: ViewMode, canMove: boolean) {
    if (view === "list") {
      return (
        <div className="space-y-2">
          {items.map((c) => (
            <ClientCard key={c.id} client={c} view="list" isNew={isNewClient(c)} intakeSubmitted={intakeSet.has(c.id)} canMove={canMove} />
          ))}
        </div>
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <ClientCard key={c.id} client={c} view="cards" isNew={isNewClient(c)} intakeSubmitted={intakeSet.has(c.id)} canMove={canMove} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, company, or email…"
            className="w-full rounded-lg border border-border bg-muted/40 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STAGE_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setStage(t.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                stage === t.value ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {t.label} <span className="opacity-70">{counts[t.value] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No clients yet — add your first above.</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No clients match your search.</div>
      ) : (
        <div className="space-y-5">
          {/* Incoming Leads */}
          <section className="space-y-3 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Incoming Leads</h2>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">{incoming.length}</span>
                <span className="hidden text-xs text-muted-foreground md:inline">New inquiries — follow up, then move them along.</span>
              </div>
              <div className="flex items-center gap-2">
                <ViewToggle value={incomingView} onChange={setIncomingView} />
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition hover:bg-muted"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>
            </div>
            {incoming.length === 0 ? (
              <p className="text-xs text-muted-foreground">No incoming leads right now.</p>
            ) : (
              renderItems(incoming, incomingView, true)
            )}
          </section>

          {/* Colored divider */}
          <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />

          {/* Existing Clients */}
          <section className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Existing Clients</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{existing.length}</span>
              </div>
              <ViewToggle value={existingView} onChange={setExistingView} />
            </div>
            {existing.length === 0 ? (
              <p className="text-xs text-muted-foreground">No existing clients yet — move a lead over when you start working together.</p>
            ) : (
              renderItems(existing, existingView, false)
            )}
          </section>
        </div>
      )}
    </div>
  );
}
