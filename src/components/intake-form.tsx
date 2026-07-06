"use client";

import { useRef, useState } from "react";
import { Loader2, CheckCircle2, Check, ChevronDown, Send, Upload, Paperclip, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

const SERVICE_GROUPS: { category: string; question: string; options: string[] }[] = [
  {
    category: "Branding & logo design",
    question: "What type of branding help do you need?",
    options: [
      "New logo design",
      "Logo refresh / redesign",
      "Full brand identity system",
      "Brand guidelines",
      "Color palette & typography",
      "Business card / stationery",
      "Brand strategy / positioning",
      "Product or package branding",
      "Social media brand kit",
      "Church / nonprofit branding",
      "Small business rebrand",
      "Brand launch package",
      "Other branding need",
    ],
  },
  {
    category: "Graphic design & print",
    question: "What design materials do you need?",
    options: [
      "Flyer design",
      "Brochure design",
      "Poster design",
      "Presentation / pitch deck",
      "One-sheet / sales sheet",
      "Direct mail / postcard",
      "Banner / signage",
      "Event graphics",
      "Trade show display",
      "Training materials",
      "Workbook / guide design",
      "Infographic design",
      "Packaging design",
      "Print-ready production files",
      "Other graphic design need",
    ],
  },
  {
    category: "Web design & development",
    question: "What kind of web support do you need?",
    options: [
      "New website design",
      "Website redesign",
      "Landing page",
      "Portfolio website",
      "Business website",
      "Church / nonprofit website",
      "Website copy / content layout",
      "UI / UX design",
      "Web graphics",
      "Contact / intake form setup",
      "Mobile responsive design",
      "Website updates",
      "Domain / hosting support",
      "SEO basics",
      "Website launch support",
      "Other web need",
    ],
  },
  {
    category: "Video, photo & social media",
    question: "What type of media project do you need?",
    options: [
      "Brand video",
      "Promotional video",
      "Testimonial video",
      "Event recap video",
      "Training / learning video",
      "Executive message video",
      "Social media video",
      "Motion graphics / animation",
      "Photography",
      "Headshots",
      "Product photography",
      "Event photography",
      "Social media graphics",
      "Content repurposing",
      "Reels / short-form content",
      "YouTube / podcast visuals",
      "Other media need",
    ],
  },
  {
    category: "AI creative workflow support",
    question: "What AI-related support do you need?",
    options: [
      "AI content workflow setup",
      "Repurpose video into posts/blogs",
      "AI-assisted design systems",
      "Content templates",
      "Social media content system",
      "Brand asset organization",
      "Creative automation",
      "Training for your team",
      "AI video / avatar content",
      "Workflow consultation",
      "Other AI need",
    ],
  },
];

const BUDGETS = ["Under $500", "$500 – $1,000", "$1,000 – $5,000", "$5,000+", "Not sure yet"];
const TIMELINES = ["As soon as possible", "Within 2 weeks", "This month", "1 – 3 months", "Flexible / just exploring"];
const SOURCES = ["Referral / word of mouth", "Instagram or social media", "Google search", "Returning client", "Other"];

type Attachment = { path: string; name: string };

const fieldClass =
  "w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

export function IntakeForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [openCats, setOpenCats] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [source, setSource] = useState("");
  const [details, setDetails] = useState("");
  const [links, setLinks] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleService(s: string) {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function toggleCat(category: string) {
    setOpenCats((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  }

  function removeAttachment(path: string) {
    setAttachments((prev) => prev.filter((a) => a.path !== path));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError("");
    const supabase = createClient();
    const uploaded: Attachment[] = [];
    for (const file of Array.from(files)) {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
      const path = `${crypto.randomUUID()}/${safe}`;
      const { error } = await supabase.storage.from("intake-uploads").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        setUploadError(`Couldn't upload ${file.name}. Try a smaller file or share a link instead.`);
        continue;
      }
      uploaded.push({ path, name: file.name });
    }
    if (uploaded.length) setAttachments((prev) => [...prev, ...uploaded]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("intake-submit", {
        body: { name, email, phone, company, services, budget, timeline, source, details, links, attachments },
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
          <p className="-mt-1 mb-2 text-xs text-muted-foreground">Tap a category to see options. Pick everything that applies.</p>
          <div className="space-y-2">
            {SERVICE_GROUPS.map((g) => {
              const isOpen = openCats.includes(g.category);
              const count = g.options.filter((o) => services.includes(o)).length;
              return (
                <div key={g.category} className="overflow-hidden rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => toggleCat(g.category)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-2 bg-muted/40 px-3 py-2.5 text-left text-sm font-medium transition hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      {g.category}
                      {count > 0 ? (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">{count}</span>
                      ) : null}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition", isOpen && "rotate-180")} />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-border p-2">
                      <p className="px-1 pb-1.5 pt-1 text-xs font-medium text-muted-foreground">{g.question}</p>
                      <div className="space-y-1">
                        {g.options.map((o) => {
                          const active = services.includes(o);
                          return (
                            <button
                              key={o}
                              type="button"
                              onClick={() => toggleService(o)}
                              className={cn(
                                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition",
                                active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted",
                              )}
                            >
                              <span
                                className={cn(
                                  "grid h-4 w-4 shrink-0 place-items-center rounded border",
                                  active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                                )}
                              >
                                {active ? <Check className="h-3 w-3" /> : null}
                              </span>
                              {o}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
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
          <label className={labelClass}>
            Brand assets & examples <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <p className="-mt-1 mb-2 text-xs text-muted-foreground">
            Share logos, past work, or inspiration — paste links (Google Drive, Dropbox, your website) and/or upload files.
          </p>
          <textarea
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            rows={2}
            placeholder="Paste any links here…"
            className={cn(fieldClass, "resize-y")}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,application/pdf,video/*,.zip,.doc,.docx,.ppt,.pptx,.txt"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3.5 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Upload files"}
          </button>
          <span className="ml-2 text-xs text-muted-foreground">Up to 50MB each</span>
          {uploadError ? <p className="mt-1.5 text-xs text-red-400">{uploadError}</p> : null}
          {attachments.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {attachments.map((a) => (
                <li key={a.path} className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{a.name}</span>
                  </span>
                  <button type="button" onClick={() => removeAttachment(a.path)} aria-label="Remove file" className="text-muted-foreground/70 transition hover:text-red-400">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
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
          disabled={status === "sending" || uploading || !name.trim()}
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
