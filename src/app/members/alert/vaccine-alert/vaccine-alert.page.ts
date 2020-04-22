import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { AlertService } from "src/app/services/alert.service";
import { ToastService } from "src/app/shared/toast.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { AndroidPermissions } from "@ionic-native/android-permissions/ngx";
import { CallNumber } from '@ionic-native/call-number/ngx';
declare var SMS: any;
@Component({
  selector: "app-vaccine-alert",
  templateUrl: "./vaccine-alert.page.html",
  styleUrls: ["./vaccine-alert.page.scss"],
  providers: [AndroidPermissions]
})
export class VaccineAlertPage implements OnInit {
  doctorId: any;
  clinicId: any;
  SMSKey: any;
  Childs: any;

  numOfDays: number = 0; // 0 means get alert for today, 5 means get alert for next five days, same as for -5

  constructor(
    public loadingController: LoadingController,
    private alertService: AlertService,
    private toastService: ToastService,
    private storage: Storage,
    private androidPermissions: AndroidPermissions,
    private callNumber: CallNumber
  ) {}

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
    this.storage.get(environment.CLINIC_Id).then(clinicId => {
      this.clinicId = clinicId;
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
    await this.alertService.getChild(this.numOfDays, this.clinicId).subscribe(
      res => {
        if (res.IsSuccess) {
          this.Childs = res.ResponseData;

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
  async sendSMS(child: any) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();

    for (let i = 0; i < child.length; i++) {
      this.sendAlertMsg(child[i].ChildId, child[i].Child.User.MobileNumber);
    }
    loading.dismiss();
  }

  // send Alert Msg to childs
  async sendAlertMsg(id, childMobile) {
    if (this.SMSKey == 0) {
      await this.alertService
        .sendIndividualAlertMsg(this.numOfDays, id)
        .subscribe(
          res => {
            if (res.IsSuccess) {
              //loading.dismiss();

              this.toastService.create("Alerts has been sent successfully");
            } else {
              //loading.dismiss();
              this.toastService.create(res.Message, "danger");
            }
          },
          err => {
            //loading.dismiss();
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
        "Test Message",
        () => {
          console.log("Message sent successfully");
        },
        error => {
          console.error(error);
        }
      );
    }
  }

  callFunction(celnumber)
  {
    console.log(celnumber);
    this.callNumber.callNumber(0 + celnumber, true)
    .then(res => console.log('Launched dialer!', res))
    .catch(err => console.log('Error launching dialer', err));
  }
}
