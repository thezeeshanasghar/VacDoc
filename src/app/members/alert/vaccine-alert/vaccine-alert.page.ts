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
import { Downloader , DownloadRequest , NotificationVisibility } from '@ionic-native/downloader/ngx';
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
  Messages:any = [];
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
  ) {}

 async ngOnInit() {
    await this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
    await this.storage.get(environment.CLINIC_Id).then(clinicId => {
      this.clinicId = clinicId;
    });
   await  this.storage.get(environment.SMS).then(val => {
      this.SMSKey = val;
    });
    this.storage.get(environment.MESSAGES).then(messages=> {this.Messages = messages});
   await this.getChlid(this.numOfDays);
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

  downloadcsv(){
    let query = "";
this.Childs.map(x=>x.Child.Id).forEach(id => {
  query += 'arr[]='+id+'&';
});
    var request: DownloadRequest = {
      uri: `${this.API_VACCINE}child/downloadcsv?${query}`,
      title: 'Child Schedule',
      description: '',
      mimeType: '',
      visibleInDownloadsUi: true,
      notificationVisibility: NotificationVisibility.VisibleNotifyCompleted,
     // notificationVisibility: 0,
      destinationInExternalFilesDir: {
          dirType: 'Downloads',
          subPath: 'ChildSchedule.pdf'
      }
  };
  this.downloader.download(request)
  .then((location: string) => console.log('File downloaded at:'+location))
  .catch((error: any) => console.error(error));
  
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
generateSMS(schedule){
  var sms1="Mr ."+ this.titlecasePipe.transform(schedule.Child.FatherName) + 'vaccine for';
  if (schedule.Child.Gender == 'Boy')
  {
    sms1 += ' Your Son '
  }
  if (schedule.Child.Gender == 'Girl')
  {
    sms1 += ' Your Daughter '
  }
  sms1 += schedule.Child.Name + ' is scheduled on ' + schedule.Date ;

return sms1;
}
  // send Alert Msg to childs
  async sendAlertMsg(id, childMobile , message) {
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
}
