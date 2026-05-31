import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { DashboardService } from 'src/app/services/dashboard.service';
import { ClinicService } from 'src/app/services/clinic.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-data',
  templateUrl: './data.page.html',
  styleUrls: ['./data.page.scss'],
})
export class DataPage implements OnInit {

  doctorId: any;

  // Filters
  clinics: any[] = [];
  selectedClinicId = 0;  // 0 = all clinics
  fromDate: string;
  toDate: string;
  compareFrom: string;
  compareTo: string;
  customCompare = false;

  // Section 1 — Growth Overview
  current:  any = null;
  previous: any = null;

  // Section 2 — By Clinic
  byClinic: any[] = [];

  // Section 3 — Vaccine Performance
  byVaccine: any[] = [];
  vaccineSort: 'doses' | 'revenue' = 'doses';

  // Section 4 — Monthly Trend
  monthly:     any[] = [];
  monthlyPrev: any[] = [];
  trendMetric: 'revenue' | 'doses' | 'patients' | 'expense' = 'revenue';

  loading = false;
  hasData = false;

  constructor(
    private dashboardService: DashboardService,
    private clinicService: ClinicService,
    private loadingCtrl: LoadingController,
    private storage: Storage
  ) {
    const now   = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    this.fromDate    = this.fmt(first);
    this.toDate      = this.fmt(now);
    this.compareFrom = this.fmt(new Date(first.getFullYear() - 1, first.getMonth(), 1));
    this.compareTo   = this.fmt(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));
  }

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    await this.loadClinics();
    await this.load();
  }

  async loadClinics() {
    this.clinicService.getClinics(Number(this.doctorId)).subscribe({
      next: (res: any) => {
        if (res && res.IsSuccess) this.clinics = res.ResponseData || [];
      },
      error: () => {}
    });
  }

  async load() {
    if (!this.fromDate || !this.toDate) return;

    // Auto-set compare dates unless user customised them
    if (!this.customCompare) {
      const f = new Date(this.fromDate);
      const t = new Date(this.toDate);
      this.compareFrom = this.fmt(new Date(f.getFullYear() - 1, f.getMonth(), f.getDate()));
      this.compareTo   = this.fmt(new Date(t.getFullYear() - 1, t.getMonth(), t.getDate()));
    }

    const loader = await this.loadingCtrl.create({ message: 'Loading analytics...' });
    await loader.present();
    this.loading = true;

    this.dashboardService.getAdvancedAnalytics(
      Number(this.doctorId),
      this.selectedClinicId,
      this.fromDate,
      this.toDate,
      this.compareFrom,
      this.compareTo
    ).subscribe({
      next: (res: any) => {
        loader.dismiss();
        this.loading = false;
        this.hasData = true;
        this.current     = res.Current;
        this.previous    = res.Previous;
        this.byClinic    = res.ByClinic  || [];
        this.byVaccine   = res.ByVaccine || [];
        this.monthly     = res.Monthly      || [];
        this.monthlyPrev = res.MonthlyPrev  || [];
      },
      error: () => {
        loader.dismiss();
        this.loading = false;
      }
    });
  }

  // Comparison helpers
  delta(cur: number, prev: number): number {
    if (!prev || prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
  }
  deltaClass(cur: number, prev: number): string {
    const d = this.delta(cur, prev);
    return d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
  }
  deltaLabel(cur: number, prev: number): string {
    const d = this.delta(cur, prev);
    return (d > 0 ? '▲ ' : d < 0 ? '▼ ' : '') + Math.abs(d) + '%';
  }

  // Sort vaccine table
  sortedVaccines(): any[] {
    return [...this.byVaccine].sort((a, b) =>
      this.vaccineSort === 'doses' ? b.Doses - a.Doses : b.Revenue - a.Revenue
    );
  }

  // Monthly trend value picker
  trendVal(row: any): number {
    switch (this.trendMetric) {
      case 'revenue':  return row.Revenue;
      case 'doses':    return row.Doses;
      case 'patients': return row.Patients;
      case 'expense':  return row.Expense;
    }
  }
  maxTrend(): number {
    const all = [...this.monthly, ...this.monthlyPrev].map((r: any) => this.trendVal(r));
    return Math.max(...all, 1);
  }

  // Bar chart helper — % of max
  barPct(val: number): number {
    return Math.round((val / this.maxTrend()) * 100);
  }

  // Max for clinic chart
  maxClinicVal(): number {
    const vals: number[] = [];
    this.byClinic.forEach(c => { vals.push(c.Revenue); vals.push(c.Expense); });
    return Math.max(...vals, 1);
  }

  // Quick date presets
  setPreset(p: string) {
    const now = new Date();
    switch (p) {
      case 'thismonth':
        this.fromDate = this.fmt(new Date(now.getFullYear(), now.getMonth(), 1));
        this.toDate   = this.fmt(now);
        break;
      case 'lastmonth': {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        this.fromDate = this.fmt(lm);
        this.toDate   = this.fmt(new Date(now.getFullYear(), now.getMonth(), 0));
        break;
      }
      case 'thisyear':
        this.fromDate = this.fmt(new Date(now.getFullYear(), 0, 1));
        this.toDate   = this.fmt(now);
        break;
      case 'lastyear':
        this.fromDate = this.fmt(new Date(now.getFullYear() - 1, 0, 1));
        this.toDate   = this.fmt(new Date(now.getFullYear() - 1, 11, 31));
        break;
    }
    this.customCompare = false;
    this.load();
  }

  private fmt(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  fmtMoney(n: number): string {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
    return Math.round(n).toString();
  }
}
