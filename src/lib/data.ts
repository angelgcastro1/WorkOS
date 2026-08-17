// Domain types for WorkCham. Rows come from Supabase (see src/lib/queries.ts) and are
// mapped into these shapes for the UI.

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";
export type ProjectStatus =
  | "planning"
  | "active"
  | "in_progress"
  | "in_review"
  | "waiting_client"
  | "on_hold"
  | "done"
  | "cancelled";
export type NoteType = "Idea" | "Meeting" | "Client" | "SOP" | "Prompt" | "Note";
export type ApplicationStage = "applied" | "screening" | "interview" | "offer" | "rejected";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "accepted" | "declined";
export type DocKind = "invoice" | "quote";
export type ClientStage = "lead" | "quoted" | "won" | "lost";

export interface Profile {
  id: string;
  name: string;
  role: string;
  businessName: string | null;
  businessContactName: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: Priority;
  category: string | null;
  client: string | null;
  clientId: string | null;
  deadline: string | null;
  note: string | null;
  tasksDone: number;
  tasksTotal: number;
  progress: number;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  projectId: string | null;
  project: string | null;
  due: string | null;
  completedAt: string | null;
  tags: string[];
  repeatRule: RepeatRule;
}

export interface Attachment {
  id: string;
  noteId: string;
  name: string;
  path: string;
  mime: string | null;
  size: number | null;
  createdAt: string | null;
  /** Voice notes only: length, waveform peaks (0-1) and any transcript. */
  durationSeconds: number | null;
  peaks: number[] | null;
  transcript: string | null;
}

export interface Note {
  id: string;
  title: string;
  type: NoteType;
  body: string | null;
  projectId: string | null;
  date: string | null;
  tags: string[];
  attachments: Attachment[];
}

export interface Contact {
  id: string;
  name: string;
  company: string | null;
  type: string;
  stage: string;
  email: string | null;
  phone: string | null;
  value: number;
  lastContacted: string | null;
  nextFollowUp: string | null;
  projectId: string | null;
}

export interface Reminder {
  id: string;
  title: string;
  note: string | null;
  dueAt: string;
  done: boolean;
  clientId: string | null;
}

export interface Application {
  id: string;
  company: string;
  role: string | null;
  link: string | null;
  stage: ApplicationStage;
  appliedOn: string | null;
  nextStep: string | null;
  notes: string | null;
}

export interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  stage: ClientStage;
  createdAt: string | null;
}

export interface ClientNote {
  id: string;
  clientId: string;
  body: string;
  createdAt: string;
}

export interface IntakeAttachment {
  path: string;
  name: string;
}

export interface IntakeSubmission {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  services: string[];
  budget: string | null;
  timeline: string | null;
  details: string | null;
  source: string | null;
  links: string | null;
  attachments: IntakeAttachment[];
  status: string;
  clientId: string | null;
  createdAt: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id: string;
  publicToken: string;
  kind: DocKind;
  invoiceNumber: string | null;
  client: string | null;
  clientId: string | null;
  amount: number;
  status: InvoiceStatus;
  issuedOn: string | null;
  dueOn: string | null;
  paidOn: string | null;
  lineItems: LineItem[];
  taxRate: number;
  notes: string | null;
}

export interface TimeEntry {
  id: string;
  projectId: string | null;
  description: string | null;
  minutes: number;
  entryDate: string | null;
}

export type EventType = "meeting" | "deadline" | "task" | "reminder" | "follow_up";
export type RepeatRule = "none" | "daily" | "weekly" | "monthly";

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  startTime: string | null;
  endTime: string | null;
  clientId: string | null;
  projectId: string | null;
  notes: string | null;
  meetingLink: string | null;
  attendees: string | null;
  agenda: string | null;
  actionItems: string | null;
  reminderMinutes: number | null;
  reminderChannel: string;
  repeatRule: RepeatRule;
}

export interface Workspace {
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  contacts: Contact[];
  reminders: Reminder[];
  applications: Application[];
  invoices: Invoice[];
  timeEntries: TimeEntry[];
  clients: Client[];
  events: CalendarEvent[];
}
