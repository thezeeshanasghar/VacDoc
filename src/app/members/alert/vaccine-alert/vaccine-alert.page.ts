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
  alertID: any;
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
    console.log(this.doctorID);
    this.getChlid(0);
  }

  // Get childs get from server
  async getChlid(msgID) {
    this.alertID = msgID;
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.getChild(this.alertID, this.doctorID).subscribe(
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
    await this.alertService.sendIndividualAlertMsg(this.alertID, id).subscribe(
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
