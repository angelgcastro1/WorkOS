import { getWorkspace } from "@/lib/queries";
import { RemindersClient } from "@/components/reminders-client";

export default async function RemindersPage() {
  const { reminders } = await getWorkspace();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Reminders</h1>
        <p className="text-sm text-muted-foreground">Time-based nudges. Alerts pop up while WorkCham is open in your browser.</p>
      </header>
      <RemindersClient reminders={reminders} />
    </div>
  );
}
