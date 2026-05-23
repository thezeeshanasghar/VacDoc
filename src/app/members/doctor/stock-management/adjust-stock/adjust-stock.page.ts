import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { StockService } from 'src/app/services/stock.service';
import { BrandService } from 'src/app/services/brand.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-adjust-stock',
  templateUrl: './adjust-stock.page.html',
  styleUrls: ['./adjust-stock.page.scss'],
})
export class AdjustStockPage {
  doctorId: number = 0;
  clinicId: number = 0;
  clinics: any[] = [];

  // Form fields
  adjustType: string = 'Increase';
  brandId: number = null;
  brandSearch: string = '';
  brandDropOpen: boolean = false;
  batchLot: string = '';
  expiryDate: string = '';
  availableQty: number = 0;
  qty: number = null;
  adjustDate: string = '';
  reason: string = '';
  price: number = null;

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

  filteredBrands(search: string): any[] {
    const q = (search || '').toLowerCase();
    if (!q) return this.brands;
    return this.brands.filter((b: any) =>
      (b.VaccineName || '').toLowerCase().indexOf(q) >= 0 ||
      (b.BrandName || '').toLowerCase().indexOf(q) >= 0
    );
  }

  get filteredHistory(): any[] {
    const q = (this.historySearch || '').toLowerCase();
    if (!q) return this.history;
    return this.history.filter((h: any) =>
      (h.BrandName || '').toLowerCase().indexOf(q) >= 0 ||
      (h.VaccineName || '').toLowerCase().indexOf(q) >= 0 ||
      (h.Reason || '').toLowerCase().indexOf(q) >= 0
    );
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
    this.clinicId = clinic ? clinic.Id : 0;
    const allClinics = await this.storage.get(environment.CLINICS);
    this.clinics = allClinics || (clinic ? [clinic] : []);

    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    this.adjustDate = today.getFullYear() + '-' + mm + '-' + dd;

    this.loadBrands();
    this.loadHistory();
  }

  onClinicChange() {
    this.resetForm();
    this.loadBrands();
    this.loadHistory();
  }

  loadBrands() {
    this.brandService.getBrandAmount(this.doctorId, this.clinicId).subscribe(
      (res: any) => {
        if (res.IsSuccess) {
          this.brands = res.ResponseData || [];
        }
      },
      () => {}
    );
  }

  loadHistory() {
    this.stockService.getAdjustments(this.doctorId, this.clinicId).subscribe(
      (res: any) => {
        if (res.IsSuccess) {
          this.history = res.ResponseData || [];
        }
      },
      () => {}
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
    this.stockService.getBatchLotsByBrand(this.brandId, this.clinicId).subscribe(
      (res: any) => {
        if (res.IsSuccess) {
          this.batches = res.ResponseData || [];
          if (this.batches.length > 0) {
            // FEFO — first result is oldest expiry (API returns ordered by expiry asc)
            const first = this.batches[0];
            this.batchLot = first.BatchLot || '';
            this.expiryDate = first.Expiry ? this.formatDateInput(first.Expiry) : '';
            this.availableQty = first.Quantity || 0;
            if (this.adjustType === 'Increase') {
              this.price = first.StockAmount || null;
            }
          } else {
            this.batchLot = '';
            this.expiryDate = '';
            this.availableQty = 0;
          }
        }
      },
      () => {}
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
    if (this.adjustType === 'Increase') {
      this.price = batch.StockAmount || null;
    }
    this.batchModalOpen = false;
  }

  formatDateInput(d: string): string {
    if (!d) return '';
    const dt = new Date(d);
    const mm = (dt.getMonth() + 1).toString().padStart(2, '0');
    const dd = dt.getDate().toString().padStart(2, '0');
    return dt.getFullYear() + '-' + mm + '-' + dd;
  }

  setType(t: string) {
    this.adjustType = t;
    if (t === 'Loss') {
      this.price = null;
    }
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
    if (!this.adjustDate) {
      this.toastService.create('Date is required', 'danger');
      return;
    }
    if (!this.reason || this.reason.trim() === '') {
      this.toastService.create('Reason is required', 'danger');
      return;
    }
    if (this.adjustType === 'Increase' && (!this.price || this.price <= 0)) {
      this.toastService.create('Price per unit is required for Increase', 'danger');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Saving...' });
    await loading.present();

    const payload = {
      DoctorId: this.doctorId,
      ClinicId: this.clinicId,
      BrandId: this.brandId,
      Quantity: this.qty,
      Type: this.adjustType,
      Reason: this.reason,
      Price: this.adjustType === 'Increase' ? (this.price || 0) : 0,
      BatchLot: this.batchLot,
      ExpiryDate: this.expiryDate ? this.expiryDate : null,
      Date: this.adjustDate
    };

    this.stockService.createAdjustment(payload).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Adjustment saved', 'success');
          this.resetForm();
          this.loadHistory();
        } else {
          this.toastService.create(res.Message || 'Failed to save', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to save adjustment', 'danger');
      }
    );
  }

  async confirmDelete(id: number) {
    const alert = await this.alertController.create({
      header: 'Delete Adjustment',
      message: 'This will reverse the stock change. Are you sure?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => { this.deleteAdjustment(id); }
        }
      ]
    });
    await alert.present();
  }

  deleteAdjustment(id: number) {
    this.stockService.deleteAdjustment(id).subscribe(
      (res: any) => {
        if (res.IsSuccess) {
          this.toastService.create('Adjustment deleted', 'success');
          this.loadHistory();
        } else {
          this.toastService.create(res.Message || 'Failed to delete', 'danger');
        }
      },
      () => {
        this.toastService.create('Failed to delete adjustment', 'danger');
      }
    );
  }

  resetForm() {
    this.adjustType = 'Increase';
    this.brandId = null;
    this.brandSearch = '';
    this.brandDropOpen = false;
    this.batchLot = '';
    this.expiryDate = '';
    this.availableQty = 0;
    this.qty = null;
    this.reason = '';
    this.price = null;
    this.batches = [];
    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    this.adjustDate = today.getFullYear() + '-' + mm + '-' + dd;
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
