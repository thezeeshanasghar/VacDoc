import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { LoadingController, ModalController } from '@ionic/angular';
import { StockTransferConfirmComponent } from './stock-transfer-confirm.component';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ClinicService } from 'src/app/services/clinic.service';
import { BrandService } from 'src/app/services/brand.service';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import {
  StockTransferService,
  AvailableBatchDTO,
  StockTransferItemDTO,
  StockTransferHistoryDTO
} from 'src/app/services/stock-transfer.service';

interface TransferRow {
  brandId: any;
  brandName: string;
  brandSearchTerm: string;
  filteredBrands: any[];
  batches: AvailableBatchDTO[];
  batchLot: string;
  expiry: string;
  availableQty: number;
  costPrice: number;
  transferQty: any;
}

@Component({
  selector: 'app-stock-transfer',
  templateUrl: './stock-transfer.page.html',
  styleUrls: ['./stock-transfer.page.scss']
})
export class StockTransferPage implements OnInit {
  clinics: any[] = [];
  brands: any[] = [];

  fromClinicId: any = null;
  toClinicId: any = null;

  rows: TransferRow[] = [];

  completedTransfer: StockTransferHistoryDTO[] | null = null;
  completedFromClinic = '';
  completedToClinic = '';

  private doctorId: any;
  private usertype: any;

  constructor(
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private storage: Storage,
    private clinicService: ClinicService,
    private brandService: BrandService,
    private paService: PaService,
    private toastService: ToastService,
    private transferService: StockTransferService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.doctorId = Number(await this.storage.get(environment.DOCTOR_Id));
    this.usertype = await this.storage.get(environment.USER);
    await this.loadClinics();
    await this.loadBrands();
    this.addRow();
  }

  // ── Clinics ───────────────────────────────────────────────────────────────
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
        if (res && res.IsSuccess) {
          this.clinics = res.ResponseData || [];
        } else {
          this.toastService.create(res && res.Message ? res.Message : 'Failed to load clinics', 'danger');
        }
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

  get toClinics() {
    return this.clinics.filter(c => c.Id !== this.fromClinicId);
  }

