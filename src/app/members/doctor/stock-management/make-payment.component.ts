import { Component, Input } from '@angular/core';
import { ModalController, LoadingController } from '@ionic/angular';
import { StockService } from 'src/app/services/stock.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-make-payment',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Make Payment</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- Supplier + Bill info -->
      <div style="background:#f4f6fb; border-radius:10px; padding:14px 16px; margin-bottom:16px;">
        <div style="font-size:18px; font-weight:700; color:#1565C0; margin-bottom:4px;">{{ bill.Supplier || 'No Supplier' }}</div>
        <div style="font-size:13px; color:#555;">{{ bill.BillNo }} &nbsp;·&nbsp; {{ bill.BillDate | date:'dd MMM yyyy' }}</div>
      </div>

      <!-- Amounts summary -->
      <div style="border-radius:10px; border:1px solid #e0e0e0; padding:12px 16px; margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f0f0f0;">
          <span style="color:#555; font-size:14px;">Bill Total</span>
          <span style="font-weight:600; font-size:14px;">Rs {{ billTotal | number:'1.2-2' }}</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f0f0f0;">
          <span style="color:#555; font-size:14px;">Already Paid</span>
          <span style="font-weight:600; font-size:14px; color:#2E7D32;">Rs {{ alreadyPaid | number:'1.2-2' }}</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:6px 0;">
          <span style="color:#C62828; font-weight:700; font-size:14px;">Due Amount</span>
          <span style="font-weight:800; font-size:16px; color:#C62828;">Rs {{ dueAmount | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- No supplier warning -->
      <div *ngIf="!bill.SupplierId" style="background:#fff3e0; border-radius:8px; padding:10px 14px; margin-bottom:16px; font-size:13px; color:#E65100;">
        <ion-icon name="warning-outline"></ion-icon>
        No supplier linked to this bill. Payment will be recorded on the bill only — not in supplier ledger.
        To link a supplier, edit the bill first.
      </div>

      <!-- Payment amount -->
      <ion-item>
        <ion-label position="floating">Payment Amount (Rs) <span style="color:red">*</span></ion-label>
        <ion-input type="number" [(ngModel)]="payAmount" min="0.01" [max]="dueAmount" step="0.01" placeholder="Enter amount"></ion-input>
      </ion-item>

      <!-- Payment method -->
      <ion-item>
        <ion-label position="floating">Payment Method</ion-label>
        <ion-select [(ngModel)]="paymentMethod" placeholder="Select">
          <ion-select-option value="Cash">Cash</ion-select-option>
          <ion-select-option value="Cheque">Cheque</ion-select-option>
          <ion-select-option value="Online Transfer">Online Transfer</ion-select-option>
        </ion-select>
      </ion-item>

      <!-- Notes -->
      <ion-item>
        <ion-label position="floating">Notes (optional)</ion-label>
        <ion-input type="text" [(ngModel)]="notes" placeholder="e.g. cheque no, bank name"></ion-input>
      </ion-item>

      <ion-button expand="block" color="success" class="ion-margin-top" (click)="submit()">
        <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
        Submit Payment
      </ion-button>

    </ion-content>
  `
})
export class MakePaymentComponent {
  @Input() bill: any = {};

  payAmount: number = null;
  paymentMethod: string = 'Cash';
  notes: string = '';

  get billTotal(): number {
    return Number(this.bill.TotalAmount) || 0;
  }

  get alreadyPaid(): number {
    return Number(this.bill.AmountPaid) || 0;
  }

  get dueAmount(): number {
    return Math.max(0, this.billTotal - this.alreadyPaid);
  }

  constructor(
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private stockService: StockService,
    private toastService: ToastService
  ) {}

  dismiss() { this.modalCtrl.dismiss(null); }

  async submit() {
    if (!this.payAmount || this.payAmount <= 0) {
      this.toastService.create('Please enter a valid payment amount.', 'danger');
      return;
    }
    if (this.payAmount > this.dueAmount) {
      this.toastService.create('Amount cannot exceed due amount of Rs ' + this.dueAmount.toFixed(2), 'danger');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Recording payment...' });
    await loading.present();

    this.stockService.makeBillPayment(this.bill.Id, {
      Amount: this.payAmount,
      PaymentMethod: this.paymentMethod,
      Notes: this.notes
    }).subscribe({
      next: (res: any) => {
        loading.dismiss();
        if (res && (res.message || res.Message)) {
          this.toastService.create(res.message || res.Message, 'success');
          this.modalCtrl.dismiss({ paid: true });
        } else {
          this.toastService.create('Payment failed.', 'danger');
        }
      },
      error: () => { loading.dismiss(); this.toastService.create('Failed to record payment.', 'danger'); }
    });
  }
}
