import { Component, OnInit } from '@angular/core';
import { LoadingController } from "@ionic/angular";
import { ToastService } from "src/app/shared/toast.service";
import { environment } from "src/environments/environment";
import { Storage } from "@ionic/storage";
import { BirthdayService } from "src/app/services/birthday.service";
import { Platform } from '@ionic/angular';
import { ClinicService } from "src/app/services/clinic.service";
import { PaService } from "src/app/services/pa.service";
import { Downloader, DownloadRequest, NotificationVisibility } from '@ionic-native/downloader/ngx';

@Component({
  selector: 'app-birthday-alert',
  templateUrl: './birthday-alert.page.html',
  styleUrls: ['./birthday-alert.page.scss'],
})
export class BirthdayAlertPage implements OnInit {
  selectedDate: string = new Date().toISOString();
  formattedDate: string;
  doctorId: any;
  docname: string = '';
  clinic: string = '';
  clinics: any;
  firstClinic: string = '';
  birthdayChild: any[] = [];
  usertype: any;
  allClinicIds: number[] = [];

  // Clinic filter: default 'all' = merged across every accessible clinic.
  allChilds: any[] = [];
  selectedClinicId: number | 'all' = 'all';
  clinicPickerOpen = false;
  clinicPickerSearch = '';

  private readonly API_VACCINE = `${environment.BASE_URL}`;
  constructor(
    public loadingController: LoadingController,
    private birthdayService: BirthdayService,
    private toastService: ToastService,
    private storage: Storage,
    public platform: Platform,
    private downloader: Downloader,
    public clinicService: ClinicService,
    private paService: PaService,
  ) { }

  async ngOnInit() {
    this.usertype = await this.storage.get(environment.USER);
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);

    // Doctor display name/clinic list for the WhatsApp message body — doctor-only lookup.
    // PA sessions skip this and fall back to each child's own ClinicName (see openWhatsApp).
    if (this.doctorId && !(this.usertype && this.usertype.UserType === 'PA')) {
      this.loadDoctorDetails(this.doctorId);
    }

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
            this.getAllClinicsBirthdays();
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

  async getAllClinicsBirthdays(): Promise<void> {
    if (!this.allClinicIds || this.allClinicIds.length === 0) return;

    const loading = await this.loadingController.create({
      message: "Loading...",
      spinner: "circles",
    });
    await loading.present();

    const isPA = this.usertype && this.usertype.UserType === 'PA';
    const paId = isPA ? Number(this.usertype.PAId) : undefined;
    const doctorId = isPA ? undefined : Number(this.doctorId);

    try {
      const requests = this.allClinicIds.map(clinicId =>
        this.birthdayService.getBirthdayAlertForClinic(clinicId, this.formattedDate, paId, doctorId)
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
          this.toastService.create('Error loading birthday alerts', 'danger');
        }
      );
    } catch (error) {
      loading.dismiss();
      this.toastService.create('Error loading birthday alerts', 'danger');
    }
  }

  // ---------- clinic filter ----------
  applyClinicFilter() {
    this.birthdayChild = this.selectedClinicId === 'all'
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

  formatDateToString(date: string | Date): string {
    const d = new Date(date);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${month}-${day}`;
  }

  onDateChange(event: any) {
    this.selectedDate = event.value;
    this.formattedDate = this.formatDateToString(this.selectedDate);
    this.getAllClinicsBirthdays();
  }

  // Note: intentionally does NOT touch this.clinics — that's owned by loadClinics() and
  // feeds the clinic filter picker. This only sets docname/clinic (message-body fallback text).
  loadDoctorDetails(doctorId: number) {
    this.birthdayService.loadDoctorDetails(doctorId).subscribe(
      (res) => {
        if (res.IsSuccess) {
          const DoctorDetails = res.ResponseData;
          this.docname = DoctorDetails.DisplayName;
          const doctorClinics = Array.isArray(DoctorDetails.Clinics) ? DoctorDetails.Clinics : [];
          if (doctorClinics.length > 0) {
            const firstClinic = doctorClinics[0];
            this.clinic = (typeof firstClinic === 'object' && firstClinic !== null)
              ? (firstClinic.Name || firstClinic.ClinicName || "Unknown Clinic")
              : "Unknown Clinic";
          } else {
            this.clinic = "Unknown Clinic";
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

  async sendemails() {
    const loading = await this.loadingController.create({
      message: "Sending birthday emails"
    });
    await loading.present();
    await this.birthdayService.sendEmailToAll(this.doctorId).subscribe(
      res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create("Birthday emails sent successfull", "success");
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

   downloadcsv() {
      let query = '';
      this.birthdayChild.map((x) => x.Id).forEach((Id) => {
        if (Id) {
          query += 'arr[]=' + Id + '&';
        }
      });
    
      const url = `${this.API_VACCINE}Birthday/export-birthdays-csv?${query}`;
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

  // AlertSentAt is only shown as a tick if it falls within the current calendar year —
  // an annual birthday wish naturally "resets" every year with no cleanup job needed.
  isBirthdayAlertSentThisYear(child: any): boolean {
    if (!child.LastBirthdayAlertSentAt) return false;
    return new Date(child.LastBirthdayAlertSentAt).getFullYear() === new Date().getFullYear();
  }

  trackByChildId(_index: number, child: any): any {
    return child.Id;
  }

  openWhatsApp(mobileNumber: string, childName: string, birthDate: string, child: any) {
    if (mobileNumber.trim() === '') {
      alert('Invalid mobile number. Please provide a valid number.');
      return;
    }

    const clinicName = child.ClinicName || this.clinic || 'Unknown Clinic';
    const message = encodeURIComponent(
      `🎉 *Happy Birthday, ${childName}!* 🎂\n\n` +
      `Wishing you a day filled with joy, laughter, and happiness! May your year ahead be full of success and good health. 🎈\n\n` +
      `🎁 *Date of Birth:* ${birthDate}\n` +
      `🏥 *Clinic:* ${clinicName}\n\n` +
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

    // Fire-and-forget: persist "sent" so the tick survives reload/logout-login.
    this.birthdayService.markBirthdayAlertSent(child.Id).subscribe(
      () => { child.LastBirthdayAlertSentAt = new Date(); },
      (err) => console.error('Error marking birthday alert sent:', err)
    );
  }
}