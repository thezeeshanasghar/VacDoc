import { Component, OnInit } from "@angular/core";
import { LoadingController, ToastController } from "@ionic/angular";
import { ClinicService } from "src/app/services/clinic.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ToastService } from "src/app/shared/toast.service";
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { IonRouterOutlet, Platform } from '@ionic/angular';
import { Plugins } from '@capacitor/core';

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
    private storage: Storage,
    private androidPermissions: AndroidPermissions,
    public platform: Platform,
    private routerOutlet: IonRouterOutlet,
  ) {}

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    this.user = await this.storage.get(environment.USER);

    const loading = await this.loadingController.create({ message: "Loading ..." });
    await loading.present();

    const userType = this.user && this.user.UserType === 'PA' ? 'PA' : 'DOCTOR';
    const id = userType === 'PA' ? Number(this.user.PAId) : Number(this.doctorId);

    try {
      const res = await this.clinicService.getShellData(userType, id).toPromise();
      if (res && res.IsSuccess && res.ResponseData) {
        this.applyShellData(res.ResponseData);
      } else {
        this.clinicsExist = false;
        this.toastService.create((res && res.Message) || "Failed to load dashboard data", "danger");
      }
    } catch (error) {
      console.error("Error while loading dashboard data:", error);
      this.toastService.create("Error loading dashboard data", "danger");
    } finally {
      loading.dismiss();
    }
  }

  private applyShellData(shellData: any) {
    this.Clinics = shellData.Clinics || [];
    this.clinicCount = this.Clinics.length;
    this.clinicsExist = this.clinicCount > 0;
    this.hasPA = shellData.HasPA || false;
    this.pendingApprovalsCount = shellData.PendingApprovalsCount || 0;

    if (shellData.OnlineClinic) {
      this.storage.set(environment.CLINIC_Id, shellData.OnlineClinic.Id);
      this.storage.set(environment.ON_CLINIC, shellData.OnlineClinic);
      this.clinicService.updateClinic(shellData.OnlineClinic);
    }
    this.storage.set(environment.CLINICS, this.Clinics);

    if (this.user && this.user.UserType === 'PA') {
      this.isPa = true;
      this.userName = shellData.PaName || this.user.Name || '';
      const perm = shellData.PaPermissions;
      this.showPatients  = (perm && perm.SearchPatient)    || false;
      this.showAlerts    = (perm && perm.ViewAlerts)       || false;
      this.showAnalytics = (perm && perm.ViewAnalytics)    || false;
      this.showSchedule  = (perm && perm.ViewSchedule)     || false;
      this.showClinics   = (perm && perm.SetClinicOnline)  || false;
      this.showStock     = (perm && (perm.StockSuppliers || perm.StockPurchaseBills || perm.StockOverview || perm.StockAdjust || perm.StockTransfer || perm.StockDirectSale || perm.StockReports)) || false;
      this.showVacation  = (perm && perm.SetVacationDates) || false;
      this.showFinancial = false;
      this.showAgent     = false;
      this.showPersonalAssistant = false;
      this.assignmentCount = shellData.PaAssignmentCount || 0;
    } else {
      this.userName = shellData.DisplayName || '';
      this.showStock     = shellData.AllowInventory !== false;
      this.showFinancial = shellData.AllowFinancial === true;
      this.showAnalytics = shellData.AllowAnalytics === true;
      this.showAgent     = shellData.AllowAgent === true;
      this.showPersonalAssistant = this.doctorId === 1;
      this.showVacation  = true;
      this.showClinics   = true;
      this.showPatients  = true;
      this.showAlerts    = true;
      this.showSchedule  = true;

      if (!this.clinicsExist) {
        this.routerOutlet.nativeEl.ownerDocument.defaultView.location.href = 'members/doctor/clinic/add';
      }
    }
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

}