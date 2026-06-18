// Domain types for WorkCham. Rows come from Supabase (see src/lib/queries.ts) and are
// mapped into these shapes for the UI.

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";
export type ProjectStatus = "planning" | "active" | "on_hold" | "done";
export type NoteType = "Idea" | "Meeting" | "Client" | "SOP" | "Prompt" | "Note";

export interface Profile {
  id: string;
  name: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: Priority;
  category: string | null;
  client: string | null;
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
}

export interface Attachment {
  id: string;
  noteId: string;
  name: string;
  path: string;
  mime: string | null;
  size: number | null;
  createdAt: string | null;
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
}

export interface Workspace {
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  contacts: Contact[];
  reminders: Reminder[];
}
