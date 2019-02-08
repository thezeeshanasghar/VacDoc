import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ClinicService } from 'src/app/services/clinic.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-clinic',
  templateUrl: './clinic.page.html',
  styleUrls: ['./clinic.page.scss'],
})
export class ClinicPage implements OnInit {

  clinics: any;
  doctorID: number;

  constructor(
    public loadingController: LoadingController,
    private api: ClinicService,
    private toast: ToastService,
    private storage: Storage,
  ) { }

  ngOnInit() {
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
          console.log(this.clinics)
          loading.dismiss();
        }
        else {
          loading.dismiss();
          this.toast.create(res.Message);
        }
      },
      err => {
        loading.dismiss();
        this.toast.create(err);
      }
    );
  }

  async setOnlineClinic(clinicID) {
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    let data = { 'DoctorID': this.doctorID, 'ID': clinicID, 'IsOnline': 'true' }
    await this.api.changeOnlineClinic(data)
      .subscribe(res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.getClinics();
        }
        else {
          this.toast.create(res.Message)
        }


      }, (err) => {
        this.toast.create(err);
      });
  }
}
