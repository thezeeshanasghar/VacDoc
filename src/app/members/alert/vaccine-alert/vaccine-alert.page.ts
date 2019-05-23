import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { AlertService } from "src/app/services/alert.service";
import { ToastService } from "src/app/shared/toast.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { AndroidPermissions } from "@ionic-native/android-permissions/ngx";
import { ChildService } from "src/app/services/child.service";
declare var SMS: any;
@Component({
  selector: "app-vaccine-alert",
  templateUrl: "./vaccine-alert.page.html",
  styleUrls: ["./vaccine-alert.page.scss"],
  providers: [AndroidPermissions]
})
export class VaccineAlertPage implements OnInit {
  doctorID: any;
  clinicID: any;
  SMSKey: any;
  Childs: any;

  numOfDays: number = 0; // 0 means get alert for today, 5 means get alert for next five days, same as for -5

  constructor(
    public loadingController: LoadingController,
    private alertService: AlertService,
    private toastService: ToastService,
    private storage: Storage,
    private androidPermissions: AndroidPermissions
  ) {}

  ngOnInit() {
    this.storage.get(environment.DOCTOR_ID).then(val => {
      this.doctorID = val;
    });
    this.storage.get(environment.CLINIC_ID).then(clinicID => {
      this.clinicID = clinicID;
    });
    this.storage.get(environment.SMS).then(val => {
      this.SMSKey = val;
    });
    this.getChlid(this.numOfDays);
  }

  // Get childs get from server
  async getChlid(numOfDays: number) {
    this.numOfDays = numOfDays;
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.alertService.getChild(this.numOfDays, this.clinicID).subscribe(
      res => {
        if (res.IsSuccess) {
          this.Childs = res.ResponseData;
          console.log(this.Childs);
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
    console.log(child);
    for (let i = 0; i < child.length; i++) {
      this.sendIndividualAlertMsg(
        child[i].ChildId,
        child[i].Child.User.MobileNumber
      );
    }
  }

  // send Alert Msg individual childs
  async sendIndividualAlertMsg(id, childMobile) {
    if (this.SMSKey == 0) {
      const loading = await this.loadingController.create({
        message: "Loading"
      });
      await loading.present();
      await this.alertService
        .sendIndividualAlertMsg(this.numOfDays, id)
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
      for (let i = 0; i < this.Childs.length; i++) {
        if (this.Childs[i].ChildId == id) {
          console.log(this.Childs[i]);
        }
      }
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
        "92" + childMobile,
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
}
