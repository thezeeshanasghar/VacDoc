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
  last5DaysAlert: any;
  todayAlert: any;
  Next5DaysAlert: any;
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
    console.log(this.doctorID);
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

  // send Alert Msg Last 5 days individual childs
  async sendIndividualAlertMsg_Last5Days_Child(id) {

    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.sendIndividualAlertMsg_Last5Days_Child(id).subscribe(
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

  // send Alert Msg Today individual childs
  async sendIndividualAlertMsg_Today_Child(id) {

    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.sendIndividualAlertMsg_Today_Child(id).subscribe(
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

  // send Alert Msg Next 5 days individual childs
  async sendIndividualAlertMsg_Next5Days_Child(id) {

    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.sendIndividualAlertMsg_Next5Days_Child(id).subscribe(
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
