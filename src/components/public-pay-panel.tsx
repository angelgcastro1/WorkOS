"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = { token: string; status: string; amountLabel: string; sessionId: string | null };

export function PublicPayPanel({ token, status, amountLabel, sessionId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirming, setConfirming] = useState(Boolean(sessionId) && status !== "paid");

  useEffect(() => {
    if (!sessionId || status === "paid") return;
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.functions.invoke("confirm-payment", { body: { token, session_id: sessionId } });
      if (!active) return;
      setConfirming(false);
      if (data && (data as { paid?: boolean }).paid) router.refresh();
    })();
    return () => {
      active = false;
    };
  }, [sessionId, status, token, router]);

  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-500">
        <Check className="h-4 w-4" /> Paid — thank you!
      </span>
    );
  }

  async function pay() {
    setLoading(true);
    setMsg("");
    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke("create-checkout", { body: { token, origin: window.location.origin } });
    const res = data as { url?: string; error?: string } | null;
    if (res?.url) {
      window.location.href = res.url;
      return;
    }
    setMsg(res?.error || error?.message || "Online payment isn't set up yet.");
    setLoading(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={pay}
        disabled={loading || confirming}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110 disabled:opacity-60"
      >
        {loading || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {confirming ? "Confirming payment…" : loading ? "Redirecting…" : `Pay ${amountLabel}`}
      </button>
      {msg ? <span className="text-xs text-red-400">{msg}</span> : null}
    </div>
  );
}
