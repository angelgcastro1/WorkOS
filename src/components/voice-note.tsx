"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { Download, Mic, Pause, Play, Scissors, Square, Trash2, Loader2 } from "lucide-react";
import type { Attachment } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Linkify } from "@/components/linkify";

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

/** Writes 16-bit mono PCM into a .wav container — the trimmed clip needs a real file. */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function peaksOf(data: Float32Array): number[] {
  const step = Math.floor(data.length / BARS) || 1;
  const peaks: number[] = [];
  for (let i = 0; i < BARS; i++) {
    let max = 0;
    for (let j = 0; j < step; j++) {
      const v = Math.abs(data[i * step + j] ?? 0);
      if (v > max) max = v;
    }
    peaks.push(max);
  }
  const loudest = Math.max(...peaks, 0.01);
  return peaks.map((p) => Number((p / loudest).toFixed(3)));
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
  // Trim mode: everything between the two handles is what you keep.
  const [trimming, setTrimming] = useState(false);
  const [range, setRange] = useState<[number, number]>([0, 1]);
  const [dragging, setDragging] = useState<"start" | "end" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveRef = useRef<HTMLDivElement | null>(null);
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

  function fractionFromEvent(e: ReactPointerEvent): number {
    const box = waveRef.current?.getBoundingClientRect();
    if (!box) return 0;
    return Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
  }

  function onWavePointerDown(e: ReactPointerEvent) {
    const f = fractionFromEvent(e);
    if (!trimming) {
      // Plain click while not trimming = scrub to that point.
      if (audioRef.current && duration) {
        audioRef.current.currentTime = f * duration;
        setPosition(f * duration);
      }
      return;
    }
    // Grab whichever handle is nearer.
    const nearStart = Math.abs(f - range[0]) <= Math.abs(f - range[1]);
    setDragging(nearStart ? "start" : "end");
    setRange(([s0, e0]) => (nearStart ? [Math.min(f, e0 - 0.02), e0] : [s0, Math.max(f, s0 + 0.02)]));
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onWavePointerMove(e: ReactPointerEvent) {
    if (!dragging) return;
    const f = fractionFromEvent(e);
    setRange(([s0, e0]) => (dragging === "start" ? [Math.min(f, e0 - 0.02), e0] : [s0, Math.max(f, s0 + 0.02)]));
  }

  /** Keep only the selected stretch: re-encode it, swap the file, redraw the wave. */
  async function applyTrim() {
    const src = await signedUrl();
    if (!src || !duration) return;
    setBusy(true);
    setNote(null);
    try {
      const bytes = await (await fetch(src)).arrayBuffer();
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const decoded = await ctx.decodeAudioData(bytes);
      void ctx.close();

      const startSec = range[0] * decoded.duration;
      const lengthSec = Math.max(0.1, (range[1] - range[0]) * decoded.duration);
      const rate = 16000; // plenty for speech, and what transcription wants anyway
      const offline = new OfflineAudioContext(1, Math.ceil(lengthSec * rate), rate);
      const source = offline.createBufferSource();
      source.buffer = decoded;
      source.connect(offline.destination);
      source.start(0, startSec, lengthSec);
      const rendered = await offline.startRendering();

      const channel = rendered.getChannelData(0);
      const wav = encodeWav(channel, rate);
      const newPath = `${attachment.path.replace(/\.[^.]+$/, "")}-trim-${Date.now()}.wav`;

      const { error: upErr } = await supabase.storage.from("attachments").upload(newPath, wav, { contentType: "audio/wav" });
      if (upErr) {
        setNote("Could not save the trimmed clip.");
        return;
      }
      await supabase
        .from("note_attachments")
        .update({
          path: newPath,
          mime: "audio/wav",
          size: wav.size,
          duration_seconds: lengthSec,
          peaks: peaksOf(channel),
        })
        .eq("id", attachment.id);
      await supabase.storage.from("attachments").remove([attachment.path]);

      audioRef.current?.pause();
      audioRef.current = null;
      setUrl(null);
      setPlaying(false);
      setPosition(0);
      setTrimming(false);
      setRange([0, 1]);
      router.refresh();
    } catch {
      setNote("Could not trim that recording.");
    } finally {
      setBusy(false);
    }
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

        <div
          ref={waveRef}
          onPointerDown={onWavePointerDown}
          onPointerMove={onWavePointerMove}
          onPointerUp={() => setDragging(null)}
          onPointerCancel={() => setDragging(null)}
          className={cn("relative flex h-9 min-w-0 flex-1 touch-none items-center gap-[2px]", trimming ? "cursor-ew-resize" : "cursor-pointer")}
        >
          {peaks.map((p, i) => {
            const at = i / peaks.length;
            const inRange = at >= range[0] && at <= range[1];
            return (
              <span
                key={i}
                className={cn(
                  "w-[3px] flex-1 rounded-full transition-colors",
                  trimming
                    ? inRange
                      ? "bg-amber-500"
                      : "bg-muted-foreground/25"
                    : at <= progress
                      ? "bg-primary"
                      : "bg-muted-foreground/40",
                )}
                style={{ height: `${Math.max(8, p * 100)}%` }}
              />
            );
          })}

          {trimming ? (
            <>
              <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-amber-500" style={{ left: `${range[0] * 100}%` }} />
              <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-amber-500" style={{ left: `${range[1] * 100}%` }} />
            </>
          ) : null}
        </div>

        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {trimming ? `${clock((range[1] - range[0]) * duration)} kept` : `${clock(position)} / ${clock(duration)}`}
        </span>

        {trimming ? (
          <>
            <button
              type="button"
              onClick={applyTrim}
              disabled={busy}
              className="shrink-0 rounded-lg border border-amber-500/60 px-2.5 py-1 text-xs font-semibold text-amber-500 transition hover:bg-amber-500/10 disabled:opacity-60"
            >
              {busy ? "Cutting…" : "Cut"}
            </button>
            <button
              type="button"
              onClick={() => {
                setTrimming(false);
                setRange([0, 1]);
              }}
              className="shrink-0 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
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

            <button
              type="button"
              onClick={() => {
                audioRef.current?.pause();
                setPlaying(false);
                setTrimming(true);
              }}
              aria-label="Trim recording"
              title="Trim"
              className="shrink-0 text-muted-foreground/70 transition hover:text-foreground"
            >
              <Scissors className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {trimming ? (
        <p className="mt-1.5 text-[11px] text-muted-foreground">Drag the amber edges to choose what to keep, then Cut. The original is replaced.</p>
      ) : null}

      {attachment.transcript ? (
        <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">
          <Linkify text={attachment.transcript} />
        </p>
      ) : null}
      {note ? <p className="mt-2 text-xs text-amber-400">{note}</p> : null}
    </div>
  );
}
