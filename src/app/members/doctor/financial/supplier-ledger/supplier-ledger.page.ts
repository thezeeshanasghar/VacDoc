import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { SupplierService } from 'src/app/services/supplier.service';
import { ClinicService } from 'src/app/services/clinic.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-supplier-ledger',
  templateUrl: './supplier-ledger.page.html',
  styleUrls: ['./supplier-ledger.page.scss'],
})
export class SupplierLedgerPage implements OnInit {
  supplierId: number;
  clinicId: number;
  clinics: any[] = [];
  ledger: any = null;

  showPaymentForm = false;
  payment = {
    amount: null as number | null,
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Cash',
    notes: ''
  };
  paymentMethods = ['Cash', 'Online Transfer', 'Partial'];

  constructor(
    private route: ActivatedRoute,
    private supplierService: SupplierService,
    private clinicService: ClinicService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastService: ToastService,
    private storage: Storage,
  ) {}

  async ngOnInit() {
    this.supplierId = Number(this.route.snapshot.paramMap.get('id'));
    await this.loadClinics();
  }

  ionViewWillEnter() {
    if (this.clinicId) this.loadLedger();
  }

  async loadClinics() {
    const usertype = await this.storage.get(environment.USER);
    const storedClinicId = await this.storage.get(environment.CLINIC_Id);
    const doctorId = await this.storage.get(environment.DOCTOR_Id);

    if (usertype && doctorId) {
      this.clinicService.getClinics(Number(doctorId)).subscribe(res => {
        if (res.IsSuccess) {
          this.clinics = res.ResponseData || [];
          this.clinicId = storedClinicId || (this.clinics.length > 0 ? this.clinics[0].Id : null);
          if (this.clinicId) this.loadLedger();
        }
      });
    }
  }

  async loadLedger() {
    const loading = await this.loadingController.create({ message: 'Loading ledger...' });
    await loading.present();
    this.supplierService.getLedger(this.supplierId, this.clinicId).subscribe(
      res => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.ledger = res.ResponseData;
        } else {
          this.toastService.create(res.Message || 'Failed to load ledger', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to load ledger', 'danger');
      }
    );
  }

  onClinicChange() {
    this.ledger = null;
    this.loadLedger();
  }

  togglePaymentForm() {
    this.showPaymentForm = !this.showPaymentForm;
    if (!this.showPaymentForm) this.resetPaymentForm();
  }

  async savePayment() {
    if (!this.payment.amount || this.payment.amount <= 0) {
      this.toastService.create('Amount must be greater than zero', 'danger');
      return;
    }
    const loading = await this.loadingController.create({ message: 'Saving...' });
    await loading.present();

    const dto = {
      SupplierId: this.supplierId,
      ClinicId: this.clinicId,
      Amount: this.payment.amount,
      PaymentDate: this.payment.paymentDate,
      PaymentMethod: this.payment.paymentMethod,
      Notes: this.payment.notes || null,
    };

    this.supplierService.createPayment(dto).subscribe(
      res => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Payment recorded', 'success');
          this.resetPaymentForm();
          this.showPaymentForm = false;
          this.loadLedger();
        } else {
          this.toastService.create(res.Message || 'Failed to save', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to save payment', 'danger');
      }
    );
  }

  async confirmDelete(paymentId: number) {
    const alert = await this.alertController.create({
      header: 'Delete Payment',
      message: 'Are you sure you want to delete this payment?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.deletePayment(paymentId)
        }
      ]
    });
    await alert.present();
  }

  async deletePayment(paymentId: number) {
    const loading = await this.loadingController.create({ message: 'Deleting...' });
    await loading.present();
    this.supplierService.deletePayment(paymentId).subscribe(
      res => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Payment deleted', 'success');
          this.loadLedger();
        } else {
          this.toastService.create(res.Message || 'Failed to delete', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to delete payment', 'danger');
      }
    );
  }

  entryColor(type: string): string {
    switch (type) {
      case 'Bill': return 'danger';
      case 'Payment': return 'success';
      case 'AWT': return 'warning';
      default: return 'medium';
    }
  }

  private resetPaymentForm() {
    this.payment = {
      amount: null,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Cash',
      notes: ''
    };
  }
}
