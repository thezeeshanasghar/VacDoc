import { Component } from '@angular/core';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';
import { ScheduleService } from 'src/app/services/schedule.service';
import { StockService } from 'src/app/services/stock.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-assignments',
  templateUrl: './assignments.page.html',
  styleUrls: ['./assignments.page.scss'],
})
export class AssignmentsPage {
  assignments: any[] = [];
  pendingDirectSales: any[] = [];
  completedDirectSales: any[] = [];
  // "Invoice" reconciliation rows with no matching PAAssignment in this response —
  // see orphan-invoice note on loadAll(). Rare, but real money the PA is accountable for.
  orphanInvoiceRows: any[] = [];
  loading: boolean = false;
  paId: number = null;
  dueFilter: 'today' | 'upcoming' | 'all' = 'all';

  // Stat tiles, merged in from the retired Payables page — sourced from
  // GetMyReconciliation.TotalPending, same number that page always showed.
  totalPayable: number = 0;

  constructor(
    private paService: PaService,
    private scheduleService: ScheduleService,
    private stockService: StockService,
    private storage: Storage,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private platform: Platform,
  ) {}

  async ionViewWillEnter() {
    const user = await this.storage.get(environment.USER);
    if (user && user.PAId) {
      this.paId = Number(user.PAId);
      await this.loadAll(this.paId);
    }
  }

  // Single load for the merged page — mirrors the old payables.page.ts's Promise.all
  // pattern. GetMyReconciliation is kept (not dropped) purely to catch "orphan" Invoice
  // rows whose InvoiceSubmissionId has no matching PAAssignment in this PA's own list
  // (e.g. the assignment was later cancelled/deleted, or none existed when the invoice
  // was downloaded — SyncInvoicePaToActiveAssignment's own self-heal comment in
  // ScheduleController documents this as a real, if rare, case) — without this, such an
  // invoice would silently vanish from the PA's view even though she's accountable for it.
  async loadAll(paId: number) {
    this.loading = true;
    const user = await this.storage.get(environment.USER);
    const stamp = await this.storage.get(environment.SECURITY_STAMP);
    const callerUserId = user && user.Id ? Number(user.Id) : undefined;

    try {
      const [assignRes, reconRes, pendingDsRes, completedDsRes] = await Promise.all([
        this.paService.getAssignments(paId, callerUserId, stamp).toPromise(),
        this.paService.getMyReconciliation(paId).toPromise(),
        this.stockService.getPendingDirectSalesForPa(paId).toPromise(),
        this.stockService.getCompletedDirectSalesForPa(paId).toPromise(),
      ]);

      this.assignments = this.sortByUrgency((assignRes && assignRes.IsSuccess) ? (assignRes.ResponseData || []) : []);

      if (reconRes && reconRes.IsSuccess && reconRes.ResponseData) {
        this.totalPayable = reconRes.ResponseData.TotalPending || 0;
        const coveredInvoiceIds = new Set(
          this.assignments.filter(a => a.InvoiceSubmissionId).map(a => a.InvoiceSubmissionId)
        );
        this.orphanInvoiceRows = (reconRes.ResponseData.Rows || []).filter((r: any) =>
          r.RowType === 'Invoice' && r.InvoiceSubmissionId && !coveredInvoiceIds.has(r.InvoiceSubmissionId)
        );
      } else {
        this.totalPayable = 0;
        this.orphanInvoiceRows = [];
      }

      this.pendingDirectSales = (pendingDsRes && pendingDsRes.IsSuccess) ? (pendingDsRes.ResponseData || []) : [];
      this.completedDirectSales = (completedDsRes && completedDsRes.IsSuccess) ? (completedDsRes.ResponseData || []) : [];
    } catch (e) {
      this.toastService.create('Failed to load assignments', 'danger');
    } finally {
      this.loading = false;
    }
  }

  // Step 1: record payment mode, or Step 2: mark done — depending on sale state
  async confirmDirectSaleAction(sale: any) {
    if (!sale.IsPaymentCollected) {
      await this.confirmRecordDirectSalePayment(sale);
    } else {
      await this.confirmMarkDirectSaleDone(sale);
    }
  }

