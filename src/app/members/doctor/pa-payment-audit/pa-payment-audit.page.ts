import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-pa-payment-audit',
  templateUrl: './pa-payment-audit.page.html',
  styleUrls: ['./pa-payment-audit.page.scss'],
})
export class PaPaymentAuditPage {
  doctorId: number = null;
  selectedDate: string = '';
  summary: any[] = [];
  pendingHandovers: any[] = [];
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
    if (user && user.DoctorId) {
      this.doctorId = Number(user.DoctorId);
    }
    if (!this.selectedDate) {
      const today = new Date();
      const mm = (today.getMonth() + 1).toString().padStart(2, '0');
      const dd = today.getDate().toString().padStart(2, '0');
      this.selectedDate = today.getFullYear() + '-' + mm + '-' + dd;
    }
    this.load();
  }

  load() {
    if (!this.doctorId) { return; }
    this.loading = true;
    this.paService.getDailySummary(this.doctorId, this.selectedDate).subscribe(
      res => {
        this.loading = false;
        if (res && res.IsSuccess && res.ResponseData) {
          this.summary = res.ResponseData.Summary || [];
          this.pendingHandovers = res.ResponseData.PendingHandovers || [];
        }
      },
      () => { this.loading = false; this.toastService.create('Failed to load summary', 'danger'); }
    );
  }

  async confirmHandover(handover: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Handover',
      message: `Confirm cash handover of Rs ${handover.Amount}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm',
          handler: () => {
            this.paService.confirmHandover(handover.Id).subscribe(
              res => {
                if (res && res.IsSuccess) {
                  this.toastService.create('Handover confirmed', 'success');
                  this.load();
                } else {
                  this.toastService.create(res.Message || 'Failed', 'danger');
                }
              },
              () => { this.toastService.create('Failed to confirm', 'danger'); }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  async rejectHandover(handover: any) {
    const alert = await this.alertController.create({
      header: 'Reject Handover',
      inputs: [{ name: 'note', type: 'text', placeholder: 'Reason (optional)' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          handler: (data) => {
            this.paService.rejectHandover(handover.Id, data.note || '').subscribe(
              res => {
                if (res && res.IsSuccess) {
                  this.toastService.create('Handover rejected', 'warning');
                  this.load();
                } else {
                  this.toastService.create(res.Message || 'Failed', 'danger');
                }
              },
              () => { this.toastService.create('Failed to reject', 'danger'); }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  getPendingForPa(paId: number): any {
    return this.pendingHandovers.find(h => h.PaId === paId) || null;
  }
}
