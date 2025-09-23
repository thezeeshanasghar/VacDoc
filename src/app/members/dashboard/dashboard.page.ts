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

    const loading = await this.loadingController.create({ message: "Loading ..." });
    await loading.present();

    try {
      // await this.getCombinedDashboardData();
      await this.getClinics();
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
            if (!this.clinicsExist) {
                this.routerOutlet.nativeEl.ownerDocument.defaultView.location.href = 'members/doctor/clinic/add';
            }
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

  // async getCombinedDashboardData() {
  //   debugger
  //   return new Promise<void>((resolve, reject) => {
  //     this.dashboardService.getCombinedDashboardData(this.doctorId).subscribe(
  //       res => {
  //         if (res) {
  //           debugger
  //           this.Children = res.CurrentMonthChildCount;
  //           this.totalChildCount = res.TotalChildCount;
  //           this.totalAlertsCount = res.TotalAlertsCount;
  //           this.futureAlertsCount = res.FutureAlertsCount;
  //           this.currentMonthGivenDosesCount = res.GivenDosesCount;
  //           this.totalRevenue = res.TotalRevenue;
  //           resolve();
  //         } else {
  //           this.toastService.create("Failed to fetch combined dashboard data", "danger");
  //           reject("Unexpected response format");
  //         }
  //       },
  //       err => {
  //         this.toastService.create("Error fetching combined dashboard data", "danger");
  //         reject(err);
  //       }
  //     );
  //   });
  // }
}