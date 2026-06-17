# WorkOS — Personal Command Center

A Notion-style productivity dashboard for managing projects, tasks, notes, and analytics — built for a creative freelancer + active job search. This is **v1: Personal Work Dashboard** with realistic placeholder data, structured so a Supabase database drops in as the next step.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Recharts · lucide-react. Designed to deploy on Vercel.

## What's inside

- **Dashboard** (`/`) — KPI cards (tasks done, active projects, applications, leads, portfolio visits, income), weekly progress chart, active projects with progress bars, income-goal tracker, AI suggestions, today's focus, upcoming deadlines, recent notes, and an activity feed.
- **Projects** (`/projects`) — cards with status, priority, category, deadline, and progress.
- **Tasks** (`/tasks`) — kanban board across To do / In progress / Blocked / Done.
- **Metrics** (`/metrics`) — analytics: weekly trend, monthly income vs goal, creative output by type, tasks-by-status donut, and the job-search funnel.
- **Notes** (`/notes`) — knowledge base for ideas, meetings, client notes, SOPs, and AI prompts.
- **Settings** (`/settings`) and a **Login** screen (`/login`).
- Dark/light mode, responsive layout, smooth entrance animations.

## Run it locally

Requires Node 18.18+ (you have Node 22).

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel (recommended)

No environment variables are needed for v1 — it runs on placeholder data.

**Option A — GitHub + Vercel (no terminal):**

1. Create a new repo on GitHub and push this folder to it.
2. Go to https://vercel.com/new, import the repo, and click **Deploy**.
3. Vercel auto-detects Next.js, runs `npm install` + `npm run build`, and gives you a live URL.

**Option B — Vercel CLI:**

```bash
npm i -g vercel
vercel          # follow the prompts; accept the Next.js defaults
vercel --prod   # promote to a production URL
```

## Editing your data

All content lives in **`src/lib/data.ts`** — projects, tasks, notes, contacts, metrics, and chart series. Change the numbers and items there and the whole UI (cards, charts, lists) updates. The TypeScript types in that file double as the shape of your future database tables.

## Next step: make it real with Supabase

To turn placeholder data into a live, multi-device database with login:

1. Create a free project at https://supabase.com.
2. `npm install @supabase/supabase-js @supabase/ssr`.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local` (and to Vercel's project settings).
4. Create tables matching the types in `src/lib/data.ts` (projects, tasks, notes, contacts).
5. Replace the imports from `src/lib/data.ts` with Supabase queries, and add Supabase Auth for the login page.

## Project structure

```
src/
  app/
    layout.tsx          App shell + theme
    page.tsx            Dashboard
    projects/ tasks/ metrics/ notes/ settings/ login/
    globals.css         Tailwind v4 theme tokens (dark + light)
  components/
    app-shell.tsx       Sidebar + header
    charts.tsx          Recharts components
    theme-toggle.tsx    Dark/light switch
    ui.tsx              Card / Badge / Progress + status styles
  lib/
    data.ts             ← all placeholder data + types
    utils.ts            cn(), formatting helpers
```

## Notes

- Tailwind v4 uses CSS-first config — theme tokens are defined in `src/app/globals.css` (`@theme`), not a `tailwind.config.js`.
- The code passes `tsc --noEmit` (types) and ESLint clean. Vercel builds it with Next's native toolchain.
