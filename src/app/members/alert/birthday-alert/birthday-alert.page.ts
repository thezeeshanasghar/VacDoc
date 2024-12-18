import { Component, OnInit } from '@angular/core';
import { LoadingController } from "@ionic/angular";
import { ToastService } from "src/app/shared/toast.service";
import { environment } from "src/environments/environment";
import { Storage } from "@ionic/storage";
import { BirthdayService } from "src/app/services/birthday.service";
import { Platform } from '@ionic/angular';
@Component({
  selector: 'app-birthday-alert',
  templateUrl: './birthday-alert.page.html',
})
export class BirthdayAlertPage implements OnInit {
  selectedDate: string = new Date().toISOString(); 
  formattedDate: string;
  Childs: string;
  doctorId: any;
  birthdayChild: any=[];
  constructor(
    public loadingController: LoadingController,
    private birthdayService: BirthdayService,
    private toastService: ToastService,
    private storage: Storage,
    public platform: Platform,
  ) { }
  ngOnInit() {
     this.storage.get(environment.DOCTOR_Id).then(val => {
          this.doctorId = val;
        });
        this.getBirthdayChild(this.selectedDate);
  }
  async getBirthdayChild( formattedDate: string): Promise<void> {

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

    this.getBirthdayChild(formattedDate);
  }
  async openDatePicker() {
    const dateTimeElement = document.querySelector('ion-datetime');
    await dateTimeElement.open();
  }
  openWhatsApp(mobileNumber: string, childName: string, birthDate: string) {
    console.log('Child Name:', childName); 
    console.log('Birth Date:', birthDate); 
    if (mobileNumber.trim() === '') {
      alert('Invalid mobile number. Please provide a valid number.');
      return;
    }
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
