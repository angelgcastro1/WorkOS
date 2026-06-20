"use client";

import { useState } from "react";
import { Mail, Link2, Check } from "lucide-react";

type Props = { token: string; invoiceNumber: string | null; businessName: string | null; clientEmail: string | null };

export function InvoiceShareButtons({ token, invoiceNumber, businessName, clientEmail }: Props) {
  const [copied, setCopied] = useState(false);

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
    const subject = encodeURIComponent(`Invoice ${invoiceNumber ?? ""} from ${businessName ?? "us"}`.replace(/\s+/g, " ").trim());
    const body = encodeURIComponent(
      `Hi,\n\nHere's your invoice${invoiceNumber ? ` ${invoiceNumber}` : ""}. You can view and pay it online here:\n${url}\n\nThank you!\n${businessName ?? ""}`,
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
