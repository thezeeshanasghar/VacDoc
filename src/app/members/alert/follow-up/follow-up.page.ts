import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { ToastService } from "src/app/shared/toast.service";
import { environment } from "src/environments/environment";
import { Storage } from "@ionic/storage";
import { FollowupService } from "src/app/services/followup.service";

@Component({
  selector: "app-follow-up",
  templateUrl: "./follow-up.page.html",
  styleUrls: ["./follow-up.page.scss"]
})
export class FollowUpPage implements OnInit {
  doctorID: any;
  followUpChild: any;
  numOfDays: any;
  constructor(
    public loadingController: LoadingController,
    private followupService: FollowupService,
    private toastService: ToastService,
    private storage: Storage
  ) {}

  ngOnInit() {
    this.storage.get(environment.DOCTOR_ID).then(val => {
      this.doctorID = val;
    });
    this.getFollowupChild(0);
  }

  // get childs from server
  async getFollowupChild(followId) {
    this.numOfDays = followId;
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.followupService
      .getFollowupChild(this.numOfDays, this.doctorID)
      .subscribe(
        res => {
          if (res.IsSuccess) {
            this.followUpChild = res.ResponseData;
            loading.dismiss();
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

  async sendAlertMsgToAll() {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.followupService
      .sendAlertMsgToAll(this.numOfDays, this.doctorID)
      .subscribe(
        res => {
          if (res.IsSuccess) {
            loading.dismiss();
            this.toastService.create("Alerts has been sent successfully");
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

  // send Alert Msg individual childs
  async sendAlertMsg(id) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.followupService.sendFollowupAlertMsgIndividual(id).subscribe(
      res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create("Alerts has been sent successfully");
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

  async alertDeletevaccine() {}
}
