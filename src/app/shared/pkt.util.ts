// Pakistan Standard Time (Asia/Karachi, UTC+5, no DST) helpers. Everything shown to the user goes
// through here, so the device timezone and the device clock never decide what "today" is.
const PKT_MS = 5 * 3600 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Parses an API timestamp. Strings carrying an offset ("+05:00", "Z") are honoured; a bare
// timestamp is taken as Pakistan time.
export function parsePkt(v: any): Date {
  if (v === null || v === undefined || v === '') { return null; }
  if (v instanceof Date) { return isNaN(v.getTime()) ? null : v; }
  const s = String(v);
  const d = new Date(/Z$|[+-]\d\d:?\d\d$/.test(s) ? s : s + '+05:00');
  return isNaN(d.getTime()) ? null : d;
}

function shifted(v: any): Date {
  const d = parsePkt(v);
  return d ? new Date(d.getTime() + PKT_MS) : null; // read with getUTC* = Pakistan wall clock
}

function p2(n: number): string { return n < 10 ? '0' + n : '' + n; }

// 'h:mm a' in Pakistan time, e.g. "3:07 PM"
export function fmtTime(v: any): string {
  const d = shifted(v);
  if (!d) { return ''; }
  const h = d.getUTCHours();
  return ((h % 12) || 12) + ':' + p2(d.getUTCMinutes()) + ' ' + (h < 12 ? 'AM' : 'PM');
}

// 'd MMM' in Pakistan time, e.g. "9 Oct"
export function fmtDate(v: any): string {
  const d = shifted(v);
  return d ? d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] : '';
}

// 'd MMM h:mm a' in Pakistan time, e.g. "9 Oct 3:07 PM"
export function fmtDateTime(v: any): string {
  const d = shifted(v);
  return d ? fmtDate(v) + ' ' + fmtTime(v) : '';
}

// "Mon 5" label for a yyyy-MM-dd day string (pure calendar maths, no timezone involved)
export function dayLabel(day: string): string {
  const d = new Date(day + 'T00:00:00Z');
  return isNaN(d.getTime()) ? day : WEEKDAYS[d.getUTCDay()] + ' ' + d.getUTCDate();
}

export function addDays(day: string, n: number): string {
  const d = new Date(day + 'T00:00:00Z');
  return new Date(d.getTime() + n * 86400000).toISOString().substring(0, 10);
}

export function monthStart(day: string): string { return day.substring(0, 8) + '01'; }

export function isDay(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v || '') && !isNaN(new Date(v + 'T00:00:00Z').getTime());
}
