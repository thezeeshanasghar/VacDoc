import { Component, OnInit } from "@angular/core";
import { Route, ActivatedRoute, Router } from "@angular/router";
import { LoadingController } from "@ionic/angular";
import { BulkService } from "src/app/services/bulk.service";
import { ToastService } from "src/app/shared/toast.service";
import { InvoiceService } from "src/app/services/invoice.service";
import { FormBuilder, FormGroup, FormControl, Validators } from "@angular/forms";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import * as moment from "moment";
import { AlertController } from '@ionic/angular';
import { elementAt } from 'rxjs/operators';
import { Downloader, DownloadRequest, NotificationVisibility } from '@ionic-native/downloader/ngx';
import { Platform } from '@ionic/angular';
import { ClinicService } from "src/app/services/clinic.service";
import { PaService } from "src/app/services/pa.service";
@Component({
  selector: "app-bulk",
  templateUrl: "./bulk.page.html",
  styleUrls: ["./bulk.page.scss"]
})
export class BulkInvoicePage implements OnInit {
  childId: any;
  doctorId: any;
  clinicId: any;
  currentDate: any;
  currentDate1: any;
  bulkData: any;
  fg: FormGroup;
  consultationfee: number = 0;
  private readonly API_VACCINE = `${environment.BASE_URL}`
  BrandIds = [];
  usertype: any;
  invoiceData: any;
  bulkDatadiff: any;
  invoiceStatus: any = { isSubmitted: false, editCount: 0, canEdit: true };
  paId: any = null;
  parentDownloadedWarning: boolean = false;
  // Fee-only mode (routed from the OHF "CHARGE FEE" action on vaccine.page.html):
  // no clinic stock was used for any dose on this date, so there's no vaccine
  // cost to bill — every Amount is locked at 0 and only ConsultationFee is
  // editable. Reuses this same screen/endpoint; nothing else changes.
  feeOnly: boolean = false;
  // invoiceNumber: string;
  constructor(
    private loadingController: LoadingController,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private bulkService: BulkService,
    private toastService: ToastService,
    private storage: Storage,
    public alertController: AlertController,
    private downloader: Downloader,
    public platform: Platform,
    private invoiceService: InvoiceService,
    private clinicService: ClinicService,
    private paService: PaService
  ) { }

  hasActiveValidations(): boolean {
    return (this.fg.get('ConsultationFee').invalid && (this.fg.get('ConsultationFee').dirty || this.fg.get('ConsultationFee').touched)) ||
      (this.bulkData && Array.isArray(this.bulkData) && this.bulkData.some(bulk => isNaN(Number(bulk.Amount))));
  }


  // Validations on amount
  bulk = { Amount: '' };
  isValidInput = true;

