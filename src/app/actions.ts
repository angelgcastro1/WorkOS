"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function str(value: FormDataEntryValue | null): string | null {
  const s = value?.toString().trim();
  return s ? s : null;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createTask(formData: FormData) {
  const title = str(formData.get("title"));
  if (!title) return;
  const supabase = await createClient();
  await supabase.from("tasks").insert({
    title,
    status: str(formData.get("status")) ?? "todo",
    priority: str(formData.get("priority")) ?? "medium",
    project_id: str(formData.get("project_id")),
    due: str(formData.get("due")),
  });
  revalidatePath("/", "layout");
}

export async function toggleTask(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) return;
  const done = str(formData.get("done")) === "true";
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ status: done ? "todo" : "done", completed_at: done ? null : today() })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteTask(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function createProject(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;
  const supabase = await createClient();
  await supabase.from("projects").insert({
    name,
    status: str(formData.get("status")) ?? "planning",
    priority: str(formData.get("priority")) ?? "medium",
    category: str(formData.get("category")),
    client: str(formData.get("client")),
    deadline: str(formData.get("deadline")),
  });
  revalidatePath("/", "layout");
}

export async function createNote(formData: FormData) {
  const title = str(formData.get("title"));
  if (!title) return;
  const supabase = await createClient();
  await supabase.from("notes").insert({
    title,
    type: str(formData.get("type")) ?? "Note",
    body: str(formData.get("body")),
    project_id: str(formData.get("project_id")),
    date: today(),
  });
  revalidatePath("/", "layout");
}

export async function createContact(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;
  const supabase = await createClient();
  await supabase.from("contacts").insert({
    name,
    company: str(formData.get("company")),
    type: str(formData.get("type")) ?? "Lead",
    stage: str(formData.get("stage")) ?? "new",
    email: str(formData.get("email")),
    value: Number(str(formData.get("value")) ?? "0") || 0,
    next_follow_up: str(formData.get("next_follow_up")),
  });
  revalidatePath("/", "layout");
}

export async function updateNote(formData: FormData) {
  const id = str(formData.get("id"));
  const title = str(formData.get("title"));
  if (!id || !title) return;
  const supabase = await createClient();
  await supabase
    .from("notes")
    .update({
      title,
      type: str(formData.get("type")) ?? "Note",
      body: str(formData.get("body")),
      project_id: str(formData.get("project_id")),
    })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteNote(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("notes").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function createReminder(formData: FormData) {
  const title = str(formData.get("title"));
  const dueAt = str(formData.get("due_at"));
  if (!title || !dueAt) return;
  const supabase = await createClient();
  await supabase.from("reminders").insert({
    title,
    note: str(formData.get("note")),
    due_at: dueAt,
  });
  revalidatePath("/", "layout");
}

export async function toggleReminder(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) return;
  const done = str(formData.get("done")) === "true";
  const supabase = await createClient();
  await supabase.from("reminders").update({ done: !done }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteReminder(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("reminders").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function createWhiteboard() {
  const supabase = await createClient();
  const { data } = await supabase.from("whiteboards").insert({ title: "Untitled board" }).select("id").single();
  revalidatePath("/whiteboards");
  if (data?.id) redirect(`/whiteboards/${data.id}`);
}

export async function deleteWhiteboard(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("whiteboards").delete().eq("id", id);
  revalidatePath("/whiteboards");
}

export async function seedSampleData() {
  const supabase = await createClient();
  await supabase.rpc("seed_sample_data");
  revalidatePath("/", "layout");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
