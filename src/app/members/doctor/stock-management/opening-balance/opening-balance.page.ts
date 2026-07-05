import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { StockService } from 'src/app/services/stock.service';
import { BrandService } from 'src/app/services/brand.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

interface OpeningRow {
  brandId: number;
  brandSearch: string;
  batchLot: string;
  expiryDate: string;
  qty: number;
  unitCost: number;
}

@Component({
  selector: 'app-opening-balance',
  templateUrl: './opening-balance.page.html',
  styleUrls: ['./opening-balance.page.scss'],
})
export class OpeningBalancePage {
  doctorId: number = 0;
  clinicId: number = 0;
  clinics: any[] = [];

  rows: OpeningRow[] = [];

  // Brand picker modal — operates on the row at activeRowIndex (same UX as Adjust Stock)
  activeRowIndex: number = -1;
  brands: any[] = [];
  brandModalOpen: boolean = false;
  brandModalSearch: string = '';

  get filteredBrandModal(): any[] {
    const q = (this.brandModalSearch || '').toLowerCase();
    if (!q) return this.brands;
    return this.brands.filter((b: any) =>
      (b.VaccineName || '').toLowerCase().indexOf(q) >= 0 ||
      (b.BrandName || '').toLowerCase().indexOf(q) >= 0
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
    this.rows = [this.newRow()];
    this.loadBrands();
  }

  newRow(): OpeningRow {
    return { brandId: null, brandSearch: '', batchLot: '', expiryDate: '', qty: null, unitCost: null };
  }

  addRow() { this.rows.push(this.newRow()); }

  removeRow(index: number) {
    this.rows.splice(index, 1);
    if (this.rows.length === 0) this.rows.push(this.newRow());
  }

  onClinicChange() {
    this.rows = [this.newRow()];
    this.loadBrands();
  }

  loadBrands() {
    this.brandService.getBrandAmount(this.doctorId, this.clinicId).subscribe(
      (res: any) => { if (res.IsSuccess) this.brands = res.ResponseData || []; },
      () => {}
    );
  }

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
    this.brandModalOpen = false;
    this.activeRowIndex = -1;
  }

  clearBrand(row: OpeningRow) {
    row.brandId = null;
    row.brandSearch = '';
  }

  async save() {
    const lines = [];
    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      const label = 'Row ' + (i + 1);
      if (!row.brandId) { this.toastService.create(label + ': Select a brand', 'danger'); return; }
      if (!row.qty || row.qty <= 0) { this.toastService.create(label + ': Quantity must be greater than 0', 'danger'); return; }
      lines.push({
        BrandId: row.brandId,
        Quantity: row.qty,
        UnitCost: row.unitCost || 0,
        BatchLot: row.batchLot ? row.batchLot.trim() : null,
        Expiry: row.expiryDate ? row.expiryDate : null
      });
    }
    if (lines.length === 0) { this.toastService.create('Add at least one item', 'danger'); return; }

    const confirm = await this.alertController.create({
      header: 'Record opening stock?',
      message: `This adds ${lines.length} item(s) as your starting on-hand at the reset date. ` +
               `Running this twice will double the stock — only record it once.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Record', handler: () => this.submit(lines) }
      ]
    });
    await confirm.present();
  }

  private async submit(lines: any[]) {
    const loading = await this.loadingController.create({ message: 'Recording opening stock...' });
    await loading.present();
    const dto = { DoctorId: this.doctorId, ClinicId: this.clinicId, Lines: lines };
    this.stockService.postOpeningBalance(dto).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create(res.Message || 'Opening stock recorded.', 'success');
          this.rows = [this.newRow()];
        } else {
          this.toastService.create((res && res.Message) || 'Failed to record opening stock', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to record opening stock', 'danger');
      }
    );
  }
}