  validateInput(event: any) {
    const inputValue: string = event.target.value;
    this.isValidInput = /^\d*$/.test(inputValue);
  }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
      this.loadInvoiceStatus();
      this.loadInvoiceWarning();
    });
    this.storage.get(environment.CLINIC_Id).then(val => { this.clinicId = val; });
    this.childId = this.activatedRoute.snapshot.paramMap.get("id");
    this.currentDate = this.activatedRoute.snapshot.paramMap.get("childId");
    this.feeOnly = this.activatedRoute.snapshot.queryParamMap.get("feeOnly") === "1";
    // const storedInvoiceId = localStorage.getItem('invoiceId');
    // console.log('Stored Invoice ID:', storedInvoiceId);
    this.currentDate1 = new Date(this.currentDate);
    this.getBulk();
    this.fg = this.formBuilder.group({
      IsConsultationFee: this.feeOnly ? true : false,
      ConsultationFee: [null, Validators.pattern('^[0-9]*$')] // Add Validators.pattern to allow only numbers
    });
    this.loadConsultationFeeFromOnlineClinic();

    this.storage.get(environment.USER).then((user) => {
      if (user) {
        this.usertype = user.UserType;
        if (user.UserType === 'PA') {
          this.paId = user.PAId || null;
        }
      } else {
        console.error('No user data found in storage.');
      }
    });
  }

  loadInvoiceStatus() {
    if (!this.doctorId || !this.childId || !this.currentDate) { return; }
    const dateStr = new Date(this.currentDate).toISOString().split('T')[0];
    this.bulkService.getInvoiceStatus(this.childId, this.doctorId, dateStr).subscribe({
      next: (res: any) => { this.invoiceStatus = res || { isSubmitted: false, editCount: 0, canEdit: true }; },
      error: () => {}
    });
  }

  loadInvoiceWarning() {
    if (!this.childId || !this.currentDate) { return; }
    const dateStr = new Date(this.currentDate).toISOString().split('T')[0];
    const url = `${this.API_VACCINE}child/${this.childId}/${dateStr}/invoice-warning`;
    fetch(url, { headers: { 'Content-Type': 'application/json' } })
      .then(r => r.json())
      .then((res: any) => { this.parentDownloadedWarning = res.parentDownloaded === true; })
      .catch(() => {});
  }

  loadConsultationFeeFromOnlineClinic() {
    this.storage.get(environment.USER).then((user) => {
      if (!user) {
        this.loadConsultationFeeFromStoredOnlineClinic();
        return;
      }

      if (user.UserType === 'PA' && user.PAId) {
        this.paService.getPaClinics(Number(user.PAId)).subscribe(
          (res) => {
            if (res && res.IsSuccess && Array.isArray(res.ResponseData)) {
              const onlineClinic = res.ResponseData.find((clinic) => clinic.IsOnline) || res.ResponseData[0];
              this.setConsultationFeeFromClinic(onlineClinic);
            } else {
              this.loadConsultationFeeFromStoredOnlineClinic();
            }
          },
          () => this.loadConsultationFeeFromStoredOnlineClinic()
        );
        return;
      }

      const doctorId = user.DoctorId || this.doctorId;
      if (!doctorId) {
        this.loadConsultationFeeFromStoredOnlineClinic();
        return;
      }

      this.clinicService.getClinics(Number(doctorId)).subscribe(
        (res) => {
          if (res && res.IsSuccess && Array.isArray(res.ResponseData)) {
            const onlineClinic = res.ResponseData.find((clinic) => clinic.IsOnline) || res.ResponseData[0];
            this.setConsultationFeeFromClinic(onlineClinic);
          } else {
            this.loadConsultationFeeFromStoredOnlineClinic();
          }
        },
        () => this.loadConsultationFeeFromStoredOnlineClinic()
      );
    });
  }

  loadConsultationFeeFromStoredOnlineClinic() {
    this.storage.get(environment.ON_CLINIC).then((clinic) => {
      this.setConsultationFeeFromClinic(clinic);
    });
  }

  // Reads THIS visit's actually-saved consultation fee from InvoiceSubmission,
  // scoped by ChildId+date (same pattern as invoice-total). If a saved invoice
  // already exists for this visit, its fee overrides the clinic-default seeded by
  // loadConsultationFeeFromOnlineClinic() above — fixing the bug where reopening an
  // invoiced dose showed a past visit's fee instead of what was actually charged
  // today. If no invoice exists yet (new visit), the clinic default stands.
  loadConsultationFeeForVisit() {
    if (!this.childId || !this.bulkData || this.bulkData.length === 0) { return; }
    const dateStr = this.resolveInvoiceDateForDisplay();
    this.invoiceService.getConsultationFeeForVisit(Number(this.childId), dateStr).subscribe(res => {
      if (res && res.IsSuccess) {
        this.fg.controls['ConsultationFee'].setValue(res.ResponseData);
        this.fg.controls['IsConsultationFee'].setValue(true);
      }
    });
  }

  setConsultationFeeFromClinic(clinic: any) {
    if (!clinic) {
      return;
    }

    if (clinic.Id) {
      this.storage.set(environment.ON_CLINIC, clinic);
      this.storage.set(environment.CLINIC_Id, clinic.Id);
    }

    if (clinic.ConsultationFee != null) {
      this.fg.controls['ConsultationFee'].setValue(clinic.ConsultationFee);
    }
  }
