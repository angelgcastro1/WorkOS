"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, Check, AlertTriangle, Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** What the assistant did, reported as each tool finishes. */
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
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<RecognitionLike | null>(null);
  const router = useRouter();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  /** Adds to the assistant message currently being written. */
  function appendToReply(text: string) {
    setMessages((m) => {
      const last = m[m.length - 1];
      if (!last || last.role !== "assistant") return [...m, { role: "assistant", content: text }];
      return [...m.slice(0, -1), { ...last, content: last.content + text }];
    });
  }

  function attachAction(action: Action) {
    setMessages((m) => {
      const last = m[m.length - 1];
      if (!last || last.role !== "assistant") return [...m, { role: "assistant", content: "", actions: [action] }];
      return [...m.slice(0, -1), { ...last, actions: [...(last.actions ?? []), action] }];
    });
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError("");
    const history: Msg[] = [...messages, { role: "user", content }];
    setMessages(history);
    setInput("");
    setLoading(true);
    setStatus("Sending…");

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in again.");

      // Streamed, so the words show up as they are written. supabase.functions.invoke
      // waits for the whole body, so this talks to the function directly.
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          "Content-Type": "application/json",
        },
        // stream: true asks the function for server-sent events. Without it the
        // function replies with one JSON object, which is what older builds expect.
        body: JSON.stringify({ stream: true, messages: history.map((m) => ({ role: m.role, content: m.content })) }),
      });

      if (!res.ok || !res.body) {
        const detail = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(detail?.error ?? "Something went wrong.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let started = false;
      let changed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          let evt: { type?: string; text?: string; label?: string; action?: Action; error?: string };
          try {
            evt = JSON.parse(line.slice(5).trim());
          } catch {
            continue;
          }

          if (evt.type === "status" && evt.label) {
            setStatus(evt.label);
          } else if (evt.type === "text" && evt.text) {
            if (!started) {
              started = true;
              setStatus("");
              setMessages((m) => [...m, { role: "assistant", content: "" }]);
            }
            appendToReply(evt.text);
          } else if (evt.type === "action" && evt.action) {
            if (!started) {
              started = true;
              setMessages((m) => [...m, { role: "assistant", content: "" }]);
            }
            attachAction(evt.action);
            if (evt.action.ok) changed = true;
          } else if (evt.type === "error" && evt.error) {
            setError(evt.error);
          }
        }
      }

      // Something was created or changed — pull the rest of the app back in step.
      if (changed) router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setStatus("");
      setLoading(false);
    }
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
          messages.map((m, i) => {
            const isLast = i === messages.length - 1;
            return (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className="max-w-[85%] space-y-1.5">
                  {m.content ? (
                    <div
                      className={cn(
                        "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-card",
                      )}
                    >
                      {m.content}
                      {/* Cursor, so you can see it is still writing. */}
                      {loading && isLast && m.role === "assistant" ? (
                        <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-primary" />
                      ) : null}
                    </div>
                  ) : null}

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
            );
          })
        )}

        {status ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
              </span>
              {status}
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
