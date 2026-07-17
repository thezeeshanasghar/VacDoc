import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { ToastService } from "src/app/shared/toast.service";
import { environment } from "src/environments/environment";
import { Storage } from "@ionic/storage";
import { FollowupService } from "src/app/services/followup.service";
import { AndroidPermissions } from "@ionic-native/android-permissions/ngx";
import { Platform } from '@ionic/angular';
import { ClinicService } from "src/app/services/clinic.service";
import { PaService } from "src/app/services/pa.service";
import { Downloader, DownloadRequest, NotificationVisibility } from '@ionic-native/downloader/ngx';
@Component({
  selector: "app-follow-up",
  templateUrl: "./follow-up.page.html",
  styleUrls: ["./follow-up.page.scss"],
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
  usertype: any;
  clinics: any;
  allClinicIds: number[] = [];

  // Clinic filter: default 'all' = merged across every accessible clinic.
  allChilds: any[] = [];
  selectedClinicId: number | 'all' = 'all';
  clinicPickerOpen = false;
  clinicPickerSearch = '';

  private readonly API_VACCINE = `${environment.BASE_URL}`;
  constructor(
    public loadingController: LoadingController,
    private followupService: FollowupService,
    private toastService: ToastService,
    private storage: Storage,
    public platform: Platform,
    private downloader: Downloader,
    public clinicService: ClinicService,
    private paService: PaService,
  ) { }

  async ngOnInit() {
    this.storage.get(environment.CLINIC_Id).then(clinicId => {
      this.clinicId = clinicId;
    });
    this.usertype = await this.storage.get(environment.USER);
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    this.formattedDate = this.formatDateToString(this.selectedDate);
    await this.loadClinics();
  }

  async loadClinics() {
    const loading = await this.loadingController.create({ message: 'Loading clinics...' });
    await loading.present();

    const isPA = this.usertype && this.usertype.UserType === 'PA';
    const clinics$ = isPA
      ? this.paService.getPaClinics(Number(this.usertype.PAId))
      : this.clinicService.getClinics(Number(this.doctorId));

    clinics$.subscribe({
      next: (response) => {
        loading.dismiss();
        if (response.IsSuccess) {
          this.clinics = response.ResponseData;
          this.allClinicIds = this.clinics.map(c => c.Id);
          if (this.allClinicIds.length > 0) {
            this.getAllClinicsFollowups();
          }
        } else {
          this.toastService.create(response.Message, 'danger');
        }
      },
      error: () => {
        loading.dismiss();
        this.toastService.create('Failed to load clinics', 'danger');
      },
    });
  }

  async getAllClinicsFollowups() {
    if (!this.allClinicIds || this.allClinicIds.length === 0) return;

    const loading = await this.loadingController.create({ message: 'Loading follow-ups...' });
    await loading.present();

    const isPA = this.usertype && this.usertype.UserType === 'PA';
    const paId = isPA ? Number(this.usertype.PAId) : undefined;
    const doctorId = isPA ? undefined : Number(this.doctorId);

    try {
      const requests = this.allClinicIds.map(clinicId =>
        this.followupService.getFollowupsForClinic(clinicId, this.numOfDays, this.formattedDate, paId, doctorId)
      );
      const { forkJoin } = await import('rxjs');

      forkJoin(requests).subscribe(
        (responses: any[]) => {
          let allChildren = [];
          responses.forEach((res, i) => {
            if (res.IsSuccess && res.ResponseData) {
              const clinicId = this.allClinicIds[i];
              res.ResponseData.forEach((item: any) => item._sourceClinicId = clinicId);
              allChildren = allChildren.concat(res.ResponseData);
            }
          });
          this.allChilds = allChildren;
          this.applyClinicFilter();
          loading.dismiss();
        },
        () => {
          loading.dismiss();
          this.toastService.create('Error loading follow-up alerts', 'danger');
        }
      );
    } catch (error) {
      loading.dismiss();
      this.toastService.create('Error loading follow-up alerts', 'danger');
    }
  }

  // ---------- clinic filter ----------
  applyClinicFilter() {
    this.followUpChild = this.selectedClinicId === 'all'
      ? this.allChilds
      : this.allChilds.filter(c => c._sourceClinicId === this.selectedClinicId);
  }

  get filteredPickerClinics() {
    const search = (this.clinicPickerSearch || '').trim().toLowerCase();
    const all = [{ Id: 'all', Name: 'All Clinics' }, ...(this.clinics || [])];
    if (!search) return all;
    return all.filter(c => c.Name.toLowerCase().includes(search));
  }

  get selectedClinicName(): string {
    if (this.selectedClinicId === 'all') return 'All Clinics';
    const match = (this.clinics || []).find(c => c.Id === this.selectedClinicId);
    return match ? match.Name : 'All Clinics';
  }

  openClinicPicker() {
    this.clinicPickerSearch = '';
    this.clinicPickerOpen = true;
  }

  closeClinicPicker() {
    this.clinicPickerOpen = false;
  }

  selectClinic(id: number | 'all') {
    this.selectedClinicId = id;
    this.applyClinicFilter();
    this.closeClinicPicker();
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
    this.formattedDate = this.formatDateToString(date);
    this.getAllClinicsFollowups();
  }

  openWhatsApp(mobileNumber: string, childName: string, nextVisitDate: string, child: any) {
  console.log('Child Name:', childName);
  console.log('Next Visit Date:', nextVisitDate);
  if (mobileNumber.trim() === '') {
    alert('Invalid mobile number. Please provide a valid number.');
    return;
  }
  // Get dynamic country code, fallback to '+92' if not present
  const countryCode = child.Child.User.CountryCode ? child.Child.User.CountryCode : '+92';
  // Remove any leading zero from the mobile number
  const cleanedMobile = mobileNumber.replace(/^0+/, '');
  const formattedPatientNumber = countryCode + cleanedMobile;

  // const userName = child.Child.User?.MobileNumber ? child.Child.User.MobileNumber : '';
  const password = child.Child.User.Password ? child.Child.User.Password : '******';
  const message = encodeURIComponent(
    `Reminder: Follow-up visit for ${childName} is scheduled on ${nextVisitDate}.\n` +
    `Please confirm your appointment.\n` +
    `Login at https://client.vaccinationcentre.com\nUsername: ${formattedPatientNumber}\nPassword: ${password}\n` +
    `Thanks, Baby Medics`
  );

  let whatsappUrl: string;
  if (this.platform.is('android') || this.platform.is('ios')) {
    whatsappUrl = `whatsapp://send?phone=${formattedPatientNumber}&text=${message}`;
  } else {
    whatsappUrl = `https://web.whatsapp.com/send?phone=${formattedPatientNumber}&text=${message}`;
  }
  window.open(whatsappUrl, '_system');

  // Fire-and-forget: persist "sent" so the tick survives reload/logout-login.
  this.followupService.markFollowupAlertSent(child.Id).subscribe(
    () => { child.AlertSentAt = new Date(); },
    (err) => console.error('Error marking follow-up alert sent:', err)
  );
}
}
