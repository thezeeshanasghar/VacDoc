import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { PaLocationService } from 'src/app/services/pa-location.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

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

  private todayPkt(): Date {
    const d = new Date(Date.now() + 5 * 3600 * 1000);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  private iso(d: Date): string { return d.toISOString().substring(0, 10); }

  async setRange(r: 'week' | 'month' | 'custom') {
    this.range = r;
    const today = this.todayPkt();
    if (r === 'week') {
      this.to = this.iso(today);
      this.from = this.iso(new Date(today.getTime() - 6 * 86400000));
    } else if (r === 'month') {
      this.to = this.iso(today);
      this.from = this.iso(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)));
    }
    await this.load();
  }

  async load() {
    this.loading = true;
    try {
      const res: any = await this.locationService.getKm(this.doctorId, this.from, this.to).toPromise();
      this.days = res.days || [];
      this.assistants = res.assistants || [];
    } catch (e) {
      this.days = []; this.assistants = [];
      this.toastService.create((e && e.error && e.error.message) || 'Could not load the KM report', 'danger');
    } finally {
      this.loading = false;
    }
  }

  dayLabel(d: string): string {
    const dt = new Date(d + 'T00:00:00Z');
    return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
  }

  dayTotal(d: string): number {
    return Math.round(this.assistants.reduce((s, a) => s + (a.cells.find(c => c.date === d) || { km: 0 }).km, 0) * 10) / 10;
  }

  grandTotal(): number {
    return Math.round(this.assistants.reduce((s, a) => s + a.totalKm, 0) * 10) / 10;
  }

  openDay(a: any, c: any) {
    if (!c.shifts && !c.fixes) { return; }
    this.router.navigate(['/members/doctor/assistant-locations'], { queryParams: { paId: a.paId, date: c.date } });
  }

  exportCsv() {
    const q = (v: any) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [['Assistant', ...this.days, 'Total km', 'Shift days', 'Avg km/day'].map(q).join(',')];
    this.assistants.forEach(a => rows.push([a.name, ...a.cells.map(c => c.shifts || c.km ? c.km : ''), a.totalKm, a.shiftDays, a.avgKm].map(q).join(',')));
    rows.push(['All assistants', ...this.days.map(d => this.dayTotal(d)), this.grandTotal(), '', ''].map(q).join(','));
    const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `assistant-km_${this.from}_${this.to}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
