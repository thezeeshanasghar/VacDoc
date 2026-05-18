import { Component, OnInit } from "@angular/core";
import { LoadingController, ActionSheetController, AlertController, ModalController } from "@ionic/angular";
import { MakePaymentComponent } from './make-payment.component';
import { DeleteBillComponent } from './delete-bill.component';
import { Router } from "@angular/router";
import { Storage } from "@ionic/storage";
import { BrandService } from "src/app/services/brand.service";
import { ToastService } from "src/app/shared/toast.service";
import { environment } from "src/environments/environment";
import { StockService, BillDetails, Response } from "src/app/services/stock.service";
import { ClinicService } from "src/app/services/clinic.service";
import { PaService } from "src/app/services/pa.service";

@Component({
  selector: "app-stock-management",
  templateUrl: "./stock-management.page.html",
  styleUrls: ["./stock-management.page.scss"]
})
export class StockManagementPage implements OnInit {
  data: any[] = [];
  clinics: any[] = [];
  clinicId: any;
  selectedClinicId: any;
  doctorId: any;
  usertype: any;

  constructor(
    private loadingController: LoadingController,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private router: Router,
    private storage: Storage,
    private brandService: BrandService,
    private toastService: ToastService,
    public clinicService: ClinicService,
    private stockService: StockService,
    private paService: PaService
  ) {}

  async ngOnInit() {
    try {
      this.doctorId = await this.storage.get(environment.DOCTOR_Id);
      this.clinicId = await this.storage.get(environment.CLINIC_Id);
      this.usertype = await this.storage.get(environment.USER);
      if (!this.doctorId || !this.usertype) {
        this.toastService.create("Failed to load user data", "danger");
        return;
      }
      await this.loadClinics();
    } catch (error) {
      this.toastService.create("An unexpected error occurred", "danger");
    }
  }

  async loadClinics() {
    const loading = await this.loadingController.create({ message: "Loading clinics..." });
    await loading.present();
    try {
      const obs = this.usertype.UserType === "PA"
        ? this.paService.getPaClinics(Number(this.usertype.PAId))
        : this.clinicService.getClinics(Number(this.doctorId));

      obs.subscribe({
        next: (response: any) => {
          loading.dismiss();
          if (response.IsSuccess) {
            this.clinics = response.ResponseData;
            this.selectedClinicId = this.clinicId || (this.clinics.length > 0 ? this.clinics[0].Id : null);
            if (this.selectedClinicId) { this.getBill(this.selectedClinicId); }
          } else {
            this.toastService.create(response.Message, "danger");
          }
        },
        error: () => { loading.dismiss(); this.toastService.create("Failed to load clinics", "danger"); }
      });
    } catch (error) {
      loading.dismiss();
    }
  }

  onClinicChange(event: any) {
    this.getBill(event.detail.value);
  }

  async getBill(clinicId: any) {
    const loading = await this.loadingController.create({ message: "Loading bills..." });
    await loading.present();
    this.stockService.getBills(Number(clinicId)).subscribe({
      next: (res: any) => {
        loading.dismiss();
        if (res.IsSuccess) { this.data = res.ResponseData || []; }
        else { this.toastService.create(res.Message || "Failed to fetch bills", "danger"); }
      },
      error: () => { loading.dismiss(); this.toastService.create("Failed to fetch bills", "danger"); }
    });
  }

  // ── Summary helpers ──────────────────────────────────────────────────────
  getTotalPurchase(): number {
    return (this.data || []).reduce((s, b) => s + (b.TotalAmount || 0), 0);
  }
  getUnpaidCount(): number {
    return (this.data || []).filter(b => !b.IsPaid).length;
  }

  // ── Bill actions ─────────────────────────────────────────────────────────
  printBill(bill: any) {
    this.toastService.create("Print coming soon", "primary");
  }

  shareBill(bill: any) {
    this.toastService.create("Share coming soon", "primary");
  }

  async openBillMenu(bill: any) {
    const sheet = await this.actionSheetCtrl.create({
      header: bill.Supplier || 'Bill Options',
      buttons: [
        {
          text: 'Make Payment',
          icon: 'cash-outline',
          handler: () => { this.openPaymentModal(bill); }
        },
        {
          text: 'Payment History',
          icon: 'time-outline',
          handler: () => { this.toastService.create("Payment history coming soon", "primary"); }
        },
        {
          text: 'Edit Bill',
          icon: 'create-outline',
          handler: () => { this.router.navigate(['/members/doctor/stock-management/brandlist/edit', bill.Id]); }
        },
        {
          text: 'Delete Bill',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => { this.confirmDelete(bill); }
        },
        { text: 'Cancel', icon: 'close', role: 'cancel' }
      ]
    });
    await sheet.present();
  }

  async openPaymentModal(bill: any) {
    const modal = await this.modalCtrl.create({
      component: MakePaymentComponent,
      componentProps: { bill }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data && data.paid) {
      this.getBill(this.selectedClinicId);
    }
  }

  async confirmDelete(bill: any) {
    const loading = await this.loadingController.create({ message: 'Checking stock...' });
    await loading.present();

    this.stockService.getBillConsumption(bill.Id).subscribe({
      next: async (res: any) => {
        loading.dismiss();
        if (res && res.HasConsumption) {
          // Some doses consumed — open the full modal
          const modal = await this.modalCtrl.create({
            component: DeleteBillComponent,
            componentProps: { bill, consumption: res }
          });
          await modal.present();
          const { data } = await modal.onDidDismiss();
          if (data && data.deleted) {
            this.data = this.data.filter(b => b.Id !== bill.Id);
            this.toastService.create('Bill deleted successfully.', 'success');
          } else if (data && data.reduced) {
            this.getBill(this.selectedClinicId);
            this.toastService.create('Remaining stock deleted. Bill adjusted.', 'success');
          }
        } else {
          // Zero consumption — simple confirm
          const alert = await this.alertCtrl.create({
            header: 'Delete Bill',
            message: `Delete <strong>${bill.BillNo}</strong> and reverse all ${res.PurchasedQty} unit(s)? This cannot be undone.`,
            buttons: [
              { text: 'Cancel', role: 'cancel' },
              {
                text: 'Delete',
                cssClass: 'danger-btn',
                handler: () => { this.deleteBill(bill); }
              }
            ]
          });
          await alert.present();
        }
      },
      error: () => { loading.dismiss(); this.toastService.create('Failed to check bill consumption.', 'danger'); }
    });
  }

  async deleteBill(bill: any) {
    const loading = await this.loadingController.create({ message: 'Deleting bill...' });
    await loading.present();
    this.stockService.deleteBillWithReversal(bill.Id).subscribe({
      next: (res: any) => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Bill deleted and stock reversed.', 'success');
          this.data = this.data.filter(b => b.Id !== bill.Id);
        } else {
          this.toastService.create(res && res.Message ? res.Message : 'Failed to delete bill.', 'danger');
        }
      },
      error: () => { loading.dismiss(); this.toastService.create('Failed to delete bill.', 'danger'); }
    });
  }

  async approvePurchase(billId: number) {
    const loading = await this.loadingController.create({ message: "Approving..." });
    await loading.present();
    this.stockService.patchIsApproved(billId).subscribe({
      next: (response: any) => {
        loading.dismiss();
        this.toastService.create(response.message, "success");
        this.getBill(this.selectedClinicId);
      },
      error: (error: any) => {
        loading.dismiss();
        this.toastService.create(error.error.message || "Failed to approve", "danger");
      }
    });
  }
}
