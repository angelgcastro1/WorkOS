import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WhiteboardEditor } from "@/components/whiteboard-editor";

interface BoardRow {
  id: string;
  title: string;
  scene: { elements?: unknown[]; appState?: Record<string, unknown>; files?: Record<string, unknown> } | null;
}

export default async function WhiteboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("whiteboards").select("id, title, scene").eq("id", id).maybeSingle();
  if (!data) redirect("/whiteboards");
  const board = data as BoardRow;

  return <WhiteboardEditor id={board.id} title={board.title} initialScene={board.scene ?? {}} />;
}
