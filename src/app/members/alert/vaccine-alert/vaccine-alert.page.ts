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

  doctorID: any;
  Childs: any;
  
  numOfDays: number = 0; // 0 means get alert for today, 5 means get alert for next five days, same as for -5

  constructor(
    public loadingController: LoadingController,
    private alertService: AlertService,
    private toastService: ToastService,
    private storage: Storage
  ) { }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_ID).then((val) => {
      this.doctorID = val;
    });
    this.getChlid(this.numOfDays);
  }

  // Get childs get from server
  async getChlid(numOfDays: number) {
    this.numOfDays = numOfDays;
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.getChild(this.numOfDays, this.doctorID).subscribe(
      res => {
        if (res.IsSuccess) {
          this.Childs = res.ResponseData
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

  // send Alert Msg individual childs
  async sendIndividualAlertMsg(id) {

    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.sendIndividualAlertMsg(this.numOfDays, id).subscribe(
      res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create('Alerts has been sent successfully');
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
