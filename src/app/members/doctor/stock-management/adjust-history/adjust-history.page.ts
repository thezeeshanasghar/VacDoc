import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ClinicService } from 'src/app/services/clinic.service';
import { BrandService } from 'src/app/services/brand.service';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { StockService } from 'src/app/services/stock.service';

@Component({
  selector: 'app-adjust-history',
  templateUrl: './adjust-history.page.html',
  styleUrls: ['./adjust-history.page.scss']
})
export class AdjustHistoryPage implements OnInit {
  records: any[] = [];
  filteredRecords: any[] = [];

  clinics: any[] = [];
  brands: any[] = [];

  filterClinicId: any = null;
  filterBrandId: any = null;
  filterFromDate = '';
  filterToDate = '';
  searchBrand = '';

  private doctorId: any;
  private usertype: any;

  constructor(
    private loadingCtrl: LoadingController,
    private storage: Storage,
    private clinicService: ClinicService,
    private brandService: BrandService,
    private paService: PaService,
    private toastService: ToastService,
    private stockService: StockService
  ) {}

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    this.usertype = await this.storage.get(environment.USER);
    await this.loadClinics();
    await this.loadBrands();
    await this.loadHistory();
  }

  async loadClinics() {
    const isPA = this.usertype && this.usertype.UserType === 'PA';
    const obs = isPA
      ? this.paService.getPaClinics(Number(this.usertype.PAId))
      : this.clinicService.getClinics(Number(this.doctorId));
    obs.subscribe({
      next: (res: any) => { if (res && res.IsSuccess) { this.clinics = res.ResponseData || []; } },
      error: () => {}
    });
  }

  async loadBrands() {
    this.brandService.getBrands().subscribe({
      next: (res: any) => {
        if (res && res.IsSuccess) {
          this.brands = (res.ResponseData || []).map((b: any) => ({ id: b.Id, name: b.Name }));
        }
      },
      error: () => {}
    });
  }

  async loadHistory() {
    const loader = await this.loadingCtrl.create({ message: 'Loading history...' });
    await loader.present();

    const params: any = { doctorId: this.doctorId };
    if (this.filterClinicId) { params.clinicId = this.filterClinicId; }
    if (this.filterBrandId) { params.brandId = this.filterBrandId; }
    if (this.filterFromDate) { params.fromDate = this.filterFromDate; }
    if (this.filterToDate) { params.toDate = this.filterToDate; }

    this.stockService.getAdjustHistory(params).subscribe({
      next: (res: any) => {
        loader.dismiss();
        if (res && res.IsSuccess) {
          this.records = res.ResponseData || [];
          this.applySearch();
        } else {
          const msg = res && res.Message ? res.Message : 'Failed to load history';
          this.toastService.create(msg, 'danger');
        }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to load history', 'danger'); }
    });
  }

  applySearch() {
    const term = (this.searchBrand || '').toLowerCase().trim();
    this.filteredRecords = term
      ? this.records.filter(r => (r.BrandName || '').toLowerCase().includes(term))
      : this.records.slice();
  }

  onSearchChange() { this.applySearch(); }
  applyFilters() { this.loadHistory(); }

  clearFilters() {
    this.filterClinicId = null;
    this.filterBrandId = null;
    this.filterFromDate = '';
    this.filterToDate = '';
    this.searchBrand = '';
    this.loadHistory();
  }

  getTotalValue(): number {
    return this.filteredRecords.reduce((s, r) => s + Math.abs(r.Adjustment) * (r.Price || 0), 0);
  }

  getAdjType(adj: number): string { return adj > 0 ? 'Increase' : 'Decrease'; }
  getAdjColor(adj: number): string { return adj > 0 ? 'success' : 'danger'; }
  absVal(n: number): number { return Math.abs(n); }
}
