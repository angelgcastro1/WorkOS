"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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

export function ClientsBrowser({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<StageFilter>("all");

  const counts = useMemo(() => {
    const c: Record<StageFilter, number> = { all: clients.length, lead: 0, quoted: 0, won: 0, lost: 0 };
    for (const client of clients) c[client.stage] = (c[client.stage] ?? 0) + 1;
    return c;
  }, [clients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (stage !== "all" && c.stage !== stage) return false;
      if (!q) return true;
      return [c.name, c.company, c.email].some((v) => (v ?? "").toLowerCase().includes(q));
    });
  }, [clients, query, stage]);

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

      {filtered.length === 0 ? (
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
