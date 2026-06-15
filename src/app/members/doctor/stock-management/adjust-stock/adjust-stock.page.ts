import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { StockService } from 'src/app/services/stock.service';
import { BrandService } from 'src/app/services/brand.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

interface AdjustmentRow {
  adjustType: string;
  brandId: number;
  brandSearch: string;
  batchLot: string;
  expiryDate: string;
  availableQty: number;
  qty: number;
  reason: string;
  price: number;
  batches: any[];
}

@Component({
  selector: 'app-adjust-stock',
  templateUrl: './adjust-stock.page.html',
  styleUrls: ['./adjust-stock.page.scss'],
})
export class AdjustStockPage {
  doctorId: number = 0;
  clinicId: number = 0;
  clinics: any[] = [];

  // Shared date across all rows
  adjustDate: string = '';

  // Form rows — one per brand
  rows: AdjustmentRow[] = [];

  // Brand picker modal — operates on the row at activeRowIndex
  activeRowIndex: number = -1;
  brands: any[] = [];
  brandModalOpen: boolean = false;
  brandModalSearch: string = '';

  // Batch picker modal — operates on the row at activeRowIndex
  batchModalOpen: boolean = false;

  get filteredBrandModal(): any[] {
    const q = (this.brandModalSearch || '').toLowerCase();
    if (!q) return this.brands;
    return this.brands.filter((b: any) =>
      (b.VaccineName || '').toLowerCase().indexOf(q) >= 0 ||
      (b.BrandName || '').toLowerCase().indexOf(q) >= 0
    );
  }

  // History
  history: any[] = [];
  historySearch: string = '';

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

    this.setTodayDate();
    this.rows = [this.newRow()];

