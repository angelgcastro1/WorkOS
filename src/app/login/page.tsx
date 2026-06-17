import Link from "next/link";
import { ArrowRight } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white shadow-lg shadow-indigo-500/40">
            W
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Welcome to WorkOS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your personal command center</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
            <input className={inputClass} type="email" placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</label>
            <input className={inputClass} type="password" placeholder="••••••••" />
          </div>
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            Sign in <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
          >
            Continue with Google
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          No account?{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
