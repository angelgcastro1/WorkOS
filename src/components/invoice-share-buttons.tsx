"use client";

import { useState } from "react";
import { Mail, Link2, Check } from "lucide-react";
import type { DocKind } from "@/lib/data";

type Props = {
  token: string;
  invoiceNumber: string | null;
  businessName: string | null;
  clientEmail: string | null;
  kind?: DocKind;
};

export function InvoiceShareButtons({ token, invoiceNumber, businessName, clientEmail, kind = "invoice" }: Props) {
  const [copied, setCopied] = useState(false);
  const noun = kind === "quote" ? "quote" : "invoice";

  function link() {
    return `${window.location.origin}/invoice/${token}`;
  }

  function copy() {
    navigator.clipboard.writeText(link()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function email() {
    const url = link();
    const subject = encodeURIComponent(`${noun === "quote" ? "Quote" : "Invoice"} ${invoiceNumber ?? ""} from ${businessName ?? "us"}`.replace(/\s+/g, " ").trim());
    const action = noun === "quote" ? "view it online" : "view and pay it online";
    const body = encodeURIComponent(
      `Hi,\n\nHere's your ${noun}${invoiceNumber ? ` ${invoiceNumber}` : ""}. You can ${action} here:\n${url}\n\nThank you!\n${businessName ?? ""}`,
    );
    window.location.href = `mailto:${clientEmail ?? ""}?subject=${subject}&body=${body}`;
  }

  return (
    <>
      <button onClick={email} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted">
        <Mail className="h-4 w-4" /> Email
      </button>
      <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted">
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
      </button>
    </>
  );
}
