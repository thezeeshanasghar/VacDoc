import { Component, OnInit } from "@angular/core";
import { LoadingController, ToastController } from "@ionic/angular";
import { ClinicService } from "src/app/services/clinic.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ToastService } from "src/app/shared/toast.service";
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { IonRouterOutlet, Platform } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
import { DashboardService } from "src/app/services/dashboard.service";

const { App } = Plugins;

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.page.html",
  styleUrls: ["./dashboard.page.scss"]
})
export class DashboardPage implements OnInit {
  Clinics: any = [];
  clinic: any;
  doctorId: any;
  NewClinics: any = [];
  DelClinics: any = [];
  Messages: any = [];
  Children: any;
  DashboardService: any;
  totalChildCount: number;
  clinicCount: any;
  totalAlertsCount: number;
  clinicsExist: boolean = false;
  futureAlertsCount: number;
  currentMonthGivenDosesCount: number = 0;
  totalRevenue: number = 0;

  constructor(
    private loadingController: LoadingController,
    public clinicService: ClinicService,
    private toastService: ToastService,
    private dashboardService: DashboardService,
    private storage: Storage,
    private androidPermissions: AndroidPermissions,
    public platform: Platform,
    private routerOutlet: IonRouterOutlet
  ) {}

  async ngOnInit() {
    await this.storage.get(environment.DOCTOR_Id).then(docId => {
      this.doctorId = docId;
    });

    // Use a single loading indicator for all operations
    const loading = await this.loadingController.create({ message: "Loading ..." });
    await loading.present();

    try {
      await Promise.all([
        this.getClinics(),
        this.getChildren(),
        this.getTotalChildCount(),
        this.getTotalAlerts(),
        this.getFutureAlertsCount(),
        this.getCurrentMonthGivenDoses(),
        this.getCurrentMonthRevenue() 
      ]);
    } catch (error) {
      console.error("Error while loading dashboard data:", error);
      this.toastService.create("Error loading dashboard data", "danger");
    } finally {
      loading.dismiss();
    }

    await this.storage.get(environment.ON_CLINIC).then(clinic => {
      this.clinic = clinic;
      if (this.clinic) {
        this.clinicService.updateClinic(this.clinic);
      } else {
        this.getClinics();
      }
    });
  }

  async ionViewDidEnter() {
    this.storage.set(environment.SMS, 1);
    if (!this.platform.is('desktop') && !this.platform.is('mobileweb')) {
      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.SEND_SMS).then(
        result => {
          if (!result.hasPermission) {
            this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.SEND_SMS);
          }
        }
      );
    }
  }

  async getClinics() {
    return new Promise<void>((resolve, reject) => {
      this.clinicService.getClinics(this.doctorId).subscribe(
        res => {
          if (res.IsSuccess) {
            this.Clinics = res.ResponseData;
            this.clinicCount = this.Clinics.length;
            this.clinicsExist = this.clinicCount > 0;
            this.storage.set(environment.CLINICS, this.Clinics);
            for (let i = 0; i < this.Clinics.length; i++) {
              if (this.Clinics[i].IsOnline) {
                this.storage.set(environment.CLINIC_Id, this.Clinics[i].Id);
                this.storage.set(environment.ON_CLINIC, this.Clinics[i]);
                this.clinicService.updateClinic(this.Clinics[i]);
              }
            }
            resolve();
          } else {
            this.clinicsExist = false;
            this.toastService.create(res.Message, "danger");
            reject(res.Message);
          }
        },
        err => {
          this.clinicsExist = false;
          this.toastService.create(err, "danger");
          reject(err);
        }
      );
    });
  }

  async getChildren() {
    return new Promise<void>((resolve, reject) => {
      this.dashboardService.getThisMonthChild().subscribe(
        res => {
          if (res && res.CurrentMonthChildCount !== undefined) {
            this.Children = res.CurrentMonthChildCount;
            resolve();
          } else {
            this.toastService.create("Failed to fetch child data", "danger");
            reject("Unexpected response format");
          }
        },
        err => {
          this.toastService.create("Error fetching child data", "danger");
          reject(err);
        }
      );
    });
  }

  async getTotalChildCount() {
    return new Promise<void>((resolve, reject) => {
      this.dashboardService.getTotalChildren(this.doctorId).subscribe(
        res => {
          if (res && res.TotalChildCount !== undefined) {
            this.totalChildCount = res.TotalChildCount;
            resolve();
          } else {
            this.toastService.create("Failed to fetch total child count", "danger");
            reject("Unexpected response format");
          }
        },
        err => {
          this.toastService.create("Error fetching total child count", "danger");
          reject(err);
        }
      );
    });
  }

  async getTotalAlerts() {
    return new Promise<void>((resolve, reject) => {
      this.dashboardService.getDoctorAlerts(this.doctorId).subscribe(
        res => {
          if (res && res.TotalAlertsCount !== undefined) {
            this.totalAlertsCount = res.TotalAlertsCount;
            resolve();
          } else {
            this.toastService.create("Failed to fetch alerts data", "danger");
            reject("Unexpected response format");
          }
        },
        err => {
          this.toastService.create("Error fetching alerts data", "danger");
          reject(err);
        }
      );
    });
  }

  async getFutureAlertsCount() {
    return new Promise<void>((resolve, reject) => {
      this.dashboardService.getFutureAlerts(this.doctorId).subscribe(
        res => {
          if (res && res.FutureAlertsCount !== undefined) {
            this.futureAlertsCount = res.FutureAlertsCount;
            resolve();
          } else {
            this.toastService.create("Failed to fetch future alerts count", "danger");
            reject("Unexpected response format");
          }
        },
        err => {
          this.toastService.create("Error fetching future alerts count", "danger");
          reject(err);
        }
      );
    });
  }

  async getCurrentMonthGivenDoses() {
    this.dashboardService.getCurrentMonthGivenDoses(this.doctorId).subscribe(
      (res) => {
        if (res && res.GivenDosesCount !== undefined) {
          this.currentMonthGivenDosesCount = res.GivenDosesCount;
        } else {
          this.toastService.create("Failed to fetch given doses count for the current month", "danger");
        }
      },
      (err) => {
        console.error("Error fetching given doses count:", err);
        this.toastService.create("Error fetching given doses count for the current month", "danger");
      }
    );
  }

  async getCurrentMonthRevenue() {
    this.dashboardService.getCurrentMonthRevenue(this.doctorId).subscribe(
      (res) => {
        if (res && res.TotalRevenue !== undefined) {
          this.totalRevenue = res.TotalRevenue;
        } else {
          this.toastService.create("Failed to fetch revenue for the current month", "danger");
        }
      },
      (err) => {
        console.error("Error fetching revenue:", err);
        this.toastService.create("Error fetching revenue for the current month", "danger");
      }
    );
  }
  
  
}
