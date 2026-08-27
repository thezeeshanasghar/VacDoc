import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ClinicService } from 'src/app/services/clinic.service';
import { PaService } from 'src/app/services/pa.service';
import { StockService } from 'src/app/services/stock.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

interface PaymentRow {
  InvoiceSubmissionId: number;
  ScheduleId: number;       // alias = InvoiceSubmissionId, kept for backwards compat
  AmendmentId?: number;     // set when RowType is UngiveReversal or EditReversal
  AssignmentId?: number;    // PAAssignment.Id — used for "delete assignment" cascade
  DirectSaleBillNo?: string; // set when RowType is DirectSale
  RowType: 'Invoice' | 'UngiveReversal' | 'EditReversal' | 'AwaitingInvoice' | 'DirectSale';
  Date: string;
  AssignedAt?: string;
  PatientName: string;
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
}

@Component({
  selector: 'app-payment-reconciliation',
  templateUrl: './payment-reconciliation.page.html',
  styleUrls: ['./payment-reconciliation.page.scss'],
})
export class PaymentReconciliationPage {
  doctorId: number | null = null;
  clinics: any[] = [];
  pas: any[] = [];

  selectedClinicId: number | null = null;

  selectedPaId: number | null = null;
  fromDate: string = '';
  toDate: string = '';
  searchQuery: string = '';
  selectedStatus: string = 'all';

  allRows: PaymentRow[] = [];
  filteredRows: PaymentRow[] = [];
  selectedIds: Set<number> = new Set();

  loading: boolean = false;

  pendingReversals: any[] = [];
  pendingHandovers: any[] = [];

  constructor(
    private paService: PaService,
    private clinicService: ClinicService,
    private stockService: StockService,
    private storage: Storage,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private route: ActivatedRoute,
  ) {}

  async ionViewWillEnter() {
    // Default to no date filter — shows every pending row regardless of how old its
    // InvoiceDate is. Defaulting to today/today silently hid any invoice dated before
    // today (e.g. a visit given weeks/months back but invoiced/paid-mode-recorded later),
    // since GetByPA (the PA's own list) never date-filters at all. Live-verified 2026-08-27:
    // widening from today-only to an open range took Payment Reconciliation from 12 rows to
    // 623, surfacing real, still-unconfirmed invoices (e.g. "Ahmed Javed", dated 21 Jul 2026,
    // PKR 7,866 Online) that had been invisible under the today-only default. See "Today"
    // quick-filter button below for the narrower view.
    this.fromDate = '';
    this.toDate = '';

    const user = await this.storage.get(environment.USER);
    if (user && user.DoctorId) {
      this.doctorId = Number(user.DoctorId);
    }
    await this.loadClinics();

    // Optional deep-link from PA Assignment Tracking's "View in Payments" — pre-selects
    // clinic/PA scope so the doctor lands on the right filter instead of "All Clinics".
    const params = this.route.snapshot.queryParamMap;
    const qClinicId = params.get('clinicId');
    const qPaId = params.get('paId');
    if (qClinicId) {
      this.selectedClinicId = Number(qClinicId);
      await new Promise<void>(resolve => {
        this.loadPasForClinic();
        // loadPasForClinic() is async (subscribe-based); give it a tick before applying paId
        setTimeout(resolve, 300);
      });
    }
    if (qPaId) {
      this.selectedPaId = Number(qPaId);
    }

    this.load();
    this.loadPendingReversals();
    this.loadPendingHandovers();
  }

