import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ClinicService } from 'src/app/services/clinic.service';
import { PaService } from 'src/app/services/pa.service';
import { ManagerService } from 'src/app/services/manager.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { addDays, formatDay, parseDay, formatInstant, nowInstant, parseInstant, today as todayDay } from 'src/app/shared/time';

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
  // Computed by the API (AssignmentStage): 1 Assigned, 2 Given, 3 Invoiced, 4 Paid, 5 Confirmed.
  // A manager only ever receives 1-2. Absent on an older API, so every use falls back.
  Stage?: number;
  StageLabel?: string;
  StageAgeDays?: number;
  expanded?: boolean;
  history?: any[];
  historyLoaded?: boolean;
}

// Why a visit is being called off. The reason pre-selects an option but never runs it.
const CANCEL_REASONS: { code: string; label: string }[] = [
  { code: 'refused', label: 'Client refused' },
  { code: 'postponed', label: 'Postponed or booking cancelled' },
  { code: 'wrongpa', label: 'Wrong PA or PA unavailable' },
  { code: 'mistake', label: 'Entered by mistake' },
];

interface ActionOption {
  code: 'task' | 'reassign' | 'takeback' | 'reverse';
  title: string;
  effects: string[];
  danger?: boolean;
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
  // The list is always loaded with every status; the counted view tabs below decide what shows.
  selectedStatus: string = 'All';
  view: 'needs' | 'stuck' | 'with' | 'closed' | 'cash' = 'needs';
  closedKind: 'confirmed' | 'cancelled' = 'confirmed';
  readonly STUCK_DAYS = 3;
  readonly CANCEL_REASONS = CANCEL_REASONS;
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

  // PA "patient refused at home" requests awaiting approve (= full reversal) / reject.
  pendingRefusals: any[] = [];
  rejectingRefusalId: number | null = null;
  refusalRejectNote: string = '';

  // The "Cancel, reassign or reverse" dialog (null = closed).
  // `options` is built once when the dialog opens: the template must never call a method that
  // returns fresh objects on every change-detection pass (ngFor would rebuild forever).
  dlg: {
    row: AssignmentRow; reason: string; note: string; opt: string; newPaId: number | null;
    ack: boolean; touched: boolean; busy: boolean; paOptions: any[]; options: ActionOption[];
  } | null = null;

