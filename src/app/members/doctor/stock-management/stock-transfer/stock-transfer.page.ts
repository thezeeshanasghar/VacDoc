import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { StockService } from 'src/app/services/stock.service';
import { BrandService } from 'src/app/services/brand.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-stock-transfer',
  templateUrl: './stock-transfer.page.html',
  styleUrls: ['./stock-transfer.page.scss'],
})
export class StockTransferPage {
  doctorId: number = 0;
  fromClinicId: number = 0;
  toClinicId: number = 0;
  clinics: any[] = [];

  // Form fields
  brandId: number = null;
  brandSearch: string = '';
  brandDropOpen: boolean = false;
  batchLot: string = '';
  expiryDate: string = '';
  availableQty: number = 0;
  qty: number = null;
  transferDate: string = '';
  reason: string = '';

  // Batch popup
  batchModalOpen: boolean = false;
  batches: any[] = [];

  // Brand autocomplete
  brands: any[] = [];
  brandDropTop: number = 0;
  brandDropLeft: number = 0;
  brandDropWidth: number = 200;

  // History
  history: any[] = [];
  historySearch: string = '';

  get toClinicOptions(): any[] {
    return this.clinics.filter(function(c: any) { return c.Id !== this.fromClinicId; }, this);
  }

  filteredBrands(search: string): any[] {
    const q = (search || '').toLowerCase();
    if (!q) return this.brands;
    return this.brands.filter(function(b: any) {
      return (b.VaccineName || '').toLowerCase().indexOf(q) >= 0 ||
             (b.BrandName || '').toLowerCase().indexOf(q) >= 0;
    });
  }

  get filteredHistory(): any[] {
    const q = (this.historySearch || '').toLowerCase();
    if (!q) return this.history;
    return this.history.filter(function(h: any) {
      return (h.BrandName || '').toLowerCase().indexOf(q) >= 0 ||
             (h.VaccineName || '').toLowerCase().indexOf(q) >= 0 ||
             (h.Reason || '').toLowerCase().indexOf(q) >= 0;
    });
  }

  constructor(
    private stockService: StockService,
    private brandService: BrandService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private storage: Storage,
    private toastService: ToastService,
  ) {}

  async ionViewWillEnter() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    const clinic = await this.storage.get(environment.ON_CLINIC);
    this.fromClinicId = clinic ? clinic.Id : 0;
    const allClinics = await this.storage.get(environment.CLINICS);
    this.clinics = allClinics || (clinic ? [clinic] : []);

    // Default toClinic to first option that isn't fromClinic
    const other = this.clinics.filter(function(c: any) { return c.Id !== clinic.Id; });
    this.toClinicId = other.length > 0 ? other[0].Id : 0;

    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    this.transferDate = today.getFullYear() + '-' + mm + '-' + dd;

