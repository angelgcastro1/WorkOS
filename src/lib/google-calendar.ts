import { createClient } from "@/lib/supabase/server";

// Google Calendar two-way sync.
//
// How the two directions work:
//   WorkCham -> Google   happens the moment you save, straight from the event actions.
//   Google -> WorkCham   happens on a pull (the Sync button, or when the calendar page
//                        loads and the last pull is stale).
// Events carry `google_event_id` so the two copies stay matched up, and `origin` records
// which side created them.

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/calendar/v3";
const SCOPE = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly openid email";

export type GoogleStatus = {
  connected: boolean;
  email: string | null;
  lastSyncedAt: string | null;
  timeZone: string | null;
};

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(origin: string): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? origin}/api/google/callback`;
}

export function consentUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${p.toString()}`;
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number };

export async function exchangeCode(code: string, origin: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return (await res.json()) as TokenResponse;
}

async function refresh(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`);
  return (await res.json()) as TokenResponse;
}

type Row = {
  user_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  account_email: string | null;
  time_zone: string | null;
  last_synced_at: string | null;
};

/** Returns a usable access token, refreshing it first if it is close to expiring. */
async function activeToken(): Promise<{ token: string; row: Row } | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("integrations").select("*").eq("provider", "google").maybeSingle();
  const row = data as Row | null;
  if (!row?.refresh_token) return null;

  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (row.access_token && expiresAt - Date.now() > 60_000) return { token: row.access_token, row };

  const fresh = await refresh(row.refresh_token);
  const nextExpiry = new Date(Date.now() + fresh.expires_in * 1000).toISOString();
  await supabase
    .from("integrations")
    .update({ access_token: fresh.access_token, expires_at: nextExpiry, updated_at: new Date().toISOString() })
    .eq("user_id", row.user_id)
    .eq("provider", "google");
  return { token: fresh.access_token, row };
}

export async function googleStatus(): Promise<GoogleStatus> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("integrations")
    .select("account_email, last_synced_at, time_zone, refresh_token")
    .eq("provider", "google")
    .maybeSingle();
  const row = data as { account_email: string | null; last_synced_at: string | null; time_zone: string | null; refresh_token: string | null } | null;
  return {
    connected: Boolean(row?.refresh_token),
    email: row?.account_email ?? null,
    lastSyncedAt: row?.last_synced_at ?? null,
    timeZone: row?.time_zone ?? null,
  };
}

async function api(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  return res;
}

export async function primaryTimeZone(token: string): Promise<string> {
  const res = await api(token, "/calendars/primary");
  if (!res.ok) return "UTC";
  const cal = (await res.json()) as { timeZone?: string };
  return cal.timeZone ?? "UTC";
}

export async function accountEmail(token: string): Promise<string | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const me = (await res.json()) as { email?: string };
  return me.email ?? null;
}

// ---- shape conversion -------------------------------------------------------

export type LocalEvent = {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  meeting_link: string | null;
  google_event_id: string | null;
};

type GoogleEvent = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  hangoutLink?: string;
  updated?: string;
  location?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
};

function localDatePart(dt: string): string {
  return dt.slice(0, 10);
}

function localTimePart(dt: string): string | null {
  // "2026-08-14T15:30:00-04:00" -> "15:30"
  const m = /T(\d{2}:\d{2})/.exec(dt);
  return m ? m[1] : null;
}

function toGoogleBody(ev: LocalEvent, timeZone: string) {
  const allDay = !ev.start_time;
  const endDate = ev.event_date;
  return {
    summary: ev.title,
    description: ev.notes ?? undefined,
    location: ev.meeting_link ?? undefined,
    start: allDay
      ? { date: ev.event_date }
      : { dateTime: `${ev.event_date}T${ev.start_time}:00`, timeZone },
    end: allDay
      ? { date: endDate }
      : { dateTime: `${endDate}T${ev.end_time ?? ev.start_time}:00`, timeZone },
  };
}

// ---- WorkCham -> Google -----------------------------------------------------

/** Best effort: a failure here must never block saving the event in WorkCham. */
export async function pushEvent(ev: LocalEvent): Promise<string | null> {
  try {
    const active = await activeToken();
    if (!active) return null;
    const tz = active.row.time_zone ?? (await primaryTimeZone(active.token));
    const body = JSON.stringify(toGoogleBody(ev, tz));

    if (ev.google_event_id) {
      const res = await api(active.token, `/calendars/primary/events/${encodeURIComponent(ev.google_event_id)}`, { method: "PATCH", body });
      return res.ok ? ev.google_event_id : null;
    }
    const res = await api(active.token, "/calendars/primary/events", { method: "POST", body });
    if (!res.ok) return null;
    const created = (await res.json()) as { id: string };
    return created.id;
  } catch {
    return null;
  }
}

export async function deleteRemoteEvent(googleEventId: string): Promise<void> {
  try {
    const active = await activeToken();
    if (!active) return;
    await api(active.token, `/calendars/primary/events/${encodeURIComponent(googleEventId)}`, { method: "DELETE" });
  } catch {
    // the event is already gone from WorkCham; a stale Google copy is not worth failing over
  }
}

// ---- Google -> WorkCham -----------------------------------------------------

export type PullResult = { ok: boolean; added: number; updated: number; removed: number; error?: string };

export async function pullEvents(): Promise<PullResult> {
  const active = await activeToken();
  if (!active) return { ok: false, added: 0, updated: 0, removed: 0, error: "Google is not connected." };

  const supabase = await createClient();
  const now = new Date();
  const timeMin = new Date(now.getTime() - 45 * 86400000).toISOString();
  const timeMax = new Date(now.getTime() + 365 * 86400000).toISOString();

  let added = 0;
  let updated = 0;
  let removed = 0;
  let pageToken: string | undefined;

  try {
    do {
      const q = new URLSearchParams({ timeMin, timeMax, singleEvents: "true", maxResults: "250", showDeleted: "true" });
      if (pageToken) q.set("pageToken", pageToken);
      const res = await api(active.token, `/calendars/primary/events?${q.toString()}`);
      if (!res.ok) return { ok: false, added, updated, removed, error: `Google said: ${res.status}` };
      const page = (await res.json()) as { items?: GoogleEvent[]; nextPageToken?: string };
      pageToken = page.nextPageToken;

      for (const g of page.items ?? []) {
        const { data: existing } = await supabase
          .from("events")
          .select("id, origin")
          .eq("user_id", active.row.user_id)
          .eq("google_event_id", g.id)
          .maybeSingle();

        if (g.status === "cancelled") {
          if (existing) {
            await supabase.from("events").delete().eq("id", (existing as { id: string }).id);
            removed++;
          }
          continue;
        }

        const startRaw = g.start?.dateTime ?? g.start?.date;
        if (!startRaw) continue;
        const endRaw = g.end?.dateTime ?? g.end?.date;
        const conference = g.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri;

        const row = {
          title: g.summary ?? "(no title)",
          event_date: localDatePart(startRaw),
          start_time: g.start?.dateTime ? localTimePart(g.start.dateTime) : null,
          end_time: g.end?.dateTime && endRaw ? localTimePart(endRaw) : null,
          notes: g.description ?? null,
          meeting_link: g.hangoutLink ?? conference ?? null,
          google_event_id: g.id,
          google_updated_at: g.updated ?? null,
          synced_at: new Date().toISOString(),
        };

        if (existing) {
          await supabase.from("events").update(row).eq("id", (existing as { id: string }).id);
          updated++;
        } else {
          await supabase.from("events").insert({
            ...row,
            user_id: active.row.user_id,
            type: "meeting",
            origin: "google",
            reminder_channel: "both",
            repeat_rule: "none",
          });
          added++;
        }
      }
    } while (pageToken);

    await supabase
      .from("integrations")
      .update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("user_id", active.row.user_id)
      .eq("provider", "google");

    return { ok: true, added, updated, removed };
  } catch (e) {
    return { ok: false, added, updated, removed, error: e instanceof Error ? e.message : "Sync failed." };
  }
}
