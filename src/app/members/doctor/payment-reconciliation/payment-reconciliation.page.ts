import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ClinicService } from 'src/app/services/clinic.service';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

interface PaymentRow {
  InvoiceSubmissionId: number;
  ScheduleId: number;       // alias = InvoiceSubmissionId, kept for backwards compat
  AmendmentId?: number;     // set when RowType is UngiveReversal or EditReversal
  RowType: 'Invoice' | 'UngiveReversal' | 'EditReversal';
  Date: string;
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

  allRows: PaymentRow[] = [];
  filteredRows: PaymentRow[] = [];
  selectedIds: Set<number> = new Set();

  loading: boolean = false;

  constructor(
    private paService: PaService,
    private clinicService: ClinicService,
    private storage: Storage,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController,
  ) {}

  async ionViewWillEnter() {
    const today = this.toDateStr(new Date());
    this.fromDate = today;
    this.toDate = today;

    const user = await this.storage.get(environment.USER);
    if (user && user.DoctorId) {
      this.doctorId = Number(user.DoctorId);
    }
    await this.loadClinics();
    this.load();
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
                PaymentMode: s.PaymentMode || 'Cash',
                IsConfirmed: !!s.IsPaymentApproved,
                ConfirmedAt: s.ApprovedAt || null,
                PaId: pa.PaId,
                PaName: pa.PaName || '',
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
                PaymentMode: s.PaymentMode || 'Cash',
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

  applySearch() {
    const q = (this.searchQuery || '').toLowerCase().trim();
    this.filteredRows = q
      ? this.allRows.filter(r => r.PatientName.toLowerCase().includes(q))
      : [...this.allRows];
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

  // Right-panel getters (based on selected PA or all PAs)
  get panelRows(): PaymentRow[] {
    if (this.selectedPaId) {
      return this.allRows.filter(r => r.PaId === this.selectedPaId);
    }
    return this.allRows;
  }

  get panelCashPending(): number {
    return this.panelRows
      .filter(r => !r.IsConfirmed && r.PaymentMode === 'Cash')
      .reduce((s, r) => s + (r.Amount || 0), 0);
  }

  get panelOnlinePending(): number {
    return this.panelRows
      .filter(r => !r.IsConfirmed && r.PaymentMode === 'Online')
      .reduce((s, r) => s + (r.Amount || 0), 0);
  }

  get panelTotalOutstanding(): number {
    return this.panelRows
      .filter(r => !r.IsConfirmed)
      .reduce((s, r) => s + (r.Amount || 0), 0);
  }

  get selectedPaName(): string {
    if (!this.selectedPaId) { return 'All Staff / PA'; }
    const pa = this.pas.find(p => p.PaId === this.selectedPaId || p.Id === this.selectedPaId);
    return pa ? pa.Name || pa.PaName : 'Selected PA';
  }

  get selectedClinicName(): string {
    if (!this.selectedClinicId) { return 'All Clinics'; }
    const c = this.clinics.find(cl => cl.Id === this.selectedClinicId);
    return c ? c.Name : 'Selected Clinic';
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
    const pending = this.filteredRows.filter(r => !r.IsConfirmed);
    return pending.length > 0 && pending.every(r => this.selectedIds.has(r.ScheduleId));
  }

  toggleAll(checked: boolean) {
    if (checked) {
      this.filteredRows.filter(r => !r.IsConfirmed).forEach(r => this.selectedIds.add(r.ScheduleId));
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

  formatDate(dateStr: string): string {
    if (!dateStr) { return ''; }
    try {
      const d = new Date(dateStr);
      const dd = d.getDate().toString().padStart(2, '0');
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const yy = d.getFullYear().toString().slice(-2);
      return `${dd}/${mm}/${yy}`;
    } catch { return dateStr; }
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) { return ''; }
    try {
      const d = new Date(dateStr);
      const dd = d.getDate().toString().padStart(2, '0');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      let h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${dd} ${months[d.getMonth()]} ${d.getFullYear()} ${h}:${m} ${ampm}`;
    } catch { return dateStr; }
  }
}
