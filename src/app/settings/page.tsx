import { Database, Sparkles, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { getProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { seedSampleData, signOut, updateBusinessInfo } from "@/app/actions";

const fieldClass =
  "w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

export default async function SettingsPage() {
  const profile = await getProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const initials = profile?.name?.trim()?.[0]?.toUpperCase() ?? "W";

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Your account, appearance, and workspace data.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {initials}
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">{profile?.name ?? "You"}</p>
            <p className="text-xs text-muted-foreground">{profile?.role ?? "Member"}</p>
            <p className="text-xs text-muted-foreground">{user?.email ?? ""}</p>
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
          <CardTitle>Business details</CardTitle>
          <span className="text-xs text-muted-foreground">Shown as the “From” on your invoices</span>
        </CardHeader>
        <CardContent>
          <form action={updateBusinessInfo} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Business name</label>
              <input name="business_name" defaultValue={profile?.businessName ?? ""} placeholder="e.g. Cham Media" className={fieldClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Business email</label>
              <input name="business_email" defaultValue={profile?.businessEmail ?? ""} placeholder="you@business.com" className={fieldClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Address</label>
              <textarea name="business_address" defaultValue={profile?.businessAddress ?? ""} rows={2} placeholder="Street, City, Country" className={`${fieldClass} resize-y`} />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
              >
                Save business details
              </button>
            </div>
          </form>
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
                <p className="text-xs text-emerald-400">Connected — your data is private to your account.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-violet-400" />
              <div>
                <p className="text-sm font-medium">Load sample data</p>
                <p className="text-xs text-muted-foreground">Adds a starter set if your workspace is empty.</p>
              </div>
            </div>
            <form action={seedSampleData}>
              <button
                type="submit"
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
              >
                Load
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Sign out</p>
                <p className="text-xs text-muted-foreground">End your session on this device.</p>
              </div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
              >
                Sign out
              </button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
