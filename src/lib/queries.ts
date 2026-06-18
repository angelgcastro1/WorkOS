import { createClient } from "@/lib/supabase/server";
import type {
  Workspace,
  Project,
  Task,
  Note,
  Contact,
  Reminder,
  Attachment,
  Application,
  Invoice,
  TimeEntry,
  Client,
  LineItem,
  Profile,
  ProjectStatus,
  Priority,
  TaskStatus,
  NoteType,
  ApplicationStage,
  InvoiceStatus,
} from "@/lib/data";

interface ProjectRow {
  id: string;
  name: string;
  status: string;
  priority: string;
  category: string | null;
  client: string | null;
  deadline: string | null;
  note: string | null;
}
interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  project_id: string | null;
  due: string | null;
  completed_at: string | null;
  tags: string[] | null;
}
interface NoteRow {
  id: string;
  title: string;
  type: string;
  body: string | null;
  project_id: string | null;
  date: string | null;
  tags: string[] | null;
}
interface ContactRow {
  id: string;
  name: string;
  company: string | null;
  type: string;
  stage: string;
  email: string | null;
  phone: string | null;
  value: number | string | null;
  last_contacted: string | null;
  next_follow_up: string | null;
  project_id: string | null;
}
interface ReminderRow {
  id: string;
  title: string;
  note: string | null;
  due_at: string;
  done: boolean;
}
interface AttachmentRow {
  id: string;
  note_id: string;
  name: string;
  path: string;
  mime: string | null;
  size: number | string | null;
  created_at: string | null;
}
interface ApplicationRow {
  id: string;
  company: string;
  role: string | null;
  link: string | null;
  stage: string;
  applied_on: string | null;
  next_step: string | null;
  notes: string | null;
}
interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  client: string | null;
  client_id: string | null;
  amount: number | string | null;
  status: string;
  issued_on: string | null;
  due_on: string | null;
  paid_on: string | null;
  line_items: unknown;
  tax_rate: number | string | null;
  notes: string | null;
}
interface TimeEntryRow {
  id: string;
  project_id: string | null;
  description: string | null;
  minutes: number | null;
  entry_date: string | null;
}
interface ClientRow {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}
interface RawLineItem {
  description?: unknown;
  quantity?: unknown;
  rate?: unknown;
}

function mapLineItems(raw: unknown): LineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const li = (item ?? {}) as RawLineItem;
    return {
      description: typeof li.description === "string" ? li.description : "",
      quantity: Number(li.quantity) || 0,
      rate: Number(li.rate) || 0,
    };
  });
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, name, role, business_name, business_email, business_address")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    name: data?.name ?? user.email?.split("@")[0] ?? "You",
    role: data?.role ?? "Member",
    businessName: data?.business_name ?? null,
    businessEmail: data?.business_email ?? user.email ?? null,
    businessAddress: data?.business_address ?? null,
  };
}

