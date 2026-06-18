"use client";

import "@excalidraw/excalidraw/index.css";
import { useCallback, useRef, useState, type ComponentType } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Scene = { elements?: unknown[]; appState?: Record<string, unknown>; files?: Record<string, unknown> };
type ExcalidrawChange = (
  elements: readonly unknown[],
  appState: { viewBackgroundColor?: string },
  files: Record<string, unknown>,
) => void;
type ExcalidrawProps = { initialData?: unknown; onChange?: ExcalidrawChange };

const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw as unknown as ComponentType<ExcalidrawProps>;
  },
  {
    ssr: false,
    loading: () => <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading canvas…</div>,
  },
);

type Props = { id: string; title: string; initialScene: Scene };

export function WhiteboardEditor({ id, title, initialScene }: Props) {
  const [supabase] = useState(() => createClient());
  const [status, setStatus] = useState<"saved" | "saving">("saved");
  const sceneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback<ExcalidrawChange>(
    (elements, appState, files) => {
      setStatus("saving");
      if (sceneTimer.current) clearTimeout(sceneTimer.current);
      sceneTimer.current = setTimeout(async () => {
        const scene: Scene = {
          elements: elements as unknown[],
          appState: { viewBackgroundColor: appState?.viewBackgroundColor ?? "#ffffff" },
          files,
        };
        await supabase.from("whiteboards").update({ scene, updated_at: new Date().toISOString() }).eq("id", id);
        setStatus("saved");
      }, 1200);
    },
    [supabase, id],
  );

  const saveTitle = async (value: string) => {
    const next = value.trim() || "Untitled board";
    await supabase.from("whiteboards").update({ title: next }).eq("id", id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Link href="/whiteboards" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Boards
        </Link>
        <input
          defaultValue={title}
          onBlur={(e) => saveTitle(e.target.value)}
          className="flex-1 rounded-lg bg-transparent px-2 py-1 text-lg font-semibold outline-none transition focus:bg-muted/40"
          aria-label="Board title"
        />
        <span className="text-xs text-muted-foreground">{status === "saving" ? "Saving…" : "Saved"}</span>
      </div>
      <div className="h-[calc(100vh-11rem)] w-full overflow-hidden rounded-2xl border border-border">
        <Excalidraw
          initialData={{
            elements: initialScene?.elements ?? [],
            appState: initialScene?.appState ?? {},
            files: initialScene?.files ?? {},
            scrollToContent: true,
          }}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
