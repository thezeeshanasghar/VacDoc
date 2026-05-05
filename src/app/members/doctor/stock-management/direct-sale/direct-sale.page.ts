import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ClinicService } from 'src/app/services/clinic.service';
import { BrandService } from 'src/app/services/brand.service';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { StockTransferService, AvailableBatchDTO } from 'src/app/services/stock-transfer.service';
import { DirectSaleService, DirectSaleDTO } from 'src/app/services/direct-sale.service';

interface SaleRow {
  brandId: any;
  brandName: string;
  brandSearchTerm: string;
  filteredBrands: any[];
  batches: AvailableBatchDTO[];
  batchLot: string;
  expiry: string;
  availableQty: number;
  salePrice: any;
  purchasePrice: number;
  qty: any;
}

@Component({
  selector: 'app-direct-sale',
  templateUrl: './direct-sale.page.html',
  styleUrls: ['./direct-sale.page.scss']
})
export class DirectSalePage implements OnInit {
  clinics: any[] = [];
  brands: any[] = [];

  selectedClinic: any = null;
  rows: SaleRow[] = [];

  clientName = '';
  paymentMode = 'Cash';
  notes = '';
  saleDate = new Date().toISOString().split('T')[0];

  completedSales: DirectSaleDTO[] | null = null;
  completedClinicName = '';

  private doctorId: any;
  private usertype: any;

  constructor(
    private loadingCtrl: LoadingController,
    private storage: Storage,
    private clinicService: ClinicService,
    private brandService: BrandService,
    private paService: PaService,
    private toastService: ToastService,
    private transferService: StockTransferService,
    private directSaleService: DirectSaleService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.doctorId = Number(await this.storage.get(environment.DOCTOR_Id));
    this.usertype = await this.storage.get(environment.USER);
    await this.loadClinics();
    await this.loadBrands();
    this.addRow();
  }

