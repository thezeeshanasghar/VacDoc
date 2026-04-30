import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ClinicService } from 'src/app/services/clinic.service';
import { BrandService } from 'src/app/services/brand.service';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { DirectSaleService, DirectSaleDTO } from 'src/app/services/direct-sale.service';

@Component({
  selector: 'app-direct-sale-history',
  templateUrl: './direct-sale-history.page.html',
  styleUrls: ['./direct-sale-history.page.scss']
})
export class DirectSaleHistoryPage implements OnInit {
  records: DirectSaleDTO[] = [];
  filteredRecords: DirectSaleDTO[] = [];
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
    private directSaleService: DirectSaleService
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
    const obs = isPA ? this.paService.getPaClinics(Number(this.usertype.PAId)) : this.clinicService.getClinics(Number(this.doctorId));
    obs.subscribe({ next: (res: any) => { if (res && res.IsSuccess) this.clinics = res.ResponseData || []; }, error: () => {} });
  }

  async loadBrands() {
    this.brandService.getBrands().subscribe({
      next: (res: any) => { if (res && res.IsSuccess) this.brands = (res.ResponseData || []).map((b: any) => ({ id: b.Id, name: b.Name })); },
      error: () => {}
    });
  }

  async loadHistory() {
    const loader = await this.loadingCtrl.create({ message: 'Loading history...' });
    await loader.present();
    const params: any = { doctorId: this.doctorId };
    if (this.filterClinicId) params.clinicId = this.filterClinicId;
    if (this.filterBrandId)  params.brandId  = this.filterBrandId;
    if (this.filterFromDate) params.fromDate  = this.filterFromDate;
    if (this.filterToDate)   params.toDate    = this.filterToDate;

    this.directSaleService.getHistory(params).subscribe({
      next: (res) => {
        loader.dismiss();
        if (res && res.IsSuccess) { this.records = res.ResponseData || []; this.applySearch(); }
        else { this.toastService.create(res && res.Message ? res.Message : 'Failed', 'danger'); }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to load history', 'danger'); }
    });
  }

  applySearch() {
    const t = (this.searchBrand || '').toLowerCase().trim();
    this.filteredRecords = t ? this.records.filter(r => (r.BrandName || '').toLowerCase().includes(t)) : this.records.slice();
  }

  onSearchChange() { this.applySearch(); }
  applyFilters()   { this.loadHistory(); }
  clearFilters()   { this.filterClinicId = null; this.filterBrandId = null; this.filterFromDate = ''; this.filterToDate = ''; this.searchBrand = ''; this.loadHistory(); }

  getTotalSale():   number { return this.filteredRecords.reduce((s, r) => s + (r.TotalSaleValue || 0), 0); }
  getTotalProfit(): number { return this.filteredRecords.reduce((s, r) => s + (r.Profit || 0), 0); }
  absVal(n: number): number { return Math.abs(n); }
}
