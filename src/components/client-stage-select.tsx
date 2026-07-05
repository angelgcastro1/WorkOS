"use client";

import { useState, useTransition } from "react";
import type { ClientStage } from "@/lib/data";
import { setClientStage } from "@/app/actions";

const STAGES: { value: ClientStage; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

type Props = { clientId: string; stage: ClientStage };

export function ClientStageSelect({ clientId, stage }: Props) {
  const [value, setValue] = useState<ClientStage>(stage);
  const [pending, startTransition] = useTransition();

  function handleChange(next: ClientStage) {
    setValue(next);
    const fd = new FormData();
    fd.set("id", clientId);
    fd.set("stage", next);
    startTransition(() => {
      void setClientStage(fd);
    });
  }

  return (
    <select
      value={value}
      onChange={(e) => handleChange(e.target.value as ClientStage)}
      disabled={pending}
      className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
      aria-label="Pipeline stage"
    >
      {STAGES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
