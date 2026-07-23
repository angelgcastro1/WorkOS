"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Inbox, RefreshCw, Search, Users } from "lucide-react";
import type { Client, ClientStage } from "@/lib/data";
import { ClientCard } from "@/components/client-card";
import { cn } from "@/lib/utils";

type StageFilter = ClientStage | "all";

const STAGE_TABS: { value: StageFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "lead", label: "Leads" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

function matchesQuery(c: Client, q: string) {
  if (!q) return true;
  return [c.name, c.company, c.email].some((v) => (v ?? "").toLowerCase().includes(q));
}

export function ClientsBrowser({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<StageFilter>("all");
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  const counts = useMemo(() => {
    const c: Record<StageFilter, number> = { all: clients.length, lead: 0, quoted: 0, won: 0, lost: 0 };
    for (const client of clients) c[client.stage] = (c[client.stage] ?? 0) + 1;
    return c;
  }, [clients]);

  const q = query.trim().toLowerCase();

  const incoming = useMemo(() => clients.filter((c) => c.stage === "lead" && matchesQuery(c, q)), [clients, q]);
  const existing = useMemo(() => clients.filter((c) => c.stage !== "lead" && matchesQuery(c, q)), [clients, q]);
  const filtered = useMemo(
    () => clients.filter((c) => (stage === "all" || c.stage === stage) && matchesQuery(c, q)),
    [clients, q, stage],
  );

  const showSections = stage === "all";

  return (
    <div className="space-y-4">
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

      {showSections ? (
        <>
          <section className="rounded-xl border border-primary/25 bg-primary/5 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Incoming Leads</h2>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">{incoming.length}</span>
              <span className="text-xs text-muted-foreground">New inquiries from your websites — follow up, then move them along.</span>
              <button
                type="button"
                onClick={() => startRefresh(() => router.refresh())}
                disabled={isRefreshing}
                title="Check for newly imported leads"
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-60"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                {isRefreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>
            {incoming.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No new leads right now.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {incoming.map((c) => (
                  <ClientCard key={c.id} client={c} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Existing Clients</h2>
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{existing.length}</span>
            </div>
            {existing.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {clients.length === 0 ? "No clients yet — add your first above." : "No existing clients match your search."}
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {existing.map((c) => (
                  <ClientCard key={c.id} client={c} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {clients.length === 0 ? "No clients yet — add your first above." : "No clients match your search."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <ClientCard key={c.id} client={c} />
          ))}
        </div>
      )}
    </div>
  );
}
