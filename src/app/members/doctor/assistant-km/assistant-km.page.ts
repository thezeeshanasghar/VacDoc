import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { PaLocationService } from 'src/app/services/pa-location.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { addDays, formatDay, monthStart, parseDay } from 'src/app/shared/time';

function isDay(v: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(v || '') && !!parseDay(v); }

// Doctor report: km travelled per assistant per day (computed server-side from shift GPS fixes).
@Component({
  selector: 'app-assistant-km',
  templateUrl: './assistant-km.page.html',
  styleUrls: ['./assistant-km.page.scss'],
})
export class AssistantKmPage {
  doctorId: number = null;
  range: 'week' | 'month' | 'custom' = 'month';
  from = '';
  to = '';
  days: string[] = [];
  assistants: any[] = [];
  loading = true;
  serverToday = '';
  private tok = 0;

  constructor(
    private locationService: PaLocationService,
    private storage: Storage,
    private toastService: ToastService,
    private router: Router,
  ) {}

  async ionViewWillEnter() {
    this.doctorId = Number(await this.storage.get(environment.DOCTOR_Id));
    await this.setRange(this.range);
  }

  ionViewWillLeave() { this.tok++; }

  // "Today" comes from the server (Pakistan day), never from the phone clock.
  private async ensureToday(): Promise<boolean> {
    if (this.serverToday) { return true; }
    try {
      const res: any = await this.locationService.getKm(this.doctorId).toPromise();
      if (res && isDay(res.serverTodayPkt)) { this.serverToday = res.serverTodayPkt; return true; }
    } catch (e) { /* toast below */ }
    this.toastService.create('Could not load the KM report', 'danger');
    this.loading = false;
    return false;
  }

  async setRange(r: 'week' | 'month' | 'custom') {
    this.range = r;
    if (r === 'custom') { return; }
    if (!(await this.ensureToday())) { return; }
    const today = this.serverToday;
    this.to = today;
    this.from = r === 'week' ? addDays(today, -6) : monthStart(today);
    await this.load();
  }

  async load() {
    if (!isDay(this.from) || !isDay(this.to)) { this.toastService.create('Choose a valid date range', 'danger'); return; }
    const tok = ++this.tok;
    this.loading = true;
    try {
      const res: any = await this.locationService.getKm(this.doctorId, this.from, this.to).toPromise();
      if (tok !== this.tok) { return; }
      if (res && isDay(res.serverTodayPkt)) { this.serverToday = res.serverTodayPkt; }
      this.days = res.days || [];
      this.assistants = res.assistants || [];
    } catch (e) {
      if (tok !== this.tok) { return; }
      this.days = []; this.assistants = [];
      this.toastService.create((e && e.error && e.error.message) || 'Could not load the KM report', 'danger');
    } finally {
      if (tok === this.tok) { this.loading = false; }
    }
  }

  dayLabel(d: string): string { return formatDay(d, 'EEE d'); }

  showCell(c: any): boolean { return !!(c.noGps || c.shifts || c.fixes); }

  // Sums in whole tenths of a km so nothing drifts from the server's one-decimal cell values.
  dayTotal(d: string): number {
    return this.assistants.reduce((s, a) => {
      const c = a.cells.find(x => x.date === d);
      return s + (c ? Math.round(c.km * 10) : 0);
    }, 0) / 10;
  }

  grandTotal(): number {
    return this.assistants.reduce((s, a) => s + Math.round(a.totalKm * 10), 0) / 10;
  }

  openDay(a: any, c: any) {
    if (!this.showCell(c) || c.noGps) { return; }
    this.router.navigate(['/members/doctor/assistant-locations'], { queryParams: { paId: a.paId, date: c.date } });
  }

  exportCsv() {
    // Quote everything; neutralise spreadsheet formulas (= + - @) with a leading apostrophe.
    const q = (v: any) => {
      let t = String(v === null || v === undefined ? '' : v);
      if (/^[=+\-@]/.test(t)) { t = "'" + t; }
      return `"${t.replace(/"/g, '""')}"`;
    };
    const gapDays = (a: any) => a.cells.filter(c => c.gaps).length;
    const cell = (c: any) => c.noGps ? 'No GPS' : (c.shifts || c.km ? c.km : '');
    const rows = [['Assistant', ...this.days, 'Total km', 'Shift days', 'Avg km/day', 'Days with GPS gaps'].map(q).join(',')];
    this.assistants.forEach(a => rows.push([a.name, ...a.cells.map(cell), a.totalKm, a.shiftDays, a.avgKm, gapDays(a)].map(q).join(',')));
    rows.push(['All assistants', ...this.days.map(d => this.dayTotal(d)), this.grandTotal(), '', '', this.assistants.reduce((s, a) => s + gapDays(a), 0)].map(q).join(','));
    const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `assistant-km_${this.from}_${this.to}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
