import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { ToastService } from "src/app/shared/toast.service";
import { environment } from "src/environments/environment";
import { Storage } from "@ionic/storage";
import { FollowupService } from "src/app/services/followup.service";
import { AndroidPermissions } from "@ionic-native/android-permissions/ngx";
import { TitleCasePipe } from '@angular/common';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { SMS } from '@ionic-native/sms/ngx';

@Component({
  selector: "app-follow-up",
  templateUrl: "./follow-up.page.html",
  styleUrls: ["./follow-up.page.scss"],
  providers: [AndroidPermissions]
})
export class FollowUpPage implements OnInit {
  doctorId: any;
  followUpChild: any;
  numOfDays: number = 0;
  SMSKey: any;
  clinicId:any;
  Messages:any = [];
  constructor(
    public loadingController: LoadingController,
    private followupService: FollowupService,
    private toastService: ToastService,
    private storage: Storage,
    private androidPermissions: AndroidPermissions,
    private titlecasePipe: TitleCasePipe,
    private sms: SMS,
    private callNumber: CallNumber
  ) {}

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
    this.storage.get(environment.SMS).then(val => {
      this.SMSKey = val;
    });
     this.storage.get(environment.CLINIC_Id).then(clinicId => {
      this.clinicId = clinicId;
    });
    this.storage.get(environment.MESSAGES).then(messages=> {this.Messages = messages});
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
      .getFollowupChild(this.numOfDays, this.clinicId)
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

  async sendSMS(child: any) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();

    for (let i = 0; i < child.length; i++) {
      let message = this.generateSMS(child[i]);
      this.sendAlertMsg(child[i].ChildId, child[i].Child.User.MobileNumber , message);
    }
    loading.dismiss();
  }

  // send Alert Msg to childs
  async sendAlertMsg(id, childMobile , message) {
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
                    this.sendMessage(childMobile , message);
                  },
                  err => {
                    console.error(err);
                  }
                );
            } else {
              this.sendMessage(childMobile , message);
            }
          },
          err => {
            this.androidPermissions
              .requestPermission(this.androidPermissions.PERMISSION.SEND_SMS)
              .then(
                success => {
                  this.sendMessage(childMobile , message);
                },
                err => {
                  console.error(err);
                }
              );
          }
        );
    }
  }

  generateSMS(schedule){
    var sms1="Reminder: Followup visit of "; 

    sms1 += schedule.Child.Name + ' is due on ' + schedule.NextVisitDate ;

    sms1 += ' with Dr. ' + this.titlecasePipe.transform(schedule.Doctor.FirstName) + ' ' + this.titlecasePipe.transform(schedule.Doctor.LastName);

  return sms1;
  }

  sendMessage(childMobile , message) {
    this.sms.send('+92'+childMobile, message)
          .then(()=>{
            let obj = {'toNumber':'+92' + childMobile , 'message': message , 'created': Date.now(), 'status':true};
            this.Messages.push(obj);
            this.storage.set(environment.MESSAGES , this.Messages);
          this.toastService.create("Message Sent Successful");
          }).catch((error)=>{
          //console.log("The Message is Failed",error);
          this.toastService.create("Message Sent Failed" , "danger");
          let obj = {'toNumber':'+92' + childMobile , 'message': message , 'created': Date.now(), 'status':false};
            this.Messages.push(obj);
            this.storage.set(environment.MESSAGES , this.Messages);
          });
  }

  callFunction(celnumber)
  {
    console.log(celnumber);
    this.callNumber.callNumber(0 + celnumber, true)
    .then(res => console.log('Launched dialer!', res))
    .catch(err => console.log('Error launching dialer', err));
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
