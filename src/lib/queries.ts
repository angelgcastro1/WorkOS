import { createClient } from "@/lib/supabase/server";
import type {
  Workspace,
  Project,
  Task,
  Note,
  Contact,
  Profile,
  ProjectStatus,
  Priority,
  TaskStatus,
  NoteType,
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

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("id, name, role").eq("id", user.id).maybeSingle();
  return {
    id: user.id,
    name: data?.name ?? user.email?.split("@")[0] ?? "You",
    role: data?.role ?? "Member",
  };
}

export async function getWorkspace(): Promise<Workspace> {
  const supabase = await createClient();
  const [pRes, tRes, nRes, cRes] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: true }),
    supabase.from("tasks").select("*").order("created_at", { ascending: true }),
    supabase.from("notes").select("*").order("date", { ascending: false }),
    supabase.from("contacts").select("*").order("created_at", { ascending: true }),
  ]);

  const projectRows = (pRes.data ?? []) as ProjectRow[];
  const taskRows = (tRes.data ?? []) as TaskRow[];
  const noteRows = (nRes.data ?? []) as NoteRow[];
  const contactRows = (cRes.data ?? []) as ContactRow[];

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

  const notes: Note[] = noteRows.map((n) => ({
    id: n.id,
    title: n.title,
    type: n.type as NoteType,
    body: n.body,
    projectId: n.project_id,
    date: n.date,
    tags: n.tags ?? [],
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

  return { projects, tasks, notes, contacts };
}
