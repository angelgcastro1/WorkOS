import { Database, Sparkles, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { getProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { seedSampleData, signOut } from "@/app/actions";

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
