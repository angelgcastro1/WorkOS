import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Turns a saved recording into text with OpenAI Whisper.
//
// This is the "transcribe it properly" path. While you are recording, the browser
// already produces a live transcript for free; this one is for recordings made
// somewhere noisy, made before the browser could listen, or when you want a cleaner
// pass with punctuation.

export const maxDuration = 60;

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Add an OPENAI_API_KEY in Vercel to transcribe saved recordings. Live transcription while you record works without it." },
      { status: 200 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { attachmentId, path } = (await request.json()) as { attachmentId?: string; path?: string };
  if (!path) return NextResponse.json({ error: "No recording given." }, { status: 400 });

  // Row-level security means this only succeeds for the signed-in owner's own file.
  const { data: file, error } = await supabase.storage.from("attachments").download(path);
  if (error || !file) return NextResponse.json({ error: "Could not read that recording." }, { status: 404 });

  const form = new FormData();
  form.append("file", file, path.split("/").pop() ?? "recording.webm");
  form.append("model", "whisper-1");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    return NextResponse.json({ error: `Transcription failed (${res.status}).` }, { status: 200 });
  }
  const json = (await res.json()) as { text?: string };
  const text = json.text?.trim() ?? "";

  if (attachmentId && text) {
    await supabase.from("note_attachments").update({ transcript: text }).eq("id", attachmentId);
  }
  return NextResponse.json({ text });
}
