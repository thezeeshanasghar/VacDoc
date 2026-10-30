import { ScheduleVisitModel, emptyVisit, visitPayload, rememberArea } from 'src/app/shared/schedule-visit/schedule-visit.component';
import { Component, OnInit, ViewChild, ChangeDetectorRef } from "@angular/core";
import { LoadingController, IonContent, PopoverController, ActionSheetController } from "@ionic/angular";
import { VaccineService } from "src/app/services/vaccine.service";
import { ScheduleService } from "src/app/services/schedule.service";
import { ToastService } from "src/app/shared/toast.service";
import { ActivatedRoute, Router } from "@angular/router";
import { BulkService } from "src/app/services/bulk.service";
import { AlertController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { Downloader, DownloadRequest, NotificationVisibility } from '@ionic-native/downloader/ngx';
import { Storage } from '@ionic/storage';
import { Platform } from '@ionic/angular';
import { FormBuilder, FormGroup } from "@angular/forms";
import { PaService } from "src/app/services/pa.service";
import { ManagerService } from "src/app/services/manager.service";
import { InvoiceService } from "src/app/services/invoice.service";
import { AuditPopoverComponent } from "./audit-popover/audit-popover.component";
import { PdfOptionsPopoverComponent } from "./pdf-options-popover/pdf-options-popover.component";
import { AuthSession } from 'src/app/services/auth-session';
import { today, dayOf, parseDay, diffDays, toLegacyDay, dayFromPicker, formatInstant, addMonths, addYears, addDays as dayAdd } from 'src/app/shared/time';

@Component({
  selector: "app-vaccine",
  templateUrl: "./vaccine.page.html",
  styleUrls: ["./vaccine.page.scss"]
})
export class VaccinePage {
  @ViewChild(IonContent, { static: false }) content: IonContent;
  vaccine: any[] = [];
  specialvaccineids: any[] = [];
  dataGrouping: { [date: string]: any[] } = {};
  vaccinesData = [];
  childId: any;
  alphabetically: any;
  Pneum2Date: any;
  BirthYear: any;
  ChildName: string;
  fgAddData: FormGroup;
  private readonly API_VACCINE = `${environment.BASE_URL}`
  type: string;
  istravel: boolean = true;
  usertype: any;
  paId: number = null;
  managerId: number = null;
  canAssignPa: boolean = false;
  canEditInvoiceAsManager: boolean = false;
  retryCount = 0;
  maxRetries = 3;
  canGiveVaccine = true;
  canUngiveVaccine = true;
  canReschedule = true;
  canBulkGive = true;
  canBulkUngive = true;
  canBulkReschedule = true;
  canInvoice = true;
  canAddParams = true;
  canPrint = true;
  canSkip = true;
  canUnskip = true;
  canEditSchedule = true;
  doctorId: number = null;
  callerUserId: number = null;
  securityStamp: string = null;
  clinicId: number = null;
  clinicPAs: any[] = [];
  assignPopupOpen: boolean = false;
  assignPopupLoading: boolean = false;
  assigningPA: boolean = false;
  // Every assignment is its own entity (one per pressed vaccine group): the page holds ALL of this
  // child's open assignments and resolves each date-group against the assignment that pins it.
  childAssignments: any[] = [];
  pendingReassignAsg: any = null;
  activeAssignmentLoading: boolean = false;
  reassignPopupOpen: boolean = false;
  paGuidelines: string = '';
  paTargetDate: string = '';
  assignVisit: ScheduleVisitModel = emptyVisit();
  pendingAssignPA: any = null;
  pendingAssignScheduleIds: number[] = [];
  pendingAssignGroupIds: number[] = [];
  pendingReassignPA: any = null;
  paymentPopupOpen: boolean = false;
  paymentTargetScheduleId: number = null;
  paymentTargetScheduleIds: number[] = [];
  paymentDueAmount: number = 0;
  // Growth gate before payment (PA + regular child). growthSheetOpen shows the box;
  // pendingGrowth rides along on each recordPaymentMode call of the visit.
  growthSheetOpen: boolean = false;
  growthW: string = '';
  growthH: string = '';
  growthO: string = '';
  growthNotMeasured: boolean = false;
  growthOfcEnabled: boolean = true;   // OFC is unfillable from the child's 2nd birthday
  pendingGrowth: any = null;
  private growthResume: { scheduleId: number, group: any[] } | null = null;
  canCollectPayment = true;
  invoiceExistsMap: { [date: string]: boolean } = {};
  invoiceAmountMap: { [date: string]: number } = {};
  // Stage-4 (paid) override support (spec §3.4a): per-date invoice ownership/edit
  // window, from the existing GET schedule/invoice-status endpoint (already used
  // by bulkinvoice.page.ts) — no new backend endpoint needed.
  invoiceStatusMap: { [date: string]: { isSubmitted: boolean; editCount: number; canEdit: boolean; submittedByPaId: number | null; isPrePaymentSystem?: boolean } } = {};

  isFilledToday(doneAt: any): boolean {
    if (!doneAt) return false;
    return dayOf(doneAt) === today();
  }

  private isInfiniteVaccine(data: any): boolean {
    const dose = data && data.Dose ? data.Dose : null;
    const vaccine = dose && dose.Vaccine ? dose.Vaccine : null;
    const flag = !!(vaccine && vaccine.isInfinite);
    const doseName = ((dose && dose.Name) || '').toString().toLowerCase();
    const vaccineName = ((vaccine && vaccine.Name) || '').toString().toLowerCase();
    const fullName = `${doseName} ${vaccineName}`;

    return flag
      || doseName.startsWith('flu')
      || doseName.startsWith('typhoid')
      || fullName.includes('vitamin a');
  }

  constructor(
    public loadingController: LoadingController,
    public route: ActivatedRoute,
    public router: Router,
    private vaccineService: VaccineService,
    private bulkService: BulkService,
    private toastService: ToastService,
    public alertController: AlertController,
    private downloader: Downloader,
    private storage: Storage,
    public platform: Platform,
    private formBuilder: FormBuilder,
    private scheduleService: ScheduleService,
    private paService: PaService,
    private managerService: ManagerService,
    private invoiceService: InvoiceService,
    private popoverController: PopoverController,
    private actionSheetController: ActionSheetController,
    private cdr: ChangeDetectorRef,
  ) {
    this.type = '';
  }

  ionViewWillEnter() {
    this.childId = this.route.snapshot.paramMap.get("id");
    this.vaccinesData = [];
    this.getVaccination();
    // this.removal();
    this.fgAddData = this.formBuilder.group({
      'DoctorId': [''],
      'IsDone': [null],
      // 'Weight': [null],
      // 'Height': [null],
      // 'Circle': [null],
      'BrandId': [null],
      // 'GivenDate': [null],
      'IsDisease': [false],
      'DiseaseYear': ['2019'],
      'DoseId': [null],
      'ChildId': [null],
      'Date': [null]
    });
    this.loadUserAndPAs();
    this.loadRefusalFlag();
  }

  ngOnInit() {}

  // Golden "refused at home" marker data (doctor view only renders it)
  refusalFlag: any = null;

  private loadRefusalFlag() {
    this.refusalFlag = null;
    this.paService.getRefusalFlag(Number(this.childId)).subscribe(
      res => { this.refusalFlag = (res && res.IsSuccess) ? res.ResponseData : null; },
      () => { this.refusalFlag = null; }
    );
  }

  private loadUserAndPAs() {
    this.storage.get(environment.USER).then((user) => {
      if (!user) { console.error('No user data found in storage.'); return; }
      this.usertype = user.UserType;
      this.callerUserId = user.Id ? Number(user.Id) : null;
      this.storage.get(environment.SECURITY_STAMP).then(stamp => { this.securityStamp = stamp || null; });
      if (user.UserType === 'PA') {
        this.paId = Number(user.PAId) || null;
        // invoice-status is keyed by DoctorId, not PaId — bulkinvoice.page.ts reads
        // this same storage key unconditionally for both user types.
        this.storage.get(environment.DOCTOR_Id).then(val => {
          this.doctorId = val ? Number(val) : null;
          // getVaccination() may have already run and skipped loadInvoiceStatuses()
          // because doctorId wasn't loaded yet — retry now that it is.
          if (this.doctorId && Object.keys(this.dataGrouping).length > 0) {
            this.loadInvoiceStatuses();
          }
        });
        this.paService.getPaPermissions(Number(user.PAId)).subscribe(perm => {
          this.canGiveVaccine    = (perm && perm.GiveVaccine)        || false;
          this.canUngiveVaccine  = (perm && perm.UngiveVaccine)      || false;
          this.canReschedule     = true; // single-dose reschedule is available to all PAs, not gated by permission
          this.canBulkGive       = (perm && perm.BulkGiveVaccines)   || false;
          this.canBulkUngive     = (perm && perm.BulkUngiveVaccines) || false;
          this.canBulkReschedule = (perm && perm.BulkReschedule)     || false;
          this.canInvoice        = (perm && perm.ManageInvoice)      || false;
          this.canCollectPayment = (perm && perm.GiveVaccine)        || false;
          this.canAddParams      = (perm && perm.AddVaccineParams)   || false;
          this.canPrint          = (perm && perm.PrintSchedulePdf)   || false;
          this.canSkip           = (perm && perm.SkipVaccine)        || false;
          this.canUnskip         = (perm && perm.UnskipVaccine)      || false;
          this.canEditSchedule   = (perm && perm.EditVaccineSchedule)|| false;
        });
        this.loadActivePAAssignment();
      }
      if (user.UserType === 'DOCTOR') {
        this.doctorId = user.DoctorId ? Number(user.DoctorId) : null;
        this.storage.get(environment.ON_CLINIC).then(clinic => {
          this.clinicId = clinic ? Number(clinic.Id) : null;
          if (this.clinicId) {
            this.paService.getPAsForClinic(this.clinicId).subscribe(res => {
              if (res && res.IsSuccess) { this.clinicPAs = res.ResponseData || []; }
            });
          }
          this.loadActiveAssignment();
        });
      }
      if (user.UserType === 'MANAGER') {
        this.managerId = user.ManagerId ? Number(user.ManagerId) : null;
        this.storage.get(environment.DOCTOR_Id).then(val => { this.doctorId = val ? Number(val) : null; });
        if (this.managerId) {
          this.managerService.getManagerPermissions(this.managerId).subscribe(perm => {
            this.canAssignPa            = (perm && perm.AssignPaToPatient) || false;
            this.canGiveVaccine         = (perm && perm.CanGiveVaccine)    || false;
            this.canUngiveVaccine       = (perm && perm.CanGiveVaccine)    || false;
            this.canBulkGive            = (perm && perm.CanGiveVaccine)    || false;
            this.canBulkUngive          = (perm && perm.CanGiveVaccine)    || false;
            // Manager never collects/records payment mode (the assigned PA does) — only
            // sees the invoice-menu entry point (for CanEditInvoice), never PAYMENT itself.
            this.canCollectPayment      = false;
            this.canInvoice             = (perm && perm.CanEditInvoice)    || false;
            this.canEditInvoiceAsManager = (perm && perm.CanEditInvoice)   || false;
          });
        }
        // Manager has no "online clinic" — the relevant clinic for the PA picker is
        // this patient's own clinic (Child.ClinicId), populated once getVaccination()
        // resolves it below, not a storage key Manager never writes to.
        this.loadActiveAssignment();
      }
    });
  }

  // Manager-only: called once getVaccination() resolves the patient's own Child.ClinicId,
  // since Manager has no ON_CLINIC storage concept to read clinicId from up front (unlike
  // Doctor, whose "online clinic" is fixed and known before the page even loads).
  private loadClinicPAsForManager(clinicId: number) {
    if (!clinicId || this.clinicPAs.length > 0) { return; }
    this.clinicId = clinicId;
    this.paService.getPAsForClinic(clinicId).subscribe(res => {
      if (res && res.IsSuccess) { this.clinicPAs = res.ResponseData || []; }
    });
  }

  handleSkipClick(event: Event, id: number, doseName: string) {
    event.preventDefault();
    event.stopPropagation();
    this.SkipVaccine(id, doseName);
  }

  handleUnSkipClick(event: Event, id: number, doseName: string) {
    event.preventDefault();
    event.stopPropagation();
    this.UnSkipVaccine(id, doseName);
  }

  // generateInvoice(item: any): void {
  //   const invoiceDTO = {
  //     amount: 0,
  //     childId: this.childId  // Use the existing childId property
  //   };

  //   console.log(invoiceDTO);
  //   this.invoiceService.CreateInvoice(invoiceDTO).subscribe(
  //     (res) => {
  //       // Assuming res contains the created invoice details
  //       console.log(res);
  //       if (res && res.InvoiceId) {  // Adjust this check based on your actual API response structure
  //         console.log("Invoice created successfully.");
  //         console.log(res.Id);
  //         localStorage.setItem('invoiceId', res.Id);
  //         const url = `/members/child/vaccine/${this.childId}/bulkinvoice/${item.key}`;
  //         this.router.navigateByUrl(url)
  //       } else {
  //         console.log("Failed to create invoice.");
  //       }
  //     },
  //     (error) => {
  //       console.error('Error creating invoice:', error);
  //       this.toastService.create('Error creating invoice.', "danger");
  //     }
  //   );
  // }

  checkVaccineIsDon(data): boolean {
    for (let i = 0; i < data.length; i++) {
      if (!data[i].IsDone) { return false; }
    }
    return true;
  }

  anyVaccineGiven(data: any[]): boolean {
    return data.some(v => v.IsDone && !v.Due2EPI);
  }

  // ── EPI-historical detection (govt EPI programme doses, not clinic-given) ──
  // Due2EPI exists on the DTO but the backend's InsertEpiHistoryDoses (the ONLY
  // writer of these rows, at EPI Plus registration time) never sets it — it's
  // always false on these rows, so it can't be used alone here. Instead: a dose
  // is EPI-historical when the child was registered EPI Plus (Child.IsEPIDone),
  // the dose is already done, and it carries no real clinic give trail (no brand
  // recorded, not given by a PA) — the two things InsertEpiHistoryDoses never
  // stamps but every real clinic/OHF give does attribute to an actor.
  isEpiHistoricalDose(v: any): boolean {
    return !!(v && v.IsDone && v.Child && v.Child.IsEPIDone && !v.BrandId && !v.GivenByPaId);
  }
  // A date-group is EPI-historical only when EVERY dose in it is — a group that
  // mixes an EPI-historical dose with a real clinic dose given on the same date
  // (edge case) must still be invoiceable for the clinic-given part.
  isEpiHistoricalGroup(data: any[]): boolean {
    return !!(data && data.length > 0) && data.every(v => this.isEpiHistoricalDose(v));
  }

  // ── OHF (Other Health Facility) detection ─────────────────────────────────
  // A dose given OHF never consumed this clinic's stock (BrandId is nulled out
  // client-side before the give POST — see fill.page.ts/bulk.page.ts) — the
  // clinic has nothing to bill for it. BrandId is also null for not-yet-given
  // rows, so this only means OHF once the dose is actually done.
  isOhfDose(v: any): boolean {
    return !!(v && v.IsDone && !v.BrandId);
  }
  // Same all-or-nothing grouping as isEpiHistoricalGroup: a group that mixes an
  // OHF dose with a real clinic-stock dose on the same date must stay
  // invoiceable for the clinic-given part.
  isOhfGroup(data: any[]): boolean {
    return !!(data && data.length > 0) && data.every(v => this.isOhfDose(v));
  }

  // ── Sequential action pipeline (spec §3) ──────────────────────────────────
  // A skipped dose leaves the pipeline entirely (§3.3): never counted, given,
  // invoiced or printed. isActiveDose() = a dose still "in" the pipeline.
  isSkippedDose(v: any): boolean {
    return !!(v && v.IsSkip);
  }
  // DiseaseYear should always be a bare "YYYY" — a bulk-give bug (fixed) briefly wrote a full
  // ISO datetime instead. Normalize here so any already-saved bad rows still display cleanly.
  diseaseYearDisplay(v: any): string {
    const raw = (v && v.DiseaseYear) || '';
    if (/^\d{4}$/.test(raw)) { return raw; }
    return /^\d{4}-/.test(raw) ? raw.substring(0, 4) : raw;
  }
  isActiveDose(v: any): boolean {
    return !!v && !v.IsSkip && !v.Due2EPI;
  }
  // Doses in this group that are due (active + not yet given) — the GIVE n count.
  dueDoses(data: any[]): any[] {
    return (data || []).filter(v => this.isActiveDose(v) && !v.IsDone);
  }
  giveCount(data: any[]): number {
    return this.dueDoses(data).length;
  }
  skippedCount(data: any[]): number {
    return (data || []).filter(v => this.isSkippedDose(v)).length;
  }
  hasSkipped(data: any[]): boolean {
    return this.skippedCount(data) > 0;
  }
  // Active doses that have been given.
  givenActiveDoses(data: any[]): any[] {
    return (data || []).filter(v => this.isActiveDose(v) && v.IsDone);
  }
  // Given date for the group — bulk-give means every active dose shares one GivenDate.
  groupGivenDate(data: any[]): string {
    const given = this.givenActiveDoses(data);
    return given.length > 0 ? given[0].GivenDate : null;
  }

  /**
   * Derive the group's pipeline stage from existing dose state + invoice map.
   *   1 DUE       — one or more active doses still to give
   *   2 GIVEN     — all active doses given, no invoice yet
   *   3 INVOICED  — invoice exists, at least one done dose unpaid
   *   4 PAID      — invoice exists, all done doses paid
   * EPI-only / empty groups fall through to stage 1 (nothing to do here).
   *
   * NOTE: a stage-2 group that is EPI-historical (isEpiHistoricalGroup()) or
   * OHF (isOhfGroup()) is still reported as stage 2 here — it genuinely has
   * given, uninvoiced doses. The template is responsible for not offering
   * INVOICE for either case (see the guards in vaccine.page.html): EPI-historical
   * because the government EPI programme gave these doses for free and the
   * clinic never billed for them, OHF because the dose was given at another
   * facility and never touched this clinic's stock. Keeping the numeric stage
   * unchanged avoids disturbing every other isStage() consumer (assign-to-PA,
   * resolved card styling, stage-4 override, etc.) for a case that only
   * affects one button.
   */
  groupStage(data: any[], date: string): 1 | 2 | 3 | 4 {
    const given = this.givenActiveDoses(data);
    const anyDue = this.dueDoses(data).length > 0;
    if (anyDue || given.length === 0) { return 1; }

    const invoiced = !!this.invoiceExistsMap[date];
    if (!invoiced) { return 2; }

    const anyUnpaid = given.some(v => !v.IsPaymentCollected);
    return anyUnpaid ? 3 : 4;
  }

  isStage(data: any[], date: string, stage: number): boolean {
    return this.groupStage(data, date) === stage;
  }

  // Header sub-line copy under the group date (spec §3.1) — stage 1 (due) only.
  // Once any dose in the group is given, the header shows the given date
  // instead (see groupGivenDate) — the due date above already anchors the group.
  groupStageSubline(data: any[], date: string): string {
    const skips = this.skippedCount(data);
    const skipStr = skips > 0 ? ` · ${skips} skipped` : '';
    const n = this.giveCount(data);
    return `${n} to give${skipStr}`;
  }

  // PA picker subline + shift state (spec §4.1). Uses ONLY real fields the
  // backend sends — no fabricated "on shift". If the API doesn't provide shift
  // or schedule-count data, the subline is simply omitted.
  paSubline(pa: any): string {
    if (!pa) { return ''; }
    const parts: string[] = [];
    const count = (pa.SchedulesToday != null) ? pa.SchedulesToday
                : (pa.ScheduleCount != null) ? pa.ScheduleCount : null;
    if (count != null) { parts.push(`${count} schedule${count === 1 ? '' : 's'} today`); }
    if (pa.IsOnShift === true) { parts.push('on shift'); }
    else if (pa.IsOnShift === false) { parts.push('off shift'); }
    return parts.join(' · ');
  }
  isPaOffShift(pa: any): boolean {
    return !!pa && pa.IsOnShift === false;   // only when the flag is explicitly false
  }

  // Two-letter initials for the PA avatar (spec §4.1).
  paInitials(name: string): string {
    if (!name) { return '?'; }
    const parts = name.trim().split(/\s+/);
    const a = parts[0] ? parts[0][0] : '';
    const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (a + b).toUpperCase();
  }

  // ── Overdue helper for the row subtitle (spec §3.2) ───────────────────────
  isOverdue(v: any): boolean {
    if (!v || v.IsDone || v.IsSkip || v.Due2EPI || !v.Date) { return false; }
    const due = parseDay(v.Date);
    return !!due && due < today();
  }
  overdueLabel(v: any): string {
    const due = parseDay(v.Date);
    if (!due) { return 'overdue'; }
    const days = diffDays(today(), due);
    return days <= 0 ? 'overdue' : `overdue ${days}d`;
  }

  // ── Guarded ungive (spec §3.4, §7.3) ──────────────────────────────────────
  // Stage 2 (given, not invoiced): instant. Stage 3 (invoiced): confirm dialog
  // that spells out the invoice + stock-restore consequence before proceeding.
  // Stage 4 (paid): only reachable via canOverridePaidUngive() — a stronger
  // confirm naming the paid amount, since this also voids a paid invoice.
  async requestUngive(v: any, date: string) {
    if (v.IsPaymentCollected) {
      await this.confirmUngivePaid(v, date);
      return;
    }
    const invoiced = !!this.invoiceExistsMap[date];
    if (!invoiced) {
      // Stage 2 — instant ungive, stock restored by the backend.
      await this.UnfillVaccine(v.Id);
      return;
    }
    // Stage 3 — guarded confirm. Doctor ungive deletes the invoice immediately; PA ungive
    // leaves it intact and sends it to the doctor's Pending Reversal Approvals queue instead
    // — same asymmetry as everywhere else ungive is trusted-vs-reviewed by actor.
    const batch = v.BatchNo || v.LotNo || v.Batch || 'this batch';
    const doseName = (v.Dose && v.Dose.Name) ? v.Dose.Name : 'this dose';
    const amt = this.invoiceAmountMap[date];
    const amtLabel = amt > 0 ? ' (currently Rs ' + amt.toLocaleString() + ')' : '';
    const invoiceStr = this.usertype === 'DOCTOR'
      ? ' The invoice for this visit' + amtLabel + ' will be deleted.'
      : ' The invoice for this visit' + amtLabel + ' will be sent to the doctor for review before it\'s changed.';
    const alert = await this.alertController.create({
      header: 'Ungive ' + doseName + '?',
      cssClass: 'vac-confirm',
      message:
        'This dose is on the invoice for this visit.' + invoiceStr + ' Stock for ' + batch + ' will be restored.',
      buttons: [
        { text: 'Keep', role: 'cancel', cssClass: 'alert-btn-neutral' },
        {
          text: 'UNGIVE',
          cssClass: 'alert-btn-danger',
          handler: () => { this.UnfillVaccine(v.Id); }
        }
      ]
    });
    await alert.present();
  }

  async confirmUngivePaid(v: any, date: string) {
    const doseName = (v.Dose && v.Dose.Name) ? v.Dose.Name : 'this dose';
    const amt = this.invoiceAmountMap[date];
    const amtStr = amt > 0 ? ' (Rs ' + amt.toLocaleString() + ')' : '';
    const isDoctor = this.usertype === 'DOCTOR';
    const remaining = isDoctor ? '' : (' You have ' + (2 - (v.UngiveCount || 0)) + ' same-day ungive(s) left. This is logged for the doctor to review.');
    const invoiceAction = isDoctor
      ? 'Ungiving will permanently delete the invoice and mark this dose due again.'
      : 'Ungiving will mark this dose due again and send the invoice to the doctor for approval before anything is changed.';
    const alert = await this.alertController.create({
      header: 'Ungive paid dose?',
      cssClass: 'vac-confirm',
      message:
        doseName + ' was invoiced and marked paid' + amtStr + '. ' + invoiceAction +
        ' This cannot be undone from here.' + remaining,
      buttons: [
        { text: 'Cancel', role: 'cancel', cssClass: 'alert-btn-neutral' },
        {
          text: isDoctor ? 'Ungive & delete invoice' : 'Ungive & send for review',
          cssClass: 'alert-btn-danger',
          handler: () => { this.UnfillVaccine(v.Id); }
        }
      ]
    });
    await alert.present();
  }

  // ── Invoice options menu (spec §3.4, §3.4a) — stage 3 receipt icon, and the
  // stage-4 (paid) override icon for doctor / same-day-own-invoice PA. ───────
  // Presented via a proper Ionic ActionSheet (re-download / edit & regenerate / void).
  // "Void invoice" stays doctor-only even in the stage-4 override — a PA can
  // fix/re-download a same-day mistake but can't kill a paid invoice outright.
  async openInvoiceMenu(ev: Event, groupVaccines: any[], date: string) {
    const buttons: any[] = [
      {
        text: 'Re-download PDF',
        icon: 'download-outline',
        handler: () => {
          const fee = this.invoiceAmountMap[date] || 0;
          this.downloadInvoicePdf(this.childId, date, fee);
        }
      },
      {
        text: 'Edit & regenerate',
        icon: 'create-outline',
        handler: () => {
          this.router.navigate([`/members/child/vaccine/${this.childId}/bulkinvoice/${date}`]);
        }
      }
    ];
    if (this.usertype === 'DOCTOR') {
      buttons.push({
        text: 'Void invoice',
        icon: 'close-circle-outline',
        role: 'destructive',
        handler: () => { this.confirmVoidInvoice(groupVaccines, date); }
      });
    }
    buttons.push({ text: 'Cancel', role: 'cancel' });

    const sheet = await this.actionSheetController.create({
      header: 'Invoice',
      cssClass: 'invoice-action-sheet',
      buttons
    });
    await sheet.present();
  }

  // Re-download the already-generated PDF straight from the action sheet — no
  // navigation, no edit form. Unlike BulkInvoicePage.download() (which follows
  // an explicit Save and is allowed to (re)generate a new invoice number), this
  // must be read-only: it hits the same invoice-file lookup VacParent uses,
  // which 404s with a friendly message instead of silently minting a new
  // invoice number and voiding the one the parent may already have downloaded.
  private downloadInvoicePdf(id: any, date: string, fee: number) {
    const formattedDate = parseDay(date);

    const url = `${this.API_VACCINE}child/${id}/${formattedDate}/invoice-file`;
    if (this.platform.is('desktop') || this.platform.is('mobileweb')) {
      fetch(url, { headers: AuthSession.token ? { Authorization: 'Bearer ' + AuthSession.token } : {} }).then(res => {
        if (!res.ok) {
          this.toastService.create('No invoice PDF has been generated yet for this visit.', 'danger');
          return;
        }
        window.open(AuthSession.withToken(url));
      }).catch(() => {
        this.toastService.create('No invoice PDF has been generated yet for this visit.', 'danger');
      });
    } else {
      const request: DownloadRequest = {
        uri: AuthSession.withToken(url),
        title: 'Invoice',
        description: '',
        mimeType: '',
        visibleInDownloadsUi: true,
        notificationVisibility: NotificationVisibility.VisibleNotifyCompleted,
        destinationInExternalFilesDir: { dirType: 'Downloads', subPath: 'Invoice.pdf' }
      };
      this.downloader.download(request)
        .then((location: string) => console.log('File downloaded at:' + location))
        .catch(() => {
          this.toastService.create('No invoice PDF has been generated yet for this visit.', 'danger');
        });
    }
  }

  async confirmVoidInvoice(groupVaccines: any[], date: string) {
    const alert = await this.alertController.create({
      header: 'Void this invoice?',
      cssClass: 'vac-confirm',
      message:
        'The invoice for this visit will be voided and this group returns to the ' +
        '“not invoiced” state. The doses stay given; you can re-invoice or ungive them.',
      buttons: [
        { text: 'Keep', role: 'cancel', cssClass: 'alert-btn-neutral' },
        {
          text: 'VOID',
          cssClass: 'alert-btn-danger',
          handler: () => {
            // Locally reflect the reverse transition (stage 3 → 2). The backend
            // invoice is regenerated/rebuilt on the next invoice action.
            this.invoiceExistsMap[date] = false;
            this.cdr.detectChanges();
          }
        }
      ]
    });
    await alert.present();
  }


 async getVaccination() {
  const scrollPosition = await this.content.getScrollElement().then(element => element.scrollTop); 
  const loading = await this.loadingController.create({
    message: "Loading Vaccines"
  });
  await loading.present();

  this.vaccineService.getVaccinationById(this.childId).subscribe(
    res => {
      if (res.IsSuccess && res.ResponseData && res.ResponseData.length > 0) {
        setTimeout(() => {
          this.content.scrollToPoint(0, scrollPosition);
        }, 100);

        this.BirthYear = res.ResponseData[0].Child.DOB;
        this.storage.set('BirthYear', this.BirthYear);
        this.vaccine = res.ResponseData;
        this.ChildName = this.vaccine[0].Child.Name;
        this.type = this.vaccine[0].Child.Type;
        this.removal(this.type);

        if (this.usertype === 'MANAGER' && this.vaccine[0].Child.ClinicId) {
          this.loadClinicPAsForManager(Number(this.vaccine[0].Child.ClinicId));
        }

        this.vaccine.forEach(doc => {
          doc.Date = parseDay(doc.Date);
          if (doc.GivenDate)
            doc.GivenDate = parseDay(doc.GivenDate);
          this.vaccinesData.push({ childId: doc.Child.Id, vaccineId: doc.Dose.VaccineId, brandId: doc.BrandId });
        });

        this.storage.set("vaccinesData", this.vaccinesData);
        this.dataGrouping = this.groupBy(this.vaccine, "Date");
        this.loadInvoiceExistence();
        this.loadInvoiceStatuses();
        loading.dismiss();

      } else if (res.IsSuccess === false) {
        loading.dismiss();
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`Retrying... Attempt ${this.retryCount}`);
          setTimeout(() => {
            this.getVaccination();
          }, 2000); // wait 2 seconds before retry
        } else {
          this.toastService.create("Failed after multiple retries.");
        }

      } else {
        this.toastService.create("Vaccines Not Found! Please Add vaccines");
        loading.dismiss();
      }
    },
    err => {
      this.toastService.create("Error: server failure");
      loading.dismiss();
    }
  );
}

  groupBy(objectArray, property) {
    return objectArray.reduce(
      function (acc, obj) {
        var key = obj[property];
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(obj);
        return acc;
      },
      {}
    );
  }

  async updateDate($event, vacId) {
    // console.log($event.value);
    let newDate = $event.value;
    newDate = toLegacyDay(newDate instanceof Date ? dayFromPicker(newDate) : newDate);
    let data = { Date: newDate, Id: vacId };
    await this.vaccineService.updateVaccinationDate(data, false, false, false).subscribe(
      res => {
        if (res.IsSuccess) {
          this.getVaccination();
          this.toastService.create(res.Message);
        } else {
          //this.toastService.create(res.Message, "danger");
          this.resheduleAlert(res.Message, data, res.RuleCode);
        }
      },
      err => {
        this.toastService.create(err, "danger");
      }
    );
  }

  async updateBulkDate($event, id) {
    let newDate = $event.value; //$event.detail.value;
    newDate = toLegacyDay(newDate instanceof Date ? dayFromPicker(newDate) : newDate);
    let data = { Date: newDate, Id: id };

    await this.bulkService.updateInjectionDate(data, false, false, false).subscribe(
      res => {
        if (res.IsSuccess) {
          this.getVaccination();
          this.toastService.create(res.Message);
        } else {
          //this.toastService.create(res.Message, "danger");
          this.resheduleBulkAlert(res.Message, data, res.RuleCode);
        }
      },
      err => {
        this.toastService.create(err, "danger");
      }
    );
  }

  async resheduleAlert(message, data, ruleCode?) {
    if (ruleCode === 'BEFORE_PREV_DOSE' || message.includes('before or on the same date as the previous dose')) {
      const alert = await this.alertController.create({
        header: 'Cannot Reschedule',
        message: message,
        buttons: ['Ok']
      });
      await alert.present();
      return;
    }
    const alert = await this.alertController.create({
      header: 'Alert',
      // message: message,
      message: message,
      buttons: [
        {
          text: 'Ignore Rule',
          // role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            if (ruleCode === 'MAX_AGE') {
              this.vaccineService.updateVaccinationDate(data, true, false, false).subscribe(
                res => {
                  if (res.IsSuccess) {
                    this.getVaccination();
                    this.toastService.create(res.Message);
                  } else {
                    //this.toastService.create(res.Message, "danger");
                    this.resheduleAlert(res.Message, data, res.RuleCode);
                  }
                },
                err => {
                  this.toastService.create(err, "danger");
                }
              );
            }
            else if (ruleCode === 'MIN_AGE_FROM_DOB') {
              this.vaccineService.updateVaccinationDate(data, false, true, false).subscribe(
                res => {
                  if (res.IsSuccess) {
                    this.getVaccination();
                    this.toastService.create(res.Message);
                  } else {
                    //this.toastService.create(res.Message, "danger");
                    this.resheduleAlert(res.Message, data, res.RuleCode);
                  }
                },
                err => {
                  this.toastService.create(err, "danger");
                }
              );
            }
            else if (ruleCode === 'MIN_GAP_FROM_PREV') {
              this.vaccineService.updateVaccinationDate(data, false, false, true).subscribe(
                res => {
                  if (res.IsSuccess) {
                    this.getVaccination();
                    this.toastService.create(res.Message);
                  } else {
                    //this.toastService.create(res.Message, "danger");
                    this.resheduleAlert(res.Message, data, res.RuleCode);
                  }
                },
                err => {
                  this.toastService.create(err, "danger");
                }
              );
            }

          }
        },
        {
          text: 'Ok',
          handler: () => {
            console.log('Confirm Ok');
          }
        }
      ]
      // buttons: ['OK']
    });
    await alert.present();
  }

  async resheduleBulkAlert(message, data, ruleCode?) {
    if (ruleCode === 'BEFORE_PREV_DOSE' || message.includes('before or on the same date as the previous dose')) {
      const alert = await this.alertController.create({
        header: 'Cannot Reschedule',
        message: message,
        buttons: ['Ok']
      });
      await alert.present();
      return;
    }
    const alert = await this.alertController.create({
      header: 'Alert',
      message: message,
      buttons: [
        {
          text: 'Ignore Rule',
          // role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            if (ruleCode === 'MAX_AGE') {
              this.bulkService.updateInjectionDate(data, true, false, false).subscribe(
                res => {
                  if (res.IsSuccess) {
                    this.getVaccination();
                    this.toastService.create(res.Message);
                  } else {
                    //this.toastService.create(res.Message, "danger");
                    this.resheduleBulkAlert(res.Message, data, res.RuleCode);
                  }
                },
                err => {
                  this.toastService.create(err, "danger");
                }
              );
            }
            else if (ruleCode === 'MIN_AGE_FROM_DOB') {
              this.bulkService.updateInjectionDate(data, false, true, false).subscribe(
                res => {
                  if (res.IsSuccess) {
                    this.getVaccination();
                    this.toastService.create(res.Message);
                  } else {
                    //this.toastService.create(res.Message, "danger");
                    this.resheduleBulkAlert(res.Message, data, res.RuleCode);
                  }
                },
                err => {
                  this.toastService.create(err, "danger");
                }
              );
            }else if (ruleCode === 'MIN_GAP_FROM_PREV') {
              this.bulkService.updateInjectionDate(data, false, false, true).subscribe(
                res => {
                  if (res.IsSuccess) {
                    this.getVaccination();
                    this.toastService.create(res.Message);
                  } else {
                    //this.toastService.create(res.Message, "danger");
                    this.resheduleBulkAlert(res.Message, data, res.RuleCode);
                  }
                },
                err => {
                  this.toastService.create(err, "danger");
                }
              );
            }

          }
        }, {
          text: 'Ok',
          handler: () => {
            console.log('Confirm Ok');
          }
        }
      ]
      // buttons: ['OK']
    });
    await alert.present();
  }

  checkforpnemococal(name, DOB, Id) {
    if ((name == 'Pneumococcal # 3') || (name == 'Pneumococcal # 4')) {
      // console.log(name);
      //       const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds

    }
    else {
      this.router.navigate(["/members/child/vaccine/" + this.childId + "/fill/" + Id]);
    }
    // let Date = moment(DOB, 'DD-MM-YYYY');
    // console.log(DOB);
    // console.log(this.Pneum2Date);
  }

