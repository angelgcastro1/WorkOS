"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

const SERVICES = [
  "Branding & logo design",
  "Graphic design & print",
  "Web design & development",
  "Video, photo & social media",
];
const BUDGETS = ["Under $500", "$500 – $1,000", "$1,000 – $5,000", "$5,000+", "Not sure yet"];
const TIMELINES = ["As soon as possible", "Within 2 weeks", "This month", "1 – 3 months", "Flexible / just exploring"];
const SOURCES = ["Referral / word of mouth", "Instagram or social media", "Google search", "Returning client", "Other"];

const fieldClass =
  "w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

export function IntakeForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [source, setSource] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function toggleService(s: string) {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("intake-submit", {
        body: { name, email, phone, company, services, budget, timeline, source, details },
      });
      const res = data as { ok?: boolean; error?: string } | null;
      if (error || !res?.ok) {
        setErrorMsg(res?.error || "Something went wrong. Please try again or email us directly.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setErrorMsg("Something went wrong. Please try again or email us directly.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <BrandMark src="/cham-media-logo.png" alt="Cham Media" height={56} className="mx-auto" />
        <CheckCircle2 className="mx-auto mt-8 h-14 w-14 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Thank you, {name.split(" ")[0] || "there"}!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your request is in. We&rsquo;ll review the details and get back to you shortly at{" "}
          {email ? <span className="text-foreground">{email}</span> : "the contact info you provided"}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <header className="mb-8 text-center">
        <BrandMark src="/cham-media-logo.png" alt="Cham Media" height={56} className="mx-auto" />
        <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Let&rsquo;s work together</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Tell us a little about your project and we&rsquo;ll get back to you with next steps. It only takes a minute.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              Your name <span className="text-red-400">*</span>
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Doe" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Company / brand</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optional" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="(555) 555‑5555" className={fieldClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>What do you need help with?</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {SERVICES.map((s) => {
              const active = services.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition",
                    active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-4 w-4 shrink-0 place-items-center rounded border",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {active ? <CheckCircle2 className="h-3 w-3" /> : null}
                  </span>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Budget</label>
            <select value={budget} onChange={(e) => setBudget(e.target.value)} className={fieldClass}>
              <option value="">Select…</option>
              {BUDGETS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Timeline</label>
            <select value={timeline} onChange={(e) => setTimeline(e.target.value)} className={fieldClass}>
              <option value="">Select…</option>
              {TIMELINES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Tell us about your project</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            placeholder="Goals, what you're looking for, any examples you love…"
            className={cn(fieldClass, "resize-y")}
          />
        </div>

        <div>
          <label className={labelClass}>How did you hear about us?</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className={fieldClass}>
            <option value="">Select…</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {status === "error" ? <p className="text-sm text-red-400">{errorMsg}</p> : null}

        <button
          type="submit"
          disabled={status === "sending" || !name.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110 disabled:opacity-60"
        >
          {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {status === "sending" ? "Sending…" : "Send request"}
        </button>
        <p className="text-center text-xs text-muted-foreground">Powered by Cham Media · WorkCham</p>
      </form>
    </div>
  );
}
