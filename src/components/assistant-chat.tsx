"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Sparkles, Check, AlertTriangle, Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** What the assistant did, as reported back by the ai-assistant function. */
type Action = { tool: string; summary: string; ok: boolean };
type Msg = { role: "user" | "assistant"; content: string; actions?: Action[] };

const SUGGESTIONS = [
  "Add a project called Q4 rebrand, due end of October",
  "What's overdue right now?",
  "Add a task to Launch personal website: write the about page, due Friday",
  "Draft a friendly payment reminder email",
];

// Dictation, using the speech recognition built into Chrome and Safari.
type RecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
  onend: (() => void) | null;
};

function newRecogniser(): RecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.continuous = false;
  r.interimResults = true;
  r.lang = navigator.language || "en-US";
  return r;
}

export function AssistantChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<RecognitionLike | null>(null);
  const router = useRouter();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError("");
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    const supabase = createClient();
    const { data, error: invokeError } = await supabase.functions.invoke("ai-assistant", { body: { messages: next } });
    let res = data as { text?: string; error?: string; actions?: Action[] } | null;
    // On a non-2xx response supabase-js returns data=null and stashes the body on error.context.
    if (!res && invokeError && typeof invokeError === "object" && "context" in invokeError) {
      try {
        res = (await (invokeError as { context: Response }).context.json()) as { text?: string; error?: string; actions?: Action[] };
      } catch {
        // fall through to the generic message
      }
    }
    if (res?.text) {
      const txt = res.text;
      const acts = res.actions ?? [];
      setMessages((m) => [...m, { role: "assistant", content: txt, actions: acts }]);
      // Something was created or changed — pull the rest of the app back in step.
      if (acts.some((a) => a.ok)) router.refresh();
    } else {
      setError(res?.error || invokeError?.message || "Something went wrong.");
    }
    setLoading(false);
  }

  function toggleDictation() {
    if (listening) {
      recogRef.current?.stop();
      return;
    }
    const recog = newRecogniser();
    if (!recog) {
      setError("This browser can't do dictation — type instead.");
      return;
    }
    let heard = "";
    recog.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) heard += chunk;
        else interim += chunk;
      }
      setInput((heard + interim).trim());
    };
    recog.onend = () => {
      setListening(false);
      recogRef.current = null;
    };
    try {
      recog.start();
      recogRef.current = recog;
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[24rem] flex-col rounded-2xl border border-border bg-card/40">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium">Ask about your work — or tell me to do it.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                I can read your tasks, invoices, calendar, reminders, notes and clients, and I can create projects, clients, tasks,
                notes, reminders and events. I can&apos;t delete anything.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-border px-3 py-1.5 text-xs transition hover:bg-muted">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className="max-w-[85%] space-y-1.5">
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-card",
                  )}
                >
                  {m.content}
                </div>
                {m.actions?.length ? (
                  <div className="space-y-1 rounded-xl border border-border bg-muted/40 px-3 py-2">
                    {m.actions.map((a, j) => (
                      <p key={j} className={cn("flex items-start gap-1.5 text-xs", a.ok ? "text-emerald-400" : "text-amber-400")}>
                        {a.ok ? <Check className="mt-0.5 h-3 w-3 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />}
                        {a.summary}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
        {loading ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          </div>
        ) : null}
        {error ? <p className="text-center text-xs text-red-400">{error}</p> : null}
        <div ref={endRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? "Listening…" : "Ask anything, or tell me to create something…"}
          className="flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={toggleDictation}
          aria-label={listening ? "Stop dictation" : "Dictate"}
          title="Dictate"
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition",
            listening ? "border-red-500/60 bg-red-500/10 text-red-400" : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <Mic className="h-4 w-4" />
        </button>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
