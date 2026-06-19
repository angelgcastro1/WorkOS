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

function parseLineItems(json: string | null): { description: string; quantity: number; rate: number }[] {
  if (!json) return [];
  try {
    const arr: unknown = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => {
        const item = (x ?? {}) as { description?: unknown; quantity?: unknown; rate?: unknown };
        return {
          description: typeof item.description === "string" ? item.description : "",
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
        };
      })
      .filter((x) => x.description.trim() !== "" || x.quantity !== 0 || x.rate !== 0);
  } catch {
    return [];
  }
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

export async function updateProject(formData: FormData) {
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  if (!id || !name) return;
  const supabase = await createClient();
  await supabase
    .from("projects")
    .update({
      name,
      status: str(formData.get("status")) ?? "planning",
      priority: str(formData.get("priority")) ?? "medium",
      category: str(formData.get("category")),
      client: str(formData.get("client")),
      deadline: str(formData.get("deadline")),
      note: str(formData.get("note")),
    })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteProject(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function createApplication(formData: FormData) {
  const company = str(formData.get("company"));
  if (!company) return;
  const supabase = await createClient();
  await supabase.from("applications").insert({
    company,
    role: str(formData.get("role")),
    link: str(formData.get("link")),
    stage: str(formData.get("stage")) ?? "applied",
    next_step: str(formData.get("next_step")),
    notes: str(formData.get("notes")),
  });
  revalidatePath("/", "layout");
}

export async function setApplicationStage(formData: FormData) {
  const id = str(formData.get("id"));
  const stage = str(formData.get("stage"));
  if (!id || !stage) return;
  const supabase = await createClient();
  await supabase.from("applications").update({ stage }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteApplication(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("applications").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function createInvoice(formData: FormData) {
  const supabase = await createClient();
  const lineItems = parseLineItems(str(formData.get("line_items")));
  const taxRate = Number(str(formData.get("tax_rate")) ?? "0") || 0;
  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.rate, 0);
  const amount = Math.round(subtotal * (1 + taxRate / 100) * 100) / 100;
  const { data } = await supabase
    .from("invoices")
    .insert({
      invoice_number: str(formData.get("invoice_number")),
      client_id: str(formData.get("client_id")),
      line_items: lineItems,
      tax_rate: taxRate,
      notes: str(formData.get("notes")),
      status: str(formData.get("status")) ?? "draft",
      issued_on: str(formData.get("issued_on")) ?? today(),
      due_on: str(formData.get("due_on")),
      amount,
    })
    .select("id")
    .single();
  revalidatePath("/", "layout");
  if (data?.id) redirect(`/invoices/${data.id}`);
}

export async function updateInvoice(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) return;
  const supabase = await createClient();
  const lineItems = parseLineItems(str(formData.get("line_items")));
  const taxRate = Number(str(formData.get("tax_rate")) ?? "0") || 0;
  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.rate, 0);
  const amount = Math.round(subtotal * (1 + taxRate / 100) * 100) / 100;
  await supabase
    .from("invoices")
    .update({
      invoice_number: str(formData.get("invoice_number")),
      client_id: str(formData.get("client_id")),
      line_items: lineItems,
      tax_rate: taxRate,
      notes: str(formData.get("notes")),
      status: str(formData.get("status")) ?? "draft",
      due_on: str(formData.get("due_on")),
      amount,
    })
    .eq("id", id);
  revalidatePath("/", "layout");
  redirect(`/invoices/${id}`);
}

export async function setInvoiceStatus(formData: FormData) {
  const id = str(formData.get("id"));
  const status = str(formData.get("status"));
  if (!id || !status) return;
  const supabase = await createClient();
  await supabase
    .from("invoices")
    .update({ status, paid_on: status === "paid" ? new Date().toISOString().slice(0, 10) : null })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteInvoice(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("invoices").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function createTimeEntry(formData: FormData) {
  const minutes = Number(str(formData.get("minutes")) ?? "0") || 0;
  if (minutes <= 0) return;
  const supabase = await createClient();
  await supabase.from("time_entries").insert({
    project_id: str(formData.get("project_id")),
    description: str(formData.get("description")),
    minutes,
    entry_date: str(formData.get("entry_date")) ?? new Date().toISOString().slice(0, 10),
  });
  revalidatePath("/", "layout");
}

export async function deleteTimeEntry(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("time_entries").delete().eq("id", id);
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

export async function addClient(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;
  const supabase = await createClient();
  await supabase.from("clients").insert({
    name,
    company: str(formData.get("company")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    address: str(formData.get("address")),
  });
  revalidatePath("/", "layout");
}

export async function updateClient(formData: FormData) {
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  if (!id || !name) return;
  const supabase = await createClient();
  await supabase
    .from("clients")
    .update({
      name,
      company: str(formData.get("company")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      address: str(formData.get("address")),
    })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteClient(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function updateBusinessInfo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .update({
      business_name: str(formData.get("business_name")),
      business_contact_name: str(formData.get("business_contact_name")),
      business_email: str(formData.get("business_email")),
      business_address: str(formData.get("business_address")),
      business_phone: str(formData.get("business_phone")),
    })
    .eq("id", user.id);
  revalidatePath("/", "layout");
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
