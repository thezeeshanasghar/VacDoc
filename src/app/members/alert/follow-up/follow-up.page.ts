import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { ToastService } from "src/app/shared/toast.service";
import { environment } from "src/environments/environment";
import { Storage } from "@ionic/storage";
import { FollowupService } from "src/app/services/followup.service";
import { AndroidPermissions } from "@ionic-native/android-permissions/ngx";
declare var SMS: any;

@Component({
  selector: "app-follow-up",
  templateUrl: "./follow-up.page.html",
  styleUrls: ["./follow-up.page.scss"],
  providers: [AndroidPermissions]
})
export class FollowUpPage implements OnInit {
  doctorID: any;
  followUpChild: any;
  numOfDays: number = 0;
  SMSKey: any;
  constructor(
    public loadingController: LoadingController,
    private followupService: FollowupService,
    private toastService: ToastService,
    private storage: Storage,
    private androidPermissions: AndroidPermissions
  ) {}

  ngOnInit() {
    this.storage.get(environment.DOCTOR_ID).then(val => {
      this.doctorID = val;
    });
    this.storage.get(environment.SMS).then(val => {
      this.SMSKey = val;
    });
    this.getFollowupChild(this.numOfDays);
  }

  // get childs from server
  async getFollowupChild(numOfDays: number) {
    this.numOfDays = numOfDays;
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

  sendSMS(child: any) {
    for (let i = 0; i < child.length; i++) {
      this.sendAlertMsg(child[i].ChildId, child[i].Child.User.MobileNumber);
    }
  }

  // send Alert Msg to childs
  async sendAlertMsg(id, childMobile) {
    if (this.SMSKey == 0) {
      const loading = await this.loadingController.create({
        message: "Loading"
      });
      await loading.present();
      await this.followupService
        .sendAlertMsgToAll(this.numOfDays, id)
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
    } else {
      this.androidPermissions
        .checkPermission(this.androidPermissions.PERMISSION.SEND_SMS)
        .then(
          success => {
            if (!success.hasPermission) {
              this.androidPermissions
                .requestPermission(this.androidPermissions.PERMISSION.SEND_SMS)
                .then(
                  success => {
                    this.sendMessage(childMobile);
                  },
                  err => {
                    console.error(err);
                  }
                );
            } else {
              this.sendMessage(childMobile);
            }
          },
          err => {
            this.androidPermissions
              .requestPermission(this.androidPermissions.PERMISSION.SEND_SMS)
              .then(
                success => {
                  this.sendMessage(childMobile);
                },
                err => {
                  console.error(err);
                }
              );
          }
        );
    }
  }

  sendMessage(childMobile) {
    if (SMS) {
      SMS.sendSMS(
        "0092" + childMobile,
        "Test Message faisal",
        () => {
          console.log("Message sent successfully");
        },
        error => {
          console.error(error);
        }
      );
    }
  }

  // async sendAlertMsgToAll() {
  //   const loading = await this.loadingController.create({
  //     message: "Loading"
  //   });
  //   await loading.present();
  //   await this.followupService
  //     .sendAlertMsgToAll(this.numOfDays, this.doctorID)
  //     .subscribe(
  //       res => {
  //         if (res.IsSuccess) {
  //           loading.dismiss();
  //           this.toastService.create("Alerts has been sent successfully");
  //         } else {
  //           loading.dismiss();
  //           this.toastService.create(res.Message, "danger");
  //         }
  //       },
  //       err => {
  //         loading.dismiss();
  //         this.toastService.create(err, "danger");
  //       }
  //     );
  // }

  // // send Alert Msg individual childs
  // async sendAlertMsg(id) {
  //   const loading = await this.loadingController.create({
  //     message: "Loading"
  //   });
  //   await loading.present();
  //   await this.followupService.sendFollowupAlertMsgIndividual(id).subscribe(
  //     res => {
  //       if (res.IsSuccess) {
  //         loading.dismiss();
  //         this.toastService.create("Alerts has been sent successfully");
  //       } else {
  //         loading.dismiss();
  //         this.toastService.create(res.Message, "danger");
  //       }
  //     },
  //     err => {
  //       loading.dismiss();
  //       this.toastService.create(err, "danger");
  //     }
  //   );
  // }
}
