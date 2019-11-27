import { Component } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ClinicService } from 'src/app/services/clinic.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/shared/alert.service';

@Component({
  selector: 'app-clinic',
  templateUrl: './clinic.page.html',
  styleUrls: ['./clinic.page.scss'],
})
export class ClinicPage {

  clinics: any;
  doctorId: number;

  constructor(
    public loadingController: LoadingController,
    private clinicService: ClinicService,
    private toastService: ToastService,
    private storage: Storage,
    private router: Router,
    private alertService: AlertService,
  ) { }

  ionViewWillEnter() {
    this.storage.get(environment.DOCTOR_Id).then((docId) => {
      this.doctorId = docId;
      this.getClinics();
    });
  }

  async getClinics() {
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    await this.clinicService.getClinics(this.doctorId).subscribe(
      res => {

        this.clinics = res.ResponseData;
        loading.dismiss();
        if (res.IsSuccess) {
          for (let i = 0; i < this.clinics.length; i++) {
            if (this.clinics[i].IsOnline == true) {
              this.storage.set(environment.CLINIC_Id, this.clinics[i].Id)
            }
          }
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger');
      }
    );
  }

  async setOnlineClinic(clinicId) {
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    this.storage.set(environment.CLINIC_Id, clinicId)
    let data = { 'DoctorID': this.doctorId, 'ID': clinicId, 'IsOnline': 'true' }
    await this.clinicService.changeOnlineClinic(data)
      .subscribe(res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.router.navigate(['/members/dashboard']);
        }
        else {
          this.toastService.create(res.Message)
        }

      }, (err) => {
        this.toastService.create(err);
      });
  }

  alertDeleteClinic(id) {
    this.alertService.confirmAlert('Are you sure you want to delete this ?')
      .then((yes) => {
        if (yes) {
          this.deleteClinic(id);
        }
      });
  }

  async deleteClinic(id) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.clinicService.deleteClinic(id).subscribe(
      res => {
        if (res.IsSuccess == true) {
          this.router.navigate(['/members/doctor/clinic']);
          loading.dismiss();
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger')
      }
    );
  }
}
