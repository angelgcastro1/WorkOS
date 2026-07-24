"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, Inbox, Users } from "lucide-react";
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

type Props = { clients: Client[]; newSince?: string; intakeClientIds?: string[] };

export function ClientsBrowser({ clients, newSince, intakeClientIds = [] }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<StageFilter>("all");
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
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Incoming Leads</h2>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">{incoming.length}</span>
                <span className="hidden text-xs text-muted-foreground sm:inline">New inquiries — follow up, then move them along.</span>
              </div>
              <button
                type="button"
                onClick={() => router.refresh()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition hover:bg-muted"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
            {incoming.length === 0 ? (
              <p className="text-xs text-muted-foreground">No incoming leads right now.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {incoming.map((c) => (
                  <ClientCard key={c.id} client={c} isNew={isNewClient(c)} intakeSubmitted={intakeSet.has(c.id)} canMove />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Existing Clients</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{existing.length}</span>
            </div>
            {existing.length === 0 ? (
              <p className="text-xs text-muted-foreground">No existing clients yet — move a lead over when you start working together.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {existing.map((c) => (
                  <ClientCard key={c.id} client={c} isNew={isNewClient(c)} intakeSubmitted={intakeSet.has(c.id)} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