//   loadInvoiceData() {
//     const storedInvoiceId = localStorage.getItem('invoiceId');
//     if (storedInvoiceId) {
//       this.invoiceService.getInvoiceById(storedInvoiceId).subscribe(
//         (res) => {
//           if (res && res.InvoiceId) {
//             console.log(res.InvoiceId);
//             this.invoiceNumber = res.InvoiceId; // Store the invoice number
//           } else {
//           console.error('Failed to fetch invoice data.');
//         }
//       },
//       (error) => {
//         console.error('Error fetching invoice data:', error);
//       }
//     );
//   }
// }

  async getBulk() {
    let data = { ChildId: this.childId, Date: this.currentDate1 };
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.bulkService.getBulk(data).subscribe(
      res => {
        if (res.IsSuccess) {
          // Spec §3.3: only given, non-skipped doses are billable.
          this.bulkData = res.ResponseData.filter(x => x.IsDone == true && !x.IsSkip);
          if (this.feeOnly) {
            // No clinic stock used — nothing to bill per dose, only the
            // consultation/vaccination fee below.
            this.bulkData.forEach(item => { item.Amount = 0; });
          }
          // console.log(this.bulkData);
          // console.log(res.ResponseData);
          this.bulkDatadiff = this.bulkData.map(item => {
              // console.log(item.Dose.Id);
              this.getAmount(item.Id, item.Dose.Id, this.childId);
          });
          this.loadConsultationFeeForVisit();
        } else {
          this.toastService.create(res.Message, "danger");
        }
        loading.dismiss();
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  // Prefer the actual given date — money/stock/PA-assignment are all keyed on it,
  // and it's the exact value loadInvoiceExistence() looks up the invoice by.
  // GivenDate arrives as a "DD-MM-YYYY" string (OnlyDateConverter on the API side) —
  // must be parsed with that explicit format, NOT new Date(), which reads ambiguous
  // strings as MM-DD-YYYY and silently swaps day/month for any day-of-month <= 12
  // (e.g. "08-06-2026" => Aug 6 instead of Jun 8). Strict mode rejects the
  // null/default-date edge case ("01-01-0001").
  //
  // Returns a bare "YYYY-MM-DD" string — NOT a Date object. HttpClient JSON-serializes
  // Date objects via toISOString() (UTC), and the backend deserializes that into a
  // DateTime with Kind=Utc; .Date then truncates "local midnight" to the PREVIOUS day
  // whenever the device's local timezone is ahead of UTC (PKT always is, UTC+5). A bare
  // date string has no timezone component, so it's parsed as Kind=Unspecified at
  // midnight — .Date is then exact.
  //
  // Returns null when no valid GivenDate can be found — this.bulkData is already
  // filtered to IsDone==true rows (getBulk() above), so a given dose with no parseable
  // GivenDate means that dose's own record is broken, not just this screen. Callers
  // decide what to do with null: buildInvoiceDTO() (the actual invoice write) must NOT
  // silently substitute the due-date bucket here — a real invoice #176 was found live in
  // production with InvoiceDate 5 months after its own SubmittedAt because this used to
  // fall back to `this.currentDate1` (the due-date route param) unconditionally, and that
  // fabricated date then propagates into every report that filters by InvoiceDate
  // (Dashboard, P&L, StockController sales report, PA reconciliation). The lenient
  // due-date fallback still exists as resolveInvoiceDateForDisplay() below, used only for
  // the non-critical consultation-fee prefill lookup.
  private resolveInvoiceDate(): string | null {
    const givenDateRaw = this.bulkData && this.bulkData.length > 0 ? this.bulkData[0].GivenDate : null;
    if (givenDateRaw) {
      const parsed = moment(givenDateRaw, "DD-MM-YYYY", true);
      if (parsed.isValid() && parsed.year() > 2020) {
        return parsed.format("YYYY-MM-DD");
      }
    }
    return null;
  }

  // Lenient variant for loadConsultationFeeForVisit()'s prefill lookup only — falling
  // back to the due-date bucket there just means the fee-prefill lookup might miss (the
  // clinic-default fee stands instead), never that a wrong date gets written anywhere.
  private resolveInvoiceDateForDisplay(): string {
    return this.resolveInvoiceDate() || moment(this.currentDate1 || new Date()).format("YYYY-MM-DD");
  }

  // Throws when no valid GivenDate exists among the billed doses — callers must catch
  // this and stop before calling updateVaccineInvoice, instead of sending a fabricated
  // InvoiceDate. See resolveInvoiceDate()'s comment for why this can't just fall back.
  buildInvoiceDTO(consultationFee: number): any {
    const invoiceDate = this.resolveInvoiceDate();
    if (!invoiceDate) {
      throw new Error(
        "Can't determine the actual given date for this visit — the dose record may be corrupted. " +
        "Please correct the given date on the dose before invoicing."
      );
    }
    const schedules = (this.bulkData || []).map((schedule: any) => ({
      Id: schedule.Id,
      Amount: schedule.Amount
    }));
    return {
      Schedules: schedules,
      ChildId: Number(this.childId),
      DoctorId: Number(this.doctorId),
      PaId: this.paId ? Number(this.paId) : null,
      ClinicId: this.clinicId ? Number(this.clinicId) : null,
      InvoiceDate: invoiceDate,
      ConsultationFee: consultationFee
    };
  }

  onSubmit() {
    let dto: any;
    try {
      dto = this.buildInvoiceDTO(this.fg.value.IsConsultationFee ? Number(this.fg.value.ConsultationFee) : 0);
    } catch (e) {
      this.toastService.create(e.message, "danger");
      return;
    }
    this.fillVaccine(dto);
  }

  async fillVaccine(dto: any) {
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();
    await this.bulkService.updateVaccineInvoice(dto).subscribe(
      (res: any) => {
        if (res.IsSuccess) {
          this.toastService.create("Successfully Updated");
          this.loadInvoiceStatus();
          this.router.navigate(["/members/child/vaccine/" + this.childId]);
          loading.dismiss();
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, "danger");
        }
      },
      (err: any) => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  async saveanddownload() {
    if (this.parentDownloadedWarning) {
      const alert = await this.alertController.create({
        header: 'Warning',
        message: 'The parent has already downloaded this invoice. Saving will cancel the current invoice and issue a new invoice number. Do you want to continue?',
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Continue', handler: () => { this.doSaveAndDownload(); } }
        ]
      });
      await alert.present();
    } else {
      this.doSaveAndDownload();
    }
  }

  private async doSaveAndDownload() {
    this.consultationfee = this.fg.value.IsConsultationFee ? Number(this.fg.value.ConsultationFee) : 0;
    let dto: any;
    try {
      dto = this.buildInvoiceDTO(this.consultationfee);
    } catch (e) {
      this.toastService.create(e.message, "danger");
      return;
    }
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();
    this.bulkService.updateVaccineInvoice(dto).subscribe(
      (res: any) => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.loadInvoiceStatus();
          this.download(this.childId, this.currentDate, this.consultationfee);
          this.router.navigate(["/members/child/vaccine/" + this.childId]);
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, "danger");
        }
      },
      (err: any) => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

getAmount(id: string, doseId: string, childId: string) {
  // Fee-only mode: no clinic stock was used, so there's no vaccine cost to
  // suggest a price for — leave every dose's Amount at 0 (set in getBulk())
  // instead of overwriting it with the server's normal per-brand price lookup.
  if (this.feeOnly) { return; }
  this.invoiceService.getAmount(id, doseId, childId, this.clinicId).subscribe(res => {
    if (res.IsSuccess) {
      const bulkItem = this.bulkData.find(item => item.Dose.Id === doseId);
      if (bulkItem) { bulkItem.Amount = res.ResponseData; }
    }
  });
}

// hasAnyInvoiceId(): boolean {
//   console.log(Array.isArray(this.bulkData) && this.bulkData.some(bulk => !!bulk.InvoiceId));
//   return Array.isArray(this.bulkData) && this.bulkData.some(bulk => !!bulk.InvoiceId);
// }

  download(id, date, fee) {
    const today = new Date(date); // Use the provided date instead of today's date
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-indexed
    const day = today.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    if (this.platform.is('desktop') || this.platform.is('mobileweb')) {
      const url = `${this.API_VACCINE}child/${id}/${formattedDate}/${formattedDate}/${fee}/Verify-Invoice-PDF`;
      window.open(url);
    } else {
      var request: DownloadRequest = {
        uri: `${this.API_VACCINE}child/${id}/${formattedDate}/${fee}/Download-Invoice-PDF`,
        title: 'Invoice',
        description: '',
        mimeType: '',
        visibleInDownloadsUi: true,
        notificationVisibility: NotificationVisibility.VisibleNotifyCompleted,
        destinationInExternalFilesDir: {
          dirType: 'Downloads',
          subPath: 'Invoice.pdf'
        }
      };
      this.downloader.download(request)
        .then((location: string) => console.log('File downloaded at:' + location))
        .catch((error: any) => console.error(error));
    }
  }
}
