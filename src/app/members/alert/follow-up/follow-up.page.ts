import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { ToastService } from "src/app/shared/toast.service";
import { environment } from "src/environments/environment";
import { Storage } from "@ionic/storage";
import { FollowupService } from "src/app/services/followup.service";
import { AndroidPermissions } from "@ionic-native/android-permissions/ngx";
import { Platform } from '@ionic/angular';
import { ClinicService } from "src/app/services/clinic.service";
import { Downloader, DownloadRequest, NotificationVisibility } from '@ionic-native/downloader/ngx';

@Component({
  selector: "app-follow-up",
  templateUrl: "./follow-up.page.html",
  providers: [AndroidPermissions]
})
export class FollowUpPage implements OnInit {
  doctorId: any;
  followUpChild: any[] = []; // Initialize as an empty array
  numOfDays: number = 0;
  clinicId: any;
  selectedDate: string = new Date().toISOString();
  formattedDate: string;
  Childs: any;
  private readonly API_VACCINE = `${environment.BASE_URL}`;
  constructor(
    public loadingController: LoadingController,
    private followupService: FollowupService,
    private toastService: ToastService,
    private storage: Storage,
    public platform: Platform,
    private downloader: Downloader,
    private clinicService: ClinicService,
  ) { }
  
  ngOnInit() {
    this.storage.get(environment.CLINIC_Id).then(clinicId => {
      this.clinicId = clinicId;
    });
    this.getFollowupChild( this.selectedDate);
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
    // this.storage.get(environment.USER).then(user => {
    //   if (user) {
    //     this.Childs = user.Children;
    //   }
    // });
    console.log(this.clinicService.OnlineClinic);
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

  async sendemails() {
    const loading = await this.loadingController.create({
      message: "sending follow up emails"
    });
    await loading.present();
    await this.followupService.sendEmailToAll(this.numOfDays, this.clinicId).subscribe(
      res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create("Follow up emails sent successfull", "success");
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
    let query = '';
    this.followUpChild.map((x) => x.ChildId).forEach((ChildId) => {
      if (ChildId) {
        query += 'arr[]=' + ChildId + '&';
      }
    });
  
    const url = `${this.API_VACCINE}FollowUp/export-followups-csv?${query}`;
    if (this.platform.is('desktop') || this.platform.is('mobileweb')) {
      window.open(url, '_blank');
    } else {
      const request: DownloadRequest = {
        uri: url,
        title: 'Child Alerts CSV',
        description: 'Downloading follow-up alerts CSV',
        mimeType: 'text/csv',
        visibleInDownloadsUi: true,
        notificationVisibility: NotificationVisibility.VisibleNotifyCompleted,
        destinationInExternalFilesDir: {
          dirType: 'Downloads',
          subPath: 'Child Alerts.csv',
        },
      };
  
      this.downloader
        .download(request)
        .then((location: string) => {
          console.log('File downloaded at:', location);
          this.toastService.create('File downloaded successfully', 'success');
        })
        .catch((error: any) => {
          console.error('Download failed:', error);
          this.toastService.create('Failed to download file', 'danger');
        });
    }
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

  async sendemail(child: any) {
    console.log(child);
    console.log(child[0].ChildId);
    const loading = await this.loadingController.create({
      message: "sending email"
    });
    await loading.present();
    await this.followupService.sendFollowupMails(child[0].ChildId).subscribe(
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
      `Please confirm your appointment. Thanks!\nBaby Medics\n` +
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
