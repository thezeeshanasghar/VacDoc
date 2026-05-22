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
          this.bills = res.ResponseData || [];
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

  addBill() {
    this.router.navigate(['/members/doctor/stock-management/purchase-bills/add']);
  }

  async confirmReverse(bill: any) {
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
