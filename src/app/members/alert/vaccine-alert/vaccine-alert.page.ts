import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { AlertService } from 'src/app/services/alert.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-vaccine-alert',
  templateUrl: './vaccine-alert.page.html',
  styleUrls: ['./vaccine-alert.page.scss'],
})
export class VaccineAlertPage implements OnInit {

  todayAlert: any;
  constructor(
    public loadingController: LoadingController,
    private alertService: AlertService,
    private toastService: ToastService,
    private storage: Storage
  ) { }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_ID).then((val) => {
      this.getAllChlid(val);
    })
  }

  async getAllChlid(id) {

    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.getTodayChild(id).subscribe(
      res => {
        if (res.IsSuccess) {
          this.todayAlert = res.ResponseData
          console.log(this.todayAlert);
          loading.dismiss();
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
    )
  }

  async sendIndividualMsgtoChild(id) {

    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.getIndividualMsgtoChild(id).subscribe(
      res => {
        if (res.IsSuccess) {
          loading.dismiss();
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
    )
  }
}