    this.loadBrands();
    this.loadHistory();
  }

  setTodayDate() {
    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    this.adjustDate = today.getFullYear() + '-' + mm + '-' + dd;
  }

  newRow(): AdjustmentRow {
    return {
      adjustType: 'Increase',
      brandId: null,
      brandSearch: '',
      batchLot: '',
      expiryDate: '',
      availableQty: 0,
      qty: null,
      reason: '',
      price: null,
      batches: [],
    };
  }

  addRow() {
    this.rows.push(this.newRow());
  }

  removeRow(index: number) {
    this.rows.splice(index, 1);
    if (this.rows.length === 0) {
      this.rows.push(this.newRow());
    }
  }

  onClinicChange() {
    this.rows = [this.newRow()];
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

  // Brand modal
  openBrandModal(index: number) {
    this.activeRowIndex = index;
    this.brandModalSearch = '';
    this.brandModalOpen = true;
  }

  closeBrandModal() {
    this.brandModalOpen = false;
    this.activeRowIndex = -1;
  }

  selectBrandModal(b: any) {
    const row = this.rows[this.activeRowIndex];
    if (!row) return;
    row.brandId = b.BrandId;
    row.brandSearch = b.BrandName;
    row.batchLot = '';
    row.expiryDate = '';
    row.availableQty = 0;
    this.brandModalOpen = false;
    this.loadBatchesForRow(this.activeRowIndex);
    this.activeRowIndex = -1;
  }

  clearBrand(row: AdjustmentRow) {
    row.brandId = null;
    row.brandSearch = '';
    row.batchLot = '';
    row.expiryDate = '';
    row.availableQty = 0;
    row.batches = [];
  }

  loadBatchesForRow(index: number) {
    const row = this.rows[index];
    if (!row || !row.brandId) return;
    this.stockService.getBatchLotsByBrand(row.brandId, this.clinicId).subscribe(
      (res: any) => {
        if (res.IsSuccess) {
          row.batches = res.ResponseData || [];
          if (row.batches.length > 0) {
            // FEFO — first result is oldest expiry (API returns ordered by expiry asc)
            const first = row.batches[0];
            row.batchLot = first.BatchLot || '';
            row.expiryDate = first.Expiry ? this.formatDateInput(first.Expiry) : '';
            row.availableQty = first.Quantity || 0;
            if (row.adjustType === 'Increase') {
              row.price = first.StockAmount || null;
            }
          } else {
            row.batchLot = '';
            row.expiryDate = '';
            row.availableQty = 0;
          }
        }
      },
      () => {}
    );
  }

  // Batch popup
  openBatchModal(index: number) {
    const row = this.rows[index];
    if (!row || !row.brandId) return;
    this.activeRowIndex = index;
    this.batchModalOpen = true;
  }

  closeBatchModal() {
    this.batchModalOpen = false;
    this.activeRowIndex = -1;
  }

  selectBatch(batch: any) {
    const row = this.rows[this.activeRowIndex];
    if (!row) return;
    row.batchLot = batch.BatchLot || '';
    row.expiryDate = batch.Expiry ? this.formatDateInput(batch.Expiry) : '';
    row.availableQty = batch.Quantity || 0;
    if (row.adjustType === 'Increase') {
      row.price = batch.StockAmount || null;
    }
    this.batchModalOpen = false;
    this.activeRowIndex = -1;
  }

  formatDateInput(d: string): string {
    if (!d) return '';
    const dt = new Date(d);
    const mm = (dt.getMonth() + 1).toString().padStart(2, '0');
    const dd = dt.getDate().toString().padStart(2, '0');
    return dt.getFullYear() + '-' + mm + '-' + dd;
  }

  setType(row: AdjustmentRow, t: string) {
    row.adjustType = t;
    if (t === 'Loss') {
      row.price = null;
    }
  }

  get activeBatches(): any[] {
    const row = this.rows[this.activeRowIndex];
    return row ? row.batches : [];
  }

  get activeBatchLot(): string {
    const row = this.rows[this.activeRowIndex];
    return row ? row.batchLot : '';
  }

  async save() {
    if (this.rows.length === 0) {
      this.toastService.create('Add at least one brand', 'danger');
      return;
    }
    if (!this.adjustDate) {
      this.toastService.create('Date is required', 'danger');
      return;
    }

    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      const rowLabel = 'Row ' + (i + 1);
      if (!row.brandId) {
        this.toastService.create(rowLabel + ': Select a brand', 'danger');
        return;
      }
      if (!row.batchLot || row.batchLot.trim() === '') {
        this.toastService.create(rowLabel + ': Batch is required', 'danger');
        return;
      }
      if (!row.qty || row.qty <= 0) {
        this.toastService.create(rowLabel + ': Quantity must be greater than 0', 'danger');
        return;
      }
      if (!row.reason || row.reason.trim() === '') {
        this.toastService.create(rowLabel + ': Reason is required', 'danger');
        return;
      }
      if (row.adjustType === 'Increase' && (!row.price || row.price <= 0)) {
        this.toastService.create(rowLabel + ': Price per unit is required for Increase', 'danger');
        return;
      }
    }

    const loading = await this.loadingController.create({ message: 'Saving...' });
    await loading.present();

    let successCount = 0;
    let failedRows: string[] = [];

    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      const payload = {
        DoctorId: this.doctorId,
        ClinicId: this.clinicId,
        BrandId: row.brandId,
        Quantity: row.qty,
        Type: row.adjustType,
        Reason: row.reason,
        Price: row.adjustType === 'Increase' ? (row.price || 0) : 0,
        BatchLot: row.batchLot,
        ExpiryDate: row.expiryDate ? row.expiryDate : null,
        Date: this.adjustDate
      };

      try {
        const res: any = await this.stockService.createAdjustment(payload).toPromise();
        if (res.IsSuccess) {
          successCount++;
        } else {
          failedRows.push(row.brandSearch || ('Row ' + (i + 1)));
        }
      } catch {
        failedRows.push(row.brandSearch || ('Row ' + (i + 1)));
      }
    }

    loading.dismiss();

    if (failedRows.length === 0) {
      this.toastService.create(successCount + ' adjustment(s) saved', 'success');
      this.resetForm();
    } else if (successCount === 0) {
      this.toastService.create('Failed to save adjustments: ' + failedRows.join(', '), 'danger');
    } else {
      this.toastService.create(successCount + ' saved, failed: ' + failedRows.join(', '), 'danger');
    }

    this.loadHistory();
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
    this.rows = [this.newRow()];
    this.setTodayDate();
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