removal(type: string){
    // console.log(this.type);
    if(this.type === 'travel') {
     this.istravel= false;
    }
}

  printdata(event?: Event) {
    if (this.type === 'travel') {
      this.presentPdfOptions('travel', event);
    } else if (this.type === 'special') {
      this.presentPdfOptions('special', event);
    }
    else {
      if (this.platform.is('desktop') || this.platform.is('mobileweb')) {
        const url = `${this.API_VACCINE}child/${this.childId}/ScheduleVerify`;
        window.open(url);
      } else {
        this.download(this.childId);
      }
    }
  }

  // Second toolbar icon shown only for Custom ('special') schedules — downloads
  // the landscape, Travel-styled variant instead of the default portrait PDF.
  printLandscapeData(event?: Event) {
    if (this.type === 'special') {
      this.presentPdfOptions('special-landscape', event);
    }
  }

  // Travel & custom (special) schedules offer two variants: all vaccines, or
  // given-only (hide not-yet-administered / future doses). On desktop the menu
  // is anchored to the print icon (passing `event`) so it opens at the cursor;
  // on mobile we omit the event so the popover centres on screen instead of
  // hugging the top-right edge.
  async presentPdfOptions(kind: 'travel' | 'special' | 'special-landscape', event?: Event) {
    const anchorToIcon = this.platform.is('desktop') || this.platform.is('mobileweb');
    const popover = await this.popoverController.create({
      component: PdfOptionsPopoverComponent,
      event: anchorToIcon ? event : undefined,
      translucent: true,
      cssClass: anchorToIcon ? 'pdf-options-popover' : 'pdf-options-popover pdf-options-popover--centered',
    });
    await popover.present();

    const { data } = await popover.onDidDismiss();
    if (data && typeof data.includeFuture === 'boolean') {
      if (kind === 'travel') { this.downloadTravelPdf(data.includeFuture); }
      else if (kind === 'special-landscape') { this.downloadSpecialLandscapePdf(data.includeFuture); }
      else { this.downloadSpecialPdf(data.includeFuture); }
    }
  }

  download(id) {
    var request: DownloadRequest = {
      uri: AuthSession.withToken(`${this.API_VACCINE}child/${id}/Download-Schedule-PDF`),
      title: this.ChildName + '-Schedule',
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
      .then((location: string) => console.log('File downloaded at:' + location))
      .catch((error: any) => console.error(error));
  }

  async unfillbulk(item: any) {
    // console.log(item);
    let data = []
    for (const element of item.value) {
      let tempdata = {
        Id: element.Id,
        IsDone: element.isdone ? false : false,
      }
      data.push(tempdata);
    }
    const loading = await this.loadingController.create({
      message: 'Unfilling vaccine'
    });

    for (const d of data) {
      await this.UnfillVaccine(d.Id, d)
    }
  }

  async UnfillVaccine(id, Data = null) {
    const loading = await this.loadingController.create({
      message: 'Unfilling vaccine'
    });
    if (!Data) {
      await loading.present();
    }

    var unfillData: any = {
      Id: id,
      IsDone: false,
    };
    if (this.usertype === 'PA' && this.paId) {
      unfillData.PaId = this.paId;
    }
    if (this.usertype === 'MANAGER' && this.managerId) {
      unfillData.ManagerId = this.managerId;
    }
    if (Data) {
      unfillData = Data;
      if (this.usertype === 'PA' && this.paId) {
        unfillData.PaId = this.paId;
      }
      if (this.usertype === 'MANAGER' && this.managerId) {
        unfillData.ManagerId = this.managerId;
      }
    }
    if (this.usertype === 'PA' || this.usertype === 'MANAGER') {
      unfillData.CallerUserId = this.callerUserId;
      unfillData.SecurityStamp = this.securityStamp;
    }

    await this.vaccineService.UnfillChildVaccine(unfillData)
      .subscribe(
        res => {
          if (res.IsSuccess) {
            if (this.isInfiniteVaccine(res.ResponseData)) {
              var cId = res.ResponseData.ChildId;
              var dId = res.ResponseData.Dose.Id;
              var dSchedule = res.ResponseData.Date;
              this.deleteFutureSchedules(cId, dId, dSchedule);
              loading.dismiss();
            }
            else {
              this.getVaccination();
              loading.dismiss();
            }
          }
          else if (res.IsWarning) {
            // v2 §6.5a: doctor ungiving a pre-reset historical dose — confirm "history only".
            loading.dismiss();
            this.alertController.create({
              header: 'Undo a historical dose?',
              message: res.Message,
              buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                  text: 'Undo anyway',
                  handler: () => {
                    unfillData.ConfirmPreResetUngive = true;
                    this.vaccineService.UnfillChildVaccine(unfillData).subscribe(
                      res2 => {
                        if (res2.IsSuccess) {
                          if (this.isInfiniteVaccine(res2.ResponseData)) {
                            var cId = res2.ResponseData.ChildId;
                            var dId = res2.ResponseData.Dose.Id;
                            var dSchedule = res2.ResponseData.Date;
                            this.deleteFutureSchedules(cId, dId, dSchedule);
                          } else {
                            this.getVaccination();
                          }
                        }
                        else { this.toastService.create(res2.Message || 'Error: failed to undo', 'danger'); }
                      },
                      () => { this.toastService.create('Error: server failure', 'danger'); }
                    );
                  }
                }
              ]
            }).then(a => a.present());
          }
          else {
            loading.dismiss();
            this.alertController.create({
              header: 'Cannot Ungive',
              message: res.Message,
              buttons: ['OK']
            }).then(a => a.present());
          }
        },
        err => {
          loading.dismiss();
          this.toastService.create('Error: server failure');
        }
      );
  }

  // §6.3a: correct a given dose's batch/expiry/manufacturer label — used to fill in a
  // give-at-zero dose's blank batch later, or fix a typo'd lot. Moves NO stock. Doctor + PA.
  async correctBatch(v: any) {
    if (!v || !v.IsDone) { return; }
    if (!v.BrandId) {
      this.toastService.create('This dose is OHF (no brand); there is no batch to correct.', 'warning');
      return;
    }

    const existingExpiry = parseDay(v.Expiry) || '';
    const alert = await this.alertController.create({
      header: 'Correct Batch Details',
      subHeader: (v.Brand && v.Brand.Name) ? v.Brand.Name : '',
      message: 'Label only — this does not change any stock quantity.',
      inputs: [
        { name: 'lot', type: 'text', placeholder: 'Batch / Lot no.', value: v.Lot || '' },
        { name: 'manufacturer', type: 'text', placeholder: 'Manufacturer', value: v.Manufacturer || '' },
        { name: 'expiry', type: 'date', value: existingExpiry }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: (data) => {
            this.submitCorrectBatch(v.Id, data);
          }
        }
      ]
    });
    await alert.present();
  }

  private async submitCorrectBatch(scheduleId: number, data: any) {
    const loading = await this.loadingController.create({ message: 'Saving batch details' });
    await loading.present();

    const payload: any = {
      Lot: (data && data.lot) ? data.lot : '',
      Manufacturer: (data && data.manufacturer) ? data.manufacturer : '',
      Expiry: (data && data.expiry) ? data.expiry : null,
      DoctorId: this.doctorId
    };
    if (this.usertype === 'PA' && this.paId) {
      payload.CorrectByPaId = this.paId;
    }

    this.vaccineService.CorrectBatch(scheduleId, payload).subscribe(
      res => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Batch details corrected.', 'success');
          this.getVaccination();
        } else {
          this.toastService.create(res.Message || 'Could not correct batch.', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Error: server failure', 'danger');
      }
    );
  }

  async deleteFutureSchedules(ChildId: string, DoseId: string, date: String) {
    const loading = await this.loadingController.create({
      message: 'Deleting Doses'
    });

    await loading.present();
    const delPaId = (this.usertype === 'PA' && this.paId) ? this.paId : undefined;
    const delDoctorId = this.doctorId ? this.doctorId : undefined;
    await this.vaccineService.DeleteVaccineByChildidDoseidDate(ChildId, DoseId, date, delPaId, delDoctorId)
      .subscribe(
        (result) => {
          let data: any = result;
          if (data.IsSuccess) {
            this.toastService.create('Success: Deleted future doses', 'success', false, 3000);
            this.getVaccination();
            loading.dismiss();
          }
          else {
            this.toastService.create('Error: Try again\nFailed to delete future doses', 'danger', false, 7000);
            loading.dismiss();
          }

        }, err => {
          this.toastService.create('Error: Try Again\nServer failure', 'danger', false, 3000);
          loading.dismiss();
        }
      );
  }

  async SkipVaccine(id, doseName) {
    const loading = await this.loadingController.create({
      message: 'Skipping ' + doseName
    });
    await loading.present();
    var skipData: any = {
      Id: id,
      IsSkip: true,
    };
    if (this.usertype === 'PA' && this.paId) {
      skipData.PaId = this.paId;
    }

    await this.vaccineService.UnfillChildVaccine(skipData).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create('Success: Skipped ' + res.ResponseData.Dose.Name, 'success', false, 3000);
          if (this.isInfiniteVaccine(res.ResponseData)) {
            let scheduleDate: any = this.addDays(res.ResponseData.Date, res.ResponseData.Dose.MinGap);
            // this.addNewVaccineInScheduleTable(scheduleDate, res.ResponseData);
            this.getVaccination();
            loading.dismiss();
          } else {
            this.getVaccination();
            loading.dismiss();
          }
        }
        else {
          loading.dismiss();
          this.alertController.create({
            header: 'Cannot Skip',
            message: res.Message,
            buttons: ['OK']
          }).then(a => a.present());
        }
      },
      err => {
        this.toastService.create('Error: Try Again\nServer failure', 'danger', false, 3000);
        loading.dismiss();
      }
    );
  }

  allVaccinesGiven(vaccines: any[]): boolean {
    return vaccines.every(vaccine => vaccine.IsDone);
  }

  // Returns CSS class for the date group label colour:
  // green = all given, orange = all given but payment pending, red = missed (past + not all done), yellow = due within 7 days
  getGroupDateClass(dateKey: string, vaccines: any[]): string {
    if (this.allVaccinesGiven(vaccines)) {
      if (this.canCollectPayment && this.hasUnpaidDoneVaccine(vaccines, dateKey))
        return 'date-label--payment-pending';
      return 'date-label--given';
    }
    const t = today();
    const d = parseDay(dateKey);
    if (d < t) return 'date-label--missed';
    const diff = diffDays(d, t);
    if (diff <= 7) return 'date-label--due-soon';
    return 'date-label--upcoming';
  }

  // True for the first group that still has doses to give, so the template can
  // drop a one-time "Upcoming" divider right before it. Skipped-only groups are
  // stage 1 in groupStage() but have nothing to give, so they stay above it.
  isFirstUpcomingGroup(groups: { key: string, value: any[] }[], index: number): boolean {
    const entry = groups[index];
    if (!entry || this.giveCount(entry.value) === 0) return false;
    for (let j = 0; j < index; j++) {
      if (this.giveCount(groups[j].value) > 0) return false;
    }
    return true;
  }

  private assignmentPinnedIds(a: any): Set<number> {
    return new Set<number>(a.Schedules ? a.Schedules.map((s: any) => s.Id) : (a.ScheduleIds || []));
  }

  // The open assignment that pins any dose of this date-group (no "still needs the PA" test).
  pinnedAssignmentForGroup(vaccines: any[]): any {
    if (!vaccines || !vaccines.length) return null;
    for (let i = 0; i < this.childAssignments.length; i++) {
      const a = this.childAssignments[i];
      const ids = this.assignmentPinnedIds(a);
      if (vaccines.some(v => ids.has(v.Id))) return a;
    }
    return null;
  }

  // Tag shown to a PA on each date-group: tells them whether this group is
  // theirs to act on, or was already handled by the doctor.
  getPaAssignmentTag(vaccines: any[]): 'assigned' | 'given-by-doctor' | null {
    if (this.usertype !== 'PA') return null;
    // GetByPA's Schedules array is pinned via PAAssignmentSchedule — only Schedule IDs
    // actually linked to an assignment. Each group is checked against its OWN assignment.
    if (!this.pinnedAssignmentForGroup(vaccines)) return null;
    if (this.allVaccinesGiven(vaccines)) {
      // "given-by-doctor" also covers Manager gives — the PA viewing this badge just needs
      // to know "not me", not the distinction between Doctor and Manager.
      const givenByOther = vaccines.some(v => !v.GivenByPaId);
      return givenByOther ? 'given-by-doctor' : null;
    }
    return 'assigned';
  }

  // The assignment that makes this date-group "With PA" (amber styling + tag), or null.
  // Doctor/manager view: a pinned dose only counts while it still needs the PA — undone,
  // unpaid (the PA is on the hook for the cash), or collected/given by the assigned PA.
  assignmentForGroup(vaccines: any[]): any {
    const a = this.pinnedAssignmentForGroup(vaccines);
    if (!a) return null;
    if (this.usertype === 'PA') {
      const tag = this.getPaAssignmentTag(vaccines);
      return (tag === null || tag === 'given-by-doctor') ? null : a;
    }
    const ids = this.assignmentPinnedIds(a);
    const paId = a.PaId;
    const needsPa = vaccines.filter(v => ids.has(v.Id)).some(v =>
      !v.IsDone || !v.IsPaymentCollected || v.PaymentCollectorPaId === paId || v.GivenByPaId === paId);
    return needsPa ? a : null;
  }

  isAssignedGroup(vaccines: any[]): boolean {
    return !!this.assignmentForGroup(vaccines);
  }

  paNameForGroup(vaccines: any[]): string {
    const a = this.assignmentForGroup(vaccines);
    return a ? (a.PaName || '') : '';
  }

  // PA viewer: this group's own assignment while it can still be marked done / is handed off.
  paOpenAssignmentForGroup(vaccines: any[]): any {
    if (this.usertype !== 'PA') return null;
    const a = this.pinnedAssignmentForGroup(vaccines);
    return a && a.AssignmentStatus !== 'PendingHandover' ? a : null;
  }

  paHandoffAssignmentForGroup(vaccines: any[]): any {
    if (this.usertype !== 'PA') return null;
    const a = this.pinnedAssignmentForGroup(vaccines);
    return a && a.AssignmentStatus === 'PendingHandover' ? a : null;
  }

  // Doctor menu on an assigned group: Reassign / Cancel act on THAT group's assignment only.
  async openAssignmentMenu(vaccines: any[]) {
    const asg = this.assignmentForGroup(vaccines);
    if (!asg) return;
    let action = '';
    const alert = await this.alertController.create({
      header: asg.PaName || 'Assignment',
      subHeader: 'Assignment for this group',
      buttons: [
        { text: 'Reassign to another PA', handler: () => { action = 'reassign'; } },
        { text: 'Cancel this assignment', handler: () => { action = 'cancel'; } },
        { text: 'Close', role: 'cancel' }
      ]
    });
    await alert.present();
    await alert.onDidDismiss();
    if (action === 'reassign') { this.openReassignPopup(asg); }
    else if (action === 'cancel') { this.confirmCancelAssignment(asg); }
  }

  async addNewVaccineInScheduleTable(scheduleDate, unfillData) {
    const loading = await this.loadingController.create({
      message: 'Updating Schedule'
    });
    await loading.present();
    this.fgAddData.value.DoctorId = unfillData.DoctorId;
    this.fgAddData.value.IsDone = false;
    this.fgAddData.value.BrandId = unfillData.BrandId;
    this.fgAddData.value.IsDisease = unfillData.IsDisease;
    this.fgAddData.value.DiseaseYear = unfillData.DiseaseYear;
    this.fgAddData.value.ChildId = unfillData.ChildId;
    this.fgAddData.value.DoseId = unfillData.DoseId;
    this.fgAddData.value.Date = scheduleDate;

    await this.vaccineService.AddChildSchedule(this.fgAddData.value).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create('Success: Created new dose of ' + unfillData.Dose.Name, 'success', false, 3000);
          console.log("Added vaccine");
          // console.log(res.ResponseData);
          this.getVaccination();
          loading.dismiss();
        }
        else {
          this.toastService.create("Error: Try Again\nFailed to create new dose of " + unfillData.Dose.Name + "\nRequired Action: Unskip and Skip Again", 'danger', false, 7000);
          loading.dismiss();
        }
      },
      err => {
        this.toastService.create('Error: Try Again\nServer failure', 'danger', false, 3000);
        loading.dismiss();
      }
    );
  }

  async UnSkipVaccine(id, doseName) {
    const loading = await this.loadingController.create({
      message: 'Unskipping ' + doseName
    });

    await loading.present();
    var unskipData: any = {
      Id: id,
      IsSkip: false,
    };
    if (this.usertype === 'PA' && this.paId) {
      unskipData.PaId = this.paId;
    }

    await this.vaccineService.UnfillChildVaccine(unskipData).subscribe(
      res => {
        if (res.IsSuccess) {
          // console.log(res.ResponseData)
          this.toastService.create('Success: Unskipped ' + doseName, 'success', false, 3000);
          if (this.isInfiniteVaccine(res.ResponseData)) {
            var cId = res.ResponseData.ChildId;
            var dId = res.ResponseData.Dose.Id;
            var dSchedule = res.ResponseData.Date;
            this.deleteFutureSchedules(cId, dId, dSchedule);
            loading.dismiss();
          }
          else {
            this.getVaccination();
            loading.dismiss();
          }
        }
        else {
          loading.dismiss();
          this.alertController.create({
            header: 'Cannot Unskip',
            message: res.Message,
            buttons: ['OK']
          }).then(a => a.present());
        }
      },
      err => {
        this.toastService.create('Error: Try Again\nServer failure', 'danger', false, 3000);
        loading.dismiss();
      }
    );
  }

  // Keep MinGap conversion aligned with backend ScheduleController.calculateDate
  addDays(date, days) {
    const baseDate = parseDay(date);
    const safeDays = Number(days);
    const gapDays = !isNaN(safeDays) ? safeDays : 0;

    if (gapDays === 30 || gapDays === 31) {
      return addMonths(baseDate, 1);
    }

    if (gapDays === 150) {
      return addMonths(baseDate, 5);
    }

    if (gapDays === 84) {
      return addMonths(baseDate, 3);
    }

    if (gapDays === 3315) {
      return addMonths(addYears(baseDate, 9), 1);
    }

    if (gapDays === 3833) {
      return addMonths(addYears(baseDate, 10), 6);
    }

    if (gapDays >= 365 && gapDays <= 9125 && gapDays % 365 === 0) {
      return addYears(baseDate, Math.floor(gapDays / 365));
    }

    if (gapDays >= 168 && gapDays <= 334) {
      return addMonths(baseDate, Math.floor(gapDays / 28));
    }

    if (gapDays >= 401 && gapDays <= 460) {
      return addMonths(baseDate, gapDays - 400);
    }

    if (gapDays >= 395 && gapDays <= 608) {
      return addMonths(baseDate, Math.floor(gapDays / 29));
    }

    if (gapDays >= 639 && gapDays <= 1795) {
      return addMonths(baseDate, Math.floor(gapDays / 30));
    }

    return dayAdd(baseDate, gapDays);
  }

  async showAuditPopover(event: Event, vaccine: any) {
    const popover = await this.popoverController.create({
      component: AuditPopoverComponent,
      componentProps: { vaccine },
      event,
      translucent: true,
      cssClass: 'audit-popover',
    });
    await popover.present();
  }

  // async UnfillVaccine(id, Data = null) {
  //   const loading = await this.loadingController.create({
  //     message: 'Unfilling vaccine'
  //   });
  //   if (!Data) {
  //     await loading.present();
  //   }

  //   let data = {
  //     Id: id,
  //     IsDone: false,
  //   }
  //   if (Data) {
  //     data = Data;
  //   }

  //   await this.vaccineService.UnfillChildVaccine(data)
  //     .subscribe(
  //       res => {
  //         if (res.IsSuccess) {
  //           if (res.ResponseData.Dose.Vaccine.isInfinite) {
  //             var cId = res.ResponseData.ChildId;
  //             var dId = res.ResponseData.Dose.Id;
  //             var dSchedule = res.ResponseData.Date;
  //             this.deleteFutureSchedules(cId, dId, dSchedule);
  //             loading.dismiss();
  //           }
  //           else {
  //             this.getVaccination();
  //             loading.dismiss();
  //           }
  //         }
  //         else {
  //           loading.dismiss();
  //           this.toastService.create(res.Message, 'danger');
  //         }
  //       },
  //       err => {
  //         this.toastService.create('Error: server failure');
  //         loading.dismiss();
  //       }
  //     );
  // }
  // Method to download the travel PDF
  downloadTravelPdf(includeFuture: boolean = true) {
    this.vaccineService.generateTravelPdf(this.childId, includeFuture).subscribe((response: Blob) => {
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get the filename from the Content-Disposition header if available
      const contentDisposition = this.vaccineService.getLastContentDisposition();
      let filename = 'Immunization-Record.pdf';
      
      if (contentDisposition) {
        // Extract filename from Content-Disposition header
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }, error => {
      console.error('Error downloading PDF:', error);
    });
  }

  downloadSpecialPdf(includeFuture: boolean = true) {
    this.vaccineService.generateSpecialPdf(this.childId, includeFuture).subscribe((response: Blob) => {
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = this.vaccineService.getLastContentDisposition();
      let filename = 'Immunization-Record.pdf';

      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }, error => {
      console.error('Error downloading PDF:', error);
    });
  }

  // Landscape (Travel-styled) variant of the Custom schedule PDF.
  downloadSpecialLandscapePdf(includeFuture: boolean = true) {
    this.vaccineService.generateSpecialLandscapePdf(this.childId, includeFuture).subscribe((response: Blob) => {
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = this.vaccineService.getLastContentDisposition();
      let filename = 'Immunization-Record.pdf';

      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }, error => {
      console.error('Error downloading PDF:', error);
    });
  }

  openAssignPopup(groupVaccines: any[]) {
    if (this.assigningPA) { return; }
    if (this.clinicPAs.length === 0) {
      this.toastService.create('No PAs assigned to this clinic', 'warning');
      return;
    }
    this.paGuidelines = '';
    this.paTargetDate = today();
    this.assignVisit = emptyVisit();
    this.pendingAssignPA = null;
    // Undone schedule IDs in this date-group only — pinned to the new assignment
    // via PAAssignmentSchedule at creation time, no later re-inference.
    this.pendingAssignScheduleIds = (groupVaccines || [])
      .filter(function(v) { return !v.IsDone; })
      .map(function(v) { return v.Id; });
    // Every dose (given + undone) of the clicked group, so the server can tell which invoice
    // doses genuinely belong to this visit even when the group is already fully given.
    this.pendingAssignGroupIds = (groupVaccines || []).map(function(v) { return v.Id; });
    this.assignPopupOpen = true;
  }

  selectPendingAssign(pa: any) {
    this.pendingAssignPA = pa;
  }

  confirmAssign() {
    if (!this.pendingAssignPA) { return; }
    this.doAssign(this.pendingAssignPA);
    this.pendingAssignPA = null;
  }

  closeAssignPopup() {
    this.assignPopupOpen = false;
    this.pendingAssignPA = null;
    this.paGuidelines = '';
    this.paTargetDate = '';
    this.pendingAssignScheduleIds = [];
  }

  // GivenDate arrives over the wire as a "DD-MM-YYYY" string (OnlyDateConverter on the API
  // side), but getVaccination() (line ~254) already normalizes it to "YYYY-MM-DD" before
  // dataGrouping is built — so by the time this runs it's usually already YYYY-MM-DD.
  // Accept both formats; reject anything else (e.g. "01-01-0001" null-date edge case),
  // NOT new Date() / split('T'), which misreads "12-06-2026" as Dec 6 instead of Jun 12
  // for any day-of-month <= 12.
  private toInvoiceDateStr(givenDate: any): string | null {
    const parsed = parseDay(givenDate);
    return parsed && +parsed.substring(0, 4) > 2020 ? parsed : null;
  }

  private async loadInvoiceExistence() {
    this.invoiceExistsMap = {};
    this.invoiceAmountMap = {};
    const childId = Number(this.childId);
    const grouped: any = this.dataGrouping;
    // Check all dates that have at least one given vaccine — EPI included, invoice existence is the only gate
    const doneDates = Object.keys(grouped).filter(date =>
      grouped[date].some((v: any) => v.IsDone)
    );

    // Two lookup strategies below fan out per-date; both are collected up front and
    // run concurrently (Promise.all), same batching approach as submitPayment(), so a
    // long dose history fires one round trip per unique lookup instead of a growing
    // sequential chain — and the map/detectChanges only update once, at the end.
    const byInvoiceId: Array<{ date: string; invoiceId: number }> = [];
    const byDateFallback: Array<{ date: string; givenDateStr: string }> = [];

    doneDates.forEach(date => {
      const group: any[] = grouped[date];
      const doneDoses = group.filter((v: any) => v.IsDone);
      if (doneDoses.length === 0) { return; }

      // Source of truth: Schedule.InvoiceSubmissionId, stamped directly on the dose when
      // its invoice is created (update-bulk-invoice). A primary-key link, not a date match —
      // immune to due-date-vs-given-date bucket splits and timezone/format drift, both of
      // which broke the old date-matching lookup repeatedly and in different ways.
      const invoiceIds = Array.from(new Set(
        doneDoses
          .map((v: any) => v.InvoiceSubmissionId)
          .filter((id: any) => !!id)
      ));

      if (invoiceIds.length > 0) {
        invoiceIds.forEach((invoiceId: number) => byInvoiceId.push({ date, invoiceId }));
        return;
      }

      // Fallback for doses invoiced before InvoiceSubmissionId existed (pre-backfill /
      // any row the backfill missed) — same date-matching lookup as before.
      const givenDateStrs = Array.from(new Set(
        doneDoses
          .filter((v: any) => v.GivenDate)
          .map((v: any) => this.toInvoiceDateStr(v.GivenDate))
          .filter((d: string | null) => !!d)
      ));
      givenDateStrs.forEach(givenDateStr => byDateFallback.push({ date, givenDateStr }));
    });

    // Dedupe repeated invoice-ID lookups (the same invoice can back multiple dose dates)
    // so each unique invoice is fetched once regardless of how many dates reference it.
    const uniqueInvoiceIds = Array.from(new Set(byInvoiceId.map(x => x.invoiceId)));
    const invoiceTotalsById = new Map<number, any>();
    await Promise.all(uniqueInvoiceIds.map(invoiceId =>
      this.invoiceService.getInvoiceTotalById(invoiceId).toPromise()
        .then(res => { invoiceTotalsById.set(invoiceId, res); })
        .catch(() => { invoiceTotalsById.set(invoiceId, null); })
    ));
    byInvoiceId.forEach(({ date, invoiceId }) => {
      const res = invoiceTotalsById.get(invoiceId);
      if (res && res.IsSuccess) {
        this.invoiceExistsMap[date] = true;
        if (typeof res.ResponseData === 'number') { this.invoiceAmountMap[date] = res.ResponseData; }
      }
    });

    await Promise.all(byDateFallback.map(async ({ date, givenDateStr }) => {
      try {
        const res = await this.invoiceService.getInvoiceTotal(childId, givenDateStr).toPromise();
        if (res && res.IsSuccess) {
          this.invoiceExistsMap[date] = true;
          if (typeof res.ResponseData === 'number') { this.invoiceAmountMap[date] = res.ResponseData; }
          return;
        }
        // PKT/UTC midnight boundary fallback
        const prevStr = dayAdd(givenDateStr, -1);
        const res2 = await this.invoiceService.getInvoiceTotal(childId, prevStr).toPromise();
        if (res2 && res2.IsSuccess) {
          this.invoiceExistsMap[date] = true;
          if (typeof res2.ResponseData === 'number') { this.invoiceAmountMap[date] = res2.ResponseData; }
        }
      } catch { /* leave date unset — treated as no invoice, same as before */ }
    }));

    this.cdr.detectChanges();
  }

  // Stage-4 override support: same date-resolution as loadInvoiceExistence(), but
  // pulls ownership/edit-window data (isSubmitted/editCount/canEdit/submittedByPaId)
  // from the endpoint bulkinvoice.page.ts already uses for its own same-day guard.
  private async loadInvoiceStatuses() {
    if (!this.doctorId) { return; }
    this.invoiceStatusMap = {};
    const grouped: any = this.dataGrouping;
    const doneDates = Object.keys(grouped).filter(date =>
      grouped[date].some((v: any) => v.IsDone)
    );

    const lookups: Array<{ date: string; givenDateStr: string }> = [];
    doneDates.forEach(date => {
      const group: any[] = grouped[date];
      const doneVaccine = group.find(function(v: any) { return v.IsDone && v.GivenDate; });
      if (!doneVaccine) { return; }
      const givenDateStr = this.toInvoiceDateStr(doneVaccine.GivenDate);
      if (!givenDateStr) { return; }
      lookups.push({ date, givenDateStr });
    });

    // Fired concurrently (Promise.all) instead of one-at-a-time, same batching
    // approach as loadInvoiceExistence()/submitPayment() — one detectChanges at the end.
    await Promise.all(lookups.map(({ date, givenDateStr }) =>
      this.bulkService.getInvoiceStatus(Number(this.childId), this.doctorId, givenDateStr).toPromise()
        .then(res => { if (res) { this.invoiceStatusMap[date] = res; } })
        .catch(() => {})
    ));

    this.cdr.detectChanges();
  }

  // ── Stage-4 (paid) override gating (spec §3.4a) ───────────────────────────
  // Doctor: always allowed — full invoice menu + ungive, both guarded by confirm
  // dialogs. PA: only within the same window the backend already enforces
  // (own action, same PKT calendar day, under the existing count caps) — this
  // mirrors ScheduleController.cs Update()/updateInvoice() server-side checks,
  // it does not relax them; a stale client guess still gets rejected server-side.
  canOverridePaidInvoice(date: string): boolean {
    if (this.usertype === 'DOCTOR') { return true; }
    if (this.usertype === 'MANAGER') {
      // Manager isn't the invoice's submitter, so no ownership check like PA's — just the
      // permission flag + the shared edit cap (clinic-fence already enforced server-side).
      if (!this.canEditInvoiceAsManager) { return false; }
      const status = this.invoiceStatusMap[date];
      return !!status && status.isSubmitted && status.canEdit;
    }
    if (!this.canInvoice) { return false; }
    if (this.usertype !== 'PA' || !this.paId) { return false; }
    const status = this.invoiceStatusMap[date];
    return !!status && status.isSubmitted && status.canEdit && status.submittedByPaId === this.paId;
  }

  canOverridePaidUngive(v: any): boolean {
    if (!v || !v.IsPaymentCollected) { return false; }
    if (this.usertype === 'DOCTOR') { return true; }
    if (this.usertype === 'MANAGER') {
      if (!this.managerId || !this.canUngiveVaccine) { return false; }
      if (v.GivenByManagerId !== this.managerId) { return false; }
    } else {
      if (this.usertype !== 'PA' || !this.paId || !this.canUngiveVaccine) { return false; }
      if (v.GivenByPaId !== this.paId) { return false; }
    }
    if (!v.DoneAt) { return false; }
    if (dayOf(v.DoneAt) !== today()) { return false; }
    return (v.UngiveCount || 0) < 2;
  }

  // The invoice backing this date-group predates the PA payment system's real launch
  // (2026-05-28) — a Historical Backfill row or similar fabricated/backdated invoice, not
  // a real transaction. Hides PAYMENT so nobody records a cash/online collection against
  // data that was never meant to go through PA cash handling in the first place; the
  // invoice-menu icon (view/manage) stays available regardless.
  isPrePaymentSystemInvoice(date: string): boolean {
    return !!this.invoiceStatusMap[date] && !!this.invoiceStatusMap[date].isPrePaymentSystem;
  }

  hasUnpaidDoneVaccine(data: any[], date: string): boolean {
    if (!this.invoiceExistsMap[date]) { return false; }

    const isPA = this.usertype === 'PA' && !!this.paId;

    if (isPA) {
      return data.some((v) => {
        // No per-schedule Amount check here — invoiceExistsMap[date] already confirms an
        // invoice exists for this visit (e.g. consultation-fee-only invoices have Amount=0
        // on every schedule row, but still need a payment mode recorded).
        // No DoneAt recency window either — PaymentCollectorPaId is the correct, exact gate
        // (backfilled at invoice-link time even for doses given before the PA was assigned,
        // see SyncInvoicePaToActiveAssignment/PAAssignmentController.Create). A recency window
        // here would only re-hide the icon for exactly the doctor-gives-then-assigns-later
        // ordering this gate exists to support.
        if (!v.IsDone || v.IsPaymentCollected) return false;
        return v.PaymentCollectorPaId === this.paId;
      });
    }

    return data.some(function(v) { return v.IsDone && !v.IsPaymentCollected; });
  }

  getDoneScheduleId(data: any[]): number {
    const done = data.find(v => v.IsDone && !v.Due2EPI);
    return done ? done.Id : data[0].Id;
  }

  // OFC is only recorded under 2 years; from the 2nd birthday it is locked and not counted.
  private ofcAllowedAt(given: any): boolean {
    if (!this.BirthYear) { return true; }
    const dob = new Date(this.BirthYear);
    const at = given ? new Date(given) : new Date();
    if (isNaN(dob.getTime()) || isNaN(at.getTime())) { return true; }
    return at < new Date(dob.getFullYear() + 2, dob.getMonth(), dob.getDate());
  }

  // PA recording payment on a regular child's given doses must document growth first: at least one
  // of weight, height or OFC (OFC only under 2 years), or Not measured. Doctors/Managers,
  // non-regular children and disease rows skip it. The server enforces the same rule in
  // ScheduleController.ApplyGrowthGate (GROWTH_FLAG_SPEC.md). No range checks.
  private needsGrowth(groupVaccines: any[]): boolean {
    if (this.usertype !== 'PA' || !this.paId || this.type !== 'regular') { return false; }
    const self = this;
    return (groupVaccines || []).some(function(v) {
      const hasGrowth = v.Weight > 0 || v.Height > 0 || (v.Circle > 0 && self.ofcAllowedAt(v.GivenDate));
      return v.IsDone && !v.IsDisease && !v.GrowthNotMeasured && !hasGrowth;
    });
  }

  // Pure (called from the template): returns the validation message, '' when fine. Only rejects
  // non-numeric / non-positive entries; there is no normal-range rejection yet.
  growthMessage(): string {
    if (this.growthNotMeasured) { return ''; }
    const bad = function(x: string) { return !!x && !(parseFloat(x) > 0); };
    if (bad(this.growthW) || bad(this.growthH) || (this.growthOfcEnabled && bad(this.growthO))) {
      return 'Enter a number above 0.';
    }
    return '';
  }

  growthValid(): boolean {
    if (this.growthNotMeasured) { return true; }
    return !this.growthMessage()
      && (parseFloat(this.growthW) > 0 || parseFloat(this.growthH) > 0 || (this.growthOfcEnabled && parseFloat(this.growthO) > 0));
  }

  closeGrowthSheet() {
    this.growthSheetOpen = false;
    this.growthResume = null;
  }

  continueFromGrowth() {
    if (!this.growthValid() || !this.growthResume) { return; }
    this.pendingGrowth = this.growthNotMeasured
      ? { GrowthNotMeasured: true }
      : {
          Weight: parseFloat(this.growthW) > 0 ? Number(this.growthW) : null,
          Height: parseFloat(this.growthH) > 0 ? Number(this.growthH) : null,
          Circle: (this.growthOfcEnabled && parseFloat(this.growthO) > 0) ? Number(this.growthO) : null
        };
    const r = this.growthResume;
    this.growthSheetOpen = false;
    this.growthResume = null;
    this.openPaymentPopup(r.scheduleId, r.group, true);
  }

  async openPaymentPopup(scheduleId: number, groupVaccines: any[], growthDone: boolean = false) {
    if (!growthDone && this.needsGrowth(groupVaccines)) {
      this.growthW = ''; this.growthH = ''; this.growthO = '';
      this.growthNotMeasured = false; this.pendingGrowth = null;
      const given = (groupVaccines || []).find(function(v) { return v.IsDone && v.GivenDate; });
      this.growthOfcEnabled = this.ofcAllowedAt(given ? given.GivenDate : null);
      this.growthResume = { scheduleId: scheduleId, group: groupVaccines };
      this.growthSheetOpen = true;
      return;
    }
    this.paymentTargetScheduleId = scheduleId;
    // Collect ALL done schedule IDs in this group — payment mode is recorded for the whole
    // visit even when individual schedules have Amount=0 (e.g. consultation-fee-only invoices).
    this.paymentTargetScheduleIds = (groupVaccines || [])
      .filter(function(v) { return v.IsDone && v.Id; })
      .map(function(v) { return v.Id; });
    this.paymentDueAmount = 0;
    this.paymentPopupOpen = true;
    const doneVaccine = groupVaccines.find(function(v) { return v.IsDone && v.GivenDate; });
    if (doneVaccine) {
      const givenDateStr = this.toInvoiceDateStr(doneVaccine.GivenDate);
      const childId = Number(this.childId);
      // Try current date first, then previous day (UTC vs local timezone offset)
      try {
        if (!givenDateStr) { return; }
        const res = await this.invoiceService.getInvoiceTotal(childId, givenDateStr).toPromise();
        if (res && res.IsSuccess && res.ResponseData > 0) {
          this.paymentDueAmount = res.ResponseData;
        } else {
          const prevStr = dayAdd(givenDateStr, -1);
          const res2 = await this.invoiceService.getInvoiceTotal(childId, prevStr).toPromise();
          if (res2 && res2.IsSuccess && res2.ResponseData > 0) {
            this.paymentDueAmount = res2.ResponseData;
          }
        }
      } catch { /* amount stays 0 — user can still proceed */ }
    }
  }

  closePaymentPopup() {
    this.pendingGrowth = null;
    this.paymentPopupOpen = false;
    this.paymentTargetScheduleId = null;
    this.paymentTargetScheduleIds = [];
    this.paymentDueAmount = 0;
  }

  async submitPayment(mode: 'Cash' | 'Online') {
    const ids = this.paymentTargetScheduleIds.length > 0
      ? this.paymentTargetScheduleIds
      : (this.paymentTargetScheduleId ? [this.paymentTargetScheduleId] : []);
    if (ids.length === 0) return;
    const loading = await this.loadingController.create({ message: 'Recording payment...' });
    await loading.present();
    // Record payment mode for ALL schedules in this visit in parallel
    const growth = this.pendingGrowth || {};
    const calls = ids.map(id => this.scheduleService.recordPaymentMode(id, Object.assign({ PaymentMode: mode, CallerUserId: this.callerUserId, SecurityStamp: this.securityStamp }, growth)).toPromise());
    try {
      const results = await Promise.all(calls);
      loading.dismiss();
      const allOk = results.every((res: any) => res && res.IsSuccess);
      if (allOk) {
        this.closePaymentPopup();
        this.toastService.create('Payment recorded: ' + mode, 'success');
        this.getVaccination();
      } else {
        const failed = results.find((res: any) => !(res && res.IsSuccess)) as any;
        this.toastService.create((failed && failed.Message) || 'Failed to record payment — please try again', 'danger');
        // popup stays open so user can retry
      }
    } catch {
      loading.dismiss();
      this.toastService.create('Error recording payment — please try again', 'danger');
      // popup stays open so user can retry
    }
  }

  doAssign(pa: any) {
    if (this.assigningPA) { return; }
    if (!this.doctorId || !this.clinicId || !this.childId) {
      this.toastService.create('Patient or clinic info not loaded yet', 'warning');
      return;
    }
    this.assigningPA = true;
    this.assignPopupOpen = false;
    const payload: any = {
      DoctorId: this.doctorId,
      ClinicId: this.clinicId,
      PersonalAssistantId: pa.Id,
      ChildId: Number(this.childId),
      Notes: this.paGuidelines || '',
      ScheduleIds: this.pendingAssignScheduleIds || [],
      GroupScheduleIds: this.pendingAssignGroupIds || [],
      TargetDate: this.paTargetDate || null,
      ...visitPayload(this.assignVisit)
    };
    rememberArea(this.assignVisit.area);
    this.assignVisit = emptyVisit();
    if (this.usertype === 'MANAGER' && this.managerId) {
      payload.RequestingManagerId = this.managerId;
    }
    this.paGuidelines = '';
    this.paTargetDate = '';
    this.pendingAssignScheduleIds = [];
    this.pendingAssignGroupIds = [];
    this.paService.createAssignment(payload, this.callerUserId, this.securityStamp).subscribe(res => {
      if (res && res.IsSuccess) {
        this.loadActiveAssignment(() => {
          this.assigningPA = false;
          this.toastService.create('Assigned to ' + pa.Name, 'success');
          if (res.ResponseData && res.ResponseData.BookingConfirmedId) {
            this.toastService.create('Booking confirmed. Parent notified.', 'success');
          }
          if (res.ResponseData && res.ResponseData.SpanningInvoiceNotAdopted) {
            this.toastService.create('An earlier invoice also covers another group, so it was not attached to this assignment.', 'warning');
          }
          const skipped = res.ResponseData && res.ResponseData.ExcludedStaleDoses;
          if (skipped > 0) {
            this.toastService.create(skipped + ' older given dose(s) were not added to this assignment', 'warning');
          }
        });
      } else {
        this.assigningPA = false;
        if (res && res.BlockedByAssignment) {
          this.presentBlockedAssignmentAlert(res);
        } else {
          this.toastService.create((res && res.Message) || 'Failed to assign', 'danger');
        }
      }
    }, (err) => {
      this.assigningPA = false;
      const msg = err && err.error && err.error.Message ? err.error.Message
                : err && err.message ? err.message
                : 'Failed to assign';
      this.toastService.create(msg, 'danger');
    });
  }

  // Fires when PAAssignmentController.Create blocks a new assignment because an earlier
  // one for this child (any PA) is still open — i.e. !IsCashConfirmedByDoctor, which the
  // doctor almost never associates with "go confirm a row on a different page." The plain
  // toast this used to fall through to (see catch-all above) told the doctor to "Cancel
  // that assignment or use Reassign" — both wrong: Cancel looks destructive for a dose that
  // was correctly given and paid, and same-PA Reassign doesn't touch IsCashConfirmedByDoctor
  // at all. This explains the real cause and deep-links to the one action that actually
  // unblocks it — confirming the prior visit's invoice in Payment Reconciliation.
  async presentBlockedAssignmentAlert(res: any) {
    const paName = res.BlockingPaName || 'another PA';
    const dateStr = res.BlockingAssignedDate || 'an earlier visit';
    const hasInvoice = !!res.BlockingHasInvoice;

    // Sync-gap case (2026-09-18 incident): the blocking invoice is already Confirmed on
    // Payment Reconciliation, but this assignment's own flag never flipped — telling the
    // doctor to "go tap Confirm" would be a dead end, since there's nothing left to confirm.
    // Offer a one-tap self-heal instead of repeating a satisfied instruction.
    if (res.AlreadyConfirmedButUnsynced && res.BlockingInvoiceSubmissionId) {
      const confirmedWhen = res.BlockingConfirmedAt
        ? formatInstant(res.BlockingConfirmedAt, 'dd MMM yyyy, h:mm a')
        : 'earlier';
      const syncAlert = await this.alertController.create({
        header: "Can't Assign Yet",
        cssClass: 'vac-confirm',
        message:
          `${paName}'s visit with this patient on ${dateStr} was already confirmed on ${confirmedWhen} — but the assignment record itself never synced. This is a data gap, not something for you to re-confirm.\n\n` +
          `Tap Fix to close out that old assignment now. This won't change the invoice, payment, or amount already confirmed.`,
        buttons: [
          { text: 'Cancel', role: 'cancel', cssClass: 'alert-btn-neutral' },
          {
            text: 'Fix & Continue',
            cssClass: 'alert-btn-confirm',
            handler: () => { this.healBlockedAssignmentSyncGap(res.BlockingInvoiceSubmissionId); }
          }
        ]
      });
      await syncAlert.present();
      return;
    }

    const detail = hasInvoice
      ? `Go to Payment Reconciliation and tap Confirm on that invoice row. Once confirmed, this patient can be assigned again right away.`
      : `${paName} hasn't submitted an invoice for that visit yet — ask them to submit it, then confirm it in Payment Reconciliation to unblock this patient.`;

    const alert = await this.alertController.create({
      header: "Can't Assign Yet",
      cssClass: 'vac-confirm',
      message:
        `${paName}'s visit with this patient on ${dateStr} is still waiting on your confirmation — that's what's blocking a new assignment, not a duplicate or a stuck record.\n\n${detail}`,
      buttons: [
        { text: 'Cancel', role: 'cancel', cssClass: 'alert-btn-neutral' },
        {
          text: 'Go to Payment Reconciliation',
          handler: () => {
            const queryParams: any = { paId: res.BlockingPaId };
            if (res.BlockingClinicId) { queryParams.clinicId = res.BlockingClinicId; }
            this.router.navigate(['/members/doctor/payment-reconciliation'], { queryParams });
          }
        }
      ]
    });
    await alert.present();
  }

  private async healBlockedAssignmentSyncGap(invoiceSubmissionId: number) {
    const loading = await this.loadingController.create({ message: 'Fixing...' });
    await loading.present();
    this.paService.confirmInvoice(invoiceSubmissionId, this.doctorId, this.callerUserId, this.securityStamp).subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Fixed — you can assign this patient again now.', 'success');
        } else {
          this.toastService.create((res && res.Message) || 'Failed to fix — please try again.', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to fix — please try again.', 'danger');
      }
    );
  }

  loadActiveAssignment(onDone?: () => void) {
    if (!this.doctorId || !this.childId) { if (onDone) onDone(); return; }
    this.activeAssignmentLoading = true;
    this.paService.getActiveAssignmentsForDoctor(this.doctorId).subscribe(res => {
      this.activeAssignmentLoading = false;
      if (res && res.IsSuccess) {
        const all: any[] = res.ResponseData || [];
        this.childAssignments = all.filter(a => a.ChildId === Number(this.childId));
      }
      if (onDone) onDone();
    }, () => {
      this.activeAssignmentLoading = false;
      if (onDone) onDone();
    });
  }

  // PA view of the active assignment — GetByPA is PA-scoped (no doctorId needed),
  // and already returns AssignmentId + AssignmentStatus for this child.
  loadActivePAAssignment(onDone?: () => void) {
    if (!this.paId || !this.childId) { if (onDone) onDone(); return; }
    this.paService.getAssignments(this.paId, this.callerUserId, this.securityStamp).subscribe(res => {
      if (res && res.IsSuccess) {
        const all: any[] = res.ResponseData || [];
        this.childAssignments = all.filter(a => a.ChildId === Number(this.childId));
      }
      if (onDone) onDone();
    }, () => { if (onDone) onDone(); });
  }

  // Mirrors payables.page.ts's promptDone()/doCompleteAssignment(), but checks payment
  // status against this.vaccine (already loaded on this page) instead of a separate
  // Schedules array — same source of truth, no extra request.
  async promptDoneFromVaccinePage(asg: any) {
    if (!asg) { return; }
    const pinned = this.assignmentPinnedIds(asg);
    const unpaid = (this.vaccine || []).filter((s: any) =>
      pinned.has(s.Id) && s.IsDone && s.PaymentCollectorPaId === this.paId && !s.IsPaymentCollected);

    if (unpaid.length > 0) {
      const names = unpaid.map((s: any) => s.Dose && s.Dose.Name ? s.Dose.Name : '').filter((n: string) => !!n).join(', ');
      const alert = await this.alertController.create({
        header: 'Payment Pending',
        message: 'Please record payment for: ' + names + '. Use the money icon above first.',
        buttons: [{ text: 'OK', role: 'cancel' }]
      });
      await alert.present();
      return;
    }

    const confirm = await this.alertController.create({
      header: 'Mark as Done',
      message: 'Mark this assignment as done? This will move it to Pending Cash Handover for the doctor to confirm.',
      buttons: [
        { text: 'Back', role: 'cancel' },
        { text: 'Mark Done', handler: () => { this.doCompleteAssignmentFromVaccinePage(asg); } }
      ]
    });
    await confirm.present();
  }

  async doCompleteAssignmentFromVaccinePage(asg: any) {
    if (!asg || !this.paId) { return; }
    const loading = await this.loadingController.create({ message: 'Marking done...' });
    await loading.present();
    this.paService.markAssignmentDone(asg.AssignmentId, this.paId).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Marked as done — pending cash handover', 'success');
          this.getVaccination();
          this.loadActivePAAssignment();
        } else {
          this.toastService.create((res && res.Message) || 'Mark done failed', 'danger');
        }
      },
      () => { loading.dismiss(); this.toastService.create('Mark done failed', 'danger'); }
    );
  }

  async confirmCancelAssignment(asg: any) {
    const alert = await this.alertController.create({
      header: 'Cancel Assignment',
      message: `Cancel this assignment for ${asg && asg.ChildName ? asg.ChildName : 'this patient'}?`,
      inputs: [{ name: 'reason', type: 'text', placeholder: 'Reason (optional)' }],
      buttons: [
        { text: 'No', role: 'cancel' },
        { text: 'Yes, Cancel', handler: (data) => { this.doCancelAssignment(asg, data.reason || ''); } }
      ]
    });
    await alert.present();
  }

  async doCancelAssignment(asg: any, reason: string) {
    if (!asg) return;
    const loading = await this.loadingController.create({ message: 'Cancelling...' });
    await loading.present();
    this.paService.cancelAssignment(asg.AssignmentId, 'DOCTOR', this.doctorId, reason).subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Assignment cancelled', 'success');
          this.loadActiveAssignment();
        } else {
          this.toastService.create(res.Message || 'Failed to cancel', 'danger');
        }
      },
      () => { loading.dismiss(); this.toastService.create('Failed to cancel assignment', 'danger'); }
    );
  }

  openReassignPopup(asg: any) {
    if (!asg) {
      this.toastService.create('No active assignment to reassign', 'warning');
      return;
    }
    if (this.clinicPAs.length === 0) {
      this.toastService.create('No PAs available at this clinic', 'warning');
      return;
    }
    this.paGuidelines = '';
    this.pendingReassignAsg = asg;
    this.paTargetDate = asg.TargetDate
      ? String(asg.TargetDate).slice(0, 10)
      : '';
    this.pendingReassignPA = null;
    this.reassignPopupOpen = true;
  }

  selectPendingReassign(pa: any) {
    this.pendingReassignPA = pa;
  }

  confirmReassign() {
    if (!this.pendingReassignPA) { return; }
    this.doReassign(this.pendingReassignPA);
    this.pendingReassignPA = null;
  }

  closeReassignPopup() {
    this.reassignPopupOpen = false;
    this.pendingReassignPA = null;
    this.pendingReassignAsg = null;
    this.paGuidelines = '';
    this.paTargetDate = '';
  }

  async doReassign(pa: any) {
    this.reassignPopupOpen = false;
    const asgToReassign = this.pendingReassignAsg;
    this.pendingReassignAsg = null;
    if (!asgToReassign) return;
    const loading = await this.loadingController.create({ message: 'Reassigning...' });
    await loading.present();
    const targetDate = this.paTargetDate || null;
    this.paTargetDate = '';
    this.paService.reassignAssignment(asgToReassign.AssignmentId, pa.Id, targetDate, null, this.callerUserId, this.securityStamp).subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Reassigned to ' + pa.Name, 'success');
          this.loadActiveAssignment();
        } else {
          this.toastService.create(res.Message || 'Failed to reassign', 'danger');
        }
      },
      () => { loading.dismiss(); this.toastService.create('Failed to reassign', 'danger'); }
    );
  }
}

// https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-a-array-of-objects
