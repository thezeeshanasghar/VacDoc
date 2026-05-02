import { Component, OnInit } from '@angular/core';
import { ToastService } from 'src/app/shared/toast.service';
import { BrandService } from 'src/app/services/brand.service';
import { StockService } from 'src/app/services/stock.service';
import { StockTransferService, AvailableBatchDTO } from 'src/app/services/stock-transfer.service';
import { LoadingController } from '@ionic/angular';
import { ClinicService } from 'src/app/services/clinic.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { PaService } from 'src/app/services/pa.service';

interface AdjustRow {
  brandId: any;
  brandName: string;
  brandSearchTerm: string;
  filteredBrands: any[];
  batches: AvailableBatchDTO[];
  batchLot: string;
  expiry: string;
  availableQty: number;
  costPrice: number;
  adjustQty: any;
  price: any;
  reason: string;
}

@Component({
  selector: 'app-adjust',
  templateUrl: './adjust.page.html',
  styleUrls: ['./adjust.page.scss']
})
export class AdjustPage implements OnInit {
  adjustmentType: string | null = null;

  selectedClinic: any = null;
  clinics: any[] = [];
  brands: any[] = [];

  rows: AdjustRow[] = [];

  doctorId: any;
  usertype: any;
  clinicId: any;

  constructor(
    private brandService: BrandService,
    private stockService: StockService,
    private transferService: StockTransferService,
    private toastService: ToastService,
    private loadingController: LoadingController,
    private clinicService: ClinicService,
    private storage: Storage,
    private paService: PaService
  ) {}

  async ngOnInit() {
    this.usertype = await this.storage.get(environment.USER);
    this.clinicId = await this.storage.get(environment.CLINIC_Id);
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    await this.loadBrands();
    await this.loadClinics();
    this.addRow();
  }

  // ── Clinics ──────────────────────────────────────────────────────────────
  async loadClinics() {
    const loading = await this.loadingController.create({ message: 'Loading clinics...' });
    await loading.present();
    try {
      const isPA = this.usertype && this.usertype.UserType === 'PA';
      const obs = isPA
        ? this.paService.getPaClinics(Number(this.usertype.PAId))
        : this.clinicService.getClinics(Number(this.doctorId));

      obs.subscribe({
        next: (response: any) => {
          loading.dismiss();
          if (response && response.IsSuccess) {
            this.clinics = response.ResponseData || [];
            this.selectedClinic = this.clinicId || (this.clinics.length > 0 ? this.clinics[0].Id : null);
          } else {
            this.toastService.create(response && response.Message ? response.Message : 'Failed to load clinics', 'danger');
          }
        },
        error: () => { loading.dismiss(); this.toastService.create('Failed to load clinics', 'danger'); }
      });
    } catch (e) { loading.dismiss(); }
  }

  onClinicChange() {
    this.rows.forEach(r => { r.batches = []; r.batchLot = ''; r.expiry = ''; r.availableQty = 0; });
  }

  // ── Brands ───────────────────────────────────────────────────────────────
  async loadBrands() {
    const loading = await this.loadingController.create({ message: 'Loading brands...' });
    await loading.present();
    this.clinicId = this.clinicId || await this.storage.get(environment.CLINIC_Id);

    this.brandService.getBrands().subscribe({
      next: (res: any) => {
        if (!res || !res.IsSuccess) { loading.dismiss(); return; }
        const allBrands = (res.ResponseData || []).map((b: any) => ({
          id: b.Id, name: b.Name, price: 0, displayName: b.Name
        }));

        if (!this.clinicId) {
          this.brands = allBrands;
          loading.dismiss();
          return;
        }

        this.brandService.getBrandAmount(this.clinicId).subscribe({
          next: (amtRes: any) => {
            const map = new Map<number, number>();
            if (amtRes && amtRes.IsSuccess) {
              (amtRes.ResponseData || []).forEach((b: any) => map.set(b.BrandId, b.PurchasedAmt || 0));
            }
            this.brands = allBrands.map((b: any) => ({ ...b, price: map.has(b.id) ? map.get(b.id) : 0 }));
            loading.dismiss();
            this.rows.forEach(r => { r.filteredBrands = this.brands.slice(); });
          },
          error: () => { this.brands = allBrands; loading.dismiss(); }
        });
      },
      error: () => loading.dismiss()
    });
  }

  // ── Row management ────────────────────────────────────────────────────────
  addRow() {
    this.rows.push({
      brandId: null, brandName: '', brandSearchTerm: '',
      filteredBrands: this.brands.slice(),
      batches: [], batchLot: '', expiry: '',
      availableQty: 0, costPrice: 0,
      adjustQty: null, price: null, reason: ''
    });
  }

  removeRow(index: number) { this.rows.splice(index, 1); }

  // ── Brand selection ───────────────────────────────────────────────────────
  showAllBrands(row: AdjustRow) {
    row.brandSearchTerm = '';
    row.filteredBrands = this.brands.slice();
  }

