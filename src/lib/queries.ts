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
  ClientStage,
  ClientNote,
  IntakeSubmission,
  CalendarEvent,
  EventType,
  RepeatRule,
  DocKind,
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
  client_id: string | null;
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
  repeat_rule: string | null;
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
  client_id: string | null;
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
  public_token: string;
  kind: string;
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
  stage: string | null;
  created_at: string | null;
}
interface EventRow {
  id: string;
  title: string;
  type: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  client_id: string | null;
  project_id: string | null;
  notes: string | null;
  meeting_link: string | null;
  attendees: string | null;
  agenda: string | null;
  action_items: string | null;
  reminder_minutes: number | null;
  reminder_channel: string | null;
  repeat_rule: string | null;
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

// Pull the real form-submission time out of a lead's imported note body
// (e.g. "... Submitted: 2026-07-22 02:29 UTC"). Returns an ISO string, or null
// if there is no parseable "Submitted:" value. Tolerant of the handful of
// date formats the lead importer has produced.
function parseSubmittedAt(body: string | null | undefined): string | null {
  if (!body) return null;
  const m = body.match(/Submitted:\s*(.+)/i);
  if (!m) return null;
  const raw = m[1].split("(")[0].trim();
  if (!raw) return null;
  let d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    // Normalize "2026-07-22 02:29 UTC" -> "2026-07-22T02:29Z"
    d = new Date(raw.replace(/\s+UTC$/i, "Z").replace(" ", "T"));
  }
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, name, role, business_name, business_contact_name, business_email, business_address, business_phone")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    name: data?.name ?? user.email?.split("@")[0] ?? "You",
    role: data?.role ?? "Member",
    businessName: data?.business_name ?? null,
    businessContactName: data?.business_contact_name ?? null,
    businessEmail: data?.business_email ?? user.email ?? null,
    businessAddress: data?.business_address ?? null,
    businessPhone: data?.business_phone ?? null,
  };
}

export async function getClientNotes(clientId: string): Promise<ClientNote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_notes")
    .select("id, client_id, body, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((n) => ({
    id: n.id as string,
    clientId: n.client_id as string,
    body: (n.body ?? "") as string,
    createdAt: n.created_at as string,
  }));
}

export async function getIntakeSubmissions(): Promise<IntakeSubmission[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("intake_submissions")
    .select("id, name, email, phone, company, services, budget, timeline, details, source, links, attachments, status, client_id, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []).map((s) => ({
    id: s.id as string,
    name: (s.name ?? "") as string,
    email: (s.email ?? null) as string | null,
    phone: (s.phone ?? null) as string | null,
    company: (s.company ?? null) as string | null,
    services: Array.isArray(s.services) ? (s.services as string[]) : [],
    budget: (s.budget ?? null) as string | null,
    timeline: (s.timeline ?? null) as string | null,
    details: (s.details ?? null) as string | null,
    source: (s.source ?? null) as string | null,
    links: (s.links ?? null) as string | null,
    attachments: Array.isArray(s.attachments)
      ? (s.attachments as unknown[])
          .map((a) => {
            const o = (a ?? {}) as { path?: unknown; name?: unknown };
            return { path: typeof o.path === "string" ? o.path : "", name: typeof o.name === "string" ? o.name : "file" };
          })
          .filter((a) => a.path.length > 0)
      : [],
    status: (s.status ?? "new") as string,
    clientId: (s.client_id ?? null) as string | null,
    createdAt: s.created_at as string,
  }));
}

export async function getWorkspace(): Promise<Workspace> {
  const supabase = await createClient();
  const [pRes, tRes, nRes, cRes, rRes, aRes, appRes, invRes, teRes, clRes, evRes, cnRes] = await Promise.all([
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
    supabase.from("events").select("*").order("event_date", { ascending: true }),
    supabase.from("client_notes").select("client_id, body, created_at").order("created_at", { ascending: true }),
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
  const eventRows = (evRes.data ?? []) as EventRow[];

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
    repeatRule: (t.repeat_rule ?? "none") as RepeatRule,
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
      clientId: p.client_id,
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
    clientId: r.client_id,
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
    publicToken: i.public_token,
    kind: (i.kind ?? "invoice") as DocKind,
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

  const submittedByClient = new Map<string, string>();
  for (const n of (cnRes.data ?? []) as { client_id: string | null; body: string | null }[]) {
    if (!n.client_id || submittedByClient.has(n.client_id)) continue;
    const submitted = parseSubmittedAt(n.body);
    if (submitted) submittedByClient.set(n.client_id, submitted);
  }

  const clients: Client[] = clientRows.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    email: c.email,
    phone: c.phone,
    address: c.address,
    stage: (c.stage ?? "lead") as ClientStage,
    createdAt: c.created_at,
    submittedAt: submittedByClient.get(c.id) ?? null,
  }));

  const events: CalendarEvent[] = eventRows.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type as EventType,
    date: e.event_date,
    startTime: e.start_time,
    endTime: e.end_time,
    clientId: e.client_id,
    projectId: e.project_id,
    notes: e.notes,
    meetingLink: e.meeting_link,
    attendees: e.attendees,
    agenda: e.agenda,
    actionItems: e.action_items,
    reminderMinutes: e.reminder_minutes,
    reminderChannel: e.reminder_channel ?? "both",
    repeatRule: (e.repeat_rule ?? "none") as RepeatRule,
  }));

  return { projects, tasks, notes, contacts, reminders, applications, invoices, timeEntries, clients, events };
}
