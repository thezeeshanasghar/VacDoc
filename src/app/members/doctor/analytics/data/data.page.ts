import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { DashboardService } from 'src/app/services/dashboard.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-data',
  templateUrl: './data.page.html',
  styleUrls: ['./data.page.scss'],
})
export class DataPage implements OnInit {

  doctorId: any;

  totalPatients = 0;
  currentMonthPatients = 0;
  currentMonthDoses = 0;
  totalAlerts = 0;

  monthlyRevenue: { month: string; value: number }[] = [];
  monthlyDoses: { month: string; value: number }[] = [];
  monthlyPatients: { month: string; value: number }[] = [];
  topVaccines: { name: string; count: number }[] = [];

  loading = true;

  constructor(
    private dashboardService: DashboardService,
    private loadingCtrl: LoadingController,
    private storage: Storage
  ) {}

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    this.loadData();
  }

  loadData() {
    this.dashboardService.getCombinedDashboardData(this.doctorId).subscribe({
      next: (res: any) => {
        if (res) {
          this.totalPatients = res.TotalChildCount || 0;
          this.currentMonthPatients = res.CurrentMonthChildCount || 0;
          this.currentMonthDoses = res.GivenDosesCount || 0;
          this.totalAlerts = res.TotalAlertsCount || 0;
        }
      },
      error: () => {}
    });

    this.dashboardService.getAnalyticsData(this.doctorId).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (!res) return;
        if (res.MonthlyRevenue) {
          this.monthlyRevenue = res.MonthlyRevenue.map((d: any) => ({ month: d.Month, value: d.Value }));
        }
        if (res.MonthlyDoses) {
          this.monthlyDoses = res.MonthlyDoses.map((d: any) => ({ month: d.Month, value: d.Value }));
        }
        if (res.MonthlyNewPatients) {
          this.monthlyPatients = res.MonthlyNewPatients.map((d: any) => ({ month: d.Month, value: d.Value }));
        }
        if (res.TopVaccines) {
          this.topVaccines = res.TopVaccines.map((d: any) => ({ name: d.BrandName, count: d.Count }));
        }
      },
      error: () => { this.loading = false; }
    });
  }

  maxValue(arr: { value: number }[]): number {
    const m = Math.max(...arr.map(d => d.value), 1);
    return m;
  }
}
