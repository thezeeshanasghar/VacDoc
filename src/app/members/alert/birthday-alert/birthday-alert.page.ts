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
  doctorId: any;
  docname: string = '';
  clinic: string = ''; 
  clinics: string = ''; 
  firstClinic: string = ''; 
  birthdayChild: any = [];

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
      if (this.doctorId) {
        console.log("Load Doctor");
        this.loadDoctorDetails(this.doctorId);
      }
    });

    this.getBirthdayChild(this.selectedDate);
  }

  async getBirthdayChild(formattedDate: string): Promise<void> {
    this.formattedDate = formattedDate;
    const loading = await this.loadingController.create({
      message: "Loading...",
      spinner: "circles",
    });
    await loading.present();
    this.birthdayService.getBirthdayAlert(this.formattedDate, this.doctorId).subscribe(
      async (res) => {
        if (res) {
          this.birthdayChild = res.ResponseData || [];
          console.log("Birthday Child List:", this.birthdayChild);
          await loading.dismiss();
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
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${month}-${day}`;
  }

  onDateChange(event: any) {
    this.selectedDate = event.value;
    this.getBirthdayChild(this.formatDateToString(this.selectedDate));
  }

  loadDoctorDetails(doctorId: number) {
    console.log("Doctor ID:", doctorId);

    this.birthdayService.loadDoctorDetails(doctorId).subscribe(
      (res) => {
        console.log("Full API Response:", res);

        if (res.IsSuccess) {
          const DoctorDetails = res.ResponseData;
          console.log("DoctorDetails Object:", DoctorDetails);

          this.docname = DoctorDetails.DisplayName;
          this.clinics = Array.isArray(DoctorDetails.Clinics) ? DoctorDetails.Clinics : [];

          console.log("Clinic List:", this.clinics);

          if (this.clinics.length > 0) {
            const firstClinic = this.clinics[0];

            if (Array.isArray(this.clinics) && this.clinics.length > 0) {
              const firstClinic = this.clinics[0];

              if (typeof firstClinic === 'object' && firstClinic !== null) {
                this.clinic = firstClinic.Name || firstClinic.ClinicName || "Unknown Clinic";
              } else {
                console.error("firstClinic is not an object:", firstClinic);
                this.clinic = "Unknown Clinic";
              }
            } else {
              this.clinic = "Unknown Clinic";
            }

          } else {
            this.clinic = "Unknown Clinic"
          }

        } else {
          console.error("Error fetching doctor details:", res.Message);
        }
      },
      (err) => {
        console.error("API Error:", err);
      }
    );
  }

  async sendemail(child: any) {
    console.log(child);
    console.log(child[0].Id);
    const loading = await this.loadingController.create({
      message: "sending email"
    });
    await loading.present();
    await this.birthdayService.sendBirthdayMails(child[0].Id).subscribe(
      res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create("email sent successfully", "success");
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

  openWhatsApp(mobileNumber: string, childName: string, birthDate: string, child: any ) {
    if (mobileNumber.trim() === '') {
      alert('Invalid mobile number. Please provide a valid number.');
      return;
    }

    const message = encodeURIComponent(
      `🎉 *Happy Birthday, ${childName}!* 🎂\n\n` +
      `Wishing you a day filled with joy, laughter, and happiness! May your year ahead be full of success and good health. 🎈\n\n` +
      `🎁 *Date of Birth:* ${birthDate}\n` +
      `🏥 *Clinic:* ${this.clinic}\n\n` +
      `Best wishes,\n` +
      `👨‍⚕️ ${this.docname}`
    );
    const formattedPatientNumber = mobileNumber.startsWith('+92')? mobileNumber: `+92${mobileNumber.replace(/^0/, '')}`;
    let whatsappUrl: string;
    if (this.platform.is('android') || this.platform.is('ios')) {
      whatsappUrl = `whatsapp://send?phone=${formattedPatientNumber}&text=${message}`;
    } else {
      whatsappUrl = `https://web.whatsapp.com/send?phone=${formattedPatientNumber}&text=${message}`;
    }
    window.open(whatsappUrl, '_system');
    child.isMessageSent = true;
  }
}