import { getWorkspace } from "@/lib/queries";
import { CalendarClient } from "@/components/calendar-client";

export default async function CalendarPage() {
  const { events, clients, projects, invoices, reminders, tasks } = await getWorkspace();
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Meetings, deadlines, reminders, and invoice due dates — all in one place.
        </p>
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
