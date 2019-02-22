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

  last5DaysAlert: any;
  todayAlert: any;
  Next5DaysAlert: any;
  doctorID: any;
  whichTypeChildShow: any;
  last5Days: boolean = false;
  today: boolean = false;
  next5Days: boolean = false;
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

    this.getTodayChlid();
  }

  // last 5 days childs get from server
  async getLast5daysChlid() {
    this.last5Days = true;
    this.today = false;
    this.next5Days = false;
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.getLast5DaysChild(this.doctorID).subscribe(
      res => {
        if (res.IsSuccess) {
          this.last5DaysAlert = res.ResponseData
          console.log(this.last5DaysAlert);
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

  // Today childs get from server
  async getTodayChlid() {
    this.last5Days = false;
    this.today = true;
    this.next5Days = false;
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.getTodayChild(this.doctorID).subscribe(
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

  // Next 5 days childs get from server
  async getNext5DaysChlid() {
    this.last5Days = false;
    this.today = false;
    this.next5Days = true;
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.getNext5DaysChild(this.doctorID).subscribe(
      res => {
        if (res.IsSuccess) {
          this.Next5DaysAlert = res.ResponseData
          console.log(this.Next5DaysAlert);
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
