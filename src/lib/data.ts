// Placeholder data for WorkOS v1.
// Swap this module for Supabase queries when wiring the database — the shapes below map to table rows.

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";
export type ProjectStatus = "planning" | "active" | "on_hold" | "done";
export type NoteType = "Idea" | "Meeting" | "Client" | "SOP" | "Prompt" | "Note";

export interface Profile {
  name: string;
  role: string;
  initials: string;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: Priority;
  category: string;
  client?: string;
  deadline: string;
  tasksDone: number;
  tasksTotal: number;
  progress: number;
  links?: { label: string; url: string }[];
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  project?: string;
  due?: string;
}

export interface Note {
  id: string;
  title: string;
  type: NoteType;
  excerpt: string;
  date: string;
  tags: string[];
}

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
  kind: "task" | "job" | "lead" | "content" | "income";
}

export const profile: Profile = { name: "Angel", role: "Creative Freelancer", initials: "A" };

export interface MetricSummary {
  tasksDoneWeek: number;
  tasksDoneWeekPrev: number;
  activeProjects: number;
  applicationsSent: number;
  interviewsBooked: number;
  leadsContacted: number;
  portfolioVisits: number;
  portfolioVisitsPrev: number;
  contentPosted: number;
  incomeMonth: number;
  incomeGoal: number;
  completionRate: number;
}

export const metrics: MetricSummary = {
  tasksDoneWeek: 18,
  tasksDoneWeekPrev: 14,
  activeProjects: 5,
  applicationsSent: 27,
  interviewsBooked: 4,
  leadsContacted: 12,
  portfolioVisits: 1840,
  portfolioVisitsPrev: 1510,
  contentPosted: 9,
  incomeMonth: 6200,
  incomeGoal: 10000,
  completionRate: 78,
};

export const weeklyProgress: { week: string; completed: number; applications: number }[] = [
  { week: "Apr 21", completed: 9, applications: 2 },
  { week: "Apr 28", completed: 12, applications: 3 },
  { week: "May 5", completed: 10, applications: 5 },
  { week: "May 12", completed: 14, applications: 4 },
  { week: "May 19", completed: 11, applications: 6 },
  { week: "May 26", completed: 16, applications: 3 },
  { week: "Jun 2", completed: 13, applications: 4 },
  { week: "Jun 9", completed: 18, applications: 5 },
];

export const incomeByMonth: { month: string; income: number; goal: number }[] = [
  { month: "Jan", income: 3200, goal: 10000 },
  { month: "Feb", income: 4100, goal: 10000 },
  { month: "Mar", income: 5400, goal: 10000 },
  { month: "Apr", income: 4800, goal: 10000 },
  { month: "May", income: 7300, goal: 10000 },
  { month: "Jun", income: 6200, goal: 10000 },
];

export const contentByCategory: { category: string; count: number }[] = [
  { category: "Design", count: 14 },
  { category: "Video", count: 9 },
  { category: "Motion", count: 6 },
  { category: "Photo", count: 11 },
];

export const jobFunnel: { stage: string; value: number }[] = [
  { stage: "Applied", value: 27 },
  { stage: "Screening", value: 11 },
  { stage: "Interview", value: 4 },
  { stage: "Offer", value: 1 },
];

export const projects: Project[] = [
  { id: "p1", name: "Brand identity — Brightside Co", status: "active", priority: "high", category: "Design", client: "Brightside Co", deadline: "2026-06-28", tasksDone: 8, tasksTotal: 12, progress: 67, links: [{ label: "Figma", url: "#" }, { label: "Brief", url: "#" }], note: "Logo approved — building the full system next." },
  { id: "p2", name: "Portfolio website revamp", status: "active", priority: "urgent", category: "Web", deadline: "2026-06-22", tasksDone: 6, tasksTotal: 10, progress: 60, note: "Homepage + case studies left." },
  { id: "p3", name: "YouTube channel relaunch", status: "active", priority: "medium", category: "Video", deadline: "2026-07-10", tasksDone: 5, tasksTotal: 14, progress: 36 },
  { id: "p4", name: "Motion reel 2026", status: "planning", priority: "medium", category: "Motion", deadline: "2026-07-20", tasksDone: 1, tasksTotal: 8, progress: 13 },
  { id: "p5", name: "Product shoot — Rivera", status: "active", priority: "high", category: "Photo", client: "Rivera Design", deadline: "2026-06-25", tasksDone: 4, tasksTotal: 6, progress: 67 },
  { id: "p6", name: "Job search — Senior Designer", status: "active", priority: "high", category: "Career", deadline: "2026-07-31", tasksDone: 11, tasksTotal: 20, progress: 55, note: "Targeting product + brand roles." },
];

