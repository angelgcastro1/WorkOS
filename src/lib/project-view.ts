import type { Project } from "@/lib/data";
import { daysUntil } from "@/lib/utils";

// How the project wall is coloured and ordered. Chosen on the Projects page and
// remembered in the browser, the same way the dark/light theme is.
export type ProjectColourMode = "priority" | "deadline" | "none";

export const COLOUR_MODE_KEY = "workcham-project-colour";
export const DIM_DONE_KEY = "workcham-project-dim-done";

const PRIORITY_COLOUR: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f59e0b",
  medium: "#3b82f6",
  low: "#9ca3af",
};

/** Overdue red · within a week amber · this month blue · further out green. */
function deadlineColour(project: Project): string | null {
  if (isClosed(project)) return "#9ca3af";
  const days = daysUntil(project.deadline);
  if (days === null) return null;
  if (days < 0) return "#ef4444";
  if (days <= 7) return "#f59e0b";
  if (days <= 30) return "#3b82f6";
  return "#10b981";
}

export function spineColour(project: Project, mode: ProjectColourMode): string | null {
  if (mode === "none") return null;
  if (mode === "priority") return PRIORITY_COLOUR[project.priority] ?? null;
  return deadlineColour(project);
}

/** Finished — off your plate. */
export function isClosed(project: Project): boolean {
  return project.status === "done";
}

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

/** Sorting follows the colouring, so the wall reads top-left to bottom-right. */
export function sortProjects(projects: Project[], mode: ProjectColourMode): Project[] {
  const copy = [...projects];
  if (mode === "none") return copy;

  return copy.sort((a, b) => {
    // Finished and cancelled work always sinks to the bottom.
    const doneA = isClosed(a) ? 1 : 0;
    const doneB = isClosed(b) ? 1 : 0;
    if (doneA !== doneB) return doneA - doneB;

    if (mode === "priority") {
      const rank = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
      if (rank !== 0) return rank;
    }

    // Soonest deadline first; projects without one go last.
    const da = daysUntil(a.deadline);
    const db = daysUntil(b.deadline);
    if (da === null && db === null) return 0;
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  });
}

export const COLOUR_MODE_LABEL: Record<ProjectColourMode, string> = {
  deadline: "Deadline",
  priority: "Priority",
  none: "Off",
};

export const COLOUR_MODE_HINT: Record<ProjectColourMode, string> = {
  deadline: "Overdue red · due within a week amber · this month blue · further out green",
  priority: "Urgent red · high amber · medium blue · low grey",
  none: "No colour bar — cards in the order they were created",
};
