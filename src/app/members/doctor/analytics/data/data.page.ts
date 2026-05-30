import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Label } from 'ng2-charts';
import { DashboardService } from 'src/app/services/dashboard.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-data',
  templateUrl: './data.page.html',
  styleUrls: ['./data.page.scss'],
})
export class DataPage implements OnInit {

  doctorId: any;

  // Stat cards
  totalPatients = 0;
  currentMonthPatients = 0;
  currentMonthDoses = 0;
  totalAlerts = 0;

  // Monthly Revenue chart
  revenueLabels: Label[] = [];
  revenueData: ChartDataSets[] = [{ data: [], label: 'Revenue (PKR)' }];
  revenueOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { yAxes: [{ ticks: { beginAtZero: true } }] },
    legend: { display: false }
  };

  // Monthly Doses chart
  dosesLabels: Label[] = [];
  dosesData: ChartDataSets[] = [{ data: [], label: 'Doses Given' }];
  dosesOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { yAxes: [{ ticks: { beginAtZero: true } }] },
    legend: { display: false }
  };

  // Monthly New Patients chart
  patientsLabels: Label[] = [];
  patientsData: ChartDataSets[] = [{ data: [], label: 'New Patients' }];
  patientsOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { yAxes: [{ ticks: { beginAtZero: true } }] },
    legend: { display: false }
  };

  // Top Vaccines chart
  vaccinesLabels: Label[] = [];
  vaccinesData: ChartDataSets[] = [{ data: [], label: 'Doses Given' }];
  vaccinesOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { xAxes: [{ ticks: { beginAtZero: true } }] },
    legend: { display: false }
  };

  barChartType: ChartType = 'bar';
  horizontalBarType: ChartType = 'horizontalBar';

  revenueColors = [{ backgroundColor: 'rgba(21,101,192,0.75)', borderColor: 'rgba(21,101,192,1)', borderWidth: 1 }];
  dosesColors  = [{ backgroundColor: 'rgba(46,125,50,0.75)',  borderColor: 'rgba(46,125,50,1)',  borderWidth: 1 }];
  patientsColors = [{ backgroundColor: 'rgba(230,81,0,0.75)', borderColor: 'rgba(230,81,0,1)',   borderWidth: 1 }];
  vaccinesColors = [{ backgroundColor: 'rgba(106,27,154,0.75)', borderColor: 'rgba(106,27,154,1)', borderWidth: 1 }];

  constructor(
    private dashboardService: DashboardService,
    private loadingCtrl: LoadingController,
    private storage: Storage,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    await this.loadAll();
  }

  async loadAll() {
    const loader = await this.loadingCtrl.create({ message: 'Loading analytics...' });
    await loader.present();

    // Load stat cards
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

    // Load charts
    this.dashboardService.getAnalyticsData(this.doctorId).subscribe({
      next: (res: any) => {
        loader.dismiss();
        if (!res) return;

        if (res.MonthlyRevenue) {
          this.revenueLabels = res.MonthlyRevenue.map((d: any) => d.Month);
          this.revenueData = [{ data: res.MonthlyRevenue.map((d: any) => d.Value), label: 'Revenue (PKR)' }];
        }
        if (res.MonthlyDoses) {
          this.dosesLabels = res.MonthlyDoses.map((d: any) => d.Month);
          this.dosesData = [{ data: res.MonthlyDoses.map((d: any) => d.Value), label: 'Doses Given' }];
        }
        if (res.MonthlyNewPatients) {
          this.patientsLabels = res.MonthlyNewPatients.map((d: any) => d.Month);
          this.patientsData = [{ data: res.MonthlyNewPatients.map((d: any) => d.Value), label: 'New Patients' }];
        }
        if (res.TopVaccines) {
          this.vaccinesLabels = res.TopVaccines.map((d: any) => d.BrandName);
          this.vaccinesData = [{ data: res.TopVaccines.map((d: any) => d.Count), label: 'Doses Given' }];
        }
      },
      error: () => {
        loader.dismiss();
        this.toastService.create('Failed to load analytics', 'danger');
      }
    });
  }
}
