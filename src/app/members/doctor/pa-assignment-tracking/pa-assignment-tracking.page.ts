import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ClinicService } from 'src/app/services/clinic.service';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

interface DoseRow {
  ScheduleId: number;
  DoseName: string;
  Date: string;
  IsDone: boolean;
  GivenByPaId: number | null;
}

interface AssignmentRow {
  AssignmentId: number;
  AssignedAt: string;
  TargetDate: string | null;
  Notes: string;
  AssignmentStatus: string;
  IsCompleted: boolean;
  IsCancelled: boolean;
  IsAutoCreated: boolean;
  CompletedAt: string | null;
  CancelledAt: string | null;
  CancelReason: string | null;
  ChildId: number;
  ChildName: string;
  DOB: string | null;
  PaId: number;
  PaName: string;
  ClinicId: number | null;
  ClinicName: string;
  DosesTotal: number;
  DosesGiven: number;
  Doses: DoseRow[];
  expanded?: boolean;
}

@Component({
  selector: 'app-pa-assignment-tracking',
  templateUrl: './pa-assignment-tracking.page.html',
  styleUrls: ['./pa-assignment-tracking.page.scss'],
})
export class PaAssignmentTrackingPage {
  doctorId: number | null = null;
  clinics: any[] = [];
  pas: any[] = [];

  selectedClinicId: number | null = null;
  selectedPaId: number | null = null;
  selectedStatus: string = 'Active';
  fromDate: string = '';
  toDate: string = '';
  searchQuery: string = '';

  allRows: AssignmentRow[] = [];
  filteredRows: AssignmentRow[] = [];
  loading = false;

  // Which row's "No date set" pill is currently showing its inline date picker
  editingDateForAssignmentId: number | null = null;

  constructor(
    private paService: PaService,
    private clinicService: ClinicService,
    private storage: Storage,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private router: Router,
  ) {}

