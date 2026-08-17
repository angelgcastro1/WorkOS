import { createClient } from "npm:@supabase/supabase-js@2";

// WorkCham's built-in assistant.
//
// It reads your live data to answer questions AND it can act: create clients,
// projects, tasks, notes, reminders and calendar events, and move things along.
// Everything runs through the signed-in user's own token, so row-level security
// applies exactly as it does in the app. Nothing here can delete.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "content-type": "application/json" } });
}

type Supa = ReturnType<typeof createClient>;
type Action = { tool: string; summary: string; ok: boolean };

// ---------------------------------------------------------------------------
// The things the assistant is allowed to do
// ---------------------------------------------------------------------------

const PROJECT_STATUSES = ["planning", "active", "in_progress", "in_review", "waiting_client", "on_hold", "done", "cancelled"];
const TASK_STATUSES = ["todo", "in_progress", "blocked", "done"];
const PRIORITIES = ["urgent", "high", "medium", "low"];

const TOOLS = [
  {
    name: "create_client",
    description: "Add a new client or customer to the CRM. Use when the user mentions taking on someone new, or names a person or company they are starting to work with.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Person or business name" },
        company: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        stage: { type: "string", enum: ["lead", "prospect", "active", "past"], description: "Defaults to lead" },
      },
      required: ["name"],
    },
  },
  {
    name: "create_project",
    description: "Create a project. If the user names a client that does not exist yet, create the client first with create_client, then pass the same name here.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        status: { type: "string", enum: PROJECT_STATUSES },
        priority: { type: "string", enum: PRIORITIES },
        category: { type: "string", description: "e.g. Web, Design, Career" },
        client_name: { type: "string", description: "Must match an existing client; look at the data given to you" },
        deadline: { type: "string", description: "YYYY-MM-DD" },
        note: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "create_task",
    description: "Add a task, optionally attached to a project. Call once per task when the user asks for several.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        project_name: { type: "string", description: "Must match an existing project" },
        status: { type: "string", enum: TASK_STATUSES },
        priority: { type: "string", enum: PRIORITIES },
        due: { type: "string", description: "YYYY-MM-DD" },
        repeat_rule: { type: "string", enum: ["none", "daily", "weekly", "monthly"] },
      },
      required: ["title"],
    },
  },
  {
    name: "create_note",
    description: "Write a note into the knowledge base.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string" },
        type: { type: "string", enum: ["Note", "Idea", "Meeting", "Client", "SOP", "Prompt"] },
        project_name: { type: "string" },
      },
      required: ["title"],
    },
  },
  {
    name: "create_reminder",
    description: "Set a time-based reminder. These pop up in the app when they come due.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        due_at: { type: "string", description: "ISO timestamp, e.g. 2026-08-20T09:00:00. Assume the user's local time." },
        note: { type: "string" },
      },
      required: ["title", "due_at"],
    },
  },
  {
    name: "create_event",
    description: "Put something on the calendar. If Google Calendar is connected it is mirrored there automatically.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        event_date: { type: "string", description: "YYYY-MM-DD" },
        start_time: { type: "string", description: "HH:MM, 24-hour" },
        end_time: { type: "string", description: "HH:MM, 24-hour" },
        type: { type: "string", enum: ["meeting", "deadline", "task", "reminder", "follow_up"] },
        notes: { type: "string" },
        meeting_link: { type: "string" },
      },
      required: ["title", "event_date"],
    },
  },
  {
    name: "update_project_status",
    description: "Move a project to a different status.",
    input_schema: {
      type: "object",
      properties: {
        project_name: { type: "string" },
        status: { type: "string", enum: PROJECT_STATUSES },
      },
      required: ["project_name", "status"],
    },
  },
  {
    name: "update_task_status",
    description: "Move a task along, including marking it done.",
    input_schema: {
      type: "object",
      properties: {
        task_title: { type: "string", description: "Enough of the title to identify it" },
        status: { type: "string", enum: TASK_STATUSES },
      },
      required: ["task_title", "status"],
    },
  },
  {
    name: "mark_invoice_paid",
    description: "Mark an invoice as paid, dated today unless told otherwise.",
    input_schema: {
      type: "object",
      properties: {
        invoice_number: { type: "string" },
        paid_on: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["invoice_number"],
    },
  },
];

// ---------------------------------------------------------------------------
// Running them
// ---------------------------------------------------------------------------

/**
 * The reminders column is timestamptz, so a bare "2026-08-20T09:00" would be read as
 * UTC and fire at the wrong hour. Stamp it with New York's real offset for that date,
 * which also gets daylight saving right.
 */