  constructor(
    private paService: PaService,
    private clinicService: ClinicService,
    private managerService: ManagerService,
    private storage: Storage,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  async ionViewWillEnter() {
    this.fromDate = addDays(todayDay(), -30);
    this.toDate = todayDay();

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

    // Deep link (the old Payments route and "View in Payments"): ?view=cash&clinicId=&paId=
    const qp = this.route.snapshot.queryParamMap;
    if (!this.isManager && qp.get('view') === 'cash') { this.view = 'cash'; }
    if (qp.get('clinicId')) {
      this.selectedClinicId = Number(qp.get('clinicId'));
      this.loadPasForClinic(qp.get('paId') ? Number(qp.get('paId')) : null);
    }

    this.load();
    if (!this.isManager) { this.loadPendingCancellations(); this.loadPendingRefusals(); }
  }

  loadPendingRefusals() {
    if (!this.doctorId) { return; }
    this.paService.getPendingRefusals(this.doctorId).subscribe(
      res => { this.pendingRefusals = (res && res.IsSuccess) ? (res.ResponseData || []) : []; },
      () => { this.pendingRefusals = []; }
    );
  }

  async approveRefusal(row: any) {
    if (!this.doctorId) { return; }
    const alert = await this.alertController.create({
      header: 'Approve & Reverse',
      message: `${row.ChildName}'s family refused. Approving gives back the stock, sets the doses to not given, deletes the invoice and removes this assignment. This can't be undone.`,
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Yes, Reverse',
          handler: () => {
            this.paService.approveRefusal(row.AssignmentId, this.doctorId).subscribe(
              res => {
                if (res && res.IsSuccess) {
                  this.toastService.create('Visit reversed', 'success');
                  this.pendingRefusals = this.pendingRefusals.filter(r => r.AssignmentId !== row.AssignmentId);
                  this.load();
                } else {
                  this.toastService.create((res && res.Message) || 'Failed to reverse', 'danger');
                }
              },
              () => { this.toastService.create('Failed to reverse the visit', 'danger'); }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  openRejectRefusal(row: any) {
    this.rejectingRefusalId = row.AssignmentId;
    this.refusalRejectNote = '';
  }

  closeRejectRefusal() {
    this.rejectingRefusalId = null;
    this.refusalRejectNote = '';
  }

  confirmRejectRefusal(row: any) {
    if (!this.doctorId) { return; }
    this.paService.rejectRefusal(row.AssignmentId, this.doctorId, this.refusalRejectNote || '').subscribe(
      res => {
        if (res && res.IsSuccess) {
          this.toastService.create('Request rejected — assignment stays active', 'success');
          this.pendingRefusals = this.pendingRefusals.filter(r => r.AssignmentId !== row.AssignmentId);
          this.closeRejectRefusal();
        } else {
          this.toastService.create((res && res.Message) || 'Failed to reject', 'danger');
        }
      },
      () => { this.toastService.create('Failed to reject request', 'danger'); }
    );
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

  loadPasForClinic(keepPaId: number | null = null) {
    if (!this.selectedClinicId) {
      this.pas = [];
      this.selectedPaId = null;
      return;
    }
    this.paService.getPAsForClinic(this.selectedClinicId).subscribe(res => {
      this.pas = (res && res.IsSuccess) ? (res.ResponseData || []) : [];
      this.selectedPaId = keepPaId;
      if (keepPaId) { this.load(); }
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
    this.selectedStatus = 'All';
    this.pas = [];
    this.searchQuery = '';
    this.fromDate = addDays(todayDay(), -30);
    this.toDate = todayDay();
    this.load();
  }

  goToPayments() {
    this.setView('cash');
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
    const inView = this.allRows.filter(r => this.inView(r, this.view));
    this.filteredRows = q
      ? inView.filter(r => (r.ChildName || '').toLowerCase().includes(q))
      : [...inView];
  }

  // ---- counted view tabs (PA_TRACKING_MERGE_SPEC.md). Cancelled and cash-confirmed rows never
  // appear in the working views; pending cancel requests are handled by their own panel.
  setView(v: 'needs' | 'stuck' | 'with' | 'closed' | 'cash') {
    this.view = v;
    this.selectedIds = new Set();
    this.applySearch();
  }

  setClosedKind(k: 'confirmed' | 'cancelled') {
    this.closedKind = k;
    this.selectedIds = new Set();
    this.applySearch();
  }

  isStuck(row: AssignmentRow): boolean {
    return row.Stage !== undefined && row.Stage < 4 && (row.StageAgeDays || 0) >= this.STUCK_DAYS;
  }

  inView(row: AssignmentRow, v: string): boolean {
    const cls = this.statusClass(row);
    if (v === 'closed') {
      return this.closedKind === 'confirmed' ? cls === 'cash-confirmed' : cls === 'cancelled';
    }
    if (cls === 'cancelled' || cls === 'cash-confirmed' || cls === 'pending-cancellation') { return false; }
    if (v === 'needs') { return cls === 'handover' || cls === 'completed'; }
    if (v === 'stuck') { return cls === 'active' && this.isStuck(row); }
    return cls === 'active';
  }

  viewCount(v: 'needs' | 'stuck' | 'with' | 'closed'): number {
    const n = this.allRows.filter(r => this.inView(r, v)).length;
    return v === 'needs' ? n + this.pendingCancellations.length + this.pendingRefusals.length : n;
  }

  get waitingOnYouCount(): number { return this.viewCount('needs'); }
  get stuckCount(): number { return this.viewCount('stuck'); }

  // ---- stage bar (computed by the API; falls back to the dose count on an older API)
  stageNo(row: AssignmentRow): number {
    if (row.Stage) { return row.Stage; }
    return row.DosesTotal > 0 && row.DosesGiven === row.DosesTotal ? 2 : 1;
  }

  get stageNames(): string[] {
    return this.isManager ? ['Assigned', 'Given'] : ['Assigned', 'Given', 'Invoiced', 'Paid', 'Confirmed'];
  }

  stepClass(row: AssignmentRow, i: number): string {
    // Stage n means steps 1..n are reached; the next step is the one in progress.
    const reached = this.stageNo(row);
    if (i < reached) { return 'done'; }
    return i === reached && reached < this.stageNames.length ? 'now' : '';
  }

  stageText(row: AssignmentRow): string {
    const s = this.stageNo(row);
    if (this.isManager) {
      return s >= 2 ? 'Given' : `${row.DosesGiven} of ${row.DosesTotal} given`;
    }
    if (s >= 5 || row.IsCashConfirmedByDoctor) { return 'Closed · cash confirmed'; }
    if (s === 4) { return 'Paid · waiting for your confirmation'; }
    if (s === 3) { return 'Invoiced · payment not complete'; }
    if (s === 2) { return 'Given · invoice not created'; }
    return `${row.DosesGiven} of ${row.DosesTotal} given`;
  }

  ageText(row: AssignmentRow): string {
    if (row.StageAgeDays === undefined || row.StageAgeDays === null) { return ''; }
    return row.StageAgeDays === 0 ? 'today' : `${row.StageAgeDays}d in this stage`;
  }

  toggleExpand(row: AssignmentRow) {
    row.expanded = !row.expanded;
    if (row.expanded && !row.historyLoaded) {
      row.historyLoaded = true;
      this.paService.getAssignmentHistory(row.AssignmentId, this.requestingManagerId).subscribe(
        res => { row.history = (res && res.IsSuccess) ? (res.ResponseData || []) : []; },
        () => { row.history = []; }
      );
    }
  }

  actorLabel(e: any): string {
    if (e.ActorName) { return e.ActorName; }
    if (e.Actor === 'DOCTOR') { return 'Doctor'; }
    if (e.Actor === 'MANAGER') { return 'Manager'; }
    if (e.Actor === 'PA') { return 'PA'; }
    return '';
  }

  // ---- Cancel, reassign or reverse (one dialog; the reason pre-selects, never executes)
  canOpenActionDialog(row: AssignmentRow): boolean {
    const cls = this.statusClass(row);
    if (cls === 'cancelled' || cls === 'cash-confirmed' || cls === 'pending-cancellation') { return false; }
    return !this.isManager || this.canReassign;
  }

  openActionDialog(row: AssignmentRow) {
    this.dlg = { row, reason: '', note: '', opt: '', newPaId: null, ack: false, touched: false, busy: false, paOptions: [], options: this.buildOptions(row) };
    if (row.ClinicId) {
      this.paService.getPAsForClinic(row.ClinicId).subscribe(res => {
        const all = (res && res.IsSuccess) ? (res.ResponseData || []) : [];
        if (this.dlg && this.dlg.row === row) {
          this.dlg.paOptions = all.filter((p: any) => p.Id !== row.PaId);
        }
      });
    }
  }

  closeActionDialog() { this.dlg = null; }

  private buildOptions(row: AssignmentRow): ActionOption[] {
    const s = this.stageNo(row);
    if (s >= 5 || row.IsCashConfirmedByDoctor) { return []; }
    const f = (row.PaName || 'The PA').split(' ')[0];
    const n = row.DosesTotal;
    const amt = row.CashAmount;
    const reassign: ActionOption = {
      code: 'reassign', title: 'Cancel and reassign to another PA',
      effects: [`The ${n} dose${n === 1 ? '' : 's'} move to the new PA.`]
        .concat(!this.isManager && s >= 2 && s < 4 && amt ? [`Unpaid credit of Rs ${amt} moves to the new PA.`] : [])
        .concat(!this.isManager && s >= 3 ? ['Invoice owner changes to the new PA.'] : [])
        .concat(!this.isManager && s >= 4 ? [`Cash ${f} already collected stays with ${f} until handed over.`] : [])
    };
    if (this.isManager) { return [reassign]; }
    if (s <= 1) {
      return [{
        code: 'task', title: 'Cancel the task only',
        effects: [`${f} is removed from this visit.`, 'Nothing is given and nothing is paid, so the child\'s schedule is unchanged.']
      }, reassign];
    }
    const reverse: ActionOption = {
      code: 'reverse', title: 'Reverse everything', danger: true,
      effects: [`${row.DosesGiven} dose${row.DosesGiven === 1 ? '' : 's'} ungiven, stock returned to the clinic.`]
        .concat(s >= 3 ? ['The invoice is deleted.'] : [])
        .concat(s >= 4 ? [`The cash ${f} holds stays on ${f}'s ledger until you settle it.`] : [])
        .concat([`Assignment closed. ${f} is notified. This cannot be undone.`])
    };
    if (s < 4) {
      return [reassign, {
        code: 'takeback', title: 'Take it back, I will handle it',
        effects: ['Doses stay given.', `${f} is no longer credited for the payment.`, 'You collect the payment yourself.', `${f} is told the visit was taken back.`]
      }, reverse];
    }
    return [reassign, reverse];
  }

  private preselect(row: AssignmentRow, reason: string): string {
    if (!reason) { return ''; }
    const s = this.stageNo(row);
    if (this.isManager) { return 'reassign'; }
    if (s <= 1) { return reason === 'wrongpa' ? 'reassign' : 'task'; }
    if (reason === 'refused' || reason === 'mistake') { return 'reverse'; }
    if (reason === 'wrongpa') { return 'reassign'; }
    return '';
  }

  dlgChooseReason(code: string) {
    if (!this.dlg) { return; }
    this.dlg.reason = code;
    this.dlg.ack = false;
    if (!this.dlg.touched) { this.dlg.opt = this.preselect(this.dlg.row, code); }
  }

  dlgChooseOption(code: string) {
    if (!this.dlg) { return; }
    this.dlg.opt = code;
    this.dlg.touched = true;
    this.dlg.ack = false;
  }

  get dlgReady(): boolean {
    const d = this.dlg;
    if (!d || d.busy || !d.reason || !d.opt) { return false; }
    if (d.opt === 'reassign' && !d.newPaId) { return false; }
    if (d.opt === 'reverse' && !d.ack) { return false; }
    return true;
  }

  get dlgLabel(): string {
    if (!this.dlg) { return ''; }
    switch (this.dlg.opt) {
      case 'task': return 'Cancel task';
      case 'reassign': return 'Cancel and reassign';
      case 'takeback': return 'Take it back';
      case 'reverse': return 'Reverse everything';
      default: return 'Choose what should happen';
    }
  }

  private dlgReasonText(): string {
    const d = this.dlg;
    if (!d) { return ''; }
    const label = (CANCEL_REASONS.find(r => r.code === d.reason) || { label: '' }).label;
    return d.note && d.note.trim() ? `${label}: ${d.note.trim()}` : label;
  }

  runActionDialog() {
    const d = this.dlg;
    if (!d || !this.dlgReady || !this.doctorId) { return; }
    const row = d.row;
    const reason = this.dlgReasonText();
    d.busy = true;
    const done = (res: any, okMessage: string) => {
      if (res && res.IsSuccess) {
        this.toastService.create(okMessage, 'success');
        this.dlg = null;
        this.load();
        if (!this.isManager) { this.loadPendingCancellations(); this.loadPendingRefusals(); }
      } else {
        d.busy = false;
        this.toastService.create((res && res.Message) || 'That did not work', 'danger');
      }
    };
    const failed = () => { d.busy = false; this.toastService.create('That did not work. Nothing was changed.', 'danger'); };

    if (d.opt === 'task') {
      this.paService.cancelAssignment(row.AssignmentId, 'DOCTOR', this.doctorId, reason).subscribe(res => done(res, 'Task cancelled'), failed);
    } else if (d.opt === 'reassign') {
      this.paService.reassignAssignment(
        row.AssignmentId, d.newPaId as number, row.TargetDate || undefined,
        this.isManager ? (this.requestingManagerId || undefined) : undefined,
        this.callerUserId || undefined, this.securityStamp || undefined, reason
      ).subscribe(res => done(res, 'Assignment reassigned'), failed);
    } else if (d.opt === 'takeback') {
      this.paService.takeBackAssignment(row.AssignmentId, reason, this.callerUserId || undefined, this.securityStamp || undefined)
        .subscribe(res => done(res, 'Visit taken back. Doses stay given.'), failed);
    } else if (d.opt === 'reverse') {
      this.paService.deleteAssignment(row.AssignmentId, this.doctorId, 'FullReset', reason).subscribe(res => done(res, 'Visit reversed'), failed);
    }
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

  // Opens the Cash tab scoped to this row's clinic/PA.
  viewInPayments(row: AssignmentRow) {
    this.selectedClinicId = row.ClinicId || null;
    this.loadPasForClinic(row.PaId || null);
    this.setView('cash');
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
    const at = parseInstant(row.AssignedAt);
    if (!at) { return false; }
    const assignedAt = at.getTime();
    const ageMs = nowInstant().getTime() - assignedAt;
    return ageMs >= this.STALE_DAYS * 24 * 60 * 60 * 1000;
  }

  daysAgo(dateStr: string): number {
    const t = parseInstant(dateStr);
    if (!t) { return 0; }
    const then = t.getTime();
    return Math.floor((nowInstant().getTime() - then) / (24 * 60 * 60 * 1000));
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

  // A device set to a different zone must still agree with PKT on what "today" is.
  urgency(row: AssignmentRow): 'overdue' | 'today' | 'upcoming' | 'none' {
    if (!row.TargetDate) { return 'none'; }
    const targetKey = parseDay(row.TargetDate);
    const todayKey = todayDay();
    if (targetKey < todayKey) { return 'overdue'; }
    if (targetKey === todayKey) { return 'today'; }
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
    return new Set(this.allRows.filter(r => !r.IsCancelled && !r.IsCashConfirmedByDoctor).map(r => r.PaId)).size;
  }

  // TargetDate is a calendar day; the *At stamps are UTC instants.
  formatDate(dateStr: string | null): string { return formatDay(dateStr, 'dd MMM yyyy'); }

  formatDateTime(dateStr: string | null): string {
    const t = formatInstant(dateStr, 'dd MMM yyyy, h:mm a');
    return t ? t + ' PKT' : '';
  }
}
