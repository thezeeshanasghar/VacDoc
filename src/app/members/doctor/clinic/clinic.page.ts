import { Component } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { ClinicService } from "src/app/services/clinic.service";
import { ToastService } from "src/app/shared/toast.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { NavigationEnd, Router, Route, ActivatedRoute } from "@angular/router";
import { AlertService } from "src/app/shared/alert.service";
import { PaService } from "src/app/services/pa.service";

@Component({
  selector: "app-clinic",
  templateUrl: "./clinic.page.html",
  styleUrls: ["./clinic.page.scss"],
})
export class ClinicPage {
  Clinics: any;
  dispclinics: any = [];
  doctorId: number;
  clinicId: any;
  onlineclinic: any;
  usertype: any;
  selectedClinic: any;
  type: any;
  constructor(public loadingController: LoadingController, 
    public clinicService: ClinicService,
    private toastService: ToastService, 
    private storage: Storage, 
    private router: Router,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private paService: PaService
      ) {
    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        // this.getClinics();
      }
    });
  }

  async ngOnInit() {
    await this.storage.get(environment.DOCTOR_Id).then((docId) => {
      this.doctorId = docId;
    });
   this.usertype = await this.storage.get(environment.USER);
   console.log("User Type:", this.usertype.UserType);
   this.type= this.usertype.UserType;
    this.route.queryParams.subscribe((params) => {
      if (params.refresh) {
        this.getClinics();
        this.clearRefreshFlag();
      } else {
        if (!this.Clinics) {
          this.getClinics();
        } else {
          this.Clinics = this.Clinics;
        }
      }
    });
  }

  clearRefreshFlag() {
    this.router.navigate([], {
      queryParams: { refresh: null },
      queryParamsHandling: "merge",
    });
  }

  async getClinics() {
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();
    if (this.usertype.UserType === "DOCTOR") {
    await this.clinicService.getClinics(this.doctorId).subscribe(
      (res) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.Clinics = res.ResponseData;
          for (let i = 0; i < this.Clinics.length; i++) {
            const clinic = this.Clinics[i];
            if (clinic.ClinicTimings) {
              for (let j = 0; j < clinic.ClinicTimings.length; j++) {
                const timing = clinic.ClinicTimings[j];
              }
            }
          }
          this.storage.set(environment.CLINICS, this.Clinics);
          for (let i = 0; i < this.Clinics.length; i++) {
            if (this.Clinics[i].IsOnline) {
              this.storage.set(
                environment.CLINIC_Id,
                this.Clinics[i].Id
              );
              this.storage.set(
                environment.ON_CLINIC,
                this.Clinics[i]
              );
              this.clinicService.updateClinic(this.Clinics[i])
            }
          }
          this.ngOnInit();
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, "danger");
        }
      },
      (err) => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }else if (this.usertype.UserType === "PA") {
        this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.Clinics = response.ResponseData;
            } else {
              this.toastService.create(response.Message, "danger");
            }
          },
          error: (error) => {
            loading.dismiss();
            console.error("Error fetching PA clinics:", error);
            this.toastService.create("Failed to load clinics", "danger");
          },
        });
      }
  }

  async setOnlineClinic(clinicId) {
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();
    let data = { DoctorId: this.doctorId, Id: clinicId, IsOnline: "true" };
    await this.clinicService.changeOnlineClinic(data).subscribe(
      (res) => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.storage.set(environment.CLINIC_Id, data.Id).then(() => {
          });
          this.storage.get(environment.CLINICS).then((clinics) => {
            const selectedClinic = clinics.find((clinic) => clinic.Id === data.Id);
            this.storage.set(environment.ON_CLINIC, selectedClinic).then(() => {
            });
          });
          this.getClinics();
          this.router.navigate(["/members/doctor/clinic"]);
        } else {
          this.toastService.create(res.Message);
        }
        this.storage.get(environment.CLINIC_Id).then((val) => {
          this.clinicId = val;
        });
      },
      (err) => {
        this.toastService.create(err);
      }
    );
    loading.dismiss();
  }

  alertDeleteClinic(id) {
    this.alertService.confirmAlert("Are you sure you want to delete this ?").then((yes) => {
      if (yes) {
        this.deleteClinic(id);
      }
    });
  }

  async deleteClinic(id) {
    const loading = await this.loadingController.create({
      message: "Loading",
    });
    await loading.present();
    await this.clinicService.deleteClinic(id).subscribe(
      (res) => {
        if (res.IsSuccess == true) {
          window.location.reload();
          this.router.navigate(["/members/doctor/clinic"]);
          loading.dismiss();
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, "danger");
        }
      },
      (err) => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  doRefresh(event) {
    console.log("Begin async operation");
    this.ngOnInit();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
