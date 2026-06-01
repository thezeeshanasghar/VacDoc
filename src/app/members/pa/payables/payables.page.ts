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
        // New Assignments = doctor-assigned (not auto-created), not completed
        this.newAssignments = (assignRes.ResponseData || []).filter((a: any) => !a.IsAutoCreated);
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

  async promptCancel(a: any, event: Event) {
    event.stopPropagation();
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
