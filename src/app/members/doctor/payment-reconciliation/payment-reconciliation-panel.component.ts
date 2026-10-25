import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';
import { StockService } from 'src/app/services/stock.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { formatDay, formatInstant, nowInstant } from 'src/app/shared/time';

// One card per PA on the Cash tab (built once per load, never inside the template).
interface PaCard {
  PaId: number;
  PaName: string;
  Holds: number;             // server cash-in-hand: collected cash minus confirmed handovers
  Handovers: any[];          // pending handovers waiting for the doctor
  Invoices: PaymentRow[];    // unconfirmed invoices ready to confirm
  Deleted: PaymentRow[];     // invoices of deleted patients: the doctor cancels them (no Confirm)
  Decisions: PaymentRow[];   // rows carrying a pending edit / ungive to approve or reject
  DirectSales: PaymentRow[]; // unconfirmed direct sales
  AwaitingInvoice: number;   // visits given with no invoice yet
}

interface PaymentRow {
  InvoiceSubmissionId: number;
  ScheduleId: number;       // alias = InvoiceSubmissionId, kept for backwards compat
  // Set when this Invoice row has a pending PA/Manager edit or ungive folded onto it —
  // Approve/Reject act on THIS row instead of a separate UngiveReversal/EditReversal row.
  AmendmentId?: number;
  PendingAmendmentType?: 'UngiveReversal' | 'EditReversal';
  AssignmentId?: number;    // PAAssignment.Id — used for "delete assignment" cascade
  DirectSaleBillNo?: string; // set when RowType is DirectSale
  RowType: 'Invoice' | 'UngiveReversal' | 'EditReversal' | 'AwaitingInvoice' | 'DirectSale';
  Date: string;
  AssignedAt?: string;
  PatientName: string;
  PatientDeleted?: boolean;  // the patient no longer exists (name comes from the delete audit)
  Vaccines: string;
  Amount: number;
  OldAmount?: number;
  NewAmount?: number;
  PaymentMode: string;
  IsConfirmed: boolean;
  ConfirmedAt?: string;
  InvoiceStatus?: string;
  HasPendingAmendment?: boolean;
  PendingHandover?: boolean;
  HandoverDoneAt?: string;
  HasUnbilledPayment?: boolean; // AwaitingInvoice rows only — cash already collected, no invoice yet
  IsPaymentCollected?: boolean; // DirectSale rows only — false until PA records Cash/Online
  PaId: number;
  PaName: string;
  ClinicId: number;
  ClinicName: string;
  // Growth flag (Invoice rows, PA-given regular doses on/after the server's cutoff). Display only.
  GrowthTotal?: number;
  GrowthMissing?: number;
  GrowthNotMeasured?: number;
  GrowthMissingVaccines?: string;
  GrowthNotMeasuredBy?: string;
  GrowthNotMeasuredAt?: string;
}

interface GrowthPaStat { PaId: number; PaName: string; Missing: number; NotMeasured: number; Total: number; }

@Component({
  selector: 'app-payment-reconciliation-panel',
  templateUrl: './payment-reconciliation-panel.component.html',
  styleUrls: ['./payment-reconciliation-panel.component.scss'],
})
// The "Cash" tab of PA Assignment Tracking. Clinic/PA scope comes from the tracking page's own
// filter bar, so this panel has no header or clinic/PA pickers of its own.
export class PaymentReconciliationPanelComponent implements OnInit, OnChanges {
  @Input() clinicId: number | null = null;
  @Input() paId: number | null = null;
  doctorId: number | null = null;
  private ready = false;

  selectedClinicId: number | null = null;

  selectedPaId: number | null = null;
  fromDate: string = '';
  toDate: string = '';
  searchQuery: string = '';
  selectedStatus: string = 'all';
  // Growth flag filters (spec: GROWTH_FLAG_SPEC.md). Chips never block Confirm.
  growthFilter: '' | 'missing' | 'notmeasured' = '';
  growthPaFilter: number | null = null;
  growthMissingRows = 0;
  growthNotMeasuredRows = 0;
  growthPaStats: GrowthPaStat[] = [];

  allRows: PaymentRow[] = [];
  filteredRows: PaymentRow[] = [];
  selectedIds: Set<number> = new Set();

  loading: boolean = false;

  pendingReversals: any[] = [];
  pendingHandovers: any[] = [];
  outstanding: any[] = [];
  outstandingLoaded = false;
  cashView: 'pa' | 'all' = 'pa';
  cards: PaCard[] = [];
  private callerUserId: number = null;
  private securityStamp: string = null;

  constructor(
    private paService: PaService,
    private stockService: StockService,
    private storage: Storage,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController,
  ) {}

