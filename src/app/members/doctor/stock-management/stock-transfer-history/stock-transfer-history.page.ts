import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ClinicService } from 'src/app/services/clinic.service';
import { BrandService } from 'src/app/services/brand.service';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { StockTransferService, StockTransferHistoryDTO } from 'src/app/services/stock-transfer.service';

@Component({
  selector: 'app-stock-transfer-history',
  templateUrl: './stock-transfer-history.page.html',
  styleUrls: ['./stock-transfer-history.page.scss']
})
export class StockTransferHistoryPage implements OnInit {
  records: StockTransferHistoryDTO[] = [];
  filteredRecords: StockTransferHistoryDTO[] = [];

  clinics: any[] = [];
  brands: any[] = [];

  filterClinicId: number | null = null;
  filterBrandId: number | null = null;
  filterFromDate = '';
  filterToDate = '';
  searchBrand = '';

  private doctorId: number;
  private usertype: any;

  constructor(
    private loadingCtrl: LoadingController,
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
    await this.loadHistory();
  }

  async loadClinics() {
    const obs = this.usertype?.UserType === 'PA'
      ? this.paService.getPaClinics(Number(this.usertype.PAId))
      : this.clinicService.getClinics(this.doctorId);
    obs.subscribe({
      next: (res: any) => { if (res?.IsSuccess) this.clinics = res.ResponseData || []; },
      error: () => {}
    });
  }

  async loadBrands() {
    this.brandService.getBrands().subscribe({
      next: (res: any) => {
        if (res?.IsSuccess) {
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
    if (this.filterClinicId) params.fromClinicId = this.filterClinicId;
    if (this.filterBrandId) params.brandId = this.filterBrandId;
    if (this.filterFromDate) params.fromDate = this.filterFromDate;
    if (this.filterToDate) params.toDate = this.filterToDate;

    this.transferService.getHistory(params).subscribe({
      next: (res) => {
        loader.dismiss();
        if (res?.IsSuccess) {
          this.records = res.ResponseData || [];
          this.applySearch();
        } else {
          this.toastService.create(res?.Message || 'Failed to load history', 'danger');
        }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to load history', 'danger'); }
    });
  }

  applySearch() {
    const term = (this.searchBrand || '').toLowerCase().trim();
    this.filteredRecords = term
      ? this.records.filter(r => r.BrandName.toLowerCase().includes(term))
      : [...this.records];
  }

  onSearchChange() {
    this.applySearch();
  }

  applyFilters() {
    this.loadHistory();
  }

  clearFilters() {
    this.filterClinicId = null;
    this.filterBrandId = null;
    this.filterFromDate = '';
    this.filterToDate = '';
    this.searchBrand = '';
    this.loadHistory();
  }

  getTotalValue(): number {
    return this.filteredRecords.reduce((s, r) => s + r.TotalValue, 0);
  }

  getClinicName(id: number): string {
    return this.clinics.find(c => c.Id === id)?.Name ?? id?.toString() ?? '';
  }
}
