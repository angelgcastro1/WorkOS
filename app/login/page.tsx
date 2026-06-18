import { ArrowRight } from "lucide-react";
import { login, signup } from "@/app/login/actions";

const inputClass =
  "w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white shadow-lg shadow-indigo-500/40">
            W
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Welcome to WorkCham</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your personal command center</p>
        </div>

        <form className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {sp.error ? (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{sp.error}</p>
          ) : null}
          {sp.message ? (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{sp.message}</p>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
            <input className={inputClass} type="email" name="email" required placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</label>
            <input className={inputClass} type="password" name="password" required minLength={6} placeholder="••••••••" />
          </div>

          <button
            formAction={login}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            Sign in <ArrowRight className="h-4 w-4" />
          </button>
          <button
            formAction={signup}
            className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
          >
            Create account
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          First time here? Use <span className="font-medium text-foreground">Create account</span> with any email and a 6+ character password.
        </p>
      </div>
    </div>
  );
}