function withLocalOffset(value: string): string {
  if (/([zZ]|[+-]\d{2}:\d{2})$/.test(value)) return value;
  const probe = new Date(`${value.includes("T") ? value : `${value}T12:00:00`}Z`);
  if (Number.isNaN(probe.getTime())) return value;
  const name = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "longOffset" })
    .formatToParts(probe)
    .find((part) => part.type === "timeZoneName")?.value;
  const offset = (name ?? "GMT-05:00").replace("GMT", "") || "-05:00";
  return `${value}${offset}`;
}

async function findOne(supa: Supa, table: string, column: string, value: string): Promise<{ id: string; label: string } | null> {
  const { data } = await supa.from(table).select("id, " + column).ilike(column, `%${value}%`).limit(2);
  const rows = (data ?? []) as unknown as Record<string, string>[];
  if (rows.length !== 1) return null;
  return { id: rows[0].id, label: rows[0][column] };
}

async function runTool(supa: Supa, name: string, input: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const today = new Date().toISOString().slice(0, 10);

  switch (name) {
    case "create_client": {
      const { error } = await supa.from("clients").insert({
        name: input.name,
        company: input.company ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        stage: input.stage ?? "lead",
      });
      return error ? { ok: false, message: error.message } : { ok: true, message: `Client "${input.name}" created.` };
    }

    case "create_project": {
      let clientId: string | null = null;
      let clientLabel: string | null = null;
      if (input.client_name) {
        const match = await findOne(supa, "clients", "name", input.client_name);
        if (!match) return { ok: false, message: `No single client matches "${input.client_name}". Create the client first, or use its exact name.` };
        clientId = match.id;
        clientLabel = match.label;
      }
      const { error } = await supa.from("projects").insert({
        name: input.name,
        status: input.status ?? "planning",
        priority: input.priority ?? "medium",
        category: input.category ?? null,
        client: clientLabel,
        client_id: clientId,
        deadline: input.deadline ?? null,
        note: input.note ?? null,
      });
      return error ? { ok: false, message: error.message } : { ok: true, message: `Project "${input.name}" created.` };
    }

    case "create_task": {
      let projectId: string | null = null;
      if (input.project_name) {
        const match = await findOne(supa, "projects", "name", input.project_name);
        if (!match) return { ok: false, message: `No single project matches "${input.project_name}".` };
        projectId = match.id;
      }
      const { error } = await supa.from("tasks").insert({
        title: input.title,
        status: input.status ?? "todo",
        priority: input.priority ?? "medium",
        project_id: projectId,
        due: input.due ?? null,
        repeat_rule: input.repeat_rule ?? "none",
      });
      return error ? { ok: false, message: error.message } : { ok: true, message: `Task "${input.title}" added.` };
    }

    case "create_note": {
      let projectId: string | null = null;
      if (input.project_name) {
        const match = await findOne(supa, "projects", "name", input.project_name);
        projectId = match?.id ?? null;
      }
      const { error } = await supa.from("notes").insert({
        title: input.title,
        type: input.type ?? "Note",
        body: input.body ?? null,
        project_id: projectId,
        date: today,
      });
      return error ? { ok: false, message: error.message } : { ok: true, message: `Note "${input.title}" saved.` };
    }

    case "create_reminder": {
      const { error } = await supa.from("reminders").insert({
        title: input.title,
        due_at: withLocalOffset(input.due_at),
        note: input.note ?? null,
      });
      return error ? { ok: false, message: error.message } : { ok: true, message: `Reminder "${input.title}" set.` };
    }

    case "create_event": {
      const { error } = await supa.from("events").insert({
        title: input.title,
        type: input.type ?? "meeting",
        event_date: input.event_date,
        start_time: input.start_time ?? null,
        end_time: input.end_time ?? null,
        notes: input.notes ?? null,
        meeting_link: input.meeting_link ?? null,
        reminder_channel: "both",
        repeat_rule: "none",
        origin: "workcham",
      });
      return error ? { ok: false, message: error.message } : { ok: true, message: `"${input.title}" added to the calendar.` };
    }

    case "update_project_status": {
      const match = await findOne(supa, "projects", "name", input.project_name);
      if (!match) return { ok: false, message: `No single project matches "${input.project_name}".` };
      const { error } = await supa.from("projects").update({ status: input.status }).eq("id", match.id);
      return error ? { ok: false, message: error.message } : { ok: true, message: `"${match.label}" is now ${input.status.replace("_", " ")}.` };
    }

    case "update_task_status": {
      const match = await findOne(supa, "tasks", "title", input.task_title);
      if (!match) return { ok: false, message: `No single task matches "${input.task_title}".` };
      const { error } = await supa
        .from("tasks")
        .update({ status: input.status, completed_at: input.status === "done" ? today : null })
        .eq("id", match.id);
      return error ? { ok: false, message: error.message } : { ok: true, message: `"${match.label}" is now ${input.status.replace("_", " ")}.` };
    }

    case "mark_invoice_paid": {
      const match = await findOne(supa, "invoices", "invoice_number", input.invoice_number);
      if (!match) return { ok: false, message: `No single invoice matches "${input.invoice_number}".` };
      const { error } = await supa.from("invoices").update({ status: "paid", paid_on: input.paid_on ?? today }).eq("id", match.id);
      return error ? { ok: false, message: error.message } : { ok: true, message: `Invoice ${match.label} marked paid.` };
    }

    default:
      return { ok: false, message: `Unknown tool ${name}.` };
  }
}

// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "The AI assistant isn't set up yet — add your ANTHROPIC_API_KEY in Supabase." }, 400);

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return json({ error: "Please sign in again." }, 401);

    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? [...body.messages] : [];
    const today = new Date().toISOString().slice(0, 10);

    const [t, p, inv, ev, rem, no, cl] = await Promise.all([
      userClient.from("tasks").select("title, status, priority, due").neq("status", "done").limit(60),
      userClient.from("projects").select("name, status, priority, deadline").limit(40),
      userClient.from("invoices").select("invoice_number, amount, status, due_on").limit(60),
      userClient.from("events").select("title, event_date, start_time").gte("event_date", today).limit(40),
      userClient.from("reminders").select("title, due_at").eq("done", false).limit(40),
      userClient.from("notes").select("title, type, body").limit(25),
      userClient.from("clients").select("name, company, stage").limit(40),
    ]);

    const ctx = {
      today,
      openTasks: t.data ?? [],
      projects: p.data ?? [],
      invoices: inv.data ?? [],
      upcomingEvents: ev.data ?? [],
      reminders: rem.data ?? [],
      notes: (no.data ?? []).map((n: { title: string; type: string; body: string | null }) => ({
        title: n.title,
        type: n.type,
        body: (n.body ?? "").slice(0, 600),
      })),
      clients: cl.data ?? [],
    };

    const system = `You are the built-in assistant in WorkCham, the personal business OS for ${user.email} and their company Cham Media. Today is ${today}. The user's timezone is America/New_York.

You can both answer questions from the live data below AND change things using the tools you have been given.

How to act:
- When the user asks for something to be created or changed, just do it with the tools. Do not ask for permission first, and do not ask for details they did not give — pick sensible defaults and say what you chose.
- One tool call per thing. "Add three tasks" means three create_task calls.
- Order matters: create a client before the project that references it, and a project before its tasks.
- Only use a client_name or project_name that appears in the data below, or that you have just created in this same turn.
- Dates: work out real dates from phrases like "next Friday" or "end of the month" using today's date. Always send YYYY-MM-DD.
- You cannot delete anything. If asked, say so plainly and suggest they use the delete button on the item.
- After acting, confirm in one short line what now exists — no bullet lists for one or two items.

When asked to draft something (client email, invoice note, proposal, follow-up), return polished ready-to-send copy. When asked to summarize, give key points and action items. Be concise, friendly, practical.

USER DATA (JSON):
${JSON.stringify(ctx)}`;

    const model = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-4-6";
    const actions: Action[] = [];
    let text = "";

    // Claude may need several rounds: call a tool, see the result, call the next one.
    for (let round = 0; round < 8; round++) {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model, max_tokens: 1500, system, tools: TOOLS, messages }),
      });
      const data = await resp.json();
      if (!resp.ok) return json({ error: data?.error?.message ?? "AI request failed." }, 400);

      const blocks = (data.content ?? []) as { type: string; text?: string; id?: string; name?: string; input?: Record<string, string> }[];
      text = blocks
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("\n")
        .trim();

      const calls = blocks.filter((b) => b.type === "tool_use");
      if (data.stop_reason !== "tool_use" || calls.length === 0) break;

      messages.push({ role: "assistant", content: blocks });

      const results = [];
      for (const call of calls) {
        const outcome = await runTool(userClient, call.name!, call.input ?? {});
        actions.push({ tool: call.name!, summary: outcome.message, ok: outcome.ok });
        results.push({ type: "tool_result", tool_use_id: call.id, content: outcome.message, is_error: !outcome.ok });
      }
      messages.push({ role: "user", content: results });
    }

    return json({ text: text || (actions.length ? actions.map((a) => a.summary).join(" ") : "(no response)"), actions });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
