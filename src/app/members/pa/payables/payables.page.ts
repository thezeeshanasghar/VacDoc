import { Component } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-payables',
  templateUrl: './payables.page.html',
  styleUrls: ['./payables.page.scss'],
})
export class PayablesPage {
  activeTab: 'new' | 'completed' = 'new';

  newAssignments: any[] = [];
  completedRows: any[] = [];

  totalPayable: number = 0;
  pendingCount: number = 0;

  constructor(
    private storage: Storage,
    private paService: PaService,
    private loadingController: LoadingController,
    private toastService: ToastService,
    private navCtrl: NavController,
    private alertCtrl: AlertController
  ) {}

  async ionViewWillEnter() {
    const user = await this.storage.get(environment.USER);
    if (!user || user.UserType !== 'PA') return;
    const paId = Number(user.PAId);

    const loading = await this.loadingController.create({ message: 'Loading...' });
    await loading.present();

    try {
      const [assignRes, reconRes] = await Promise.all([
        this.paService.getAssignments(paId).toPromise(),
        this.paService.getMyReconciliation(paId).toPromise()
      ]);

      if (assignRes && assignRes.IsSuccess) {
        // Show all active assignments regardless of IsAutoCreated (includes remote-clinic invoice-driven ones)
        this.newAssignments = (assignRes.ResponseData || []).filter(
          (a: any) => !a.IsCompleted && !a.IsCancelled && a.AssignmentStatus !== 'Completed' && a.AssignmentStatus !== 'PendingHandover'
        );
        this.pendingCount = this.newAssignments.length;
      }

      if (reconRes && reconRes.IsSuccess && reconRes.ResponseData) {
        this.completedRows = reconRes.ResponseData.Rows || [];
        this.totalPayable = reconRes.ResponseData.TotalPending || 0;
      }
    } catch (e) {
      this.toastService.create('Failed to load payables', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  goToSchedule(childId: number) {
    this.navCtrl.navigateForward('/members/child/vaccine/' + childId);
  }

  formatMR(childId: number): string {
    return 'MR-' + String(childId).padStart(6, '0');
  }

  async promptDone(a: any, event: Event) {
    event.stopPropagation();
    const unpaid = (a.Schedules || []).filter(function(s: any) { return !s.IsPaymentCollected && s.Amount > 0; });

    if (unpaid.length > 0) {
      const names = unpaid.map(function(s: any) { return s.DoseName; }).join(', ');
      const alert = await this.alertCtrl.create({
        header: 'Payment Pending',
        message: 'Please record payment for: ' + names + '. Use the money icon on the vaccine page first.',
        buttons: [{ text: 'OK', role: 'cancel' }]
      });
      await alert.present();
      return;
    }

    const confirm = await this.alertCtrl.create({
      header: 'Mark as Done',
      message: 'Mark assignment for ' + a.Name + ' as done? This will move it to Pending Cash Handover for the doctor to confirm.',
      buttons: [
        { text: 'Back', role: 'cancel' },
        { text: 'Mark Done', handler: () => { this.doCompleteAssignment(a.AssignmentId); } }
      ]
    });
    await confirm.present();
  }

  async doCompleteAssignment(assignmentId: number) {
    const user = await this.storage.get(environment.USER);
    const paId = Number(user.PAId);
    const loading = await this.loadingController.create({ message: 'Marking done...' });
    await loading.present();
    try {
      const res = await this.paService.markAssignmentDone(assignmentId, paId).toPromise();
      if (res && res.IsSuccess) {
        this.toastService.create('Marked as done — pending cash handover', 'success');
        await this.ionViewWillEnter();
      } else {
        this.toastService.create((res && res.Message) || 'Mark done failed', 'danger');
      }
    } catch (e) {
      this.toastService.create('Mark done failed', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  hasGivenOrPaidSchedules(a: any): boolean {
    if (!a.Schedules || !Array.isArray(a.Schedules)) { return false; }
    // Schedules array from GetByPA is already pre-filtered to IsDone === true,
    // so any entry here means a vaccine was given; IsPaymentCollected covers payment.
    return a.Schedules.length > 0 || a.Schedules.some(function(s: any) { return s.IsPaymentCollected; });
  }

  isPendingCancellation(a: any): boolean {
    return a.AssignmentStatus === 'PendingCancellation';
  }

  async promptCancel(a: any, event: Event) {
    event.stopPropagation();

    if (this.isPendingCancellation(a)) {
      const pendingAlert = await this.alertCtrl.create({
        header: 'Already Pending',
        message: 'A cancellation request for this assignment is already awaiting the doctor\'s approval.',
        buttons: ['OK']
      });
      await pendingAlert.present();
      return;
    }

    if (this.hasGivenOrPaidSchedules(a)) {
      const blockedAlert = await this.alertCtrl.create({
        header: 'Cannot Cancel',
        message: 'This assignment has vaccines given or payment recorded and can no longer be self-cancelled. Please contact the doctor to cancel or reverse it.',
        buttons: ['OK']
      });
      await blockedAlert.present();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Request Cancellation',
      message: 'This will send a cancellation request to the doctor for approval. Please provide a reason.',
      inputs: [{ name: 'reason', type: 'text', placeholder: 'One-line reason...' }],
      buttons: [
        { text: 'Back', role: 'cancel' },
        {
          text: 'Send Request',
          cssClass: 'alert-danger-btn',
          handler: async (data) => {
            if (!data.reason || !data.reason.trim()) {
              this.toastService.create('Please enter a reason', 'warning');
              return false;
            }
            await this.requestCancel(a, data.reason.trim());
          }
        }
      ]
    });
    await alert.present();
  }

  async requestCancel(a: any, reason: string) {
    const user = await this.storage.get(environment.USER);
    const paId = Number(user.PAId);
    const loading = await this.loadingController.create({ message: 'Sending request...' });
    await loading.present();
    try {
      const res = await this.paService.requestCancelAssignment(a.AssignmentId, paId, reason).toPromise();
      if (res && res.IsSuccess) {
        this.toastService.create('Cancellation request sent — awaiting doctor approval', 'success');
        await this.ionViewWillEnter();
      } else {
        this.toastService.create((res && res.Message) || 'Failed to send request', 'danger');
      }
    } catch {
      this.toastService.create('Failed to send cancellation request', 'danger');
    } finally {
      loading.dismiss();
    }
  }
}
