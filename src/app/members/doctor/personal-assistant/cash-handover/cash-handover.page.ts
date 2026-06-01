import { Component } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { PaCashHandoverService } from 'src/app/services/pa-cash-handover.service';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-cash-handover',
  templateUrl: './cash-handover.page.html',
  styleUrls: ['./cash-handover.page.scss'],
})
export class CashHandoverPage {
  usertype: any;
  paId: number = null;
  doctorId: number = null;
  clinicId: number = null;
  cashInHand: number = 0;
  handovers: any[] = [];
  pendingHandovers: any[] = [];
  isDoctorView: boolean = false;
  myRecon: { TotalCollected: number; TotalConfirmed: number; TotalPending: number } = null;

  constructor(
    private loadingController: LoadingController,
    private alertController: AlertController,
    private storage: Storage,
    private cashHandoverService: PaCashHandoverService,
    private paService: PaService,
    private toastService: ToastService
  ) {}

  ionViewWillEnter() {
    this.storage.get(environment.USER).then((user) => {
      if (!user) return;
      this.usertype = user.UserType;

      if (user.UserType === 'PA') {
        this.isDoctorView = false;
        this.paId = Number(user.PAId) || null;
        this.storage.get(environment.CLINIC_Id).then((clinicId) => {
          this.clinicId = clinicId ? Number(clinicId) : null;
          this.storage.get(environment.DOCTOR_Id).then((docId) => {
            this.doctorId = docId ? Number(docId) : null;
            this.loadCashInHand();
            this.loadHistory();
            this.loadMyReconciliation();
          });
        });
      } else if (user.UserType === 'DOCTOR') {
        this.isDoctorView = true;
        this.storage.get(environment.DOCTOR_Id).then((docId) => {
          this.doctorId = docId ? Number(docId) : null;
          this.loadPendingHandovers();
        });
      }
    });
  }

  async loadCashInHand() {
    if (!this.paId || !this.clinicId) return;
    const loading = await this.loadingController.create({ message: 'Loading...' });
    await loading.present();
    this.cashHandoverService.getCashInHand(this.paId, this.clinicId).subscribe(
      (res) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.cashInHand = res.ResponseData || 0;
        }
      },
      (err) => { loading.dismiss(); }
    );
  }

  async loadHistory() {
    if (!this.paId || !this.clinicId) return;
    this.cashHandoverService.getHistory(this.paId, this.clinicId).subscribe(
      (res) => {
        if (res.IsSuccess) {
          this.handovers = res.ResponseData || [];
        }
      },
      (err) => {}
    );
  }

  loadMyReconciliation() {
    if (!this.paId || !this.clinicId) { return; }
    this.paService.getMyReconciliation(this.paId, this.clinicId).subscribe(
      res => {
        if (res && res.IsSuccess && res.ResponseData) {
          this.myRecon = res.ResponseData;
        }
      },
      () => {}
    );
  }

  async loadPendingHandovers() {
    if (!this.doctorId) return;
    const loading = await this.loadingController.create({ message: 'Loading...' });
    await loading.present();
    this.cashHandoverService.getPendingHandovers(this.doctorId).subscribe(
      (res) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.pendingHandovers = res.ResponseData || [];
        }
      },
      (err) => { loading.dismiss(); }
    );
  }

  async initiateHandover() {
    if (!this.paId || !this.clinicId || !this.doctorId) {
      this.toastService.create('Clinic or doctor info missing.', 'danger');
      return;
    }
    const loading = await this.loadingController.create({ message: 'Creating handover...' });
    await loading.present();
    this.cashHandoverService.createHandover(this.paId, this.clinicId, this.doctorId).subscribe(
      async (res) => {
        loading.dismiss();
        if (res.IsSuccess) {
          const alert = await this.alertController.create({
            header: 'Handover Submitted',
            message: 'Rs. ' + res.ResponseData.Amount + ' handed over to doctor. Awaiting confirmation.',
            buttons: ['OK']
          });
          await alert.present();
          this.loadCashInHand();
          this.loadHistory();
        } else {
          const alert = await this.alertController.create({
            header: 'Cannot Hand Over',
            message: res.Message,
            buttons: ['OK']
          });
          await alert.present();
        }
      },
      (err) => {
        loading.dismiss();
        this.toastService.create('Error creating handover.', 'danger');
      }
    );
  }

  async confirmHandover(handover: any) {
    const loading = await this.loadingController.create({ message: 'Confirming...' });
    await loading.present();
    this.cashHandoverService.confirmHandover(handover.Id).subscribe(
      (res) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Handover confirmed — Rs. ' + handover.Amount + ' received.');
          this.loadPendingHandovers();
        } else {
          this.toastService.create(res.Message, 'danger');
        }
      },
      (err) => { loading.dismiss(); }
    );
  }

  async rejectHandover(handover: any) {
    const alert = await this.alertController.create({
      header: 'Reject Handover',
      message: 'Enter reason for rejection:',
      inputs: [{ name: 'note', type: 'textarea', placeholder: 'Reason...' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          handler: (data) => {
            this.doReject(handover.Id, data.note || '');
          }
        }
      ]
    });
    await alert.present();
  }

  async doReject(id: number, note: string) {
    const loading = await this.loadingController.create({ message: 'Rejecting...' });
    await loading.present();
    this.cashHandoverService.rejectHandover(id, note).subscribe(
      (res) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Handover rejected.');
          this.loadPendingHandovers();
        } else {
          this.toastService.create(res.Message, 'danger');
        }
      },
      (err) => { loading.dismiss(); }
    );
  }

  get hasRejectedHandover(): boolean {
    return this.handovers.some(h => h.Status === 'Rejected');
  }

  statusColor(status: string): string {
    if (status === 'Confirmed') return 'success';
    if (status === 'Rejected') return 'danger';
    return 'warning';
  }
}
