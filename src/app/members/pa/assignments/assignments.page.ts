import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';
import { ScheduleService } from 'src/app/services/schedule.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-assignments',
  templateUrl: './assignments.page.html',
  styleUrls: ['./assignments.page.scss'],
})
export class AssignmentsPage {
  assignments: any[] = [];
  loading: boolean = false;

  constructor(
    private paService: PaService,
    private scheduleService: ScheduleService,
    private storage: Storage,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController,
  ) {}

  async ionViewWillEnter() {
    const user = await this.storage.get(environment.USER);
    if (user && user.PAId) {
      this.loadAssignments(Number(user.PAId));
    }
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
    return Array.isArray(a.Schedules) && a.Schedules.length >= 2;
  }

  hasUnpaidSchedules(a: any): boolean {
    if (!a.Schedules || !Array.isArray(a.Schedules)) { return false; }
    return a.Schedules.some(function(s) { return !s.IsPaymentCollected && s.Amount > 0; });
  }

  hasInvoiceForAssignment(a: any): boolean {
    return !!a.HasInvoice;
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
          { type: 'radio', label: 'Online Transfer', value: 'Online Transfer' },
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
    const unpaid = (assignment.Schedules || []).filter(function(s: any) { return !s.IsPaymentCollected && s.Amount > 0; });
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

  async confirmCancel(assignmentId: number, name: string) {
    const alert = await this.alertController.create({
      header: 'Cancel Assignment',
      message: `Cancel assignment for ${name}?`,
      inputs: [{ name: 'reason', type: 'text', placeholder: 'Reason (optional — leave blank if none)' }],
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Yes, Cancel',
          handler: async (data) => { await this.cancelAssignment(assignmentId, data.reason || ''); }
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
