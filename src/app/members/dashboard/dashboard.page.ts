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
import { PaService } from "src/app/services/pa.service";
import { ChildService } from "src/app/services/child.service";

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

  user: any;
  userName: string = '';
  isPa: boolean = false;

  showPatients: boolean = true;
  showAlerts: boolean = true;
  showAnalytics: boolean = true;
  showSchedule: boolean = true;
  showClinics: boolean = true;
  showStock: boolean = true;
  showFinancial: boolean = false;
  showSalesReport: boolean = false;
  showVacation: boolean = true;
  showAgent: boolean = false;
  showPersonalAssistant: boolean = false;
  assignmentCount: number = 0;
  pendingApprovalsCount: number = 0;
  hasPA: boolean = false;

  constructor(
    private loadingController: LoadingController,
    public clinicService: ClinicService,
    private toastService: ToastService,
    private dashboardService: DashboardService,
    private storage: Storage,
    private androidPermissions: AndroidPermissions,
    public platform: Platform,
    private routerOutlet: IonRouterOutlet,
    private paService: PaService,
    private childService: ChildService
  ) {}

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    this.user = await this.storage.get(environment.USER);
    const doctorProfile = await this.storage.get(environment.DOCTOR);
    if (this.user && this.user.UserType === 'PA') {
      if (this.user.Name) {
        this.userName = this.user.Name;
      } else if (this.user.PAId) {
        this.paService.getPa(String(this.user.PAId)).subscribe(res => {
          if (res && res.IsSuccess && res.ResponseData) this.userName = res.ResponseData.Name || '';
        });
      }
    } else {
      this.userName = (doctorProfile && (doctorProfile.DisplayName || doctorProfile.FirstName)) || '';
    }

    const loading = await this.loadingController.create({ message: "Loading ..." });
    await loading.present();

    try {
      await this.loadPermissions();
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

  private async loadPermissions() {
    if (this.user && this.user.UserType === 'PA') {
      this.isPa = true;
      try {
        const perm = await this.paService.getPaPermissions(Number(this.user.PAId)).toPromise();
        this.showPatients  = (perm && perm.SearchPatient)    || false;
        this.showAlerts    = (perm && perm.ViewAlerts)       || false;
        this.showAnalytics = (perm && perm.ViewAnalytics)    || false;
        this.showSchedule  = (perm && perm.ViewSchedule)     || false;
        this.showClinics   = (perm && perm.SetClinicOnline)  || false;
        this.showStock     = (perm && (perm.StockSuppliers || perm.StockPurchaseBills || perm.StockOverview || perm.StockAdjust || perm.StockTransfer || perm.StockDirectSale || perm.StockReports)) || false;
        this.showVacation  = (perm && perm.SetVacationDates) || false;
        this.showFinancial = false;
        this.showSalesReport = false;
        this.showAgent     = false;
        this.showPersonalAssistant = false;
        this.paService.getAssignments(Number(this.user.PAId)).subscribe(res => {
          if (res && res.IsSuccess) {
            this.assignmentCount = (res.ResponseData || []).length;
          }
        });
      } catch (e) {
        this.showPatients = this.showAlerts = this.showAnalytics =
          this.showSchedule = this.showClinics = this.showStock =
          this.showVacation = false;
        this.showFinancial = false;
        this.showSalesReport = false;
      }
    } else {
      // Doctor permissions from user/doctor profile flags
      this.showStock     = this.user && this.user.AllowInventory !== false;
      this.showFinancial = this.user && this.user.AllowFinancial === true;
      this.showSalesReport = this.user && this.user.AllowSalesReport === true;
      this.showAnalytics = this.user && this.user.AllowAnalytics === true;
      this.showAgent     = this.user && this.user.AllowAgent === true;
      this.showPersonalAssistant = this.doctorId === 1;
      this.showVacation  = true;
      this.showClinics   = true;
      this.showPatients  = true;
      this.showAlerts    = true;
      this.showSchedule  = true;
      try {
        const pas = await this.paService.getPAsByDoctorId(String(this.doctorId)).toPromise();
        this.hasPA = (pas || []).length > 0;
      } catch (e) {
        this.hasPA = false;
      }
      if (this.hasPA) {
        this.loadPendingCount();
      }
    }
  }

  private loadPendingCount() {
    if (!this.doctorId) { return; }
    this.childService.getPendingCount(this.doctorId).subscribe(res => {
      if (res && res.IsSuccess) {
        this.pendingApprovalsCount = res.ResponseData || 0;
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
    if (this.user && this.user.UserType === 'PA') {
      return this.getPaClinics();
    }
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

  private getPaClinics() {
    return new Promise<void>((resolve, reject) => {
      this.paService.getPaClinics(Number(this.user.PAId)).subscribe(
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
            reject(res.Message);
          }
        },
        err => {
          this.clinicsExist = false;
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