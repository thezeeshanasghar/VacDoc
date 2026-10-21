// TIMESTAMP_SPEC: the one time contract. This file is byte-identical in VacDoc, VacParent, VacAgent
// and VacAdmin (VacDoc's copy is canonical; scripts/check-time.sh enforces it).
//
//  Instant : a moment, UTC on the wire with Z      -> Date  via parseInstant, shown with formatInstant / | instant
//  Day     : a calendar date, no zone, never shifted -> 'yyyy-MM-dd' string via parseDay, shown with formatDay / | day
//  today() : the current day in the app zone, never the device zone and never UTC
//
// Every user sees Pakistan time. The zone name appears here and nowhere else.
import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@angular/common';

let ZONE = 'Asia/Karachi';

// Later called once at login for users with their own zone. Pakistan needs no call.
export function setZone(z: string): void { if (z) { ZONE = z; } }
export function getZone(): string { return ZONE; }

function p2(n: number): string { return n < 10 ? '0' + n : '' + n; }

// ---------- instants ----------

// Parses an API instant. "Z" and offsets are honoured; a bare date-time is read as UTC (the DB stores UTC).
export function parseInstant(v: any): Date {
  if (v === null || v === undefined || v === '') { return null; }
  if (v instanceof Date) { return isNaN(v.getTime()) ? null : v; }
  const s = String(v);
  const hasZone = /Z$|[+-]\d\d:?\d\d$/.test(s);
  const d = new Date(!hasZone && /T\d\d:\d\d/.test(s) ? s + 'Z' : s); // time-ok
  return isNaN(d.getTime()) ? null : d;
}

export function nowInstant(): Date { return new Date(); } // time-ok

// '+0500' style offset of the app zone at the given instant.
function offsetOf(d: Date): string {
  if (ZONE === 'Asia/Karachi') { return '+0500'; }
  const parts = new Intl.DateTimeFormat('en-US', { // time-ok
    timeZone: ZONE, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(d);
  const g = (t: string) => parseInt(parts.filter(x => x.type === t)[0].value, 10);
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'), g('second'));
  const mins = Math.round((asUtc - Math.floor(d.getTime() / 1000) * 1000) / 60000);
  const a = Math.abs(mins);
  return (mins < 0 ? '-' : '+') + p2(Math.floor(a / 60)) + p2(a % 60);
}

// Angular date format (e.g. 'dd MMM yyyy, h:mm a') of an instant in the app zone. '' when empty.
export function formatInstant(v: any, fmt: string): string {
  const d = parseInstant(v);
  return d ? formatDate(d, fmt, 'en-US', offsetOf(d)) : '';
}

// The calendar day of an instant in the app zone.
export function dayOf(v: any): string {
  const d = parseInstant(v);
  return d ? formatDate(d, 'yyyy-MM-dd', 'en-US', offsetOf(d)) : null;
}

// ---------- days ----------

// Reads the literal calendar part of a day value and never converts zones.
// Accepts yyyy-MM-dd, yyyy-MM-ddTHH:mm..., dd-MM-yyyy, dd/MM/yyyy and ion-datetime values.
export function parseDay(v: any): string {
  if (v === null || v === undefined || v === '') { return null; }
  if (v instanceof Date) { return dayFromPicker(v); } // a Date in the day role is always a picker's local midnight
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  let y: number, mo: number, d: number;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; } else {
    m = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/.exec(s);
    if (!m) { return null; }
    d = +m[1]; mo = +m[2]; y = +m[3];
  }
  if (mo < 1 || mo > 12 || d < 1 || d > 31) { return null; }
  return ('000' + y).slice(-4) + '-' + p2(mo) + '-' + p2(d);
}

// A Date produced by a date picker (mat-datepicker / native date input) is local midnight of the picked
// day, so the picked day is its LOCAL calendar part, not the app-zone day of that instant.
export function dayFromPicker(d: any): string {
  if (!(d instanceof Date) || isNaN(d.getTime())) { return d instanceof Date ? null : parseDay(d); }
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); // time-ok
}

// Inverse of dayFromPicker: the local-midnight Date a date picker needs to show the given day.
export function pickerDate(day: any): Date {
  const p = parseDay(day);
  return p ? new Date(+p.substring(0, 4), +p.substring(5, 7) - 1, +p.substring(8, 10)) : null; // time-ok
}

export function today(): string { return dayOf(nowInstant()); }

function toUtcMs(day: string): number {
  const p = parseDay(day);
  return p ? Date.UTC(+p.substring(0, 4), +p.substring(5, 7) - 1, +p.substring(8, 10)) : NaN;
}

export function addDays(day: string, n: number): string {
  const ms = toUtcMs(day);
  if (isNaN(ms)) { return null; }
  const d = new Date(ms + n * 86400000);
  return d.getUTCFullYear() + '-' + p2(d.getUTCMonth() + 1) + '-' + p2(d.getUTCDate());
}

// Calendar months, clamped to the month end (Jan 31 + 1 month = Feb 28), like C# AddMonths.
export function addMonths(day: string, n: number): string {
  const p = parseDay(day);
  if (!p) { return null; }
  const total = (+p.substring(0, 4)) * 12 + (+p.substring(5, 7) - 1) + n;
  const y = Math.floor(total / 12);
  const m = total - y * 12;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const d = Math.min(+p.substring(8, 10), last);
  return ('000' + y).slice(-4) + '-' + p2(m + 1) + '-' + p2(d);
}

export function addYears(day: string, n: number): string { return addMonths(day, n * 12); }

// a - b in whole days
export function diffDays(a: string, b: string): number {
  return Math.round((toUtcMs(a) - toUtcMs(b)) / 86400000);
}

export function monthStart(day: string): string {
  const p = parseDay(day);
  return p ? p.substring(0, 8) + '01' : null;
}

// 0 = Sunday
export function weekdayOf(day: string): number {
  const ms = toUtcMs(day);
  return isNaN(ms) ? -1 : new Date(ms).getUTCDay();
}

export function toApiDay(day: any): string { return parseDay(day); }

export function toLegacyDay(day: any): string {
  const p = parseDay(day);
  return p ? p.substring(8, 10) + '-' + p.substring(5, 7) + '-' + p.substring(0, 4) : null;
}

// Angular date format of a day. A day has no time, so there is no zone to apply.
export function formatDay(v: any, fmt: string): string {
  const p = parseDay(v);
  if (!p) { return ''; }
  return formatDate(new Date(toUtcMs(p) + 12 * 3600000), fmt, 'en-US', '+0000');
}

// ---------- pipes ----------

@Pipe({ name: 'instant' })
export class InstantPipe implements PipeTransform {
  transform(v: any, fmt?: string): string { return formatInstant(v, fmt || 'dd MMM yyyy, h:mm a'); }
}

@Pipe({ name: 'day' })
export class DayPipe implements PipeTransform {
  transform(v: any, fmt?: string): string { return formatDay(v, fmt || 'dd MMM yyyy'); }
}
