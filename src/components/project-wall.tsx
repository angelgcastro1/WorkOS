"use client";

import { useSyncExternalStore } from "react";
import { Palette } from "lucide-react";
import type { Project, Task } from "@/lib/data";
import { ProjectCard } from "@/components/project-card";
import {
  COLOUR_MODE_HINT,
  COLOUR_MODE_KEY,
  COLOUR_MODE_LABEL,
  DIM_DONE_KEY,
  sortProjects,
  spineColour,
  type ProjectColourMode,
} from "@/lib/project-view";
import { cn } from "@/lib/utils";

const MODES: ProjectColourMode[] = ["deadline", "priority", "none"];

const EVENT = "workcham-project-view";

// Read the saved choice straight from localStorage, the same pattern the theme toggle
// uses — no state-in-effect, and no mismatch between the server and client render.
function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readMode(): ProjectColourMode {
  try {
    const saved = localStorage.getItem(COLOUR_MODE_KEY);
    if (saved === "deadline" || saved === "priority" || saved === "none") return saved;
  } catch {
    // private browsing can block storage; the default is fine
  }
  return "deadline";
}

function readDim(): boolean {
  try {
    return localStorage.getItem(DIM_DONE_KEY) !== "false";
  } catch {
    return true;
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // nothing to do — the choice just won't persist
  }
  window.dispatchEvent(new Event(EVENT));
}

export function ProjectWall({ projects, tasks }: { projects: Project[]; tasks: Task[] }) {
  const mode = useSyncExternalStore(subscribe, readMode, () => "deadline" as ProjectColourMode);
  const dimDone = useSyncExternalStore(subscribe, readDim, () => true);

  const ordered = sortProjects(projects, mode);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Colour &amp; order by</span>
          <div className="flex rounded-lg border border-border bg-card p-0.5">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => save(COLOUR_MODE_KEY, m)}
                aria-pressed={mode === m}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition",
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {COLOUR_MODE_LABEL[m]}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={dimDone}
            onChange={() => save(DIM_DONE_KEY, String(!dimDone))}
            className="h-3.5 w-3.5 rounded border-border accent-primary"
          />
          Dim finished projects
        </label>

        <span className="text-xs text-muted-foreground/70">{COLOUR_MODE_HINT[mode]}</span>
      </div>

      {projects.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No projects yet — add your first above.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ordered.map((p) => (
            // The anchor lets a task card link straight back to its project.
            <div key={p.id} id={`project-${p.id}`} className="scroll-mt-24">
              <ProjectCard
                project={p}
                tasks={tasks.filter((t) => t.projectId === p.id)}
                spine={spineColour(p, mode)}
                dimmed={dimDone && p.status === "done"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
