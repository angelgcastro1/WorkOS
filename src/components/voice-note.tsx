"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Mic, Pause, Play, Square, Trash2, Loader2 } from "lucide-react";
import type { Attachment } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const BARS = 56;

// ---------------------------------------------------------------------------
// Live speech-to-text, free and built into the browser. Chrome and Safari expose
// it as webkitSpeechRecognition. If it isn't there we simply record without a
// live transcript, and the recording can still be transcribed afterwards.
// ---------------------------------------------------------------------------
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
  onerror: (() => void) | null;
};

function newRecogniser(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.continuous = true;
  r.interimResults = true;
  r.lang = navigator.language || "en-US";
  return r;
}

function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Reduce a recording to ~56 loudness values so the waveform can be drawn from the row. */
async function peaksFrom(blob: Blob): Promise<{ peaks: number[]; duration: number }> {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    const data = buffer.getChannelData(0);
    const step = Math.floor(data.length / BARS) || 1;
    const peaks: number[] = [];
    for (let i = 0; i < BARS; i++) {
      let max = 0;
      for (let j = 0; j < step; j++) {
        const v = Math.abs(data[i * step + j] ?? 0);
        if (v > max) max = v;
      }
      peaks.push(Number(max.toFixed(3)));
    }
    const duration = buffer.duration;
    void ctx.close();
    const loudest = Math.max(...peaks, 0.01);
    return { peaks: peaks.map((p) => Number((p / loudest).toFixed(3))), duration };
  } catch {
    return { peaks: [], duration: 0 };
  }
}

// ---------------------------------------------------------------------------

