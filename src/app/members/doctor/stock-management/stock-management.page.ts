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
  canAddBill = true;
  canAdjustStock = true;
  canTransferStock = true;
  canDirectSale = true;
  canViewBrandAmount = true;

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
      if (this.usertype.UserType === 'PA') {
        this.paService.getPaPermissions(Number(this.usertype.PAId)).subscribe(perm => {
          this.canAddBill        = (perm && perm.AddPurchaseBill)                          || false;
          this.canAdjustStock    = (perm && perm.AdjustStock)                              || false;
          this.canTransferStock  = (perm && perm.TransferStock)                            || false;
          this.canDirectSale     = (perm && perm.AddDirectSale)                            || false;
          this.canViewBrandAmount= (perm && (perm.UpdateSalePrice || perm.DownloadStockReport)) || false;
        });
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

  isPA(): boolean {
    return this.usertype && this.usertype.UserType === 'PA';
  }

  isSameDay(dateStr: string): boolean {
    if (!dateStr) { return false; }
    const billDate = new Date(dateStr);
    const today = new Date();
    return billDate.getFullYear() === today.getFullYear()
      && billDate.getMonth() === today.getMonth()
      && billDate.getDate() === today.getDate();
  }

  canPaDeleteBill(bill: any): boolean {
    // PA can delete only: unapproved (PA-created) + same day + no consumption checked at action time
    return this.isPA() && !bill.IsPAApprove && this.isSameDay(bill.BillDate);
  }

  async openBillMenu(bill: any) {
    const isDoctor = !this.isPA();
    const paCanDelete = this.canPaDeleteBill(bill);

    const buttons: any[] = [];

    // Payment options — doctor only
    if (isDoctor) {
      buttons.push({
        text: 'Make Payment',
        icon: 'cash-outline',
        handler: () => { this.openPaymentModal(bill); }
      });
      buttons.push({
        text: 'Payment History',
        icon: 'time-outline',
        handler: () => { this.toastService.create('Payment history coming soon', 'primary'); }
      });
    }

    // Edit — doctor only
    if (isDoctor) {
      buttons.push({
        text: 'Edit Bill',
        icon: 'create-outline',
        handler: () => { this.router.navigate(['/members/doctor/stock-management/brandlist/edit', bill.Id]); }
      });
    }

    // Delete — doctor always, PA only if same-day own unapproved bill
    if (isDoctor) {
      buttons.push({
        text: 'Delete Bill',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => { this.confirmDelete(bill); }
      });
    } else if (paCanDelete) {
      buttons.push({
        text: 'Delete Bill',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => { this.confirmDeletePA(bill); }
      });
    }

    buttons.push({ text: 'Cancel', icon: 'close', role: 'cancel' });

    const sheet = await this.actionSheetCtrl.create({
      header: bill.Supplier || 'Bill Options',
      buttons
    });
    await sheet.present();
  }

  async confirmDeletePA(bill: any) {
    const loading = await this.loadingController.create({ message: 'Checking stock...' });
    await loading.present();

    this.stockService.getBillConsumption(bill.Id).subscribe({
      next: async (res: any) => {
        loading.dismiss();
        if (res && res.HasConsumption) {
          // Doses already consumed — PA cannot delete, period
          this.toastService.create(
            `Cannot delete — ${res.ConsumedQty} dose(s) already administered. Contact the doctor to handle this bill.`,
            'danger',
            true
          );
        } else {
          // Zero consumption — simple confirm
          const alert = await this.alertCtrl.create({
            header: 'Delete Bill',
            message: `Delete <strong>${bill.BillNo}</strong>? This will reverse all ${res.PurchasedQty} unit(s). Cannot be undone.`,
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