export const tasks: Task[] = [
  { id: "t1", title: "Finalize logo lockups", status: "in_progress", priority: "high", project: "Brand identity — Brightside Co", due: "2026-06-17" },
  { id: "t2", title: "Build homepage in code", status: "in_progress", priority: "urgent", project: "Portfolio website revamp", due: "2026-06-18" },
  { id: "t3", title: "Tailor resume for Northwind role", status: "todo", priority: "high", project: "Job search — Senior Designer", due: "2026-06-17" },
  { id: "t4", title: "Edit channel trailer", status: "todo", priority: "medium", project: "YouTube channel relaunch", due: "2026-06-20" },
  { id: "t5", title: "Shot list for Rivera shoot", status: "todo", priority: "high", project: "Product shoot — Rivera", due: "2026-06-19" },
  { id: "t6", title: "Color-grade reel clips", status: "blocked", priority: "medium", project: "Motion reel 2026", due: "2026-06-21" },
  { id: "t7", title: "Send 5 job applications", status: "todo", priority: "high", project: "Job search — Senior Designer", due: "2026-06-16" },
  { id: "t8", title: "Follow up with Devin (lead)", status: "todo", priority: "medium", due: "2026-06-18" },
  { id: "t9", title: "Draft case study: Brightside", status: "todo", priority: "medium", project: "Portfolio website revamp", due: "2026-06-24" },
  { id: "t10", title: "Export brand style guide", status: "done", priority: "medium", project: "Brand identity — Brightside Co" },
  { id: "t11", title: "Record 3 voiceovers", status: "done", priority: "low", project: "YouTube channel relaunch" },
  { id: "t12", title: "Book studio for shoot", status: "done", priority: "high", project: "Product shoot — Rivera" },
  { id: "t13", title: "Update portfolio thumbnails", status: "done", priority: "low", project: "Portfolio website revamp" },
  { id: "t14", title: "Interview prep — STAR stories", status: "in_progress", priority: "high", project: "Job search — Senior Designer", due: "2026-06-23" },
];

export const notes: Note[] = [
  { id: "n1", title: "Homepage hero — copy directions", type: "Idea", excerpt: "Lead with the outcome, not the tools. Hero line under 8 words. Show the work above the fold.", date: "2026-06-14", tags: ["web", "copy"] },
  { id: "n2", title: "Brightside kickoff", type: "Meeting", excerpt: "Scope: logo + system + 1 launch asset. Timeline 3 weeks. They handle copy; I own visuals.", date: "2026-06-10", tags: ["client", "brand"] },
  { id: "n3", title: "Rivera brand preferences", type: "Client", excerpt: "Warm neutral tones, lots of negative space, natural light. Avoid heavy filters.", date: "2026-06-08", tags: ["photo"] },
  { id: "n4", title: "Client onboarding SOP", type: "SOP", excerpt: "1) Send contract 2) 50% deposit 3) Brief call 4) Moodboard 5) Kickoff. Never start before deposit.", date: "2026-05-30", tags: ["ops"] },
  { id: "n5", title: "Reusable AI prompts", type: "Prompt", excerpt: "Caption generator, alt-text writer, cold-outreach opener, case-study outline. Keep tone friendly + direct.", date: "2026-06-12", tags: ["ai"] },
  { id: "n6", title: "Interview — common questions", type: "Note", excerpt: "Prep STAR stories: redesign impact, hard client, missed deadline recovery, favorite project.", date: "2026-06-13", tags: ["career"] },
  { id: "n7", title: "Motion reel — sequence ideas", type: "Idea", excerpt: "Open with kinetic type, mid logo animations, close with 3D product loop. ~45s total.", date: "2026-06-11", tags: ["motion"] },
];

export const activity: ActivityItem[] = [
  { id: "a1", text: "Completed ‘Export brand style guide’", time: "2h ago", kind: "task" },
  { id: "a2", text: "Applied to Senior Product Designer @ Northwind", time: "5h ago", kind: "job" },
  { id: "a3", text: "New lead: Aisha Khan (Cloudpeak)", time: "Yesterday", kind: "lead" },
  { id: "a4", text: "Posted motion piece ‘Loop 03’", time: "Yesterday", kind: "content" },
  { id: "a5", text: "Invoice paid — Brightside Co (+$2,400)", time: "2 days ago", kind: "income" },
  { id: "a6", text: "Booked interview with Meridian Studio", time: "3 days ago", kind: "job" },
];

export const aiSuggestions: string[] = [
  "You have 3 items due today — start with “Finalize logo lockups,” it unblocks the Brightside launch.",
  "Portfolio visits are up 22% this week. Good moment to publish a new case study.",
  "2 leads haven’t been contacted in 7+ days — follow up with Devin and Aisha.",
  "You’re $3,800 from your June income goal with 13 days left. One more invoice closes it.",
];