  private toDateStr(d: Date): string {
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  async loadClinics() {
    if (!this.doctorId) { return; }
    this.clinicService.getClinics(this.doctorId!).subscribe(res => {
      if (res && res.IsSuccess) {
        this.clinics = res.ResponseData || [];
      }
    });
  }

  loadPasForClinic() {
    if (!this.selectedClinicId) {
      this.pas = [];
      this.selectedPaId = null;
      return;
    }
    this.paService.getPAsForClinic(this.selectedClinicId).subscribe(res => {
      if (res && res.IsSuccess) {
        this.pas = res.ResponseData || [];
      } else {
        this.pas = [];
      }
      this.selectedPaId = null;
    });
  }

  onClinicChange() {
    this.loadPasForClinic();
    this.load();
  }

  onFilterChange() {
    this.load();
  }

  setTodayFilter() {
    const today = this.toDateStr(new Date());
    this.fromDate = today;
    this.toDate = today;
    this.load();
  }

  clearDateFilter() {
    this.fromDate = '';
    this.toDate = '';
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
            this.stockService.deleteDirectSale(row.ScheduleId).subscribe(
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

  async confirmDeleteAssignment(row: PaymentRow) {
    if (!row.AssignmentId) {
      this.toastService.create('No assignment linked to this row', 'warning');
      return;
    }
    const alert = await this.alertController.create({
      header: 'Remove Assignment',
      message: `How should this assignment for ${row.PatientName} be removed?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove from list only',
          cssClass: 'alert-btn-neutral',
          handler: () => this.runDeleteAssignment(row, 'UnassignOnly',
            'This only removes the assignment from your reconciliation table and the PA\'s list. The child\'s vaccine and payment records are not affected.')
        },
        {
          text: 'Reverse everything',
          cssClass: 'alert-btn-danger',
          handler: () => this.runDeleteAssignment(row, 'FullReset',
            'This will delete the invoice, restore any consumed stock, and reset the patient\'s vaccine records for this visit back to never-given. Cannot be undone.')
        }
      ]
    });
    await alert.present();
  }

  private async runDeleteAssignment(row: PaymentRow, mode: 'UnassignOnly' | 'FullReset', confirmMessage: string) {
    const confirm = await this.alertController.create({
      header: mode === 'FullReset' ? 'Reverse Everything?' : 'Remove From List Only?',
      message: confirmMessage,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: mode === 'FullReset' ? 'Reverse' : 'Remove',
          cssClass: mode === 'FullReset' ? 'alert-btn-danger' : 'alert-btn-neutral',
          handler: async () => {
            const loading = await this.loadingController.create({ message: 'Processing...' });
            await loading.present();
            this.paService.deleteAssignment(row.AssignmentId!, this.doctorId!, mode).subscribe(
              res => {
                loading.dismiss();
                if (res && res.IsSuccess) {
                  this.toastService.create(mode === 'FullReset' ? 'Assignment reset and removed' : 'Assignment removed', 'success');
                  this.load();
                } else {
                  this.toastService.create((res && res.Message) || 'Action failed', 'danger');
                }
              },
              () => { loading.dismiss(); this.toastService.create('Action failed', 'danger'); }
            );
          }
        }
      ]
    });
    await confirm.present();
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
        }
      },
      () => {}
    );
  }

  getPendingHandoverForPa(paId: number): any {
    return this.pendingHandovers.find(h => h.PaId === paId) || null;
  }

  get panelPendingHandover(): any {
    if (!this.selectedPaId) { return null; }
    return this.getPendingHandoverForPa(this.selectedPaId);
  }

  async confirmHandover(h: any) {
    const alert = await this.alertController.create({
      header: 'Cash Received',
      message: `Confirm you received Rs ${h.Amount} cash from this PA?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm',
          handler: () => {
            this.paService.confirmHandover(h.Id).subscribe(
              res => {
                if (res && res.IsSuccess) {
                  this.toastService.create('Handover confirmed', 'success');
                  this.loadPendingHandovers();
                } else {
                  this.toastService.create(res.Message || 'Failed', 'danger');
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
      header: 'Reject Handover',
      inputs: [{ name: 'note', type: 'text', placeholder: 'Reason (optional)' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          handler: (data) => {
            this.paService.rejectHandover(h.Id, data.note || '').subscribe(
              res => {
                if (res && res.IsSuccess) {
                  this.toastService.create('Handover rejected', 'warning');
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

  async promptAdjust() {
    if (!this.selectedPaId) { return; }
    const pa = this.pas.find(p => p.PaId === this.selectedPaId || p.Id === this.selectedPaId);
    const paName = pa ? (pa.Name || pa.PaName) : 'Selected PA';
    const clinicId = this.selectedClinicId || 0;
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
            this.paService.adjustPayable(this.selectedPaId!, this.doctorId!, clinicId, amt, data.reason.trim()).subscribe(
              res => {
                loading.dismiss();
                if (res && res.IsSuccess) {
                  this.toastService.create('Adjustment applied', 'success');
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
    if (row.IsConfirmed) { return 'Confirmed'; }
    if (row.PendingHandover) { return 'PendingHandover'; }
    return 'PendingWithPa';
  }

  applySearch() {
    const q = (this.searchQuery || '').toLowerCase().trim();
    let rows = q
      ? this.allRows.filter(r => r.PatientName.toLowerCase().includes(q))
      : [...this.allRows];
    if (this.selectedStatus !== 'all') {
      rows = rows.filter(r => this.rowStatus(r) === this.selectedStatus);
    }
    this.filteredRows = rows;
    this.selectedIds = new Set();
  }

  onSearch() {
    this.applySearch();
  }

  // Summary card getters
  get totalCollections(): number {
    return this.allRows.reduce((s, r) => s + (r.Amount || 0), 0);
  }

  get cashWithPA(): number {
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

  get allChecked(): boolean {
    const pending = this.filteredRows.filter(r => !r.IsConfirmed && r.RowType === 'Invoice');
    return pending.length > 0 && pending.every(r => this.selectedIds.has(r.ScheduleId));
  }

  toggleAll(checked: boolean) {
    if (checked) {
      this.filteredRows.filter(r => !r.IsConfirmed && r.RowType === 'Invoice').forEach(r => this.selectedIds.add(r.ScheduleId));
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
            this.stockService.confirmDirectSale(row.DirectSaleBillNo!, this.doctorId!).subscribe(
              res => {
                loading.dismiss();
                if (res && res.IsSuccess) {
                  row.IsConfirmed = true;
                  row.ConfirmedAt = new Date().toISOString();
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
      this.paService.confirmInvoice(row.InvoiceSubmissionId || row.ScheduleId, this.doctorId!).subscribe(
        res => {
          if (res && res.IsSuccess) {
            done++;
            row.IsConfirmed = true;
            row.ConfirmedAt = new Date().toISOString();
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
    const alert = await this.alertController.create({
      header: row.RowType === 'UngiveReversal' ? 'Approve Ungive' : 'Approve Invoice Edit Reversal',
      message: row.RowType === 'UngiveReversal'
        ? `Approve ungive for ${row.PatientName}? PA payable will drop to PKR 0 for this invoice.`
        : `Approve edit reversal for ${row.PatientName}? PA payable for Amount1 (PKR ${(row.OldAmount || 0).toLocaleString()}) will be reversed.`,
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
    const alert = await this.alertController.create({
      header: 'Reject — PA Still Owes',
      message: row.RowType === 'UngiveReversal'
        ? `Reject ungive for ${row.PatientName}? PA will still owe PKR ${(row.OldAmount || row.Amount).toLocaleString()}.`
        : `Reject edit reversal for ${row.PatientName}? PA still owes original amount PKR ${(row.OldAmount || row.Amount).toLocaleString()}.`,
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

  // Pakistan Standard Time is fixed (no DST), but the device/browser rendering this may
  // not be — so parts are pulled via Intl with an explicit Asia/Karachi timeZone instead
  // of trusting d.getDate()/getHours() (which read the LOCAL device timezone).
  private pktParts(dateStr: string): { [key: string]: string } {
    const d = new Date(dateStr);
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      year: 'numeric', month: 'short', day: '2-digit',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
    const parts: { [key: string]: string } = {};
    fmt.formatToParts(d).forEach(p => { parts[p.type] = p.value; });
    return parts;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) { return ''; }
    try {
      const p = this.pktParts(dateStr);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const mm = (months.indexOf(p.month) + 1).toString().padStart(2, '0');
      return `${p.day}/${mm}/${p.year.slice(-2)}`;
    } catch { return dateStr; }
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) { return ''; }
    try {
      const p = this.pktParts(dateStr);
      return `${p.day} ${p.month} ${p.year} ${p.hour}:${p.minute} ${p.dayPeriod} PKT`;
    } catch { return dateStr; }
  }
}