export function VoiceNoteRecorder({
  noteId,
  userId,
  onTranscript,
}: {
  noteId: string;
  userId: string;
  /** Called with the spoken text so the note body can absorb it. */
  onTranscript: (text: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [live, setLive] = useState("");
  const [levels, setLevels] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTextRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  const router = useRouter();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function pickMimeType(): string {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
    return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
  }

  async function start() {
    setError(null);
    setLive("");
    finalTextRef.current = "";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => void finish(rec.mimeType || mimeType || "audio/webm");
      rec.start();
      recorderRef.current = rec;

      // Live meter for the bars while recording.
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128) / 128);
        setLevels((prev) => [...prev.slice(-(BARS - 1)), peak]);
        setElapsed((performance.now() - startedAtRef.current) / 1000);
        rafRef.current = requestAnimationFrame(tick);
      };
      // eslint-disable-next-line react-hooks/purity -- event handler, not render
      startedAtRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);

      // Free live transcript, where the browser offers it.
      const recog = newRecogniser();
      if (recog) {
        recog.onresult = (e) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const chunk = e.results[i][0].transcript;
            if (e.results[i].isFinal) finalTextRef.current += chunk;
            else interim += chunk;
          }
          setLive((finalTextRef.current + interim).trim());
        };
        recog.onerror = () => {};
        try {
          recog.start();
          recogRef.current = recog;
        } catch {
          // already running, or blocked — the recording still works
        }
      }

      setRecording(true);
    } catch {
      setError("Microphone blocked. Allow mic access for this site and try again.");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    recogRef.current?.stop();
    recogRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
    setSaving(true);
  }

  async function finish(mime: string) {
    const blob = new Blob(chunksRef.current, { type: mime });
    const spoken = finalTextRef.current.trim();
    const { peaks, duration } = await peaksFrom(blob);
    const stamp = new Date();
    const ext = mime.includes("mp4") || mime.includes("aac") ? "m4a" : "webm";
    const name = `Recording ${stamp.toLocaleDateString()} ${stamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.${ext}`;
    const path = `${userId}/${noteId}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage.from("attachments").upload(path, blob, { contentType: mime });
    if (upErr) {
      setError("Could not save the recording.");
      setSaving(false);
      return;
    }
    await supabase.from("note_attachments").insert({
      note_id: noteId,
      name,
      path,
      mime,
      size: blob.size,
      duration_seconds: duration || elapsed,
      peaks,
      transcript: spoken || null,
    });

    if (spoken) onTranscript(spoken);
    setSaving(false);
    setElapsed(0);
    setLevels([]);
    setLive("");
    router.refresh();
  }

  if (recording || saving) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="text-xs font-semibold text-red-400">{saving ? "Saving…" : "Recording"}</span>
          <span className="text-xs tabular-nums text-muted-foreground">{clock(elapsed)}</span>
          <button
            type="button"
            onClick={stop}
            disabled={saving}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3 w-3 fill-current" />}
            {saving ? "Saving" : "Stop"}
          </button>
        </div>

        <div className="mt-2 flex h-8 items-center gap-[2px]">
          {Array.from({ length: BARS }).map((_, i) => {
            const v = levels[levels.length - BARS + i] ?? 0;
            return <span key={i} className="w-[3px] rounded-full bg-red-400/70" style={{ height: `${Math.max(3, v * 100)}%` }} />;
          })}
        </div>

        {live ? <p className="mt-2 line-clamp-3 text-xs italic text-muted-foreground">{live}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
      >
        <Mic className="h-3.5 w-3.5 text-red-400" /> Record audio
      </button>
      {error ? <p className="mt-1.5 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

/** A saved recording: play it, read the waveform, transcribe it, download or bin it. */
export function VoiceNoteCard({
  attachment,
  canTranscribe,
  onTranscript,
}: {
  attachment: Attachment;
  canTranscribe: boolean;
  onTranscript: (text: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const peaks = attachment.peaks?.length ? attachment.peaks : Array.from({ length: BARS }, () => 0.25);
  const duration = attachment.durationSeconds ?? 0;

  async function signedUrl(): Promise<string | null> {
    if (url) return url;
    const { data } = await supabase.storage.from("attachments").createSignedUrl(attachment.path, 3600);
    if (data?.signedUrl) setUrl(data.signedUrl);
    return data?.signedUrl ?? null;
  }

  async function toggle() {
    const src = await signedUrl();
    if (!src) return;
    if (!audioRef.current) {
      const el = new Audio(src);
      el.ontimeupdate = () => setPosition(el.currentTime);
      el.onended = () => {
        setPlaying(false);
        setPosition(0);
      };
      audioRef.current = el;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      await audioRef.current.play();
      setPlaying(true);
    }
  }

  async function transcribe() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentId: attachment.id, path: attachment.path }),
      });
      const json = (await res.json()) as { text?: string; error?: string };
      if (json.text) {
        onTranscript(json.text);
        router.refresh();
      } else {
        setNote(json.error ?? "Could not transcribe that recording.");
      }
    } catch {
      setNote("Could not reach the transcription service.");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    const src = await signedUrl();
    if (src) window.open(src, "_blank", "noopener,noreferrer");
  }

  async function remove() {
    audioRef.current?.pause();
    await supabase.storage.from("attachments").remove([attachment.path]);
    await supabase.from("note_attachments").delete().eq("id", attachment.id);
    router.refresh();
  }

  const progress = duration ? position / duration : 0;

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Mic className="h-3.5 w-3.5 text-red-400" />
        <span className="text-xs font-semibold">Recording</span>
        <span className="text-xs text-muted-foreground">
          {attachment.createdAt ? new Date(attachment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""}
          {duration ? ` · ${clock(duration)}` : ""}
        </span>
        <button type="button" onClick={remove} aria-label="Delete recording" className="ml-auto text-muted-foreground/60 transition hover:text-red-400">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:brightness-110"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
        </button>

        <div className="flex h-9 min-w-0 flex-1 items-center gap-[2px]">
          {peaks.map((p, i) => (
            <span
              key={i}
              className={cn("w-[3px] flex-1 rounded-full transition-colors", i / peaks.length <= progress ? "bg-primary" : "bg-muted-foreground/40")}
              style={{ height: `${Math.max(8, p * 100)}%` }}
            />
          ))}
        </div>

        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {clock(position)} / {clock(duration)}
        </span>

        <button type="button" onClick={download} aria-label="Download recording" className="shrink-0 text-muted-foreground/70 transition hover:text-foreground">
          <Download className="h-3.5 w-3.5" />
        </button>

        {canTranscribe ? (
          <button
            type="button"
            onClick={transcribe}
            disabled={busy}
            className="shrink-0 text-xs font-medium text-muted-foreground transition hover:text-primary disabled:opacity-60"
          >
            {busy ? "Transcribing…" : "Transcribe"}
          </button>
        ) : null}
      </div>

      {attachment.transcript ? <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">{attachment.transcript}</p> : null}
      {note ? <p className="mt-2 text-xs text-amber-400">{note}</p> : null}
    </div>
  );
}
