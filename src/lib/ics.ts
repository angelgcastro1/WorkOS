// Minimal iCalendar (.ics) parser used by the in-app "Import calendar" button.
// Converts each event's time (UTC or TZID) to America/New_York wall time.

const TZ = "America/New_York";

export type ParsedIcsEvent = {
  uid: string;
  title: string;
  allDay: boolean;
  date: string; // YYYY-MM-DD (local)
  startTime: string | null; // HH:MM:SS or null (all-day)
  endTime: string | null;
  notes: string | null;
  link: string | null;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function localPartsFromMs(ms: number): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  let hh = g("hour");
  if (hh === "24") hh = "00";
  return { date: `${g("year")}-${g("month")}-${g("day")}`, time: `${hh}:${g("minute")}:00` };
}

function tzOffsetMs(ms: number, tz: string): number {
  try {
    const p = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(new Date(ms));
    const m: Record<string, string> = {};
    for (const x of p) m[x.type] = x.value;
    let H = +m.hour;
    if (H === 24) H = 0;
    const asUTC = Date.UTC(+m.year, +m.month - 1, +m.day, H, +m.minute, +m.second);
    return asUTC - ms;
  } catch {
    return 0;
  }
}

function zonedWallToUtcMs(y: number, mo: number, d: number, h: number, mi: number, tz: string): number {
  const naive = Date.UTC(y, mo - 1, d, h, mi, 0);
  return naive - tzOffsetMs(naive, tz);
}

type Dt = { allDay: boolean; date: string; time: string | null };

function parseDt(value: string, tzid: string | null, isDateParam: boolean): Dt | null {
  if (!value) return null;
  const z = value.endsWith("Z");
  const s = z ? value.slice(0, -1) : value;
  if (isDateParam || !s.includes("T")) {
    return { allDay: true, date: `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`, time: null };
  }
  const y = +s.slice(0, 4), mo = +s.slice(4, 6), d = +s.slice(6, 8), h = +s.slice(9, 11), mi = +s.slice(11, 13);
  if (Number.isNaN(y) || Number.isNaN(h)) return null;
  let utcMs: number;
  if (z) utcMs = Date.UTC(y, mo - 1, d, h, mi, 0);
  else if (tzid) utcMs = zonedWallToUtcMs(y, mo, d, h, mi, tzid);
  else return { allDay: false, date: `${pad(y)}-${pad(mo)}-${pad(d)}`, time: `${pad(h)}:${pad(mi)}:00` };
  const loc = localPartsFromMs(utcMs);
  return { allDay: false, date: loc.date, time: loc.time };
}

function unescapeText(s: string): string {
  return s.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\").trim();
}

function firstUrl(text?: string): string | null {
  if (!text) return null;
  const m = text.match(/https?:\/\/[^\s"'<>]+/);
  return m ? m[0] : null;
}

export function parseIcsEvents(icsText: string): ParsedIcsEvent[] {
  if (!icsText || !icsText.includes("BEGIN:VEVENT")) return [];
  const unfolded = icsText.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r\n|\n|\r/);

  const out: ParsedIcsEvent[] = [];
  let cur: Record<string, string> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") { cur = {}; continue; }
    if (line === "END:VEVENT") {
      if (cur) out.push(buildEvent(cur));
      cur = null;
      continue;
    }
    if (!cur) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const keyPart = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const semi = keyPart.indexOf(";");
    const name = (semi === -1 ? keyPart : keyPart.slice(0, semi)).toUpperCase();
    const params = semi === -1 ? "" : keyPart.slice(semi + 1);
    if (name === "DTSTART" || name === "DTEND") {
      cur[name] = value;
      cur[name + "__TZID"] = /TZID=([^;:]+)/i.exec(params)?.[1] ?? "";
      cur[name + "__DATE"] = /VALUE=DATE/i.test(params) ? "1" : "";
    } else if (!(name in cur)) {
      cur[name] = value;
    }
  }
  return out.filter((e): e is ParsedIcsEvent => e !== null && !!e.uid && !!e.date);
}

function buildEvent(e: Record<string, string>): ParsedIcsEvent {
  const start = e["DTSTART"] ? parseDt(e["DTSTART"], e["DTSTART__TZID"] || null, e["DTSTART__DATE"] === "1") : null;
  const end = e["DTEND"] ? parseDt(e["DTEND"], e["DTEND__TZID"] || null, e["DTEND__DATE"] === "1") : null;
  const cancelled = (e["STATUS"] ?? "").toUpperCase() === "CANCELLED";
  return {
    uid: e["UID"] ? `ics:${e["UID"]}` : "",
    title: e["SUMMARY"] ? unescapeText(e["SUMMARY"]).slice(0, 300) : "(Untitled event)",
    allDay: start ? start.allDay : true,
    date: start ? start.date : "",
    startTime: start && !start.allDay ? start.time : null,
    endTime: end && !end.allDay ? end.time : null,
    notes: e["DESCRIPTION"] ? unescapeText(e["DESCRIPTION"]).slice(0, 2000) : null,
    link: firstUrl(e["URL"]) || firstUrl(e["LOCATION"]) || firstUrl(e["DESCRIPTION"]),
    // cancelled events still parse but callers can ignore; keep uid empty to drop
    ...(cancelled ? { uid: "" } : {}),
  };
}
