import { getWorkspace } from "@/lib/queries";
import { CalendarClient } from "@/components/calendar-client";
import { IcsImportButton } from "@/components/ics-import-button";

export default async function CalendarPage() {
  const { events, clients, projects, invoices, reminders, tasks } = await getWorkspace(["events","clients","projects","invoices","reminders","tasks"]);
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Meetings, deadlines, reminders, and invoice due dates — all in one place.
          </p>
        </div>
        <IcsImportButton />
      </header>
      <CalendarClient
        events={events}
        clients={clients}
        projects={projects}
        invoices={invoices}
        reminders={reminders}
        tasks={tasks}
        todayIso={todayIso}
      />
    </div>
  );
}
