import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ClinicService } from 'src/app/services/clinic.service';
import { BrandService } from 'src/app/services/brand.service';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { StockTransferService, StockTransferHistoryDTO } from 'src/app/services/stock-transfer.service';

export interface TransferGroup {
  groupKey: string;         // used as route param
  createdAt: string;
  fromClinicId: number;
  toClinicId: number;
  fromClinicName: string;
  toClinicName: string;
  brandNames: string;       // comma-joined list
  totalValue: number;
  transferredByName: string;
  ids: number[];            // all StockTransfer IDs in this group
}

@Component({
  selector: 'app-stock-transfer-history',
  templateUrl: './stock-transfer-history.page.html',
  styleUrls: ['./stock-transfer-history.page.scss']
})
export class StockTransferHistoryPage implements OnInit {
  groups: TransferGroup[] = [];
  filteredGroups: TransferGroup[] = [];

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
    private router: Router,
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
    const isPA = this.usertype && this.usertype.UserType === 'PA';
    const obs = isPA
      ? this.paService.getPaClinics(Number(this.usertype.PAId))
      : this.clinicService.getClinics(this.doctorId);
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
    if (this.filterClinicId) { params.fromClinicId = this.filterClinicId; }
    if (this.filterBrandId)  { params.brandId = this.filterBrandId; }
    if (this.filterFromDate) { params.fromDate = this.filterFromDate; }
    if (this.filterToDate)   { params.toDate = this.filterToDate; }

    this.transferService.getHistory(params).subscribe({
      next: (res) => {
        loader.dismiss();
        if (res && res.IsSuccess) {
          this.groups = this.groupRecords(res.ResponseData || []);
          this.applySearch();
        } else {
          this.toastService.create(res && res.Message ? res.Message : 'Failed to load history', 'danger');
        }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to load history', 'danger'); }
    });
  }

  private groupRecords(records: StockTransferHistoryDTO[]): TransferGroup[] {
    const map = new Map<string, TransferGroup>();
    records.forEach(r => {
      const d = new Date(r.CreatedAt);
      // group by same minute + same clinic pair
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}-${d.getUTCMinutes()}-${r.FromClinicId}-${r.ToClinicId}`;
      if (!map.has(key)) {
        map.set(key, {
          groupKey:         key,
          createdAt:        r.CreatedAt,
          fromClinicId:     r.FromClinicId,
          toClinicId:       r.ToClinicId,
          fromClinicName:   r.FromClinicName,
          toClinicName:     r.ToClinicName,
          brandNames:       '',
          totalValue:       0,
          transferredByName: r.TransferredByName || '',
          ids:              []
        });
      }
      const g = map.get(key)!;
      g.totalValue += r.TotalValue;
      g.ids.push(r.Id);
      const existing = g.brandNames ? g.brandNames.split(', ') : [];
      if (!existing.includes(r.BrandName)) {
        existing.push(r.BrandName);
        g.brandNames = existing.join(', ');
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  applySearch() {
    const term = (this.searchBrand || '').toLowerCase().trim();
    this.filteredGroups = term
      ? this.groups.filter(g => g.brandNames.toLowerCase().includes(term))
      : this.groups.slice();
  }

  onSearchChange() { this.applySearch(); }
  applyFilters()   { this.loadHistory(); }

  clearFilters() {
    this.filterClinicId = null;
    this.filterBrandId  = null;
    this.filterFromDate = '';
    this.filterToDate   = '';
    this.searchBrand    = '';
    this.loadHistory();
  }

  getTotalValue(): number {
    return this.filteredGroups.reduce((s, g) => s + g.totalValue, 0);
  }

  openTransfer(group: TransferGroup) {
    this.router.navigate([
      '/members/doctor/stock-management/stock-transfer-history/edit',
      group.groupKey
    ]);
  }
}
