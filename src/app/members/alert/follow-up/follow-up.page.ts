import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { ToastService } from "src/app/shared/toast.service";
import { environment } from "src/environments/environment";
import { Storage } from "@ionic/storage";
import { FollowupService } from "src/app/services/followup.service";
import { AndroidPermissions } from "@ionic-native/android-permissions/ngx";
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
  clinicId: any;
  selectedDate: string = new Date().toISOString();
  formattedDate: string;
  constructor(
    public loadingController: LoadingController,
    private followupService: FollowupService,
    private toastService: ToastService,
    private storage: Storage,
    public platform: Platform,
  ) { }
  
  ngOnInit() {
    this.storage.get(environment.CLINIC_Id).then(clinicId => {
      this.clinicId = clinicId;
    });
    this.getFollowupChild( this.selectedDate);
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
  }
  
  async getFollowupChild( formattedDate: string) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.followupService
    .getFollowupChild1( this.doctorId, formattedDate)
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

  formatDateToString(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

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

    this.getFollowupChild(formattedDate);
  }
  openWhatsApp(mobileNumber: string, childName: string, nextVisitDate: string) {
    console.log('Child Name:', childName);
    console.log('Next Visit Date:', nextVisitDate);
    if (mobileNumber.trim() === '') {
      alert('Invalid mobile number. Please provide a valid number.');
      return;
    }
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