  onFromClinicChange() {
    this.toClinicId = null;
    this.rows.forEach(r => {
      r.batches = [];
      r.batchLot = '';
      r.expiry = '';
      r.availableQty = 0;
    });
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
      costPrice: 0,
      transferQty: null
    });
  }

  removeRow(i: number) { this.rows.splice(i, 1); }

  // ── Brand ─────────────────────────────────────────────────────────────────
  showAllBrands(row: TransferRow) {
    row.brandSearchTerm = '';
    row.filteredBrands = this.brands.slice();
  }

  filterBrands(row: TransferRow, term: string) {
    const t = (term || '').toLowerCase().trim();
    row.filteredBrands = t
      ? this.brands.filter(b => b.name.toLowerCase().includes(t))
      : this.brands.slice();
  }

  async onBrandSelected(row: TransferRow, brandId: number) {
    if (!this.fromClinicId) {
      this.toastService.create('Please select From Clinic first.', 'danger');
      return;
    }
    const brand = this.brands.find(b => b.id === brandId);
    if (brand) { row.brandName = brand.name; }
    row.batches = [];
    row.batchLot = '';
    row.expiry = '';
    row.availableQty = 0;
    row.costPrice = 0;

    const loader = await this.loadingCtrl.create({ message: 'Loading batches...' });
    await loader.present();

    this.transferService.getAvailableBatches(brandId, this.fromClinicId).subscribe({
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
            this.toastService.create('No stock found for this brand in the selected clinic.', 'danger');
          }
          this.cdr.detectChanges();
        }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to load batches', 'danger'); }
    });
  }

  onBatchSelected(row: TransferRow, batchLot: string) {
    const batch = row.batches.find(b => (b.BatchLot || '') === batchLot);
    if (batch) {
      row.expiry = batch.Expiry || '';
      row.availableQty = batch.AvailableQuantity;
      row.costPrice = batch.CostPrice;
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
  get totalTransferValue(): number {
    return this.rows.reduce((s, r) => s + ((r.transferQty || 0) * (r.costPrice || 0)), 0);
  }

  get completedTotal(): number {
    if (!this.completedTransfer) { return 0; }
    return this.completedTransfer.reduce((s, t) => s + t.TotalValue, 0);
  }

  get completedTotalQty(): number {
    if (!this.completedTransfer) { return 0; }
    return this.completedTransfer.reduce((s, t) => s + t.Quantity, 0);
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  validate(): string | null {
    if (!this.fromClinicId) { return 'Please select From Clinic.'; }
    if (!this.toClinicId) { return 'Please select To Clinic.'; }
    if (this.fromClinicId === this.toClinicId) { return 'From and To clinics must be different.'; }
    if (!this.rows.length) { return 'Add at least one item.'; }
    for (let i = 0; i < this.rows.length; i++) {
      const r = this.rows[i];
      if (!r.brandId) { return `Row ${i + 1}: Please select a brand.`; }
      if (!r.transferQty || r.transferQty <= 0) { return `Row ${i + 1}: Quantity must be > 0.`; }
      if (r.transferQty > r.availableQty) {
        return `Row ${i + 1}: Quantity exceeds available stock (${r.availableQty}).`;
      }
    }
    return null;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async openConfirmModal() {
    const err = this.validate();
    if (err) { this.toastService.create(err, 'danger'); return; }

    const modal = await this.modalCtrl.create({
      component: StockTransferConfirmComponent,
      componentProps: {
        fromClinicName: this.getClinicName(this.fromClinicId),
        toClinicName: this.getClinicName(this.toClinicId),
        transferRows: this.rows,
        totalTransferValue: this.totalTransferValue
      }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data && data.confirmed) {
      await this.confirmTransfer();
    }
  }

  getClinicName(id: number): string {
    const clinic = this.clinics.find(c => c.Id === id);
    return clinic ? clinic.Name : '';
  }

  async confirmTransfer() {
    const loader = await this.loadingCtrl.create({ message: 'Transferring stock...' });
    await loader.present();

    const items: StockTransferItemDTO[] = this.rows.map(r => ({
      BrandId: r.brandId,
      BrandName: r.brandName,
      BatchNumber: r.batchLot || null,
      ExpiryDate: r.expiry || null,
      Quantity: Number(r.transferQty),
      CostPrice: r.costPrice
    }));

    this.transferService.createTransfer({
      FromClinicId: this.fromClinicId,
      ToClinicId: this.toClinicId,
      DoctorId: this.doctorId,
      Items: items
    }).subscribe({
      next: (res) => {
        loader.dismiss();
        if (res && res.IsSuccess) {
          this.completedFromClinic = this.getClinicName(this.fromClinicId);
          this.completedToClinic = this.getClinicName(this.toClinicId);
          this.completedTransfer = res.ResponseData || [];
          this.toastService.create('Stock transferred successfully!', 'success');
        } else {
          this.toastService.create(res && res.Message ? res.Message : 'Transfer failed', 'danger', true);
        }
      },
      error: () => { loader.dismiss(); this.toastService.create('Transfer failed. Please try again.', 'danger'); }
    });
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  async downloadPdf() {
    if (!this.completedTransfer || !this.completedTransfer.length) { return; }
    const ids = this.completedTransfer.map(t => t.Id).join(',');
    const loader = await this.loadingCtrl.create({ message: 'Generating PDF...' });
    await loader.present();
    this.transferService.downloadTransferPdf(ids).subscribe({
      next: (blob) => {
        loader.dismiss();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `StockTransfer_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastService.create('PDF downloaded successfully', 'success');
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to download PDF', 'danger'); }
    });
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  startNewTransfer() {
    this.completedTransfer = null;
    this.completedFromClinic = '';
    this.completedToClinic = '';
    this.fromClinicId = null;
    this.toClinicId = null;
    this.rows = [];
    this.addRow();
  }
}