export async function getWorkspace(): Promise<Workspace> {
  const supabase = await createClient();
  const [pRes, tRes, nRes, cRes, rRes, aRes, appRes, invRes, teRes, clRes] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: true }),
    supabase.from("tasks").select("*").order("created_at", { ascending: true }),
    supabase.from("notes").select("*").order("date", { ascending: false }),
    supabase.from("contacts").select("*").order("created_at", { ascending: true }),
    supabase.from("reminders").select("*").order("due_at", { ascending: true }),
    supabase.from("note_attachments").select("*").order("created_at", { ascending: true }),
    supabase.from("applications").select("*").order("applied_on", { ascending: false }),
    supabase.from("invoices").select("*").order("issued_on", { ascending: false }),
    supabase.from("time_entries").select("*").order("entry_date", { ascending: false }),
    supabase.from("clients").select("*").order("name", { ascending: true }),
  ]);

  const projectRows = (pRes.data ?? []) as ProjectRow[];
  const taskRows = (tRes.data ?? []) as TaskRow[];
  const noteRows = (nRes.data ?? []) as NoteRow[];
  const contactRows = (cRes.data ?? []) as ContactRow[];
  const reminderRows = (rRes.data ?? []) as ReminderRow[];
  const attachmentRows = (aRes.data ?? []) as AttachmentRow[];
  const applicationRows = (appRes.data ?? []) as ApplicationRow[];
  const invoiceRows = (invRes.data ?? []) as InvoiceRow[];
  const timeEntryRows = (teRes.data ?? []) as TimeEntryRow[];
  const clientRows = (clRes.data ?? []) as ClientRow[];

  const projectName = new Map<string, string>(projectRows.map((p) => [p.id, p.name]));

  const tasks: Task[] = taskRows.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status as TaskStatus,
    priority: t.priority as Priority,
    projectId: t.project_id,
    project: t.project_id ? projectName.get(t.project_id) ?? null : null,
    due: t.due,
    completedAt: t.completed_at,
    tags: t.tags ?? [],
  }));

  const projects: Project[] = projectRows.map((p) => {
    const related = tasks.filter((t) => t.projectId === p.id);
    const done = related.filter((t) => t.status === "done").length;
    const total = related.length;
    return {
      id: p.id,
      name: p.name,
      status: p.status as ProjectStatus,
      priority: p.priority as Priority,
      category: p.category,
      client: p.client,
      deadline: p.deadline,
      note: p.note,
      tasksDone: done,
      tasksTotal: total,
      progress: total ? Math.round((done / total) * 100) : 0,
    };
  });

  const attachmentsByNote = new Map<string, Attachment[]>();
  for (const a of attachmentRows) {
    const item: Attachment = {
      id: a.id,
      noteId: a.note_id,
      name: a.name,
      path: a.path,
      mime: a.mime,
      size: a.size === null ? null : Number(a.size),
      createdAt: a.created_at,
    };
    const list = attachmentsByNote.get(a.note_id) ?? [];
    list.push(item);
    attachmentsByNote.set(a.note_id, list);
  }

  const notes: Note[] = noteRows.map((n) => ({
    id: n.id,
    title: n.title,
    type: n.type as NoteType,
    body: n.body,
    projectId: n.project_id,
    date: n.date,
    tags: n.tags ?? [],
    attachments: attachmentsByNote.get(n.id) ?? [],
  }));

  const contacts: Contact[] = contactRows.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    type: c.type,
    stage: c.stage,
    email: c.email,
    phone: c.phone,
    value: Number(c.value) || 0,
    lastContacted: c.last_contacted,
    nextFollowUp: c.next_follow_up,
    projectId: c.project_id,
  }));

  const reminders: Reminder[] = reminderRows.map((r) => ({
    id: r.id,
    title: r.title,
    note: r.note,
    dueAt: r.due_at,
    done: r.done,
  }));

  const applications: Application[] = applicationRows.map((a) => ({
    id: a.id,
    company: a.company,
    role: a.role,
    link: a.link,
    stage: a.stage as ApplicationStage,
    appliedOn: a.applied_on,
    nextStep: a.next_step,
    notes: a.notes,
  }));

  const invoices: Invoice[] = invoiceRows.map((i) => ({
    id: i.id,
    invoiceNumber: i.invoice_number,
    client: i.client,
    clientId: i.client_id,
    amount: Number(i.amount) || 0,
    status: i.status as InvoiceStatus,
    issuedOn: i.issued_on,
    dueOn: i.due_on,
    paidOn: i.paid_on,
    lineItems: mapLineItems(i.line_items),
    taxRate: Number(i.tax_rate) || 0,
    notes: i.notes,
  }));

  const timeEntries: TimeEntry[] = timeEntryRows.map((te) => ({
    id: te.id,
    projectId: te.project_id,
    description: te.description,
    minutes: te.minutes ?? 0,
    entryDate: te.entry_date,
  }));

  const clients: Client[] = clientRows.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    email: c.email,
    phone: c.phone,
    address: c.address,
  }));

  return { projects, tasks, notes, contacts, reminders, applications, invoices, timeEntries, clients };
}