  async confirmRecordDirectSalePayment(sale: any) {
    const alert = await this.alertController.create({
      header: 'Record Payment Mode',
      message: 'Select how the client paid for this sale.',
      inputs: [
        { type: 'radio', label: 'Cash', value: 'Cash', checked: true },
        { type: 'radio', label: 'Online', value: 'Online' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm',
          handler: (selectedMode: string) => {
            this.recordDirectSalePayment(sale, selectedMode || 'Cash');
          }
        }
      ]
    });
    await alert.present();
  }

  private async recordDirectSalePayment(sale: any, mode: string) {
    const loading = await this.loadingController.create({ message: 'Recording payment...' });
    await loading.present();
    this.stockService.recordDirectSalePaymentMode(sale.SaleBillNo, { PaymentMode: mode }).subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          sale.IsPaymentCollected = true;
          sale.PaymentMode = mode;
          this.toastService.create('Payment recorded. Tap again to mark as done.');
        } else {
          this.toastService.create((res && res.Message) || 'Failed to record payment', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to record payment mode', 'danger');
      }
    );
  }

  async confirmMarkDirectSaleDone(sale: any) {
    const alert = await this.alertController.create({
      header: 'Mark as Done',
      message: `Mark this sale (${sale.PaymentMode}) as handed off to the doctor?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Mark Done',
          handler: () => {
            this.markDirectSaleDone(sale);
          }
        }
      ]
    });
    await alert.present();
  }

  private async markDirectSaleDone(sale: any) {
    const loading = await this.loadingController.create({ message: 'Updating...' });
    await loading.present();
    this.stockService.markDirectSaleDone(sale.SaleBillNo).subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.pendingDirectSales = this.pendingDirectSales.filter(s => s.SaleBillNo !== sale.SaleBillNo);
          this.toastService.create('Marked as done.');
          if (this.paId) { this.loadAll(this.paId); }
        } else {
          this.toastService.create((res && res.Message) || 'Failed to update', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to update', 'danger');
      }
    );
  }

  // Mock's list-caption promises "Sorted by urgency — overdue first, then today, then
  // upcoming" but GetByPA returns rows in raw DB order — sort here using the same
  // urgency() the pill itself renders with, so order and pill never disagree.
  private sortByUrgency(list: any[]): any[] {
    const rank = { overdue: 0, today: 1, upcoming: 2, none: 3 };
    return [...list].sort((a, b) => {
      const rankDiff = rank[this.urgency(a)] - rank[this.urgency(b)];
      if (rankDiff !== 0) { return rankDiff; }
      if (!a.TargetDate || !b.TargetDate) { return 0; }
      return new Date(a.TargetDate).getTime() - new Date(b.TargetDate).getTime();
    });
  }

  // Matches PaAssignmentTrackingPage's urgency() so overdue/today/upcoming read the same
  // way on both the doctor's tracking view and the PA's own list. Only meaningful for
  // stage() === 'new'/'given'/'invoiced' — pendingHandover/completed cards use their stage
  // pill instead (see due-pill guard in the template).
  urgency(a: any): 'overdue' | 'today' | 'upcoming' | 'none' {
    if (!a.TargetDate) { return 'none'; }
    const target = new Date(a.TargetDate);
    const today = new Date();
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    if (targetDay < todayDay) { return 'overdue'; }
    if (targetDay === todayDay) { return 'today'; }
    return 'upcoming';
  }

  // Full visit lifecycle for one assignment card: New -> Vaccine Given -> Invoice
  // Downloaded -> Pending Handover (PA marked done, MarkDone endpoint) -> Completed
  // (all paid, Complete endpoint). Row disappears from GetByPA entirely once the doctor
  // confirms cash (IsCashConfirmedByDoctor) — never computed here, that's a filter, not a
  // stage. Order matters: check the latest-reached stage first.
  stage(a: any): 'new' | 'given' | 'invoiced' | 'pendingHandover' | 'completed' {
    if (a.IsCompleted) { return 'completed'; }
    if (a.AssignmentStatus === 'PendingHandover') { return 'pendingHandover'; }
    if (a.HasInvoice) { return 'invoiced'; }
    if (Array.isArray(a.Schedules) && a.Schedules.some((s: any) => s.IsDone)) { return 'given'; }
    return 'new';
  }

  // Cards past "invoiced" stop being about due-dates and start being about handover —
  // their due-pill is replaced by the stage pill (see template), and they're excluded
  // from Today/Upcoming so those tabs stay meant for "what visit do I still need to do".
  isPastDueStage(a: any): boolean {
    const s = this.stage(a);
    return s === 'pendingHandover' || s === 'completed';
  }

  // Counts for the segmented toggle. Overdue is folded into "Today" — it's the more
  // urgent surface and there's no separate tab for it (approved mock decision).
  // Direct Sales have no TargetDate/urgency at all — always under "All" only, same as
  // before the toggle existed.
  dueFilterCount(filter: 'today' | 'upcoming' | 'all'): number {
    if (filter === 'all') {
      return this.assignments.length + this.pendingDirectSales.length + this.completedDirectSales.length + this.orphanInvoiceRows.length;
    }
    const dated = this.assignments.filter(a => !this.isPastDueStage(a));
    if (filter === 'today') {
      return dated.filter(a => this.urgency(a) === 'today' || this.urgency(a) === 'overdue').length;
    }
    return dated.filter(a => this.urgency(a) === 'upcoming').length;
  }

  setDueFilter(filter: 'today' | 'upcoming' | 'all') {
    this.dueFilter = filter;
  }

  // Assignments with no TargetDate (urgency 'none'), pendingHandover/completed-stage
  // cards, Direct Sales, and orphan invoice rows only ever show under "All".
  get filteredAssignments(): any[] {
    if (this.dueFilter === 'all') { return this.assignments; }
    const dated = this.assignments.filter(a => !this.isPastDueStage(a));
    if (this.dueFilter === 'today') {
      return dated.filter(a => this.urgency(a) === 'today' || this.urgency(a) === 'overdue');
    }
    return dated.filter(a => this.urgency(a) === 'upcoming');
  }

  formatTargetDate(dateStr: string): string {
    if (!dateStr) { return ''; }
    try {
      const d = new Date(dateStr);
      const dd = d.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${dd} ${months[d.getMonth()]}`;
    } catch { return dateStr; }
  }

  isBulkGroup(a: any): boolean {
    return Array.isArray(a.Schedules) && a.Schedules.filter(function(s: any) { return s.IsDone; }).length >= 2;
  }

  hasUnpaidSchedules(a: any): boolean {
    if (!a.Schedules || !Array.isArray(a.Schedules)) { return false; }
    const paId = this.paId;
    return a.Schedules.some(function(s) { return s.IsDone && !s.IsPaymentCollected && s.Amount > 0 && s.PaymentCollectorPaId === paId; });
  }

  hasInvoiceForAssignment(a: any): boolean {
    return !!a.HasInvoice;
  }

  // whatsAppNumber is already normalized server-side (ToWhatsAppNumber: digits only, no
  // leading 0, country code prefixed once) — opens a blank chat, no prefilled message.
  openParentWhatsApp(whatsAppNumber: string) {
    if (!whatsAppNumber) { return; }
    const url = (this.platform.is('android') || this.platform.is('ios'))
      ? `whatsapp://send?phone=${whatsAppNumber}`
      : `https://web.whatsapp.com/send?phone=${whatsAppNumber}`;
    window.open(url, '_system');
  }

  hasGivenOrPaidSchedules(a: any): boolean {
    if (!a.Schedules || !Array.isArray(a.Schedules)) { return false; }
    // GetByPA's Schedules array is pinned via PAAssignmentSchedule and may include
    // not-yet-given doses (assign-time auto-include) — check IsDone explicitly now.
    return a.Schedules.some(function(s: any) { return s.IsDone; }) || a.Schedules.some(function(s: any) { return s.IsPaymentCollected; });
  }

  getMissingGrowthVaccines(a: any): string[] {
    if (!a.Schedules || !Array.isArray(a.Schedules)) { return []; }
    return a.Schedules
      .filter(function(s) { return !s.Weight && !s.Height && !s.Circle; })
      .map(function(s) { return s.DoseName || 'Unknown'; });
  }

  // "Mark Done" — the earlier of the two completion actions (MarkDone endpoint): gates on
  // at least one paid schedule, moves the assignment to Pending Handover. Available from
  // new/given/invoiced stages. Brought over from the retired payables.page.ts.
  async promptMarkDone(a: any, event?: Event) {
    if (event) { event.stopPropagation(); }
    const unpaid = (a.Schedules || []).filter((s: any) =>
      s.IsDone && !s.IsPaymentCollected && s.Amount > 0 && s.PaymentCollectorPaId === this.paId);

    if (unpaid.length > 0) {
      const names = unpaid.map((s: any) => s.DoseName).join(', ');
      const alert = await this.alertController.create({
        header: 'Payment Pending',
        message: 'Please record payment for: ' + names + '. Use the money icon on the vaccine page first.',
        buttons: [{ text: 'OK', role: 'cancel' }]
      });
      await alert.present();
      return;
    }

    const confirm = await this.alertController.create({
      header: 'Mark as Done',
      message: 'Mark assignment for ' + a.Name + ' as done? This will move it to Pending Cash Handover for the doctor to confirm.',
      buttons: [
        { text: 'Back', role: 'cancel' },
        { text: 'Mark Done', handler: () => { this.doMarkAssignmentDone(a.AssignmentId); } }
      ]
    });
    await confirm.present();
  }

  private async doMarkAssignmentDone(assignmentId: number) {
    const loading = await this.loadingController.create({ message: 'Marking done...' });
    await loading.present();
    this.paService.markAssignmentDone(assignmentId, this.paId).subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Marked as done — pending cash handover', 'success');
          if (this.paId) { this.loadAll(this.paId); }
        } else {
          this.toastService.create((res && res.Message) || 'Mark done failed', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Mark done failed', 'danger');
      }
    );
  }

  // "Complete" — the final completion action (Complete endpoint): gates on ALL pinned
  // schedules being paid. Only reachable once an assignment is already at Pending
  // Handover — a card can't jump straight from "new" to fully completed without the
  // doctor being told a handover is pending first.
  async confirmComplete(assignment: any) {
    if (this.stage(assignment) !== 'pendingHandover') { return; }
    if (this.hasUnpaidSchedules(assignment)) {
      const alert = await this.alertController.create({
        header: 'Record Payment Mode',
        message: 'Select how the patient paid. This is required before completing the assignment.',
        inputs: [
          { type: 'radio', label: 'Cash', value: 'Cash', checked: true },
          { type: 'radio', label: 'Online', value: 'Online' },
        ],
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Confirm & Continue',
            handler: async (selectedMode: string) => {
              const ok = await this.recordPaymentModeForAll(assignment, selectedMode || 'Cash');
              if (ok) { this.proceedToGrowthCheck(assignment); }
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.proceedToGrowthCheck(assignment);
    }
  }

  private async recordPaymentModeForAll(assignment: any, mode: string): Promise<boolean> {
    const paId = this.paId;
    const unpaid = (assignment.Schedules || []).filter(function(s: any) {
      return s.IsDone && !s.IsPaymentCollected && s.Amount > 0 && s.PaymentCollectorPaId === paId;
    });
    if (unpaid.length === 0) { return true; }
    const loading = await this.loadingController.create({ message: 'Recording payment...' });
    await loading.present();
    return new Promise(resolve => {
      let settled = false;
      const done = (ok: boolean) => { if (!settled) { settled = true; loading.dismiss(); resolve(ok); } };
      const next = (index: number) => {
        if (index >= unpaid.length) { done(true); return; }
        this.scheduleService.recordPaymentMode(unpaid[index].Id, { PaymentMode: mode }).subscribe(
          res => {
            if (res && res.IsSuccess) {
              // Mark only this schedule as paid once server confirms
              unpaid[index].IsPaymentCollected = true;
              unpaid[index].PaymentMode = mode;
              next(index + 1);
            } else {
              this.toastService.create((res && res.Message) || 'Failed to record payment', 'danger');
              done(false);
            }
          },
          () => {
            this.toastService.create('Failed to record payment mode', 'danger');
            done(false);
          }
        );
      };
      next(0);
    });
  }

  private async proceedToGrowthCheck(assignment: any) {
    const missingGrowth = this.getMissingGrowthVaccines(assignment);
    if (missingGrowth.length > 0) {
      const alert = await this.alertController.create({
        header: 'Growth Not Recorded',
        message: 'Growth parameters not entered for: ' + missingGrowth.join(', ') + '. Continue anyway?',
        buttons: [
          { text: 'Go Back', role: 'cancel' },
          { text: 'Complete Anyway', handler: () => { this.completeAssignment(assignment.AssignmentId); } }
        ]
      });
      await alert.present();
    } else {
      this.completeAssignment(assignment.AssignmentId);
    }
  }

  async completeAssignment(assignmentId: number) {
    const loading = await this.loadingController.create({ message: 'Updating...' });
    await loading.present();
    this.paService.completeAssignment(assignmentId).subscribe(
      async res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Assignment completed', 'success');
          if (this.paId) { this.loadAll(this.paId); }
        } else {
          this.toastService.create(res.Message || 'Failed to complete', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to complete assignment', 'danger');
      }
    );
  }

  async confirmCancel(assignment: any) {
    if (assignment.AssignmentStatus === 'PendingCancellation') {
      const alert = await this.alertController.create({
        header: 'Already Requested',
        message: 'A cancellation request for this assignment is already awaiting the doctor\'s decision.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (this.hasGivenOrPaidSchedules(assignment)) {
      const alert = await this.alertController.create({
        header: 'Request Cancellation',
        message: 'This assignment has vaccines given or payment recorded, so it can\'t be cancelled directly. Send a cancellation request to the doctor instead?',
        inputs: [{ name: 'reason', type: 'text', placeholder: 'Reason (optional — leave blank if none)' }],
        buttons: [
          { text: 'Never Mind', role: 'cancel' },
          {
            text: 'Send Request',
            handler: async (data) => { await this.requestCancelAssignment(assignment.AssignmentId, data.reason || ''); }
          }
        ]
      });
      await alert.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Cancel Assignment',
      message: `Cancel assignment for ${assignment.Name}?`,
      inputs: [{ name: 'reason', type: 'text', placeholder: 'Reason (optional — leave blank if none)' }],
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Yes, Cancel',
          handler: async (data) => { await this.cancelAssignment(assignment.AssignmentId, data.reason || ''); }
        }
      ]
    });
    await alert.present();
  }

  async requestCancelAssignment(assignmentId: number, reason: string) {
    const user = await this.storage.get(environment.USER);
    if (!user) return;
    const loading = await this.loadingController.create({ message: 'Sending request...' });
    await loading.present();
    this.paService.requestCancelAssignment(assignmentId, Number(user.PAId), reason).subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Cancellation request sent to the doctor', 'success');
          const row = this.assignments.find(a => a.AssignmentId === assignmentId);
          if (row) { row.AssignmentStatus = 'PendingCancellation'; }
        } else {
          this.toastService.create(res.Message || 'Failed to send request', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to send cancellation request', 'danger');
      }
    );
  }

  async cancelAssignment(assignmentId: number, reason: string) {
    const user = await this.storage.get(environment.USER);
    if (!user) return;
    const loading = await this.loadingController.create({ message: 'Cancelling...' });
    await loading.present();
    this.paService.cancelAssignment(assignmentId, 'PA', Number(user.PAId), reason).subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Assignment cancelled', 'success');
          this.assignments = this.assignments.filter(a => a.AssignmentId !== assignmentId);
        } else {
          this.toastService.create(res.Message || 'Failed to cancel', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to cancel', 'danger');
      }
    );
  }
}
