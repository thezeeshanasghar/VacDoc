import { Component, OnInit } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ClinicService } from 'src/app/services/clinic.service';
import { BrandService } from 'src/app/services/brand.service';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import {
  StockTransferService,
  AvailableBatchDTO,
  StockTransferItemDTO
} from 'src/app/services/stock-transfer.service';

interface TransferRow {
  brandId: number;
  brandName: string;
  batchLot: string | null;
  expiry: string | null;
  availableQty: number;
  costPrice: number;
  transferQty: number;
}

@Component({
  selector: 'app-stock-transfer',
  templateUrl: './stock-transfer.page.html',
  styleUrls: ['./stock-transfer.page.scss']
})
export class StockTransferPage implements OnInit {
  clinics: any[] = [];
  brands: any[] = [];
  filteredBrands: any[] = [];
  brandSearchTerm = '';

  fromClinicId: number | null = null;
  toClinicId: number | null = null;

  selectedBrandId: number | null = null;
  availableBatches: AvailableBatchDTO[] = [];
  selectedBatchLots: string[] = [];

  transferRows: TransferRow[] = [];

  showConfirmModal = false;
  loading = false;

  private doctorId: number;
  private usertype: any;

  constructor(
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private storage: Storage,
    private clinicService: ClinicService,
    private brandService: BrandService,
    private paService: PaService,
    private toastService: ToastService,
    private transferService: StockTransferService
  ) {}

  async ngOnInit() {
    this.doctorId = Number(await this.storage.get(environment.DOCTOR_Id));
    this.usertype = await this.storage.get(environment.USER);
    await this.loadClinics();
    await this.loadBrands();
  }

  async loadClinics() {
    const loader = await this.loadingCtrl.create({ message: 'Loading clinics...' });
    await loader.present();
    const obs = this.usertype?.UserType === 'PA'
      ? this.paService.getPaClinics(Number(this.usertype.PAId))
      : this.clinicService.getClinics(this.doctorId);

    obs.subscribe({
      next: (res: any) => {
        loader.dismiss();
        if (res?.IsSuccess) {
          this.clinics = res.ResponseData || [];
        } else {
          this.toastService.create(res?.Message || 'Failed to load clinics', 'danger');
        }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to load clinics', 'danger'); }
    });
  }

  async loadBrands() {
    this.brandService.getBrands().subscribe({
      next: (res: any) => {
        if (res?.IsSuccess) {
          this.brands = (res.ResponseData || []).map((b: any) => ({ id: b.Id, name: b.Name }));
          this.filteredBrands = [...this.brands];
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
    this.resetBrandSelection();
  }

  filterBrands(term: string) {
    const t = (term || '').toLowerCase().trim();
    this.filteredBrands = t
      ? this.brands.filter(b => b.name.toLowerCase().includes(t))
      : [...this.brands];
  }

  showAllBrands() {
    this.brandSearchTerm = '';
    this.filteredBrands = [...this.brands];
  }

  async onBrandSelected(brandId: number) {
    if (!this.fromClinicId) {
      this.toastService.create('Please select From Clinic first.', 'danger');
      return;
    }
    this.selectedBatchLots = [];
    this.availableBatches = [];

    const loader = await this.loadingCtrl.create({ message: 'Loading batches...' });
    await loader.present();

    this.transferService.getAvailableBatches(brandId, this.fromClinicId).subscribe({
      next: (res) => {
        loader.dismiss();
        if (res?.IsSuccess) {
          this.availableBatches = res.ResponseData || [];
          if (!this.availableBatches.length) {
            this.toastService.create('No stock found for this brand in selected clinic.', 'danger');
          }
        } else {
          this.toastService.create(res?.Message || 'Failed to load batches', 'danger');
        }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to load batches', 'danger'); }
    });
  }

  onBatchSelectionChange(selectedLots: string[]) {
    // Remove rows for deselected batches
    this.transferRows = this.transferRows.filter(r =>
      r.brandId !== this.selectedBrandId ||
      selectedLots.includes(r.batchLot ?? '')
    );

    // Add new rows for newly selected batches
    for (const lot of selectedLots) {
      const alreadyAdded = this.transferRows.some(
        r => r.brandId === this.selectedBrandId && r.batchLot === lot
      );
      if (!alreadyAdded) {
        const batch = this.availableBatches.find(b => (b.BatchLot ?? '') === lot);
        if (batch) {
          const brand = this.brands.find(b => b.id === this.selectedBrandId);
          this.transferRows.push({
            brandId: this.selectedBrandId,
            brandName: brand?.name ?? '',
            batchLot: batch.BatchLot,
            expiry: batch.Expiry,
            availableQty: batch.AvailableQuantity,
            costPrice: batch.CostPrice,
            transferQty: 0
          });
        }
      }
    }
  }

  addBrandBatches() {
    if (!this.selectedBrandId) {
      this.toastService.create('Please select a brand first.', 'danger');
      return;
    }
    if (!this.selectedBatchLots.length) {
      this.toastService.create('Please select at least one batch.', 'danger');
      return;
    }
    this.resetBrandSelection();
  }

  private resetBrandSelection() {
    this.selectedBrandId = null;
    this.selectedBatchLots = [];
    this.availableBatches = [];
    this.brandSearchTerm = '';
    this.filteredBrands = [...this.brands];
  }

  removeRow(index: number) {
    this.transferRows.splice(index, 1);
  }

  get totalTransferValue(): number {
    return this.transferRows.reduce((s, r) => s + (r.transferQty * r.costPrice), 0);
  }

  validate(): string | null {
    if (!this.fromClinicId) return 'Please select From Clinic.';
    if (!this.toClinicId) return 'Please select To Clinic.';
    if (this.fromClinicId === this.toClinicId) return 'From and To clinics must be different.';
    if (!this.transferRows.length) return 'Please add at least one item to transfer.';
    for (const row of this.transferRows) {
      if (!row.transferQty || row.transferQty <= 0) return `Transfer quantity must be > 0 for ${row.brandName} (${row.batchLot || 'N/A'}).`;
      if (row.transferQty > row.availableQty) return `Transfer quantity exceeds available (${row.availableQty}) for ${row.brandName} (${row.batchLot || 'N/A'}).`;
    }
    return null;
  }

  openConfirmModal() {
    const err = this.validate();
    if (err) { this.toastService.create(err, 'danger'); return; }
    this.showConfirmModal = true;
  }

  cancelConfirm() {
    this.showConfirmModal = false;
  }

  getClinicName(id: number): string {
    return this.clinics.find(c => c.Id === id)?.Name ?? '';
  }

  async confirmTransfer() {
    this.showConfirmModal = false;
    const loader = await this.loadingCtrl.create({ message: 'Transferring stock...' });
    await loader.present();

    const items: StockTransferItemDTO[] = this.transferRows.map(r => ({
      BrandId: r.brandId,
      BrandName: r.brandName,
      BatchNumber: r.batchLot,
      ExpiryDate: r.expiry,
      Quantity: r.transferQty,
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
        if (res?.IsSuccess) {
          this.toastService.create('Stock transferred successfully!', 'success');
          this.resetAll();
        } else {
          this.toastService.create(res?.Message || 'Transfer failed', 'danger', true);
        }
      },
      error: () => { loader.dismiss(); this.toastService.create('Transfer failed. Please try again.', 'danger'); }
    });
  }

  private resetAll() {
    this.fromClinicId = null;
    this.toClinicId = null;
    this.transferRows = [];
    this.resetBrandSelection();
  }
}
