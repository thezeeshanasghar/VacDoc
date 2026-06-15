import { Component } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';
import { StockService } from 'src/app/services/stock.service';
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
    private stockService: StockService,
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
      const [assignRes, reconRes, pendingDsRes, completedDsRes] = await Promise.all([
        this.paService.getAssignments(paId).toPromise(),
        this.paService.getMyReconciliation(paId).toPromise(),
        this.stockService.getPendingDirectSalesForPa(paId).toPromise(),
        this.stockService.getCompletedDirectSalesForPa(paId).toPromise()
      ]);

      let newList: any[] = [];
      if (assignRes && assignRes.IsSuccess) {
        // Show all active assignments regardless of IsAutoCreated (includes remote-clinic invoice-driven ones)
        newList = (assignRes.ResponseData || []).filter(
          (a: any) => !a.IsCompleted && !a.IsCancelled && a.AssignmentStatus !== 'Completed' && a.AssignmentStatus !== 'PendingHandover'
        );
      }

      if (pendingDsRes && pendingDsRes.IsSuccess) {
        const dsRows = (pendingDsRes.ResponseData || []).map((s: any) => ({
          IsDirectSale: true,
          SaleBillNo: s.SaleBillNo,
          Name: s.ClientName,
          Amount: s.Amount,
          IsPaymentCollected: s.IsPaymentCollected,
          PaymentMode: s.PaymentMode,
          AssignedAt: s.Date,
          ClinicId: s.ClinicId
        }));
        newList = newList.concat(dsRows);
      }

      this.newAssignments = newList.sort((a: any, b: any) => new Date(b.AssignedAt).getTime() - new Date(a.AssignedAt).getTime());
      this.pendingCount = this.newAssignments.length;

      let completedList: any[] = [];
      if (reconRes && reconRes.IsSuccess && reconRes.ResponseData) {
        completedList = reconRes.ResponseData.Rows || [];
        this.totalPayable = reconRes.ResponseData.TotalPending || 0;
      }

      if (completedDsRes && completedDsRes.IsSuccess) {
        const dsRows = (completedDsRes.ResponseData || []).map((s: any) => ({
          IsDirectSale: true,
          SaleBillNo: s.SaleBillNo,
          PatientName: s.ClientName,
          Amount: s.Amount,
          IsConfirmed: s.IsConfirmedByDoctor,
          PaymentMode: s.PaymentMode
        }));
        completedList = completedList.concat(dsRows);
      }

      this.completedRows = completedList;
    } catch (e) {
      this.toastService.create('Failed to load payables', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  goToSchedule(childId: number) {
    this.navCtrl.navigateForward('/members/child/vaccine/' + childId);
  }

  onCardClick(item: any, childId: number) {
    if (item.IsDirectSale) return;
    this.goToSchedule(childId);
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

  // Direct sale "Done" action: step 1 records Cash/Online, step 2 marks done
  async promptDoneDirectSale(s: any, event: Event) {
    event.stopPropagation();

    if (!s.IsPaymentCollected) {
      const alert = await this.alertCtrl.create({
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
              this.recordDirectSalePayment(s, selectedMode || 'Cash');
            }
          }
        ]
      });
      await alert.present();
      return;
    }

    const confirm = await this.alertCtrl.create({
      header: 'Mark as Done',
      message: `Mark this sale (${s.PaymentMode}) as handed off to the doctor?`,
      buttons: [
        { text: 'Back', role: 'cancel' },
        { text: 'Mark Done', handler: () => { this.markDirectSaleDone(s); } }
      ]
    });
    await confirm.present();
  }

  private async recordDirectSalePayment(s: any, mode: string) {
    const loading = await this.loadingController.create({ message: 'Recording payment...' });
    await loading.present();
    try {
      const res = await this.stockService.recordDirectSalePaymentMode(s.SaleBillNo, { PaymentMode: mode }).toPromise();
      if (res && res.IsSuccess) {
        this.toastService.create('Payment recorded. Tap Done again to mark as done.', 'success');
        await this.ionViewWillEnter();
      } else {
        this.toastService.create((res && res.Message) || 'Failed to record payment', 'danger');
      }
    } catch {
      this.toastService.create('Failed to record payment mode', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  private async markDirectSaleDone(s: any) {
    const loading = await this.loadingController.create({ message: 'Updating...' });
    await loading.present();
    try {
      const res = await this.stockService.markDirectSaleDone(s.SaleBillNo).toPromise();
      if (res && res.IsSuccess) {
        this.toastService.create('Marked as done.', 'success');
        await this.ionViewWillEnter();
      } else {
        this.toastService.create((res && res.Message) || 'Failed to update', 'danger');
      }
    } catch {
      this.toastService.create('Failed to update', 'danger');
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

  async promptCancel(a: any, event: Event) {
    event.stopPropagation();

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
      header: 'Cancel Assignment',
      message: 'Please provide a reason for cancellation.',
      inputs: [{ name: 'reason', type: 'text', placeholder: 'One-line reason...' }],
      buttons: [
        { text: 'Back', role: 'cancel' },
        {
          text: 'Cancel Assignment',
          cssClass: 'alert-danger-btn',
          handler: async (data) => {
            if (!data.reason || !data.reason.trim()) {
              this.toastService.create('Please enter a reason', 'warning');
              return false;
            }
            await this.doCancelAssignment(a.AssignmentId, data.reason.trim());
          }
        }
      ]
    });
    await alert.present();
  }

  async doCancelAssignment(assignmentId: number, reason: string) {
    const user = await this.storage.get(environment.USER);
    const paId = Number(user.PAId);
    const loading = await this.loadingController.create({ message: 'Cancelling...' });
    await loading.present();
    try {
      const res = await this.paService.cancelAssignment(assignmentId, 'PA', paId, reason).toPromise();
      if (res && res.IsSuccess) {
        this.toastService.create('Assignment cancelled', 'success');
        await this.ionViewWillEnter();
      } else {
        this.toastService.create((res && res.Message) || 'Cancel failed', 'danger');
      }
    } catch {
      this.toastService.create('Cancel failed', 'danger');
    } finally {
      loading.dismiss();
    }
  }
}
