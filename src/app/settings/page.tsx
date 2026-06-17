import { Database, Rocket, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { profile, metrics } from "@/lib/data";
import { formatMoney } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const labelClass = "mb-1.5 block text-xs font-medium text-muted-foreground";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, goals, and workspace.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {profile.initials}
            </div>
            <button type="button" className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:bg-muted">
              Change photo
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Name</label>
              <input className={inputClass} defaultValue={profile.name} />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <input className={inputClass} defaultValue={profile.role} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Email</label>
              <input className={inputClass} defaultValue="angel@studio.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">Switch between dark and light mode.</p>
          </div>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goals</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Monthly income goal</label>
            <input className={inputClass} defaultValue={formatMoney(metrics.incomeGoal)} />
          </div>
          <div>
            <label className={labelClass}>Weekly task target</label>
            <input className={inputClass} defaultValue="20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace &amp; data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium">Supabase database</p>
                <p className="text-xs text-muted-foreground">Not connected — enables login + cloud sync.</p>
              </div>
            </div>
            <button type="button" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
              Connect
            </button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-sky-400" />
              <div>
                <p className="text-sm font-medium">Deploy on Vercel</p>
                <p className="text-xs text-muted-foreground">Push to a live URL on any device.</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">See README</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-violet-400" />
              <div>
                <p className="text-sm font-medium">Export data</p>
                <p className="text-xs text-muted-foreground">Download a JSON backup of your workspace.</p>
              </div>
            </div>
            <button type="button" className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:bg-muted">
              Export
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
