
// Zoom meeting creation via a Server-to-Server OAuth app.
//
// Server-to-Server means there is no "sign in with Zoom" dance: WorkCham holds three
// values from your own Zoom account and asks Zoom for a short-lived token whenever it
// needs one. Nothing to re-authorise, nothing to expire.

const TOKEN_URL = "https://zoom.us/oauth/token";
const API = "https://api.zoom.us/v2";

export function zoomConfigured(): boolean {
  return Boolean(process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET);
}

async function token(): Promise<string> {
  const basic = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${TOKEN_URL}?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Zoom refused the credentials (${res.status}).`);
  const j = (await res.json()) as { access_token: string };
  return j.access_token;
}

export type ZoomMeeting = { joinUrl: string; meetingId: string };

/**
 * Schedules a Zoom meeting. `date` is YYYY-MM-DD, `start` is HH:MM (or null for a
 * meeting with no fixed time), `timeZone` is an IANA name like America/New_York.
 */
export async function createMeeting(opts: {
  topic: string;
  date: string;
  start: string | null;
  end: string | null;
  timeZone: string;
}): Promise<ZoomMeeting> {
  const t = await token();

  let duration = 60;
  if (opts.start && opts.end) {
    const [sh, sm] = opts.start.split(":").map(Number);
    const [eh, em] = opts.end.split(":").map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    if (mins > 0) duration = mins;
  }

  const body: Record<string, unknown> = {
    topic: opts.topic || "WorkCham meeting",
    type: opts.start ? 2 : 1, // 2 = scheduled, 1 = instant
    duration,
    timezone: opts.timeZone,
    settings: { join_before_host: true, waiting_room: false },
  };
  if (opts.start) body.start_time = `${opts.date}T${opts.start}:00`;

  const res = await fetch(`${API}/users/me/meetings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Zoom could not create the meeting (${res.status}).`);
  const j = (await res.json()) as { join_url: string; id: number };
  return { joinUrl: j.join_url, meetingId: String(j.id) };
}
