import { Component, OnInit } from "@angular/core";
import { LoadingController, ToastController } from "@ionic/angular";
import { ClinicService } from "src/app/services/clinic.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ToastService } from "src/app/shared/toast.service";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.page.html",
  styleUrls: ["./dashboard.page.scss"]
})
export class DashboardPage implements OnInit {
  clinics: any;
  doctorID: any;
  constructor(
    private loadingController: LoadingController,
    private clinicService: ClinicService,
    private toastService: ToastService,
    private storage: Storage
  ) {}

  ngOnInit() {
    this.storage.get(environment.DOCTOR_ID).then(docId => {
      this.doctorID = docId;
      this.getClinics(this.doctorID);
    });
    this.storage.set(environment.SMS, 0);
  }

  async getClinics(id) {
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();

    await this.clinicService.getClinics(id).subscribe(
      res => {
        this.clinics = res.ResponseData;
        loading.dismiss();
        if (res.IsSuccess) {
          for (let i = 0; i < this.clinics.length; i++) {
            if (this.clinics[i].IsOnline == true) {
              this.storage.set(environment.CLINIC_ID, this.clinics[i].ID);
            }
          }
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, "danger");
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }
}