  async ionViewWillEnter() {
    const today = this.toDateStr(new Date());
    this.fromDate = this.toDateStr(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
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
    this.clinicService.getClinics(this.doctorId).subscribe(res => {
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
      this.pas = (res && res.IsSuccess) ? (res.ResponseData || []) : [];
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

  onSearch() {
    this.applySearch();
  }

  clearFilters() {
    this.selectedClinicId = null;
    this.selectedPaId = null;
    this.selectedStatus = 'Active';
    this.pas = [];
    this.searchQuery = '';
    this.fromDate = this.toDateStr(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    this.toDate = this.toDateStr(new Date());
    this.load();
  }

  // Jumps to the sibling Payment Reconciliation page, carrying the current clinic/PA
  // filter scope as query params — Payment Reconciliation reads these on entry to
  // pre-select its own filters (see its ionViewWillEnter()). This is a page navigation,
  // not an in-place tab, since Payment Reconciliation owns its own ion-header/ion-content
  // and can't be nested inside this page's template.
  goToPayments() {
    const queryParams: any = {};
    if (this.selectedClinicId) { queryParams.clinicId = this.selectedClinicId; }
    if (this.selectedPaId) { queryParams.paId = this.selectedPaId; }
    this.router.navigate(['/members/doctor/payment-reconciliation'], { queryParams });
  }

  load() {
    if (!this.doctorId) { return; }
    this.loading = true;

    this.paService.getAssignmentsForDoctor(
      this.doctorId,
      this.selectedClinicId || undefined,
      this.selectedPaId || undefined,
      this.selectedStatus || undefined,
      this.fromDate || undefined,
      this.toDate || undefined
    ).subscribe(
      res => {
        this.loading = false;
        this.allRows = (res && res.IsSuccess) ? (res.ResponseData || []) : [];
        this.applySearch();
      },
      () => {
        this.loading = false;
        this.allRows = [];
        this.filteredRows = [];
        this.toastService.create('Failed to load assignments', 'danger');
      }
    );
  }

  applySearch() {
    const q = (this.searchQuery || '').toLowerCase().trim();
    this.filteredRows = q
      ? this.allRows.filter(r => (r.ChildName || '').toLowerCase().includes(q))
      : [...this.allRows];
  }

  toggleExpand(row: AssignmentRow) {
    row.expanded = !row.expanded;
  }

  // Jump to Payment Reconciliation pre-scoped to this row's clinic/PA — the closest the
  // two pages get to a direct cross-link without duplicating money-state logic (Payment
  // Reconciliation already filters by PA + clinic, it just has no per-assignment
  // drill-down of its own).
  viewInPayments(row: AssignmentRow) {
    const queryParams: any = {};
    if (row.ClinicId) { queryParams.clinicId = row.ClinicId; }
    if (row.PaId) { queryParams.paId = row.PaId; }
    this.router.navigate(['/members/doctor/payment-reconciliation'], { queryParams });
  }

  // Opens/closes the inline date picker on the "No date set" pill — click elsewhere on
  // the card header still toggles dose expansion via toggleExpand(), so this stops
  // propagation from the template.
  openDatePicker(row: AssignmentRow) {
    this.editingDateForAssignmentId = row.AssignmentId;
  }

  closeDatePicker() {
    this.editingDateForAssignmentId = null;
  }

  saveTargetDate(row: AssignmentRow, value: string) {
    if (!this.doctorId) { return; }
    const targetDate = value || null;
    this.paService.setAssignmentTargetDate(row.AssignmentId, this.doctorId, targetDate).subscribe(
      res => {
        if (res && res.IsSuccess) {
          row.TargetDate = targetDate;
          this.editingDateForAssignmentId = null;
          this.toastService.create('Target date updated', 'success');
        } else {
          this.toastService.create((res && res.Message) || 'Failed to update date', 'danger');
        }
      },
      () => { this.toastService.create('Failed to update date', 'danger'); }
    );
  }

  // Lets the doctor clear a completed (or cancelled) assignment off this list once it's
  // no longer useful to see — UnassignOnly only removes the PAAssignment row itself, the
  // patient's vaccine/payment records and any invoice are left untouched (mirrors
  // Payment Reconciliation's confirmDeleteAssignment()).
  async confirmRemove(row: AssignmentRow) {
    const alert = await this.alertController.create({
      header: 'Remove Assignment',
      message: `Remove this completed assignment for ${row.ChildName} from the list? The patient's vaccine and payment records are not affected.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          cssClass: 'alert-btn-danger',
          handler: () => this.removeAssignment(row)
        }
      ]
    });
    await alert.present();
  }

  private async removeAssignment(row: AssignmentRow) {
    if (!this.doctorId) { return; }
    const loading = await this.loadingController.create({ message: 'Removing...' });
    await loading.present();
    this.paService.deleteAssignment(row.AssignmentId, this.doctorId, 'UnassignOnly').subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.allRows = this.allRows.filter(r => r.AssignmentId !== row.AssignmentId);
          this.applySearch();
          this.toastService.create('Assignment removed', 'success');
        } else {
          this.toastService.create((res && res.Message) || 'Failed to remove', 'danger');
        }
      },
      () => { loading.dismiss(); this.toastService.create('Failed to remove', 'danger'); }
    );
  }

  urgency(row: AssignmentRow): 'overdue' | 'today' | 'upcoming' | 'none' {
    if (!row.TargetDate) { return 'none'; }
    const target = new Date(row.TargetDate);
    const today = new Date();
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    if (targetDay < todayDay) { return 'overdue'; }
    if (targetDay === todayDay) { return 'today'; }
    return 'upcoming';
  }

  statusClass(row: AssignmentRow): string {
    if (row.IsCancelled) { return 'cancelled'; }
    if (row.IsCompleted) { return 'completed'; }
    if (row.AssignmentStatus === 'PendingHandover') { return 'handover'; }
    return 'active';
  }

  statusLabel(row: AssignmentRow): string {
    if (row.IsCancelled) { return 'Cancelled'; }
    if (row.IsCompleted) { return 'Completed'; }
    if (row.AssignmentStatus === 'PendingHandover') { return 'Pending Handover'; }
    return 'Active';
  }

  get activeCount(): number {
    return this.allRows.filter(r => !r.IsCompleted && !r.IsCancelled && r.AssignmentStatus !== 'PendingHandover').length;
  }

  get pendingHandoverCount(): number {
    return this.allRows.filter(r => !r.IsCompleted && !r.IsCancelled && r.AssignmentStatus === 'PendingHandover').length;
  }

  get completedCount(): number {
    return this.allRows.filter(r => r.IsCompleted).length;
  }

  get activePACount(): number {
    return new Set(this.allRows.map(r => r.PaId)).size;
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) { return ''; }
    try {
      const d = new Date(dateStr);
      const dd = d.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${dd} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch { return dateStr; }
  }

  formatDateTime(dateStr: string | null): string {
    if (!dateStr) { return ''; }
    try {
      const d = new Date(dateStr);
      const dd = d.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      let h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${dd} ${months[d.getMonth()]} ${d.getFullYear()}, ${h}:${m} ${ampm}`;
    } catch { return dateStr; }
  }
}
