"use client";

import { useState } from "react";
import { Mail, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  clientName: string;
  clientEmail: string | null;
  businessName: string | null;
  quoteRef: string | null;
};

function fallbackBody({ clientName, businessName, quoteRef }: Props): string {
  const ref = quoteRef ? ` about ${quoteRef}` : "";
  return `Hi ${clientName || "there"},\n\nI wanted to follow up${ref} and see if you had any questions. I'd love to help whenever you're ready to move forward.\n\nThanks!\n${businessName ?? ""}`.trim();
}

export function FollowUpButton(props: Props) {
  const { clientName, clientEmail, businessName, quoteRef } = props;
  const [loading, setLoading] = useState(false);

  function openMail(body: string) {
    const subject = encodeURIComponent(`Following up${quoteRef ? ` — ${quoteRef}` : ""} from ${businessName ?? "us"}`.replace(/\s+/g, " ").trim());
    window.location.href = `mailto:${clientEmail ?? ""}?subject=${subject}&body=${encodeURIComponent(body)}`;
  }

  async function draft() {
    setLoading(true);
    const prompt = `Write a short, warm follow-up email (3-4 sentences, plain text, no subject line) from ${
      businessName ?? "me"
    } to ${clientName || "a client"}${quoteRef ? ` regarding ${quoteRef}` : ""}. Politely check in and invite them to reply with questions. Sign off as ${
      businessName ?? "me"
    }. Return only the email body.`;

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { messages: [{ role: "user", content: prompt }] },
      });
      let res = data as { text?: string; error?: string } | null;
      if (!res && error && typeof error === "object" && "context" in error) {
        try {
          res = await (error.context as Response).json();
        } catch {
          /* ignore */
        }
      }
      openMail(res?.text?.trim() || fallbackBody(props));
    } catch {
      openMail(fallbackBody(props));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={draft}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {loading ? "Drafting…" : "Draft follow-up"}
      {!loading ? <Mail className="h-3.5 w-3.5 text-muted-foreground" /> : null}
    </button>
  );
}