    this.loadBrands();
    this.loadHistory();
  }

  onFromClinicChange() {
    // Ensure toClinic doesn't equal fromClinic
    if (this.toClinicId === this.fromClinicId) {
      const other = this.clinics.filter(function(c: any) { return c.Id !== this.fromClinicId; }, this);
      this.toClinicId = other.length > 0 ? other[0].Id : 0;
    }
    this.resetForm();
    this.loadBrands();
    this.loadHistory();
  }

  onToClinicChange() {
    this.loadHistory();
  }

  loadBrands() {
    this.brandService.getBrandAmount(this.doctorId, this.fromClinicId).subscribe(
      function(res: any) {
        if (res.IsSuccess) {
          this.brands = res.ResponseData || [];
        }
      }.bind(this),
      function() {}
    );
  }

  loadHistory() {
    this.stockService.getTransfers(this.doctorId, this.fromClinicId).subscribe(
      function(res: any) {
        if (res.IsSuccess) {
          this.history = res.ResponseData || [];
        }
      }.bind(this),
      function() {}
    );
  }

  // Brand autocomplete
  openBrandDrop(event: any) {
    const rect = event.target.getBoundingClientRect();
    this.brandDropTop = rect.bottom + window.scrollY;
    this.brandDropLeft = rect.left + window.scrollX;
    this.brandDropWidth = Math.max(rect.width, 220);
    this.brandDropOpen = true;
  }

  selectBrand(b: any) {
    this.brandId = b.BrandId;
    this.brandSearch = b.BrandName;
    this.brandDropOpen = false;
    this.batchLot = '';
    this.expiryDate = '';
    this.availableQty = 0;
    this.loadBatchesForBrand();
  }

  clearBrand() {
    this.brandId = null;
    this.brandSearch = '';
    this.brandDropOpen = false;
    this.batchLot = '';
    this.expiryDate = '';
    this.availableQty = 0;
    this.batches = [];
  }

  loadBatchesForBrand() {
    if (!this.brandId) return;
    this.stockService.getBatchLotsByBrand(this.brandId, this.fromClinicId).subscribe(
      function(res: any) {
        if (res.IsSuccess) {
          this.batches = res.ResponseData || [];
          if (this.batches.length > 0) {
            const first = this.batches[0];
            this.batchLot = first.BatchLot || '';
            this.expiryDate = first.Expiry ? this.formatDateInput(first.Expiry) : '';
            this.availableQty = first.Quantity || 0;
          } else {
            this.batchLot = '';
            this.expiryDate = '';
            this.availableQty = 0;
          }
        }
      }.bind(this),
      function() {}
    );
  }

  // Batch popup
  openBatchModal() {
    if (!this.brandId) return;
    this.batchModalOpen = true;
  }

  closeBatchModal() {
    this.batchModalOpen = false;
  }

  selectBatch(batch: any) {
    this.batchLot = batch.BatchLot || '';
    this.expiryDate = batch.Expiry ? this.formatDateInput(batch.Expiry) : '';
    this.availableQty = batch.Quantity || 0;
    this.batchModalOpen = false;
  }

  formatDateInput(d: string): string {
    if (!d) return '';
    const dt = new Date(d);
    const mm = (dt.getMonth() + 1).toString().padStart(2, '0');
    const dd = dt.getDate().toString().padStart(2, '0');
    return dt.getFullYear() + '-' + mm + '-' + dd;
  }

  async save() {
    if (!this.brandId) {
      this.toastService.create('Select a brand', 'danger');
      return;
    }
    if (!this.batchLot || this.batchLot.trim() === '') {
      this.toastService.create('Batch is required', 'danger');
      return;
    }
    if (!this.qty || this.qty <= 0) {
      this.toastService.create('Quantity must be greater than 0', 'danger');
      return;
    }
    if (this.qty > this.availableQty) {
      this.toastService.create('Cannot transfer more than available (' + this.availableQty + ')', 'danger');
      return;
    }
    if (!this.transferDate) {
      this.toastService.create('Date is required', 'danger');
      return;
    }
    if (!this.toClinicId || this.toClinicId === this.fromClinicId) {
      this.toastService.create('Select a different destination clinic', 'danger');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Saving...' });
    await loading.present();

    const payload = {
      DoctorId: this.doctorId,
      FromClinicId: this.fromClinicId,
      ToClinicId: this.toClinicId,
      BrandId: this.brandId,
      Quantity: this.qty,
      BatchLot: this.batchLot,
      ExpiryDate: this.expiryDate ? this.expiryDate : null,
      Reason: this.reason || '',
      TransferDate: this.transferDate
    };

    this.stockService.createTransfer(payload).subscribe(
      function(res: any) {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Transfer recorded', 'success');
          this.resetForm();
          this.loadHistory();
        } else {
          this.toastService.create(res.Message || 'Failed to save', 'danger');
        }
      }.bind(this),
      function() {
        loading.dismiss();
        this.toastService.create('Failed to save transfer', 'danger');
      }.bind(this)
    );
  }

  async confirmDelete(id: number) {
    const alert = await this.alertController.create({
      header: 'Reverse Transfer',
      message: 'This will undo the stock transfer. Are you sure?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reverse',
          role: 'destructive',
          handler: function() { this.deleteTransfer(id); }.bind(this)
        }
      ]
    });
    await alert.present();
  }

  deleteTransfer(id: number) {
    this.stockService.deleteTransfer(id).subscribe(
      function(res: any) {
        if (res.IsSuccess) {
          this.toastService.create('Transfer reversed', 'success');
          this.loadHistory();
        } else {
          this.toastService.create(res.Message || 'Failed to reverse', 'danger');
        }
      }.bind(this),
      function() {
        this.toastService.create('Failed to reverse transfer', 'danger');
      }.bind(this)
    );
  }

  resetForm() {
    this.brandId = null;
    this.brandSearch = '';
    this.brandDropOpen = false;
    this.batchLot = '';
    this.expiryDate = '';
    this.availableQty = 0;
    this.qty = null;
    this.reason = '';
    this.batches = [];
    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    this.transferDate = today.getFullYear() + '-' + mm + '-' + dd;
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return dt.getDate() + ' ' + months[dt.getMonth()] + ' ' + dt.getFullYear();
  }

  isExpired(expiryStr: string): boolean {
    if (!expiryStr) return false;
    return new Date(expiryStr) < new Date();
  }

  isExpiringSoon(expiryStr: string): boolean {
    if (!expiryStr) return false;
    const expiry = new Date(expiryStr);
    const today = new Date();
    const diffDays = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 90 && diffDays >= 0;
  }
}
