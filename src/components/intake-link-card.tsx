"use client";

import { useState } from "react";
import { Link2, Check, ExternalLink, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui";

export function IntakeLinkCard() {
  // Computed at render time; empty during SSR, real origin on the client.
  const link = typeof window !== "undefined" ? `${window.location.origin}/intake/form` : "";
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function email() {
    const subject = encodeURIComponent("Tell me about your project");
    const body = encodeURIComponent(`Hi,\n\nWhenever you're ready, fill out this quick form and I'll follow up:\n${link}\n\nThanks!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div>
          <h2 className="text-sm font-semibold">Your shareable intake link</h2>
          <p className="text-xs text-muted-foreground">Send this to clients. Every submission emails you and drops into Clients as a new Lead.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span suppressHydrationWarning className="min-w-0 flex-1 truncate text-sm">
            {link || "…"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} {copied ? "Copied!" : "Copy link"}
          </button>
          <a
            suppressHydrationWarning
            href={link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium transition hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" /> Preview form
          </a>
          <button
            onClick={email}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium transition hover:bg-muted"
          >
            <Mail className="h-4 w-4" /> Email it
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
