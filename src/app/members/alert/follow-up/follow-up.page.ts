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
import { Platform } from '@ionic/angular';

@Component({
  selector: "app-follow-up",
  templateUrl: "./follow-up.page.html",
  providers: [AndroidPermissions]
})
export class FollowUpPage implements OnInit {
  doctorId: any;
  followUpChild: any;
  numOfDays: number = 0;
  SMSKey: any;
  clinicId:any;
  Messages:any = [];
  selectedDate: string = new Date().toISOString(); 
  formattedDate: string;
  constructor(
    public loadingController: LoadingController,
    private followupService: FollowupService,
    private toastService: ToastService,
    private storage: Storage,
    private androidPermissions: AndroidPermissions,
    private titlecasePipe: TitleCasePipe,
    public platform: Platform,
    private sms: SMS,
    private callNumber: CallNumber
  ) {}

  ngOnInit() {
    // this.storage.get(environment.DOCTOR_Id).then(val => {
    //   this.doctorId = val;
    // });
    // this.storage.get(environment.SMS).then(val => {
    //   this.SMSKey = val;
    // });
     this.storage.get(environment.CLINIC_Id).then(clinicId => {
      this.clinicId = clinicId;
    });
    // this.storage.get(environment.MESSAGES).then(messages=> {this.Messages = messages});
    this.getFollowupChild(this.numOfDays,this.selectedDate);
  }

  // get childs from server
  async getFollowupChild(numOfDays: number, formattedDate: string) {
    this.numOfDays = numOfDays;
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.followupService
      .getFollowupChild(this.numOfDays, this.clinicId,formattedDate)
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

  // async sendSMS(child: any) {
  //   const loading = await this.loadingController.create({
  //     message: "Loading"
  //   });
  //   await loading.present();

  //   for (let i = 0; i < child.length; i++) {
  //     let message = this.generateSMS(child[i]);
  //     this.sendAlertMsg(child[i].ChildId, child[i].Child.User.MobileNumber , message);
  //   }
  //   loading.dismiss();
  // }

  // send Alert Msg to childs
  // async sendAlertMsg(id, childMobile , message) {
  //   if (this.SMSKey == 0) {
  //     const loading = await this.loadingController.create({
  //       message: "Loading"
  //     });
  //     await loading.present();
  //     await this.followupService
  //       .sendAlertMsgToAll(this.numOfDays, id)
  //       .subscribe(
  //         res => {
  //           if (res.IsSuccess) {
  //             loading.dismiss();
  //             this.toastService.create("Alerts has been sent successfully");
  //           } else {
  //             loading.dismiss();
  //             this.toastService.create(res.Message, "danger");
  //           }
  //         },
  //         err => {
  //           loading.dismiss();
  //           this.toastService.create(err, "danger");
  //         }
  //       );
  //   } else {
  //     this.androidPermissions
  //       .checkPermission(this.androidPermissions.PERMISSION.SEND_SMS)
  //       .then(
  //         success => {
  //           if (!success.hasPermission) {
  //             this.androidPermissions
  //               .requestPermission(this.androidPermissions.PERMISSION.SEND_SMS)
  //               .then(
  //                 success => {
  //                   this.sendMessage(childMobile , message);
  //                 },
  //                 err => {
  //                   console.error(err);
  //                 }
  //               );
  //           } else {
  //             this.sendMessage(childMobile , message);
  //           }
  //         },
  //         err => {
  //           this.androidPermissions
  //             .requestPermission(this.androidPermissions.PERMISSION.SEND_SMS)
  //             .then(
  //               success => {
  //                 this.sendMessage(childMobile , message);
  //               },
  //               err => {
  //                 console.error(err);
  //               }
  //             );
  //         }
  //       );
  //   }
  // }

  // generateSMS(schedule){
  //   var sms1="Reminder: Followup visit of "; 

  //   sms1 += schedule.Child.Name + ' is due on ' + schedule.NextVisitDate ;

  //   sms1 += ' with Dr. ' + this.titlecasePipe.transform(schedule.Doctor.FirstName) + ' ' + this.titlecasePipe.transform(schedule.Doctor.LastName);

  // return sms1;
  // }

  // sendMessage(childMobile , message) {
  //   this.sms.send('+92'+childMobile, message)
  //         .then(()=>{
  //           let obj = {'toNumber':'+92' + childMobile , 'message': message , 'created': Date.now(), 'status':true};
  //           this.Messages.push(obj);
  //           this.storage.set(environment.MESSAGES , this.Messages);
  //         this.toastService.create("Message Sent Successful");
  //         }).catch((error)=>{
  //         //console.log("The Message is Failed",error);
  //         this.toastService.create("Message Sent Failed" , "danger");
  //         let obj = {'toNumber':'+92' + childMobile , 'message': message , 'created': Date.now(), 'status':false};
  //           this.Messages.push(obj);
  //           this.storage.set(environment.MESSAGES , this.Messages);
  //         });
  // }


  formatDateToString(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);  
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
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
  onDateChange(event: any) {
    this.selectedDate = event.value;
    console.log('Selected Date:', this.selectedDate);
    this.getFollowups(this.selectedDate);
  }
  
  async openDatePicker() {
    const dateTimeElement = document.querySelector('ion-datetime');
    await dateTimeElement.open();
  }
  getFollowups(date: string) {
    const formattedDate = this.formatDateToString(date);

    this.getFollowupChild(0, formattedDate);
  }

openWhatsApp(mobileNumber: string, childName: string, nextVisitDate: string) {
  console.log('Child Name:', childName); // Debugging line
  console.log('Next Visit Date:', nextVisitDate); // Debugging line

  // Prevent multiple alerts
  if (mobileNumber.trim() === '') {
    alert('Invalid mobile number. Please provide a valid number.');
    return;
  }

  // Create a follow-up message
  const message = encodeURIComponent(
    `Reminder: Follow-up visit for ${childName} is scheduled on ${nextVisitDate}.\n` +
    `Please confirm your appointment. Thanks!\natta rehman, Baby Medics\n` +
    `Phone Number:03145553423\n` +
    `Login and check your record at https://vaccinationcentre.com`
  );

  const formattedPatientNumber = mobileNumber.startsWith('+92')
    ? mobileNumber
    : `+92${mobileNumber.replace(/^0/, '')}`;

  let whatsappUrl: string;
  if (this.platform.is('android') || this.platform.is('ios')) {
    whatsappUrl = `whatsapp://send?phone=${formattedPatientNumber}&text=${message}`;
  } else {
    whatsappUrl = `https://web.whatsapp.com/send?phone=${formattedPatientNumber}&text=${message}`;
  }
  window.open(whatsappUrl, '_system');
}

  
}
