import { Component, OnInit } from '@angular/core';
import { LoadingController } from "@ionic/angular";
import { ToastService } from "src/app/shared/toast.service";
import { environment } from "src/environments/environment";
import { Storage } from "@ionic/storage";
import { BirthdayService } from "src/app/services/birthday.service";
import { AndroidPermissions } from "@ionic-native/android-permissions/ngx";
import { TitleCasePipe } from '@angular/common';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { SMS } from '@ionic-native/sms/ngx';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-birthday-alert',
  templateUrl: './birthday-alert.page.html',
})
export class BirthdayAlertPage implements OnInit {
  selectedDate: string = new Date().toISOString(); 
  formattedDate: string;
  numOfDays: number;
  Childs: string;
  doctorId: any;
  Messages:any = [];
  SMSKey: any;
  birthdayChild: any=[];
  constructor(
    public loadingController: LoadingController,
    private birthdayService: BirthdayService,
    private toastService: ToastService,
    private storage: Storage,
    private androidPermissions: AndroidPermissions,
    private titlecasePipe: TitleCasePipe,
    private sms: SMS,
     public platform: Platform,
    private callNumber: CallNumber
  ) { }

  ngOnInit() {
     this.storage.get(environment.DOCTOR_Id).then(val => {
          this.doctorId = val;
        });
        // this.storage.get(environment.SMS).then(val => {
        //   this.SMSKey = val;
        // });
        //  this.storage.get(environment.CLINIC_Id).then(clinicId => {
        //   this.clinicId = clinicId;
        // });
        this.storage.get(environment.MESSAGES).then(messages=> {this.Messages = messages});
        this.getBirthdayChild(this.numOfDays,this.selectedDate);
  }
  async getBirthdayChild(numOfDays: number, formattedDate: string): Promise<void> {
    this.numOfDays = numOfDays;
    this.formattedDate = formattedDate;
  
   
    const loading = await this.loadingController.create({
      message: "Loading...",
      spinner: "circles", 
    });
    await loading.present();
  
    
    this.birthdayService.getBirthdayAlert(this.formattedDate, this.doctorId).subscribe(
      async (res) => {
        await loading.dismiss(); 
        console.log("atta",res.ResponseData)
        if (res) {
          this.birthdayChild = res.ResponseData || [];
          console.log(res.ResponseData)
        } else {
          this.toastService.create(res.Message || "An error occurred.", "danger");
        }
      },
      async (err) => {
        await loading.dismiss(); 
        this.toastService.create(err.message || "Failed to fetch data.", "danger");
      }
    );
  }
  
  clinicId(formattedDate: string, numOfDays: number, clinicId: any) {
    throw new Error('Method not implemented.');
  }
  formatDateToString(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);  
    const day = ('0' + d.getDate()).slice(-2);
    return `${month}-${day}`;
  }
  onDateChange(event: any) {
    this.selectedDate = event.value;
    console.log('Selected Date:', this.selectedDate);
    this.getAlerts(this.selectedDate);
  }
  getAlerts(date: string) {
    const formattedDate = this.formatDateToString(date);

    this.getBirthdayChild(0, formattedDate);
  }

  async openDatePicker() {
    const dateTimeElement = document.querySelector('ion-datetime');
    await dateTimeElement.open();
  }
  // callFunction(mobileNumber: string) {
  //   this.callNumber.callNumber(mobileNumber, true)
  //     .then(res => console.log('Launched dialer!', res))
  //     .catch(err => console.log('Error launching dialer', err));
  // }
  // sendSMS(child: any) {
  //   this.sms.send(child.MobileNumber, this.SMSKey)
  //     .then(res => console.log('SMS sent!', res))
  //     .catch(err => console.log('Error sending SMS', err));
  // }
  // sendEmail() {
  //   // this.email.sendEmail(child.Email, this.SMSKey)
  //   //   .then(res => console.log('Email sent!', res))
  //   //   .catch(err => console.log('Error sending Email', err));
  // }
  // sendEmails() {}
  // downloadCSV() {
  //   // this.csv.downloadCSV(child.Email, this.SMSKey)
  //   //   .then(res => console.log('CSV downloaded!', res))
  //   //   .catch(err => console.log('Error downloading CSV', err));
  // }
  openWhatsApp(mobileNumber: string, childName: string, birthDate: string) {
    console.log('Child Name:', childName); // Debugging line
    console.log('Birth Date:', birthDate); // Debugging line
  
    // Prevent invalid or empty numbers
    if (mobileNumber.trim() === '') {
      alert('Invalid mobile number. Please provide a valid number.');
      return;
    }
  
    // Create a Happy Birthday message
    const message = encodeURIComponent(
      `🎉 Happy Birthday, ${childName}! 🎂\n` +
      `Wishing you a day filled with joy, laughter, and special moments.\n` +
      `Stay happy and healthy! 🎈\n\n` +
      `Best wishes,\n\n` 
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