  async ngOnInit() {
    // No date filter by default — shows every pending row regardless of how old its InvoiceDate is.
    // A today-only default silently hid invoices dated before today (live-verified 2026-08-27:
    // widening took Payment Reconciliation from 12 rows to 623 still-unconfirmed invoices).
    this.fromDate = '';
    this.toDate = '';
    this.selectedClinicId = this.clinicId;
    this.selectedPaId = this.paId;

    const user = await this.storage.get(environment.USER);
    if (user && user.DoctorId) {
      this.doctorId = Number(user.DoctorId);
    }
    this.callerUserId = user && user.Id ? Number(user.Id) : null;
    this.securityStamp = await this.storage.get(environment.SECURITY_STAMP);
    this.ready = true;

    this.load();
    this.loadPendingReversals();
    this.loadPendingHandovers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.ready || (!changes.clinicId && !changes.paId)) { return; }
    this.selectedClinicId = this.clinicId;
    this.selectedPaId = this.paId;
    this.load();
  }

  onFilterChange() {
    this.load();
  }

  async confirmDeleteDirectSale(row: PaymentRow) {
    const alert = await this.alertController.create({
      header: 'Reverse Sale',
      message: `Reverse direct sale ${row.DirectSaleBillNo} for ${row.PatientName}? This will undo the sale and restore stock. Cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reverse',
          cssClass: 'alert-btn-danger',
          handler: async () => {
            const loading = await this.loadingController.create({ message: 'Reversing...' });
            await loading.present();
            this.stockService.deleteDirectSale(row.ScheduleId, { callerUserId: this.callerUserId, securityStamp: this.securityStamp }).subscribe(
              res => {
                loading.dismiss();
                if (res && res.IsSuccess) {
                  this.toastService.create('Sale reversed', 'success');
                  this.load();
                } else {
                  this.toastService.create((res && res.Message) || 'Failed to reverse', 'danger');
                }
              },
              () => { loading.dismiss(); this.toastService.create('Failed to reverse', 'danger'); }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  load() {
    if (!this.doctorId) { return; }
    this.loading = true;
    this.selectedIds = new Set();

    this.paService.getPaymentReconciliation(
      this.doctorId,
      this.selectedClinicId || undefined,
      this.selectedPaId || undefined,
      this.fromDate || undefined,
      this.toDate || undefined
    ).subscribe(
      res => {
        this.loading = false;
        if (res && res.IsSuccess && res.ResponseData) {
          this.allRows = res.ResponseData as PaymentRow[];
        } else if (res && res.IsSuccess && Array.isArray(res.ResponseData)) {
          this.allRows = res.ResponseData;
        } else {
          // Fallback: flatten daily summary into rows
          this.loadFallback();
          return;
        }
        this.applySearch();
      },
      () => {
        // Fallback if endpoint not yet available
        this.loadFallback();
      }
    );
  }

  private loadFallback() {
    this.paService.getDailySummary(this.doctorId!, this.fromDate).subscribe(
      res => {
        this.loading = false;
        if (res && res.IsSuccess && res.ResponseData) {
          const rows: PaymentRow[] = [];
          const summary: any[] = res.ResponseData.Summary || [];
          summary.forEach((pa: any) => {
            (pa.Schedules || []).forEach((s: any) => {
              rows.push({
                RowType: 'Invoice' as const,
                InvoiceSubmissionId: s.ScheduleId,
                ScheduleId: s.ScheduleId,
                Date: s.Date || this.fromDate,
                PatientName: s.ChildName || '',
                Vaccines: s.VaccineName || '',
                Amount: s.Amount || 0,
                PaymentMode: s.PaymentMode || '',
                IsConfirmed: !!s.IsPaymentApproved,
                ConfirmedAt: s.ApprovedAt || null,
                PaId: pa.PaId,
                // Manager gave this dose; this PA only collected/recorded payment — flag it
                // the same way the primary reconciliation path's "Manager/(PA Name)" does.
                PaName: s.GivenByManagerId ? ('Manager/(' + (pa.PaName || '') + ')') : (pa.PaName || ''),
                ClinicId: s.ClinicId || 0,
                ClinicName: s.ClinicName || '',
              });
            });
          });
          if (res.ResponseData.DoctorEntry) {
            const doc = res.ResponseData.DoctorEntry;
            (doc.Schedules || []).forEach((s: any) => {
              rows.push({
                RowType: 'Invoice' as const,
                InvoiceSubmissionId: s.ScheduleId,
                ScheduleId: s.ScheduleId,
                Date: s.Date || this.fromDate,
                PatientName: s.ChildName || '',
                Vaccines: s.VaccineName || '',
                Amount: s.Amount || 0,
                PaymentMode: s.PaymentMode || '',
                IsConfirmed: !!s.IsPaymentApproved,
                ConfirmedAt: s.ApprovedAt || null,
                PaId: 0,
                PaName: 'Doctor (Self)',
                ClinicId: s.ClinicId || 0,
                ClinicName: s.ClinicName || '',
              });
            });
          }
          this.allRows = rows;
          this.applySearch();
        } else {
          this.allRows = [];
          this.filteredRows = [];
        }
      },
      () => {
        this.loading = false;
        this.allRows = [];
        this.filteredRows = [];
        this.toastService.create('Failed to load payment data', 'danger');
      }
    );
  }

  loadPendingReversals() {
    if (!this.doctorId) { return; }
    this.paService.getPendingReversals(this.doctorId).subscribe(
      res => {
        if (res && res.IsSuccess) { this.pendingReversals = res.ResponseData || []; }
      },
      () => {}
    );
  }

  loadPendingHandovers() {
    if (!this.doctorId) { return; }
    this.paService.getOutstanding(this.doctorId).subscribe(
      res => {
        if (res && res.IsSuccess && res.ResponseData) {
          this.pendingHandovers = res.ResponseData.PendingHandovers || [];
          this.outstanding = res.ResponseData.Outstanding || [];
          this.outstandingLoaded = true;
          this.buildCards();
        }
      },
      () => {}
    );
  }

  // Name for a PA id from whatever the page has loaded (payment rows, then cash-in-hand list).
  paName(paId: number): string {
    const r = this.allRows.find(x => x.PaId === paId && !!x.PaName);
    if (r) { return r.PaName; }
    const o = this.outstanding.find(x => x.PaId === paId && !!x.PaName);
    return o ? o.PaName : '';
  }

  getPendingHandoverForPa(paId: number): any {
    return this.pendingHandovers.find(h => h.PaId === paId) || null;
  }

  get panelPendingHandover(): any {
    if (!this.selectedPaId) { return null; }
    return this.getPendingHandoverForPa(this.selectedPaId);
  }

  // The cash must be counted before it is accepted: the entered amount has to equal what the PA
  // declared. A different amount is never partly accepted; the doctor sends it back instead.
  async confirmHandover(h: any) {
    const alert = await this.alertController.create({
      header: 'Cash Received',
      subHeader: this.paName(h.PaId),
      message: `The PA says Rs ${h.Amount}. Count the cash and enter what you actually received.`,
      inputs: [{ name: 'counted', type: 'number', placeholder: 'Amount counted (Rs)' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm',
          handler: (data) => {
            const counted = Number(data.counted);
            if (data.counted === '' || isNaN(counted)) {
              this.toastService.create('Enter the amount you counted', 'warning');
              return false;
            }
            if (counted !== Number(h.Amount)) {
              this.toastService.create(`Counted Rs ${counted} does not match Rs ${h.Amount}. Use Send back to return it to the PA.`, 'danger');
              return false;
            }
            this.paService.confirmHandover(h.Id, this.doctorId, counted).subscribe(
              res => {
                if (res && res.IsSuccess) {
                  this.toastService.create('Handover confirmed', 'success');
                  this.loadPendingHandovers();
                  this.load();
                } else {
                  this.toastService.create((res && res.Message) || 'Failed', 'danger');
                }
              },
              () => this.toastService.create('Failed to confirm', 'danger')
            );
          }
        }
      ]
    });
    await alert.present();
  }

  async rejectHandover(h: any) {
    const alert = await this.alertController.create({
      header: 'Send back to PA',
      subHeader: this.paName(h.PaId),
      message: `Rs ${h.Amount} will go back to the PA as not handed over.`,
      inputs: [{ name: 'note', type: 'text', placeholder: 'Reason (optional)' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          handler: (data) => {
            this.paService.rejectHandover(h.Id, data.note || '', this.doctorId).subscribe(
              res => {
                if (res && res.IsSuccess) {
                  this.toastService.create('Sent back to the PA', 'warning');
                  this.loadPendingHandovers();
                } else {
                  this.toastService.create(res.Message || 'Failed', 'danger');
                }
              },
              () => this.toastService.create('Failed to reject', 'danger')
            );
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmApproveReversal(reversal: any) {
    const alert = await this.alertController.create({
      header: 'Approve Reversal',
      message: 'Approve this cancellation? The invoice amount will be reduced and the PA\'s payable decreased.\n\n' + (reversal.Notes || ''),
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Approve',
          handler: async () => {
            const loading = await this.loadingController.create({ message: 'Approving...' });
            await loading.present();
            this.paService.approveReversal(reversal.Id).subscribe(
              res => {
                loading.dismiss();
                if (res && res.IsSuccess) {
                  this.toastService.create('Reversal approved — payable adjusted', 'success');
                  this.pendingReversals = this.pendingReversals.filter((r: any) => r.Id !== reversal.Id);
                } else {
                  this.toastService.create((res && res.Message) || 'Failed', 'danger');
                }
              },
              () => { loading.dismiss(); this.toastService.create('Failed to approve', 'danger'); }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmRejectReversal(reversal: any) {
    const alert = await this.alertController.create({
      header: 'Reject Reversal',
      message: 'Reject this request? The PA\'s payable will remain unchanged.\n\n' + (reversal.Notes || ''),
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          cssClass: 'alert-btn-danger',
          handler: async () => {
            const loading = await this.loadingController.create({ message: 'Rejecting...' });
            await loading.present();
            this.paService.rejectReversal(reversal.Id).subscribe(
              res => {
                loading.dismiss();
                if (res && res.IsSuccess) {
                  this.toastService.create('Reversal rejected — payable unchanged', 'warning');
                  this.pendingReversals = this.pendingReversals.filter((r: any) => r.Id !== reversal.Id);
                } else {
                  this.toastService.create((res && res.Message) || 'Failed', 'danger');
                }
              },
              () => { loading.dismiss(); this.toastService.create('Failed to reject', 'danger'); }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  async promptAdjust(forPaId?: number) {
    const paId = forPaId || this.selectedPaId;
    if (!paId) { return; }
    const paName = this.paName(paId) || 'Selected PA';
    // A PA's clinic is known when the scope names one, or when they only hold cash in one.
    const paClinics = this.outstanding.filter(o => o.PaId === paId).map(o => o.ClinicId);
    const clinicId = this.selectedClinicId || (paClinics.length === 1 ? paClinics[0] : 0);
    const alert = await this.alertController.create({
      header: 'Adjust Payable',
      subHeader: paName,
      message: 'Enter a positive amount to increase or negative to decrease the PA\'s payable.',
      inputs: [
        { name: 'amount', type: 'number', placeholder: 'Amount (e.g. -500 or 200)' },
        { name: 'reason', type: 'text', placeholder: 'Reason (required)' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Apply',
          handler: async (data) => {
            const amt = Number(data.amount);
            if (!amt || amt === 0) {
              this.toastService.create('Enter a non-zero amount', 'warning');
              return false;
            }
            if (!data.reason || !data.reason.trim()) {
              this.toastService.create('Reason is required', 'warning');
              return false;
            }
            const loading = await this.loadingController.create({ message: 'Applying...' });
            await loading.present();
            this.paService.adjustPayable(paId, this.doctorId!, clinicId, amt, data.reason.trim()).subscribe(
              res => {
                loading.dismiss();
                if (res && res.IsSuccess) {
                  this.toastService.create('Adjustment applied', 'success');
                  this.loadPendingHandovers();
                } else {
                  this.toastService.create((res && res.Message) || 'Failed', 'danger');
                }
              },
              () => { loading.dismiss(); this.toastService.create('Failed to apply adjustment', 'danger'); }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  // Mirrors the badge logic in the template's col-status cell — kept in sync with it
  // so the Status filter always matches what the doctor actually sees on each row.
  rowStatus(row: PaymentRow): string {
    if (row.RowType === 'UngiveReversal') { return 'UngiveAfterDownload'; }
    if (row.RowType === 'EditReversal') { return 'InvoiceEditReversal'; }
    if (row.RowType === 'AwaitingInvoice') { return 'AwaitingInvoice'; }
    if (row.RowType === 'DirectSale') {
      if (row.IsConfirmed) { return 'Confirmed'; }
      if (row.PendingHandover) { return 'PendingHandover'; }
      if (row.IsPaymentCollected) { return 'PaymentRecorded'; }
      return 'PendingWithPa';
    }
    // RowType === 'Invoice'
    if (row.PendingAmendmentType) { return row.PendingAmendmentType === 'UngiveReversal' ? 'UngiveAfterDownload' : 'InvoiceEditReversal'; }
    if (row.IsConfirmed) { return 'Confirmed'; }
    if (row.PendingHandover) { return 'PendingHandover'; }
    return 'PendingWithPa';
  }

  applySearch(keepSelection: boolean = false) {
    const q = (this.searchQuery || '').toLowerCase().trim();
    let rows = q
      ? this.allRows.filter(r => r.PatientName.toLowerCase().includes(q))
      : [...this.allRows];
    if (this.selectedStatus !== 'all') {
      rows = rows.filter(r => this.rowStatus(r) === this.selectedStatus);
    }
    this.buildGrowthSummary(rows);
    if (this.growthFilter === 'missing') {
      rows = rows.filter(r => this.growthMissingOf(r) > 0);
    } else if (this.growthFilter === 'notmeasured') {
      rows = rows.filter(r => this.growthNotMeasuredOf(r) > 0);
    }
    if (this.growthPaFilter !== null) {
      const paId = this.growthPaFilter;
      rows = rows.filter(r => r.PaId === paId);
    }
    this.filteredRows = rows;
    if (keepSelection) {
      // Only keep ticks that are still on screen, so a hidden row is never confirmed by accident.
      const visible = new Set(rows.map(r => r.ScheduleId));
      const kept = new Set<number>();
      this.selectedIds.forEach(id => { if (visible.has(id)) { kept.add(id); } });
      this.selectedIds = kept;
    } else {
      this.selectedIds = new Set();
    }
    this.buildCards();
  }

  // ── Growth flag helpers (Invoice rows only: other row types have no growth meaning) ──
  growthMissingOf(r: PaymentRow): number {
    return r.RowType === 'Invoice' ? (r.GrowthMissing || 0) : 0;
  }

  growthNotMeasuredOf(r: PaymentRow): number {
    return r.RowType === 'Invoice' ? (r.GrowthNotMeasured || 0) : 0;
  }

  growthMissingTip(r: PaymentRow): string {
    return r.GrowthMissingVaccines ? 'No weight, height or OFC recorded: ' + r.GrowthMissingVaccines : 'No growth recorded';
  }

  growthNotMeasuredTip(r: PaymentRow): string {
    const by = r.GrowthNotMeasuredBy ? ('Marked Not measured by ' + r.GrowthNotMeasuredBy) : 'Marked Not measured by the PA';
    return r.GrowthNotMeasuredAt ? by + ' · ' + formatInstant(r.GrowthNotMeasuredAt, 'd MMM, h:mm a') : by;
  }

  // Counts come from the rows on screen before the growth chips apply, so the chips stay stable.
  private buildGrowthSummary(rows: PaymentRow[]) {
    let missingRows = 0;
    let notMeasuredRows = 0;
    const byPa: { [id: number]: GrowthPaStat } = {};
    rows.forEach(r => {
      if (r.RowType !== 'Invoice') { return; }
      const m = this.growthMissingOf(r);
      const n = this.growthNotMeasuredOf(r);
      if (m > 0) { missingRows++; }
      if (n > 0) { notMeasuredRows++; }
      if (m + n === 0) { return; }
      const st = byPa[r.PaId] || (byPa[r.PaId] = { PaId: r.PaId, PaName: r.PaName, Missing: 0, NotMeasured: 0, Total: 0 });
      st.Missing += m;
      st.NotMeasured += n;
    });
    // Total doses per PA (flagged or not) so "x of n" is honest.
    rows.forEach(r => {
      if (r.RowType === 'Invoice' && byPa[r.PaId]) { byPa[r.PaId].Total += (r.GrowthTotal || 0); }
    });
    this.growthMissingRows = missingRows;
    this.growthNotMeasuredRows = notMeasuredRows;
    this.growthPaStats = Object.keys(byPa).map(k => byPa[+k])
      .sort((a, b) => ((b.Missing + b.NotMeasured) - (a.Missing + a.NotMeasured)) || a.PaName.localeCompare(b.PaName));
  }

  setGrowthFilter(f: '' | 'missing' | 'notmeasured') {
    this.growthFilter = this.growthFilter === f ? '' : f;
    this.applySearch(true);
  }

  setGrowthPaFilter(paId: number) {
    this.growthPaFilter = this.growthPaFilter === paId ? null : paId;
    this.applySearch(true);
  }

  // Bulk warning: selected invoices with no growth recorded or marked Not measured. Never blocks Confirm.
  growthWarnCount(rows: PaymentRow[]): number {
    return rows.filter(r => this.growthMissingOf(r) + this.growthNotMeasuredOf(r) > 0).length;
  }

  get selectedGrowthWarn(): number {
    return this.growthWarnCount(this.filteredRows.filter(r => this.selectedIds.has(r.ScheduleId)));
  }

  setCashView(v: 'pa' | 'all') {
    this.cashView = v;
  }

  // Cash held per PA comes from the server's cash-in-hand figure (the same one the PA sees),
  // not from adding up invoice rows, so the two screens cannot disagree.
  private holdsFor(paId: number): number {
    return this.outstanding
      .filter(o => o.PaId === paId && (!this.selectedClinicId || o.ClinicId === this.selectedClinicId))
      .reduce((sum, o) => sum + (o.PendingCash || 0), 0);
  }

  buildCards() {
    const byPa: { [id: number]: PaCard } = {};
    const card = (paId: number, name: string): PaCard => {
      if (!byPa[paId]) {
        byPa[paId] = { PaId: paId, PaName: name || this.paName(paId) || ('PA ' + paId), Holds: this.holdsFor(paId),
          Handovers: [], Invoices: [], Deleted: [], Decisions: [], DirectSales: [], AwaitingInvoice: 0 };
      }
      return byPa[paId];
    };
    this.filteredRows.forEach(r => {
      if (!r.PaId) { return; }
      if (r.RowType === 'DirectSale') {
        if (!r.IsConfirmed) { card(r.PaId, r.PaName).DirectSales.push(r); }
      } else if (r.RowType === 'AwaitingInvoice') {
        card(r.PaId, r.PaName).AwaitingInvoice++;
      } else if (r.RowType === 'Invoice' && r.PatientDeleted) {
        card(r.PaId, r.PaName).Deleted.push(r);
      } else if (r.RowType !== 'Invoice' || r.PendingAmendmentType) {
        if (r.AmendmentId) { card(r.PaId, r.PaName).Decisions.push(r); }
      } else if (!r.IsConfirmed) {
        card(r.PaId, r.PaName).Invoices.push(r);
      }
    });
    this.pendingHandovers
      .filter(h => (!this.selectedPaId || h.PaId === this.selectedPaId) && (!this.selectedClinicId || h.ClinicId === this.selectedClinicId))
      .forEach(h => card(h.PaId, '').Handovers.push(h));
    this.outstanding
      .filter(o => (!this.selectedPaId || o.PaId === this.selectedPaId) && this.holdsFor(o.PaId) > 0)
      .forEach(o => card(o.PaId, o.PaName));
    this.cards = Object.keys(byPa).map(k => byPa[Number(k)])
      .sort((a, b) => (b.Holds - a.Holds) || a.PaName.localeCompare(b.PaName));
  }

  cardSelected(c: PaCard): PaymentRow[] {
    return c.Invoices.filter(r => this.selectedIds.has(r.ScheduleId));
  }

  async confirmCardSelected(c: PaCard) {
    const rows = this.cardSelected(c);
    if (rows.length === 0) { return; }
    const total = rows.reduce((sum, r) => sum + (r.Amount || 0), 0);
    const alert = await this.alertController.create({
      header: `Confirm ${rows.length} invoice${rows.length > 1 ? 's' : ''}`,
      message: `Confirm ${rows.length} invoice${rows.length > 1 ? 's' : ''} from ${c.PaName}, PKR ${total.toLocaleString()}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Confirm', handler: () => { this.doConfirm(rows); } }
      ]
    });
    await alert.present();
  }

  onSearch() {
    this.applySearch();
  }

  // Summary card getters
  get totalCollections(): number {
    return this.allRows.reduce((s, r) => s + (r.Amount || 0), 0);
  }

  get cashWithPA(): number {
    if (this.outstandingLoaded) {
      return this.outstanding
        .filter(o => (!this.selectedPaId || o.PaId === this.selectedPaId) && (!this.selectedClinicId || o.ClinicId === this.selectedClinicId))
        .reduce((sum, o) => sum + (o.PendingCash || 0), 0);
    }
    return this.allRows
      .filter(r => !r.IsConfirmed && r.PaymentMode === 'Cash')
      .reduce((s, r) => s + (r.Amount || 0), 0);
  }

  get onlinePayments(): number {
    return this.allRows
      .filter(r => r.PaymentMode === 'Online')
      .reduce((s, r) => s + (r.Amount || 0), 0);
  }

  get reconciledAmount(): number {
    return this.allRows
      .filter(r => r.IsConfirmed)
      .reduce((s, r) => s + (r.Amount || 0), 0);
  }

  // Checkbox / bulk
  isSelected(row: PaymentRow): boolean {
    return this.selectedIds.has(row.ScheduleId);
  }

  toggleRow(row: PaymentRow, checked: boolean) {
    if (checked) {
      this.selectedIds.add(row.ScheduleId);
    } else {
      this.selectedIds.delete(row.ScheduleId);
    }
    this.selectedIds = new Set(this.selectedIds);
  }

  private isBulkSelectable(r: PaymentRow): boolean {
    return !r.IsConfirmed && r.RowType === 'Invoice' && !r.PendingAmendmentType && !r.PatientDeleted;
  }

  get allChecked(): boolean {
    const pending = this.filteredRows.filter(r => this.isBulkSelectable(r));
    return pending.length > 0 && pending.every(r => this.selectedIds.has(r.ScheduleId));
  }

  toggleAll(checked: boolean) {
    if (checked) {
      this.filteredRows.filter(r => this.isBulkSelectable(r)).forEach(r => this.selectedIds.add(r.ScheduleId));
    } else {
      this.selectedIds = new Set();
    }
    this.selectedIds = new Set(this.selectedIds);
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get selectedTotal(): number {
    return this.filteredRows
      .filter(r => this.selectedIds.has(r.ScheduleId))
      .reduce((s, r) => s + (r.Amount || 0), 0);
  }

  // Single row confirm
  async confirmPayment(row: PaymentRow) {
    const alert = await this.alertController.create({
      header: 'Confirm Payment Receipt',
      message: `Have you received PKR ${row.Amount.toLocaleString()} (${row.PaymentMode}) from ${row.PaName} for ${row.PatientName} — ${row.Vaccines}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm Receipt',
          cssClass: 'alert-btn-confirm',
          handler: () => {
            this.doConfirm([row]);
          }
        }
      ]
    });
    await alert.present();
  }

  // Invoice of a deleted patient: one plain confirm, no typed reason ("patient deleted" is the reason).
  async cancelDeletedPatientPayment(row: PaymentRow) {
    const alert = await this.alertController.create({
      header: 'Cancel payment',
      message: `Cancel PKR ${row.Amount.toLocaleString()} (${row.PaymentMode || 'no mode'}) from ${row.PaName}? The patient was deleted, so ${row.PaName} will no longer owe this money.`,
      buttons: [
        { text: 'Keep', role: 'cancel' },
        {
          text: 'Cancel payment',
          cssClass: 'alert-btn-danger',
          handler: async () => {
            const loading = await this.loadingController.create({ message: 'Cancelling...' });
            await loading.present();
            this.paService.cancelDeletedPatientPayment(row.InvoiceSubmissionId || row.ScheduleId, this.doctorId!).subscribe(
              res => {
                loading.dismiss();
                if (res && res.IsSuccess) {
                  this.toastService.create('Payment cancelled', 'success');
                  this.load();
                } else {
                  this.toastService.create((res && res.Message) || 'Could not cancel', 'danger');
                }
              },
              () => {
                loading.dismiss();
                this.toastService.create('Could not cancel', 'danger');
              }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  // Direct-sale row confirm
  async confirmDirectSale(row: PaymentRow) {
    const alert = await this.alertController.create({
      header: 'Confirm Payment Receipt',
      message: `Have you received PKR ${row.Amount.toLocaleString()} (${row.PaymentMode}) from ${row.PaName} for direct sale ${row.DirectSaleBillNo}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm Receipt',
          cssClass: 'alert-btn-confirm',
          handler: async () => {
            const loading = await this.loadingController.create({ message: 'Confirming...' });
            await loading.present();
            this.stockService.confirmDirectSale(row.DirectSaleBillNo!, this.doctorId!, this.callerUserId, this.securityStamp).subscribe(
              res => {
                loading.dismiss();
                if (res && res.IsSuccess) {
                  row.IsConfirmed = true;
                  row.ConfirmedAt = nowInstant().toISOString(); // time-ok
                  this.toastService.create('Payment confirmed', 'success');
                } else {
                  this.toastService.create((res && res.Message) || 'Failed to confirm', 'danger');
                }
              },
              () => {
                loading.dismiss();
                this.toastService.create('Failed to confirm', 'danger');
              }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  // Bulk confirm
  async bulkConfirm() {
    if (this.selectedCount === 0) { return; }
    const alert = await this.alertController.create({
      header: `Confirm ${this.selectedCount} Payment${this.selectedCount > 1 ? 's' : ''}`,
      message: `Mark ${this.selectedCount} selected payment${this.selectedCount > 1 ? 's' : ''} totaling PKR ${this.selectedTotal.toLocaleString()} as received?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm All',
          cssClass: 'alert-btn-confirm',
          handler: () => {
            const rows = this.filteredRows.filter(r => this.selectedIds.has(r.ScheduleId));
            this.doConfirm(rows);
          }
        }
      ]
    });
    await alert.present();
  }

  private async doConfirm(rows: PaymentRow[]) {
    const loading = await this.loadingController.create({ message: 'Confirming...' });
    await loading.present();
    let done = 0;
    let failed = 0;
    const total = rows.length;
    const confirmNext = (index: number) => {
      if (index >= total) {
        loading.dismiss();
        if (failed === 0) {
          this.toastService.create(`${done} payment${done > 1 ? 's' : ''} confirmed`, 'success');
        } else {
          this.toastService.create(`${done} confirmed, ${failed} failed`, 'warning');
        }
        this.selectedIds = new Set();
        this.load();
        return;
      }
      const row = rows[index];
      this.paService.confirmInvoice(row.InvoiceSubmissionId || row.ScheduleId, this.doctorId!, this.callerUserId, this.securityStamp).subscribe(
        res => {
          if (res && res.IsSuccess) {
            done++;
            row.IsConfirmed = true;
            row.ConfirmedAt = nowInstant().toISOString(); // time-ok
          } else {
            failed++;
          }
          confirmNext(index + 1);
        },
        () => { failed++; confirmNext(index + 1); }
      );
    };
    confirmNext(0);
  }

  async approveAmendment(row: PaymentRow) {
    const isUngive = row.RowType === 'UngiveReversal' || row.PendingAmendmentType === 'UngiveReversal';
    const alert = await this.alertController.create({
      header: isUngive ? 'Approve Ungive' : 'Approve Invoice Edit',
      message: isUngive
        ? `Approve ungive for ${row.PatientName}? PA payable will drop to PKR 0 for this invoice.`
        : `Approve this edit for ${row.PatientName}? PA payable will change from PKR ${(row.OldAmount || 0).toLocaleString()} to PKR ${(row.NewAmount || row.Amount || 0).toLocaleString()}.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Approve',
          cssClass: 'alert-btn-confirm',
          handler: () => {
            this.paService.approveAmendment(row.AmendmentId!, this.doctorId!).subscribe(
              res => {
                if (res && res.IsSuccess) {
                  this.toastService.create('Amendment approved', 'success');
                  this.load();
                } else {
                  this.toastService.create((res && res.Message) || 'Approve failed', 'danger');
                }
              },
              () => this.toastService.create('Approve failed', 'danger')
            );
          }
        }
      ]
    });
    await alert.present();
  }

  async rejectAmendment(row: PaymentRow) {
    const isUngive = row.RowType === 'UngiveReversal' || row.PendingAmendmentType === 'UngiveReversal';
    const alert = await this.alertController.create({
      header: 'Reject — PA Still Owes',
      message: isUngive
        ? `Reject ungive for ${row.PatientName}? PA will still owe PKR ${(row.OldAmount || row.Amount).toLocaleString()}.`
        : `Reject this edit for ${row.PatientName}? PA still owes original amount PKR ${(row.OldAmount || row.Amount).toLocaleString()}.`,
      inputs: [{ name: 'notes', type: 'text', placeholder: 'Optional notes...' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          cssClass: 'alert-btn-danger',
          handler: (data) => {
            this.paService.rejectAmendment(row.AmendmentId!, this.doctorId!, (data && data.notes) || '').subscribe(
              res => {
                if (res && res.IsSuccess) {
                  this.toastService.create('Amendment rejected - PA still owes full amount', 'warning');
                  this.load();
                } else {
                  this.toastService.create((res && res.Message) || 'Reject failed', 'danger');
                }
              },
              () => this.toastService.create('Reject failed', 'danger')
            );
          }
        }
      ]
    });
    await alert.present();
  }

  // ---- Activity log drawer (the Date cell opens the assignment's full timestamped history)
  log: { row: PaymentRow; entries: any[] | null; filter: string } | null = null;
  readonly logKinds = [
    { key: 'all', label: 'All' },
    { key: 'assign', label: 'Assignment' },
    { key: 'given', label: 'Vaccine' },
    { key: 'invoice', label: 'Invoice' },
    { key: 'pay', label: 'Payment' },
    { key: 'hand', label: 'Handover' },
  ];

  openLog(row: PaymentRow) {
    if (!row.AssignmentId) { return; }
    const cur = { row, entries: null as any[] | null, filter: 'all' };
    this.log = cur;
    this.paService.getAssignmentHistory(row.AssignmentId).subscribe(
      res => { cur.entries = (res && res.IsSuccess) ? (res.ResponseData || []) : []; },
      () => { cur.entries = []; }
    );
  }

  closeLog() { this.log = null; }

  private logKind(e: any): string {
    switch (e.Action) {
      case 'Given': case 'Ungiven': case 'MarkedDone': return 'given';
      case 'Invoiced': case 'Confirmed': case 'InvoiceDownloaded': return 'invoice';
      case 'PaymentRecorded': case 'PaymentVerified': return 'pay';
      case 'HandedOver': return 'hand';
      default: return 'assign';
    }
  }

  visibleEntries(): any[] {
    if (!this.log || !this.log.entries) { return []; }
    const f = this.log.filter;
    return f === 'all' ? this.log.entries : this.log.entries.filter(e => this.logKind(e) === f);
  }

  dayLabel(at: string): string { return formatInstant(at, 'EEE d MMM yyyy'); }
  timeLabel(at: string): string { return formatInstant(at, 'h:mm a'); }

  actorLabel(e: any): string {
    if (e.ActorName) { return e.ActorName + (e.Actor === 'PA' ? ' (PA)' : e.Actor === 'MANAGER' ? ' (Manager)' : e.Actor === 'DOCTOR' ? ' (Doctor)' : ''); }
    if (e.Actor === 'PARENT') { return 'Parent'; }
    if (e.Actor === 'DOCTOR') { return 'Doctor'; }
    if (e.Actor === 'MANAGER') { return 'Manager'; }
    if (e.Actor === 'PA') { return 'PA'; }
    return '';
  }

  // Row.Date is a calendar day; the *At stamps are UTC instants.
  formatDate(dateStr: string): string { return formatDay(dateStr, 'dd/MM/yy'); }

  formatDateTime(dateStr: string): string {
    const t = formatInstant(dateStr, 'dd MMM yyyy h:mm a');
    return t ? t + ' PKT' : '';
  }
}
