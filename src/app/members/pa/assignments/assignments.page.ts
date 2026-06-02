import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';
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
      () => { this.loading = false; }
    );
  }

  hasUnpaidSchedules(a: any): boolean {
    if (!a.Schedules || !Array.isArray(a.Schedules)) { return false; }
    return a.Schedules.some(function(s) { return !s.IsPaymentCollected && s.Amount > 0; });
  }

  getMissingGrowthVaccines(a: any): string[] {
    if (!a.Schedules || !Array.isArray(a.Schedules)) { return []; }
    return a.Schedules
      .filter(function(s) { return !s.Weight && !s.Height && !s.Circle; })
      .map(function(s) { return s.DoseName || 'Unknown'; });
  }

  async confirmComplete(assignment: any) {
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
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Assignment completed', 'success');
          this.assignments = this.assignments.filter(function(a) { return a.AssignmentId !== assignmentId; });
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
      inputs: [{ name: 'reason', type: 'text', placeholder: 'Reason (optional)' }],
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
