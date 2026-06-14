import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { StockService } from 'src/app/services/stock.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-purchase-bills',
  templateUrl: './purchase-bills.page.html',
  styleUrls: ['./purchase-bills.page.scss'],
})
export class PurchaseBillsPage {
  bills: any[] = [];
  filteredBills: any[] = [];
  suppliers: string[] = [];
  selectedSupplier: string = '';
  selectedStatus: string = '';
  statuses: string[] = ['Unpaid', 'Partial', 'Paid'];
  doctorId: number = 0;
  clinicId: number = 0;

  constructor(
    private stockService: StockService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private router: Router,
    private storage: Storage,
    private toastService: ToastService,
  ) {}

  async ionViewWillEnter() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    const clinic = await this.storage.get(environment.ON_CLINIC);
    this.clinicId = clinic ? clinic.Id : 0;
    this.loadBills();
  }

  async loadBills() {
    const loading = await this.loadingController.create({ message: 'Loading...' });
    await loading.present();
    this.stockService.getBills(this.doctorId, this.clinicId).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.bills = (res.ResponseData || []).slice().sort((a: any, b: any) => b.Id - a.Id);
          // Build unique supplier list from bills
          const seen: any = {};
          this.suppliers = [];
          this.bills.forEach((b: any) => {
            const name = b.SupplierName || '';
            if (name && !seen[name]) {
              seen[name] = true;
              this.suppliers.push(name);
            }
          });
          this.suppliers.sort();
          this.applyFilter();
        } else {
          this.toastService.create(res.Message || 'Failed to load bills', 'danger');
        }
      },
      (err: any) => {
        loading.dismiss();
        this.toastService.create('Failed to load bills', 'danger');
      }
    );
  }

  applyFilter() {
    this.filteredBills = this.bills.filter((b: any) => {
      const supplierMatch = !this.selectedSupplier ||
        (b.SupplierName || '').toLowerCase() === this.selectedSupplier.toLowerCase();
      const statusMatch = !this.selectedStatus || b.PaymentStatus === this.selectedStatus;
      return supplierMatch && statusMatch;
    });
  }

  onSupplierChange() {
    this.applyFilter();
  }

  onStatusChange() {
    this.applyFilter();
  }

  addBill() {
    this.router.navigate(['/members/doctor/stock-management/purchase-bills/add']);
  }

  editBill(bill: any) {
    this.router.navigate(['/members/doctor/stock-management/purchase-bills/edit', bill.Id]);
  }

  async recordPayment(bill: any) {
    const alert = await this.alertController.create({
      header: 'Record Payment',
      subHeader: bill.BillNo + ' — Pending: Rs ' + (bill.PendingAmount || 0).toFixed(2),
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Amount paid',
          min: 1
        },
        {
          name: 'method',
          type: 'text',
          placeholder: 'Method: Cash / Bank Transfer / Cheque'
        },
        {
          name: 'notes',
          type: 'text',
          placeholder: 'Notes (optional)'
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save Payment',
          handler: (data: any) => {
            const amount = parseFloat(data.amount);
            if (!amount || amount <= 0) {
              this.toastService.create('Enter a valid amount', 'danger');
              return false;
            }
            const today = new Date();
            const mm = (today.getMonth() + 1).toString().padStart(2, '0');
            const dd = today.getDate().toString().padStart(2, '0');
            const dateStr = today.getFullYear() + '-' + mm + '-' + dd;
            this.savePayment(bill.Id, amount, data.method || 'Cash', data.notes || null, dateStr);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async savePayment(billId: number, amount: number, method: string, notes: string, date: string) {
    const loading = await this.loadingController.create({ message: 'Saving payment...' });
    await loading.present();
    this.stockService.addPayment(billId, {
      BillId: billId,
      Amount: amount,
      PaymentMethod: method,
      Notes: notes,
      PaymentDate: date
    }).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Payment recorded', 'success');
          this.loadBills();
        } else {
          this.toastService.create(res.Message || 'Failed to save payment', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to save payment', 'danger');
      }
    );
  }

  async confirmReverse(bill: any) {
    const loading = await this.loadingController.create({ message: 'Checking...' });
    await loading.present();
    this.stockService.getBillById(bill.Id).subscribe(
      async (res: any) => {
        loading.dismiss();
        if (!res.IsSuccess) {
          this.toastService.create(res.Message || 'Failed to load bill', 'danger');
          return;
        }
        const lines = (res.ResponseData.Lines || []);
        const consumedLines: any[] = [];
        for (const line of lines) {
          const check = await new Promise<any>((resolve) => {
            this.stockService.consumedCheck(bill.Id, line.StockId).subscribe(
              (cres: any) => resolve(cres.IsSuccess ? cres.ResponseData : null),
              () => resolve(null)
            );
          });
          if (check && check.Consumed > 0) consumedLines.push(check);
        }
        if (consumedLines.length > 0) {
          await this.promptConsumedBeforeReverse(bill, consumedLines, 0);
        } else {
          await this.showReverseConfirm(bill);
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to load bill', 'danger');
      }
    );
  }

  async promptConsumedBeforeReverse(bill: any, consumedLines: any[], idx: number) {
    if (idx >= consumedLines.length) {
      await this.showReverseConfirm(bill);
      return;
    }
    const c = consumedLines[idx];
    const alert = await this.alertController.create({
      header: 'Units Already Used',
      message: c.Consumed + ' unit(s) of ' + c.BrandName + ' (Batch ' + c.BatchLot + ') from ' + bill.BillNo + ' have already been used. Create a separate fully-paid bill of Rs ' + c.ConsumedAmount.toFixed(2) + ' for these units to keep purchase records accurate? Otherwise skip and adjust stock manually later.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Skip',
          handler: () => { this.promptConsumedBeforeReverse(bill, consumedLines, idx + 1); }
        },
        {
          text: 'Create Bill',
          handler: () => { this.splitConsumedThenContinue(bill, c, consumedLines, idx); }
        }
      ]
    });
    await alert.present();
  }

  async splitConsumedThenContinue(bill: any, c: any, consumedLines: any[], idx: number) {
    const loading = await this.loadingController.create({ message: 'Creating bill...' });
    await loading.present();
    this.stockService.splitConsumed(bill.Id, c.StockId).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res.IsSuccess) {
          const data = res.ResponseData;
          this.toastService.create('Created ' + data.NewBillNo + ' (Rs ' + data.ConsumedAmount.toFixed(2) + ') for consumed units', 'success');
        } else {
          this.toastService.create(res.Message || 'Failed to create bill', 'danger');
        }
        this.promptConsumedBeforeReverse(bill, consumedLines, idx + 1);
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to create bill', 'danger');
        this.promptConsumedBeforeReverse(bill, consumedLines, idx + 1);
      }
    );
  }

  async showReverseConfirm(bill: any) {
    let message = 'This will remove all remaining stock entries for ' + bill.BillNo + '. Continue?';
    if (bill.PaymentStatus === 'Paid' || bill.PaymentStatus === 'Partial') {
      message = 'Rs ' + (bill.AmountPaid || 0).toFixed(2) + ' was recorded as paid for ' + bill.BillNo + '. Reversing will remove all remaining stock. Payment recovery must be handled separately. Continue?';
    }
    const alert = await this.alertController.create({
      header: 'Reverse Bill',
      message: message,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reverse',
          cssClass: 'danger',
          handler: () => { this.reverseBill(bill.Id); }
        }
      ]
    });
    await alert.present();
  }

  async reverseBill(id: number) {
    const loading = await this.loadingController.create({ message: 'Reversing...' });
    await loading.present();
    this.stockService.reverseBill(id).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Bill reversed', 'success');
          this.loadBills();
        } else {
          this.toastService.create(res.Message || 'Failed to reverse', 'danger');
        }
      },
      (err: any) => {
        loading.dismiss();
        this.toastService.create('Failed to reverse bill', 'danger');
      }
    );
  }

  formatDate(d: string): string {
    if (!d) return '';
    const dt = new Date(d);
    const day = dt.getDate().toString().padStart(2, '0');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return day + ' ' + months[dt.getMonth()] + ' ' + dt.getFullYear();
  }
}
