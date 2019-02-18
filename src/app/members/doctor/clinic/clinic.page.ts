import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ClinicService } from 'src/app/services/clinic.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clinic',
  templateUrl: './clinic.page.html',
  styleUrls: ['./clinic.page.scss'],
})
export class ClinicPage {

  clinics: any;
  doctorID: number;

  constructor(
    public loadingController: LoadingController,
    private api: ClinicService,
    private toast: ToastService,
    private storage: Storage,
    private router: Router
  ) { }

  ionViewWillEnter() {
    this.storage.get(environment.DOCTOR_ID).then((docId) => {
      this.doctorID = docId;
      this.getClinics();
    });
  }

  async getClinics() {
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    await this.api.getClinics(this.doctorID).subscribe(
      res => {
        if (res.IsSuccess) {
          this.clinics = res.ResponseData;
          loading.dismiss();
        }
        else {
          loading.dismiss();
          this.toast.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toast.create(err, 'danger');
      }
    );
  }

  async setOnlineClinic(clinicID) {
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    this.storage.set(environment.CLINIC_ID, clinicID)
    let data = { 'DoctorID': this.doctorID, 'ID': clinicID, 'IsOnline': 'true' }
    await this.api.changeOnlineClinic(data)
      .subscribe(res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.router.navigate(['/members/dashboard']);
        }
        else {
          this.toast.create(res.Message)
        }

      }, (err) => {
        this.toast.create(err);
      });
  }
}