  filterBrands(row: AdjustRow, term: string) {
    const t = (term || '').toLowerCase().trim();
    row.filteredBrands = t
      ? this.brands.filter(b => b.displayName.toLowerCase().includes(t))
      : this.brands.slice();
  }

  async onBrandSelected(row: AdjustRow, brandId: number) {
    const brand = this.brands.find(b => b.id === brandId);
    if (brand) {
      row.brandName = brand.name;
      row.price = brand.price || null;
    }
    row.batches = [];
    row.batchLot = '';
    row.expiry = '';
    row.availableQty = 0;
    row.costPrice = 0;

    if (!this.selectedClinic) return;

    const loader = await this.loadingController.create({ message: 'Loading batches...' });
    await loader.present();
    this.transferService.getAvailableBatches(brandId, this.selectedClinic).subscribe({
      next: (res) => {
        loader.dismiss();
        if (res && res.IsSuccess) {
          row.batches = (res.ResponseData || []).sort((a: AvailableBatchDTO, b: AvailableBatchDTO) => {
            const da = a.Expiry ? new Date(a.Expiry).getTime() : Infinity;
            const db = b.Expiry ? new Date(b.Expiry).getTime() : Infinity;
            return da - db;
          });
          if (row.batches.length > 0) {
            row.batchLot = row.batches[0].BatchLot || '';
            this.onBatchSelected(row, row.batchLot);
          }
        }
      },
      error: () => loader.dismiss()
    });
  }

  onBatchSelected(row: AdjustRow, batchLot: string) {
    const batch = row.batches.find(b => (b.BatchLot || '') === batchLot);
    if (batch) {
      row.expiry = batch.Expiry || '';
      row.availableQty = batch.AvailableQuantity;
      row.costPrice = batch.CostPrice;
      if (!row.price) { row.price = batch.CostPrice; }
    }
  }

  // ── Adjustment type ───────────────────────────────────────────────────────
  get isStockLoss(): boolean { return this.adjustmentType === 'stockloss'; }

  onTypeChange() {
    if (this.adjustmentType === 'stockloss') {
      this.rows.forEach(r => { r.price = 0; });
    }
  }

  // ── Total ─────────────────────────────────────────────────────────────────
  get totalValue(): number {
    return this.rows.reduce((s, r) => s + ((r.adjustQty || 0) * (r.price || 0)), 0);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  private validate(): any {
    if (!this.selectedClinic) { return 'Please select a clinic.'; }
    if (!this.adjustmentType) { return 'Please select Increase or Stock Loss.'; }
    if (!this.rows.length) { return 'Add at least one item.'; }
    for (let i = 0; i < this.rows.length; i++) {
      const r = this.rows[i];
      if (!r.brandId) { return 'Row ' + (i + 1) + ': Please select a brand.'; }
      if (!r.adjustQty || r.adjustQty <= 0) { return 'Row ' + (i + 1) + ': Quantity must be > 0.'; }
      if (this.adjustmentType === 'increase' && (!r.price || r.price <= 0)) {
        return 'Row ' + (i + 1) + ': Price must be > 0.';
      }
      if (!r.reason || r.reason.trim() === '') { return 'Row ' + (i + 1) + ': Reason is required.'; }
      if (this.isStockLoss && r.availableQty > 0 && r.adjustQty > r.availableQty) {
        return 'Row ' + (i + 1) + ': Quantity exceeds available stock (' + r.availableQty + ').';
      }
    }
    return null;
  }

  async onSubmit() {
    const err = this.validate();
    if (err) { this.toastService.create(err, 'danger'); return; }

    const loading = await this.loadingController.create({ message: 'Adjusting stock...' });
    await loading.present();

    const sign = this.isStockLoss ? -1 : 1;
    const payload = this.rows.map(r => ({
      DoctorId: Number(this.doctorId),
      BrandId: r.brandId,
      ClinicId: this.selectedClinic,
      Adjustment: sign * Number(r.adjustQty),
      Price: this.isStockLoss ? 0 : Number(r.price),
      Reason: r.reason,
      Date: new Date(),
      BatchLot: r.batchLot || null,
      ExpiryDate: r.expiry ? new Date(r.expiry) : null,
      BrandName: r.brandName,
      VaccineName: '',
      ClinicName: '',
      DoctorName: ''
    }));

    this.stockService.adjustStockBulk(payload).subscribe({
      next: (response: any) => {
        loading.dismiss();
        if (response && response.IsSuccess) {
          this.toastService.create(response.Message || 'Stock adjusted successfully', 'success');
          this.resetForm();
        } else {
          this.toastService.create(response && response.Message ? response.Message : 'Adjustment failed', 'danger', true);
        }
      },
      error: () => { loading.dismiss(); this.toastService.create('Failed to adjust stock', 'danger'); }
    });
  }

  private resetForm() {
    this.adjustmentType = null;
    this.rows = [];
    this.addRow();
  }
}
