import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ClinicService } from 'src/app/services/clinic.service';
import { PaService } from 'src/app/services/pa.service';
import { ManagerService } from 'src/app/services/manager.service';
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
  IsCashConfirmedByDoctor: boolean;
  CashConfirmedAt: string | null;
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
  CashAmount: number | null;
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

  // Set when a Manager (not the doctor) is viewing this shared page. Backend fences
  // GetForDoctor/Reassign to this Manager's own ManagerAccess clinics whenever
  // requestingManagerId is sent — see PAAssignmentController.GetForDoctor/Reassign.
  // canReassign further hides the Reassign action client-side for a Manager who only has
  // ViewPaAssignmentStatus, not ReassignPaTask (the backend also enforces this — this is
  // just so the button isn't shown only to 403 on click).
  isManager = false;
  requestingManagerId: number | null = null;
  canReassign = true;

  // Doctor's own identity, needed to authorize a doctor-initiated Reassign (the manager path
  // is authorized via requestingManagerId + ManagerPermission instead — see PAAssignmentController).
  callerUserId: number | null = null;
  securityStamp: string | null = null;

  // Reassign flow state — which row is currently picking a new PA, and the clinic-scoped
  // PA list to choose from (loaded once the row's clinic is known).
  reassigningRowId: number | null = null;
  reassignPaOptions: any[] = [];
  reassignTargetPaId: number | null = null;

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

  // Bulk-select for cleanup — Active status never auto-expires (no date closes it out),
  // so old assignments a PA never marked done/cancelled otherwise pile up here forever.
  selectedIds: Set<number> = new Set();
  readonly STALE_DAYS = 14;

  // PA-submitted cancellation requests awaiting doctor approve/reject — doctor-only
  // (not part of the Manager permission tier), surfaced as its own panel rather than
  // folded into the main filtered list, matching the dedicated pending-cancellations endpoint.
  pendingCancellations: any[] = [];
  rejectingCancelId: number | null = null;
  rejectNote: string = '';

  constructor(
    private paService: PaService,
    private clinicService: ClinicService,
    private managerService: ManagerService,
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
    const storedDoctorId = await this.storage.get(environment.DOCTOR_Id);
    if (storedDoctorId) {
      this.doctorId = Number(storedDoctorId);
    }
    this.callerUserId = user && user.Id ? Number(user.Id) : null;
    this.securityStamp = await this.storage.get(environment.SECURITY_STAMP);

    if (user && user.UserType === 'MANAGER') {
      this.isManager = true;
      this.requestingManagerId = Number(user.ManagerId);
      const perm = await this.managerService.getManagerPermissions(this.requestingManagerId).toPromise();
      this.canReassign = (perm && perm.ReassignPaTask) || false;
    }

    await this.loadClinics();
    this.load();
    if (!this.isManager) { this.loadPendingCancellations(); }
  }

  loadPendingCancellations() {
    if (!this.doctorId) { return; }
    this.paService.getPendingCancellations(this.doctorId).subscribe(
      res => { this.pendingCancellations = (res && res.IsSuccess) ? (res.ResponseData || []) : []; },
      () => { this.pendingCancellations = []; }
    );
  }

  async approveCancellation(row: any) {
    if (!this.doctorId) { return; }
    const alert = await this.alertController.create({
      header: 'Approve Cancellation',
      message: `Cancel the assignment for ${row.ChildName}? This can't be undone.`,
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Yes, Approve',
          handler: () => {
            this.paService.approveCancelRequest(row.AssignmentId, this.doctorId).subscribe(
              res => {
                if (res && res.IsSuccess) {
                  this.toastService.create('Cancellation approved', 'success');
                  this.pendingCancellations = this.pendingCancellations.filter(r => r.AssignmentId !== row.AssignmentId);
                  this.load();
                } else {
                  this.toastService.create((res && res.Message) || 'Failed to approve', 'danger');
                }
              },
              () => { this.toastService.create('Failed to approve cancellation', 'danger'); }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  openRejectCancellation(row: any) {
    this.rejectingCancelId = row.AssignmentId;
    this.rejectNote = '';
  }

  closeRejectCancellation() {
    this.rejectingCancelId = null;
    this.rejectNote = '';
  }

  confirmRejectCancellation(row: any) {
    if (!this.doctorId) { return; }
    this.paService.rejectCancelRequest(row.AssignmentId, this.doctorId, this.rejectNote || '').subscribe(
      res => {
        if (res && res.IsSuccess) {
          this.toastService.create('Cancellation request rejected — assignment stays active', 'success');
          this.pendingCancellations = this.pendingCancellations.filter(r => r.AssignmentId !== row.AssignmentId);
          this.closeRejectCancellation();
          this.load();
        } else {
          this.toastService.create((res && res.Message) || 'Failed to reject', 'danger');
        }
      },
      () => { this.toastService.create('Failed to reject cancellation', 'danger'); }
    );
  }

  private toDateStr(d: Date): string {
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  async loadClinics() {
    if (!this.doctorId) { return; }

    // Manager: only offer clinics they themselves have ManagerAccess to — matches the
    // backend fence on GetForDoctor, and stops the filter dropdown from ever suggesting a
    // clinic the read call would silently exclude anyway.
    if (this.isManager && this.requestingManagerId) {
      this.managerService.getManagerClinics(this.requestingManagerId).subscribe(res => {
        this.clinics = (res && res.IsSuccess) ? (res.ResponseData || []) : [];
      });
      return;
    }

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

  // Top-level Active/Cash Confirmed toggle — separate from the Status dropdown (which
  // still covers PendingHandover/Completed/Cancelled/All for finer filtering). Cash
  // Confirmed means the doctor has confirmed receiving the cash for this assignment's
  // invoice (ScheduleController.ConfirmInvoice) — once that happens the row leaves
  // Active immediately, regardless of age or the PA's own IsCompleted flag.
  setStatusTab(tab: 'Active' | 'CashConfirmed') {
    this.selectedStatus = tab;
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
      this.toDate || undefined,
      this.requestingManagerId || undefined
    ).subscribe(
      res => {
        this.loading = false;
        this.allRows = (res && res.IsSuccess) ? (res.ResponseData || []) : [];
        this.selectedIds = new Set();
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

  // Opens the inline "reassign to" PA picker for this row — loads the PA list scoped to
  // the row's own clinic (same source pa-assignment's own "assign" flow already uses),
  // excluding whoever currently holds the assignment.
  openReassign(row: AssignmentRow) {
    if (!row.ClinicId) {
      this.toastService.create('This assignment has no clinic set — cannot reassign.', 'danger');
      return;
    }
    this.reassigningRowId = row.AssignmentId;
    this.reassignTargetPaId = null;
    this.paService.getPAsForClinic(row.ClinicId).subscribe(res => {
      const all = (res && res.IsSuccess) ? (res.ResponseData || []) : [];
      this.reassignPaOptions = all.filter((p: any) => p.Id !== row.PaId);
    });
  }

  closeReassign() {
    this.reassigningRowId = null;
    this.reassignPaOptions = [];
    this.reassignTargetPaId = null;
  }

  confirmReassign(row: AssignmentRow) {
    if (!this.reassignTargetPaId) { return; }
    this.paService.reassignAssignment(
      row.AssignmentId,
      this.reassignTargetPaId,
      row.TargetDate || undefined,
      this.isManager ? (this.requestingManagerId || undefined) : undefined,
      this.callerUserId || undefined,
      this.securityStamp || undefined
    ).subscribe(
      res => {
        if (res && res.IsSuccess) {
          this.toastService.create('Assignment reassigned', 'success');
          this.closeReassign();
          this.load();
        } else {
          this.toastService.create((res && res.Message) || 'Failed to reassign', 'danger');
        }
      },
      () => { this.toastService.create('Failed to reassign', 'danger'); }
    );
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

  // "Stale" = still Active/PendingHandover but assigned STALE_DAYS+ ago. Computed
  // client-side from AssignedAt — Active status has no expiry of its own, so this is
  // the only way to surface "this has been sitting untouched for weeks."
  isStale(row: AssignmentRow): boolean {
    if (row.IsCompleted || row.IsCancelled) { return false; }
    const assignedAt = new Date(row.AssignedAt).getTime();
    const ageMs = Date.now() - assignedAt;
    return ageMs >= this.STALE_DAYS * 24 * 60 * 60 * 1000;
  }

  daysAgo(dateStr: string): number {
    const then = new Date(dateStr).getTime();
    return Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000));
  }

  isSelected(row: AssignmentRow): boolean {
    return this.selectedIds.has(row.AssignmentId);
  }

  toggleSelect(row: AssignmentRow, checked: boolean) {
    if (checked) { this.selectedIds.add(row.AssignmentId); }
    else { this.selectedIds.delete(row.AssignmentId); }
    this.selectedIds = new Set(this.selectedIds);
  }

  get allSelected(): boolean {
    return this.filteredRows.length > 0 && this.filteredRows.every(r => this.selectedIds.has(r.AssignmentId));
  }

  toggleSelectAll(checked: boolean) {
    this.selectedIds = checked ? new Set(this.filteredRows.map(r => r.AssignmentId)) : new Set();
  }

  get staleCount(): number {
    return this.filteredRows.filter(r => this.isStale(r)).length;
  }

  selectStaleOnly() {
    this.selectedIds = new Set(this.filteredRows.filter(r => this.isStale(r)).map(r => r.AssignmentId));
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  async confirmBulkRemove() {
    const count = this.selectedCount;
    if (count === 0) { return; }
    const alert = await this.alertController.create({
      header: `Remove ${count} Assignment${count > 1 ? 's' : ''}`,
      message: `Remove ${count} selected assignment${count > 1 ? 's' : ''} from this list? The patients' vaccine and payment records are not affected.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove All',
          cssClass: 'alert-btn-danger',
          handler: () => this.bulkRemove()
        }
      ]
    });
    await alert.present();
  }

  private async bulkRemove() {
    if (!this.doctorId) { return; }
    const ids = Array.from(this.selectedIds);
    const loading = await this.loadingController.create({ message: `Removing ${ids.length} assignments...` });
    await loading.present();

    let done = 0;
    let failed = 0;
    const removedIds = new Set<number>();
    const removeNext = (index: number) => {
      if (index >= ids.length) {
        loading.dismiss();
        this.allRows = this.allRows.filter(r => !removedIds.has(r.AssignmentId));
        this.selectedIds = new Set();
        this.applySearch();
        if (failed === 0) {
          this.toastService.create(`${done} assignment${done > 1 ? 's' : ''} removed`, 'success');
        } else {
          this.toastService.create(`${done} removed, ${failed} failed`, 'warning');
        }
        return;
      }
      const id = ids[index];
      this.paService.deleteAssignment(id, this.doctorId!, 'UnassignOnly').subscribe(
        res => {
          if (res && res.IsSuccess) { done++; removedIds.add(id); } else { failed++; }
          removeNext(index + 1);
        },
        () => { failed++; removeNext(index + 1); }
      );
    };
    removeNext(0);
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
    if (row.IsCashConfirmedByDoctor) { return 'cash-confirmed'; }
    if (row.IsCompleted) { return 'completed'; }
    if (row.AssignmentStatus === 'PendingCancellation') { return 'pending-cancellation'; }
    if (row.AssignmentStatus === 'PendingHandover') { return 'handover'; }
    return 'active';
  }

  statusLabel(row: AssignmentRow): string {
    if (row.IsCancelled) { return 'Cancelled'; }
    if (row.IsCashConfirmedByDoctor) { return 'Cash Confirmed'; }
    if (row.IsCompleted) { return 'Completed'; }
    if (row.AssignmentStatus === 'PendingCancellation') { return 'Cancellation Requested'; }
    if (row.AssignmentStatus === 'PendingHandover') { return 'Pending Handover'; }
    return 'Active';
  }

  get activeCount(): number {
    return this.allRows.filter(r => !r.IsCancelled && !r.IsCashConfirmedByDoctor
      && !r.IsCompleted && r.AssignmentStatus !== 'PendingHandover').length;
  }

  get pendingHandoverCount(): number {
    return this.allRows.filter(r => !r.IsCancelled && !r.IsCashConfirmedByDoctor
      && !r.IsCompleted && r.AssignmentStatus === 'PendingHandover').length;
  }

  get cashConfirmedCount(): number {
    return this.allRows.filter(r => r.IsCashConfirmedByDoctor).length;
  }

  get completedCount(): number {
    return this.allRows.filter(r => r.IsCompleted).length;
  }

  get activePACount(): number {
    return new Set(this.allRows.map(r => r.PaId)).size;
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

  formatDate(dateStr: string | null): string {
    if (!dateStr) { return ''; }
    try {
      const p = this.pktParts(dateStr);
      return `${p.day} ${p.month} ${p.year}`;
    } catch { return dateStr; }
  }

  formatDateTime(dateStr: string | null): string {
    if (!dateStr) { return ''; }
    try {
      const p = this.pktParts(dateStr);
      return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute} ${p.dayPeriod} PKT`;
    } catch { return dateStr; }
  }
}
