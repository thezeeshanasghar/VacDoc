import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { AlertService } from 'src/app/services/alert.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-follow-up',
  templateUrl: './follow-up.page.html',
  styleUrls: ['./follow-up.page.scss'],
})
export class FollowUpPage implements OnInit {

  doctorID: any;
  last5DaysfollowUp: any;
  todayfollowUp: any;
  Next5DaysfollowUp: any;
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

  // Last 5 days childs get from server
  async getlast5DaystChlid() {
    this.last5Days = true;
    this.today = false;
    this.next5Days = false;
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.getLast5DaysFollowupChild(this.doctorID).subscribe(
      res => {
        if (res.IsSuccess) {
          this.last5DaysfollowUp = res.ResponseData
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

  // Todays childs get from server
  async getTodayChlid() {
    this.last5Days = false;
    this.today = true;
    this.next5Days = false;
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.getTodayFollowupChild(this.doctorID).subscribe(
      res => {
        if (res.IsSuccess) {
          this.todayfollowUp = res.ResponseData
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
  async getNext5daysChlid() {
    this.last5Days = false;
    this.today = false;
    this.next5Days = true;
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.getNext5DaysFollowupChild(this.doctorID).subscribe(
      res => {
        if (res.IsSuccess) {
          this.Next5DaysfollowUp = res.ResponseData
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
  async sendAlertMsg(id) {

    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.alertService.sendFollowupAlertMsgIndividual(id).subscribe(
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
