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
  clinics: any;
  selectedClinicId: any;
  usertype: any;

  constructor(
    private loadingController: LoadingController,
    public clinicService: ClinicService,
    private toastService: ToastService,
    private dashboardService: DashboardService,
    private storage: Storage,
    private androidPermissions: AndroidPermissions,
    public platform: Platform,
    private routerOutlet: IonRouterOutlet,
    private paService: PaService
  ) {}

  async ngOnInit() {
    await this.storage.get(environment.DOCTOR_Id).then(docId => {
      this.doctorId = docId;
    });
    this.usertype = await this.storage.get(environment.USER);

    const loading = await this.loadingController.create({ message: "Loading ..." });
    await loading.present();

    try {
      await this.getCombinedDashboardData();
      await this.loadClinics();
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
        this.loadClinics();
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

  async loadClinics() {
    try {
      if (this.usertype.UserType === 'DOCTOR') {
        this.clinicService.getClinics(this.doctorId).subscribe({
          next: (response) => {
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              this.Clinics = response.ResponseData; // Keep for backward compatibility
              this.clinicCount = this.clinics.length;
              this.clinicsExist = this.clinicCount > 0;
              
              // Check if there's already an online clinic from storage or API response
              let onlineClinic = this.clinics.find(clinic => clinic.IsOnline);
              
              // If no online clinic found in API response, check storage
              if (!onlineClinic) {
                this.storage.get(environment.ON_CLINIC).then(storedOnlineClinic => {
                  if (storedOnlineClinic) {
                    onlineClinic = this.clinics.find(clinic => clinic.Id === storedOnlineClinic.Id);
                    if (onlineClinic) {
                      this.selectedClinicId = onlineClinic.Id;
                      this.clinicService.updateClinic(onlineClinic);
                      console.log('Found online clinic from storage:', onlineClinic.Name);
                    }
                  }
                });
              }
              
              if (onlineClinic) {
                this.selectedClinicId = onlineClinic.Id;
                this.clinicService.updateClinic(onlineClinic);
                console.log('Found online clinic from API:', onlineClinic.Name);
              } else {
                this.selectedClinicId = (this.clinics.length > 0 ? this.clinics[0].Id : null);
                if (this.selectedClinicId) {
                  this.setOnlineClinic(this.selectedClinicId);
                }
              }
              console.log('Clinics:', this.clinics);
              console.log('Selected Clinic ID:', this.selectedClinicId);
              if (!this.clinicsExist) {
                this.routerOutlet.nativeEl.ownerDocument.defaultView.location.href = 'members/doctor/clinic/add';
              }
              this.storage.set(environment.CLINICS, this.clinics);
            } else {
              this.clinicsExist = false;
              this.toastService.create(response.Message, 'danger');
            }
          },
          error: (error) => {
            this.clinicsExist = false;
            console.error('Error fetching clinics:', error);
            this.toastService.create('Failed to load clinics', 'danger');
          },
        });
      } else if (this.usertype.UserType === 'PA') {
        this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
          next: (response) => {
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              this.Clinics = response.ResponseData; // Keep for backward compatibility
              this.clinicCount = this.clinics.length;
              this.clinicsExist = this.clinicCount > 0;
              
              // Check if there's already an online clinic from storage or API response
              let onlineClinic = this.clinics.find(clinic => clinic.IsOnline);
              
              // If no online clinic found in API response, check storage
              if (!onlineClinic) {
                this.storage.get(environment.ON_CLINIC).then(storedOnlineClinic => {
                  if (storedOnlineClinic) {
                    onlineClinic = this.clinics.find(clinic => clinic.Id === storedOnlineClinic.Id);
                    if (onlineClinic) {
                      this.selectedClinicId = onlineClinic.Id;
                      this.clinicService.updateClinic(onlineClinic);
                      console.log('Found PA online clinic from storage:', onlineClinic.Name);
                    }
                  }
                });
              }
              
              if (onlineClinic) {
                this.selectedClinicId = onlineClinic.Id;
                this.clinicService.updateClinic(onlineClinic);
                console.log('Found PA online clinic from API:', onlineClinic.Name);
              } else {
                this.selectedClinicId = (this.clinics.length > 0 ? this.clinics[0].Id : null);
                if (this.selectedClinicId) {
                  this.setOnlineClinic(this.selectedClinicId);
                }
              }
              console.log('PA Clinics:', this.clinics);
              console.log('Selected PA Clinic ID:', this.selectedClinicId);
              this.storage.set(environment.CLINICS, this.clinics);
            } else {
              this.clinicsExist = false;
              this.toastService.create(response.Message, 'danger');
            }
          },
          error: (error) => {
            this.clinicsExist = false;
            console.error('Error fetching PA clinics:', error);
            this.toastService.create('Failed to load clinics', 'danger');
          },
        });
      }
    } catch (error) {
      this.clinicsExist = false;
      console.error('Error in loadClinics:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
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

  async getCombinedDashboardData() {
    debugger
    return new Promise<void>((resolve, reject) => {
      this.dashboardService.getCombinedDashboardData(this.doctorId).subscribe(
        res => {
          if (res) {
            debugger
            this.Children = res.CurrentMonthChildCount;
            this.totalChildCount = res.TotalChildCount;
            this.totalAlertsCount = res.TotalAlertsCount;
            this.futureAlertsCount = res.FutureAlertsCount;
            this.currentMonthGivenDosesCount = res.GivenDosesCount;
            this.totalRevenue = res.TotalRevenue;
            resolve();
          } else {
            this.toastService.create("Failed to fetch combined dashboard data", "danger");
            reject("Unexpected response format");
          }
        },
        err => {
          this.toastService.create("Error fetching combined dashboard data", "danger");
          reject(err);
        }
      );
    });
  }

  onClinicChange(event: any) {
    const clinicId = event.detail.value;
    console.log('Selected Clinic ID:', clinicId);
    this.selectedClinicId = clinicId;
    this.setOnlineClinic(clinicId);
  }

  async setOnlineClinic(clinicId: any) {
    const loading = await this.loadingController.create({ message: "Setting clinic online..." });
    await loading.present();
    
    let data = { DoctorId: this.doctorId, Id: clinicId, IsOnline: "true" };
    
    try {
      await this.clinicService.changeOnlineClinic(data).subscribe(
        (res) => {
          if (res.IsSuccess) {
            loading.dismiss();
            // Update local storage
            this.storage.set(environment.CLINIC_Id, data.Id);
            this.storage.get(environment.CLINICS).then((clinics) => {
              const selectedClinic = clinics.find((clinic) => clinic.Id === data.Id);
              this.storage.set(environment.ON_CLINIC, selectedClinic);
              this.clinicService.updateClinic(selectedClinic);
            });
            this.toastService.create('Clinic set as online successfully', 'success');
            console.log('Online clinic set to:', clinicId);
          } else {
            loading.dismiss();
            this.toastService.create(res.Message, 'danger');
          }
        },
        (err) => {
          loading.dismiss();
          this.toastService.create('Failed to set clinic online', 'danger');
          console.error('Error setting clinic online:', err);
        }
      );
    } catch (error) {
      loading.dismiss();
      this.toastService.create('An error occurred', 'danger');
      console.error('Error in setOnlineClinic:', error);
    }
  }
}