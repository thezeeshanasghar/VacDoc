import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { AlertService } from "src/app/services/alert.service";
import { ToastService } from "src/app/shared/toast.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { AndroidPermissions } from "@ionic-native/android-permissions/ngx";
import { CallNumber } from '@ionic-native/call-number/ngx';
import { TitleCasePipe } from '@angular/common';
import { SMS } from '@ionic-native/sms/ngx';
import { Downloader, DownloadRequest, NotificationVisibility } from '@ionic-native/downloader/ngx';
import { Platform } from '@ionic/angular';
//declare var SMS: any;
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
  private readonly API_VACCINE = `${environment.BASE_URL}`;
  Messages = [];
  numOfDays: number = 0; // 0 means get alert for today, 5 means get alert for next five days, same as for -5


  constructor(
    public loadingController: LoadingController,
    private alertService: AlertService,
    private toastService: ToastService,
    private storage: Storage,
    private androidPermissions: AndroidPermissions,
    private callNumber: CallNumber,
    private titlecasePipe: TitleCasePipe,
    private sms: SMS,
    private downloader: Downloader,
    public platform: Platform
  ) {

  }




  async ngOnInit() {
    await this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
    await this.storage.get(environment.CLINIC_Id).then(clinicId => {
      this.clinicId = clinicId;
    });
    await this.storage.get(environment.SMS).then(val => {
      this.SMSKey = val;
    });
    this.storage.get(environment.MESSAGES).then(messages => { messages == null ? '' : this.Messages = messages });
    await this.getChlid(this.numOfDays);

    // if (!this.checkSmsPermission()) {
    //   this.toastService.create('check function body')
    //   this.requestSmsPermissions();
    // }

  }

  // Get childs get from server
  async getChlid(numOfDays: number) {
    console.log(numOfDays)
    this.numOfDays = numOfDays;
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.alertService.getChild(this.numOfDays, this.clinicId).subscribe(
      res => {
        if (res.IsSuccess) {
          this.Childs = "";
          this.Childs = res.ResponseData;

          console.log("Childs Saved in this.Childs");
          console.log(res.ResponseData);

          //console.log(this.Childs.map(x=>x.Child.Id));

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

  async sendemails() {

    const loading = await this.loadingController.create({
      message: "sending emails"
    });
    await loading.present();
    await this.alertService.sendAlertMsgToAll(this.numOfDays, this.clinicId).subscribe(
      res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create("emails sent successfull", "success");
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

  downloadcsv() {
    let query = "";
    this.Childs.map(x => x.Child.Id).forEach(id => {
      query += 'arr[]=' + id + '&';
    });

    if (this.platform.is('desktop') || this.platform.is('mobileweb')) {
      var url = `${this.API_VACCINE}child/downloadcsv?${query}`;
      window.open(url);
    }
    else {
      var request: DownloadRequest = {
        uri: `${this.API_VACCINE}child/downloadcsv?${query}`,
        title: 'Chil dAlerts CSV',
        description: '',
        mimeType: '',
        visibleInDownloadsUi: true,
        notificationVisibility: NotificationVisibility.VisibleNotifyCompleted,
        // notificationVisibility: 0,
        destinationInExternalFilesDir: {
          dirType: 'Downloads',
          subPath: 'Child Alerts.csv'
        }
      };
      this.downloader.download(request)
        .then((location: string) => console.log('File downloaded at:' + location))
        .catch((error: any) => console.error(error));
    }
  }

  async sendSMS(child: any) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();

    for (let i = 0; i < child.length; i++) {
      console.log("");
      console.log("message No = " + (i + 1));
      let message = this.generateSMS(child[i]);

      // await this.sendAlertMsg(child[i].ChildId, child[i].Child.User.MobileNumber, message);
    }
    loading.dismiss();
  }

  generateSMS(schedule) {
    var sms1 = 'Reminder: Vaccination for ';
    sms1 += schedule.Child.Name + ' is due on ' + schedule.Date;
    sms1 += ' (' + schedule.Dose.Name + ' )';

    console.log("message => Id = " + schedule.Id);
    console.log(sms1);

    return sms1;
  }

  // send Alert Msg to childs
  async sendAlertMsg(id, childMobile, message) {
    console.log(message);
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
            this.toastService.create('Error: Server failure', 'danger', false, 3000);
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
                    this.sendMessage(childMobile, message);
                  },
                  err => {
                    console.error(err);
                  }
                );
            } else {
              this.sendMessage(childMobile, message);
            }
          },
          err => {
            this.androidPermissions
              .requestPermission(this.androidPermissions.PERMISSION.SEND_SMS)
              .then(
                success => {
                  this.sendMessage(childMobile, message);
                },
                err => {
                  console.error(err);
                }
              );
          }
        );
    }
  }

  async sendMessage(childMobile, message) {
    this.sms.send('+92' + childMobile, message)
      .then(() => {
        let obj = { 'toNumber': '+92' + childMobile, 'message': message, 'created': Date.now(), 'status': true };
        this.Messages.push(obj);
        this.storage.set(environment.MESSAGES, this.Messages);
        this.toastService.create("Message Sent Successful");
      }).catch((error) => {
        //console.log("The Message is Failed",error);
        this.toastService.create("Message Sent Failed", "danger");
        let obj = { 'toNumber': '+92' + childMobile, 'message': message, 'created': Date.now(), 'status': false };
        this.Messages.push(obj);
        this.storage.set(environment.MESSAGES, this.Messages);
      });
  }

  callFunction(celnumber) {
    console.log(celnumber);
    this.callNumber.callNumber(0 + celnumber, true)
      .then(res => console.log('Launched dialer!', res))
      .catch(err => console.log('Error launching dialer', err));
  }

  // checkSmsPermission(): any {
  //   this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.SEND_SMS)
  //     .then((success) => {
  //       if (success.hasPermission) {
  //         return true;
  //       } else {
  //         return false;
  //       }
  //     },
  //       err => {
  //         this.requestSmsPermissions();
  //       }
  //     );

  // }

  // requestSmsPermissions() {
  //   this.androidPermissions.requestPermissions(this.androidPermissions.PERMISSION.SEND_SMS)
  //     .then((success) => {
  //       if (success.hasPermission) {
  //         // return true;
  //       } else {
  //         // return false;
  //       }
  //     },
  //       err => {
  //         this.toastService.create('Error: ' + err.message)
  //       }
  //     );
  // }


  async sendMsgsThroughList() {
    let listMessages: any;
    const loading = await this.loadingController.create({
      message: "Loading Messages"
    });
    await loading.present();
    await this.alertService.sendMsgsThroughDictionary(0, this.clinicId).subscribe(
      (response) => {
        if (response.IsSuccess) {
          this.toastService.create('Success: Generated messages', 'success', false, 3000);
          listMessages = response.ResponseData;
          this.sendMessagesToChildren(listMessages);
          loading.dismiss();
        }
        else {
          this.toastService.create('Error: Failed to generate messages\nTry Again', 'danger', false, 6000);
          loading.dismiss();
        }
      },
      (err) => {
        this.toastService.create('Error: Server failure', 'danger', false, 3000);
        loading.dismiss();
      }
    );
  }

  async sendMessagesToChildren(listMessages: any) {
    const loading = await this.loadingController.create({
      message: "Sending Messages"
    });
    await loading.present();

    await listMessages.forEach(element => {
      this.sendAlertMsg(element.ChildId, element.MobileNumber, element.SMS);
    });

    loading.dismiss();

  }

}
