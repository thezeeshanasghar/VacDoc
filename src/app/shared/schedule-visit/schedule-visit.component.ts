import { Component, Input } from '@angular/core';
import { today, formatInstant, nowInstant } from '../time';

// "Schedule visit" row of the assign dialogs (PA_DAILY_ROUTE_SPEC.md v3.1). Collapsed by default so
// the at-clinic assign stays one tap. The parent owns the model object and sends it with the assignment;
// the date is the dialog's existing Target Date field, not a second one.
export interface ScheduleVisitModel { on: boolean; windowStart: string; windowMinutes: number; area: string; }

export function emptyVisit(): ScheduleVisitModel { return { on: false, windowStart: '', windowMinutes: 60, area: '' }; }

// Fields the API expects, or an empty object for an at-clinic assignment.
export function visitPayload(m: ScheduleVisitModel): any {
  if (!m || !m.on) { return {}; }
  return { IsScheduledVisit: true, WindowStart: m.windowStart || null, WindowMinutes: m.windowMinutes, Area: (m.area || '').trim() || null };
}

@Component({
  selector: 'app-schedule-visit',
  templateUrl: './schedule-visit.component.html',
  styleUrls: ['./schedule-visit.component.scss']
})
export class ScheduleVisitComponent {
  @Input() model: ScheduleVisitModel;
  // The dialog's Target Date (yyyy-MM-dd) and whether the assignment is a home booking (always scheduled).
  @Input() date: string;
  @Input() forced = false;

  lengths = [
    { v: 15, t: '15 min' }, { v: 30, t: '30 min' }, { v: 45, t: '45 min' }, { v: 60, t: '1 hour' },
    { v: 90, t: '1.5 hours' }, { v: 120, t: '2 hours' }, { v: 180, t: '3 hours' }, { v: 240, t: '4 hours' }
  ];

  get recentAreas(): string[] {
    try { return JSON.parse(localStorage.getItem('routeAreas') || '[]'); } catch (e) { return []; }
  }

  get open(): boolean { return this.model.on || this.forced; }

  toggle() {
    if (this.forced) { return; }
    this.model.on = !this.model.on;
    if (this.model.on) { this.fillDefaults(); }
  }

  // R4 (simplified): next full hour if the date is today, otherwise 09:00. The server still validates.
  fillDefaults() {
    this.model.on = true;
    if (this.model.windowStart) { return; }
    if (!this.date || this.date <= today()) {
      const h = Number(formatInstant(nowInstant(), 'HH')) + 1;
      this.model.windowStart = h > 22 ? '' : (h < 10 ? '0' + h : '' + h) + ':00';
    } else {
      this.model.windowStart = '09:00';
    }
  }

  ngOnChanges() { if (this.forced && !this.model.on) { this.fillDefaults(); } }

  pickArea(a: string) { this.model.area = a; }
}

// Remember an area for the chips (call after a successful assign).
export function rememberArea(area: string) {
  const a = (area || '').trim();
  if (!a) { return; }
  try {
    const list: string[] = JSON.parse(localStorage.getItem('routeAreas') || '[]').filter((x: string) => x !== a);
    list.unshift(a);
    localStorage.setItem('routeAreas', JSON.stringify(list.slice(0, 8)));
  } catch (e) { }
}
