import { getWorkspace } from "@/lib/queries";
import { CalendarClient } from "@/components/calendar-client";
import { googleStatus, pullEvents } from "@/lib/google-calendar";
import { zoomConfigured } from "@/lib/zoom";

// Pull from Google at most this often when the page is opened; the Sync button in
// Settings forces one any time.
const AUTO_PULL_MS = 5 * 60 * 1000;

export default async function CalendarPage() {
  const google = await googleStatus();
  if (google.connected) {
    // eslint-disable-next-line react-hooks/purity -- server component, renders once per request
    const nowMs = Date.now();
    const last = google.lastSyncedAt ? new Date(google.lastSyncedAt).getTime() : 0;
    if (nowMs - last > AUTO_PULL_MS) await pullEvents();
  }

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
        zoomReady={zoomConfigured()}
      />
    </div>
  );
}
