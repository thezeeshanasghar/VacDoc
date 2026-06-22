import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
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
  loading: boolean = false;
  paId: number = null;

  constructor(
    private paService: PaService,
    private scheduleService: ScheduleService,
    private stockService: StockService,
    private storage: Storage,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController,
  ) {}

  async ionViewWillEnter() {
    const user = await this.storage.get(environment.USER);
    if (user && user.PAId) {
      this.paId = Number(user.PAId);
      this.loadAssignments(this.paId);
      this.loadPendingDirectSales(this.paId);
    }
  }

  loadPendingDirectSales(paId: number) {
    this.stockService.getPendingDirectSalesForPa(paId).subscribe(
      res => {
        if (res && res.IsSuccess) {
          this.pendingDirectSales = res.ResponseData || [];
        }
      },
      () => {}
    );
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

  loadAssignments(paId: number) {
    this.loading = true;
    this.paService.getAssignments(paId).subscribe(
      res => {
        this.loading = false;
        if (res && res.IsSuccess) {
          this.assignments = res.ResponseData || [];
        }
      },
      () => {
        this.loading = false;
        this.toastService.create('Failed to load assignments', 'danger');
      }
    );
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

  async confirmComplete(assignment: any) {
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
          const user = await this.storage.get(environment.USER);
          if (user && user.PAId) { this.loadAssignments(Number(user.PAId)); }
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
    if (this.hasGivenOrPaidSchedules(assignment)) {
      const alert = await this.alertController.create({
        header: 'Cannot Cancel',
        message: 'This assignment has vaccines given or payment recorded and can no longer be self-cancelled. Please contact the doctor to cancel or reverse it.',
        buttons: ['OK']
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
        this.toastService.create('Failed to cancel assignment', 'danger');
      }
    );
  }
}