  async loadClinics() {
    const loader = await this.loadingCtrl.create({ message: 'Loading clinics...' });
    await loader.present();
    const isPA = this.usertype && this.usertype.UserType === 'PA';
    const obs = isPA
      ? this.paService.getPaClinics(Number(this.usertype.PAId))
      : this.clinicService.getClinics(this.doctorId);
    obs.subscribe({
      next: (res: any) => {
        loader.dismiss();
        if (res && res.IsSuccess) { this.clinics = res.ResponseData || []; }
        else { this.toastService.create(res && res.Message ? res.Message : 'Failed to load clinics', 'danger'); }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to load clinics', 'danger'); }
    });
  }

  async loadBrands() {
    this.brandService.getBrands().subscribe({
      next: (res: any) => {
        if (res && res.IsSuccess) {
          this.brands = (res.ResponseData || []).map((b: any) => ({ id: b.Id, name: b.Name }));
          this.rows.forEach(r => { r.filteredBrands = this.brands.slice(); });
        }
      },
      error: () => {}
    });
  }

  onClinicChange() {
    this.rows.forEach(r => this.clearRow(r));
  }

  // ── Row management ────────────────────────────────────────────────────────
  addRow() {
    this.rows.push({
      brandId: null,
      brandName: '',
      brandSearchTerm: '',
      filteredBrands: this.brands.slice(),
      batches: [],
      batchLot: '',
      expiry: '',
      availableQty: 0,
      salePrice: null,
      purchasePrice: 0,
      qty: null
    });
  }

  removeRow(i: number) { this.rows.splice(i, 1); }

  private clearRow(row: SaleRow) {
    row.brandId = null;
    row.brandName = '';
    row.batches = [];
    row.batchLot = '';
    row.expiry = '';
    row.availableQty = 0;
    row.salePrice = null;
    row.purchasePrice = 0;
    row.qty = null;
    row.filteredBrands = this.brands.slice();
  }

  // ── Brand ─────────────────────────────────────────────────────────────────
  showAllBrands(row: SaleRow) {
    row.brandSearchTerm = '';
    row.filteredBrands = this.brands.slice();
  }

  filterBrands(row: SaleRow, term: string) {
    const t = (term || '').toLowerCase().trim();
    row.filteredBrands = t
      ? this.brands.filter(b => b.name.toLowerCase().includes(t))
      : this.brands.slice();
  }

  async onBrandSelected(row: SaleRow, brandId: number) {
    if (!this.selectedClinic) {
      this.toastService.create('Please select a clinic first.', 'danger');
      return;
    }
    const brand = this.brands.find(b => b.id === brandId);
    if (brand) { row.brandName = brand.name; }
    row.batches = [];
    row.batchLot = '';
    row.expiry = '';
    row.availableQty = 0;
    row.salePrice = null;
    row.purchasePrice = 0;

    // Auto-load sale price from BrandAmount
    this.brandService.getBrandAmount(this.selectedClinic).subscribe({
      next: (res: any) => {
        if (res && res.IsSuccess) {
          const ba = (res.ResponseData || []).find((b: any) => b.BrandId === brandId);
          if (ba) { row.salePrice = ba.Amount || 0; row.purchasePrice = ba.PurchasedAmt || 0; }
        }
      },
      error: () => {}
    });

    // Load available batches
    const loader = await this.loadingCtrl.create({ message: 'Loading batches...' });
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
          } else {
            this.toastService.create('No stock found for this brand in selected clinic.', 'danger');
          }
          this.cdr.detectChanges();
        }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to load batches', 'danger'); }
    });
  }

  onBatchSelected(row: SaleRow, batchLot: string) {
    const batch = row.batches.find(b => (b.BatchLot || '') === batchLot);
    if (batch) {
      row.expiry = batch.Expiry || '';
      row.availableQty = batch.AvailableQuantity;
      row.purchasePrice = batch.CostPrice || row.purchasePrice;
    } else {
      row.expiry = '';
      row.availableQty = 0;
    }
  }

  formatExpiry(expiry: string | null): string {
    if (!expiry) { return '—'; }
    const d = new Date(expiry);
    if (isNaN(d.getTime())) { return expiry; }
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  get grandTotal(): number {
    return this.rows.reduce((s, r) => s + ((r.qty || 0) * (r.salePrice || 0)), 0);
  }

  get completedGrandTotal(): number {
    if (!this.completedSales) { return 0; }
    return this.completedSales.reduce((s, d) => s + Number(d.TotalSaleValue || 0), 0);
  }

  get completedTotalQty(): number {
    if (!this.completedSales) { return 0; }
    return this.completedSales.reduce((s, d) => s + d.Quantity, 0);
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  validate(): string | null {
    if (!this.selectedClinic) { return 'Please select a clinic.'; }
    if (!this.rows.length) { return 'Add at least one item.'; }
    for (let i = 0; i < this.rows.length; i++) {
      const r = this.rows[i];
      if (!r.brandId) { return `Row ${i + 1}: Please select a brand.`; }
      if (!r.qty || r.qty <= 0) { return `Row ${i + 1}: Quantity must be > 0.`; }
      if (r.qty > r.availableQty) { return `Row ${i + 1}: Quantity exceeds available stock (${r.availableQty}).`; }
      if (!r.salePrice || r.salePrice <= 0) { return `Row ${i + 1}: Sale price must be > 0.`; }
    }
    return null;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async onSubmit() {
    const err = this.validate();
    if (err) { this.toastService.create(err, 'danger'); return; }

    const loader = await this.loadingCtrl.create({ message: 'Recording sale...' });
    await loader.present();

    const items = this.rows.map(r => ({
      BrandId: r.brandId,
      BrandName: r.brandName,
      BatchLot: r.batchLot || undefined,
      ExpiryDate: r.expiry || undefined,
      Quantity: Number(r.qty),
      SalePricePerUnit: Number(r.salePrice)
    }));

    this.directSaleService.createBulkSale({
      ClinicId: this.selectedClinic,
      DoctorId: this.doctorId,
      ClientName: this.clientName || undefined,
      PaymentMode: this.paymentMode,
      Notes: this.notes || undefined,
      SaleDate: this.saleDate,
      Items: items
    }).subscribe({
      next: (res) => {
        loader.dismiss();
        if (res && res.IsSuccess) {
          this.completedClinicName = this.getClinicName(this.selectedClinic);
          this.completedSales = res.ResponseData || [];
          this.toastService.create('Sale recorded successfully!', 'success');
        } else {
          this.toastService.create(res && res.Message ? res.Message : 'Failed to record sale', 'danger', true);
        }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to record sale', 'danger'); }
    });
  }

  getClinicName(id: number): string {
    const c = this.clinics.find(x => x.Id === id);
    return c ? c.Name : '';
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  async downloadPdf() {
    if (!this.completedSales || !this.completedSales.length) { return; }
    const ids = this.completedSales.map(s => s.Id).join(',');
    const loader = await this.loadingCtrl.create({ message: 'Generating invoice...' });
    await loader.present();
    this.directSaleService.downloadPdf(ids).subscribe({
      next: (blob) => {
        loader.dismiss();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `DirectSale_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastService.create('Invoice downloaded', 'success');
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to download invoice', 'danger'); }
    });
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  startNewSale() {
    this.completedSales = null;
    this.completedClinicName = '';
    this.selectedClinic = null;
    this.clientName = '';
    this.paymentMode = 'Cash';
    this.notes = '';
    this.saleDate = new Date().toISOString().split('T')[0];
    this.rows = [];
    this.addRow();
  }
}
