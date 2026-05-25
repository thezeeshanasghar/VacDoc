import { Component } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ExpenseService } from 'src/app/services/expense.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-fixed-assets',
  templateUrl: './fixed-assets.page.html',
  styleUrls: ['./fixed-assets.page.scss'],
})
export class FixedAssetsPage {
  doctorId: number = 0;
  clinics: any[] = [];

  assets: any[] = [];
  filtered: any[] = [];
  categoryOptions: string[] = [];

  selectedClinicId: number = null;
  selectedCategory: string = '';

  loading: boolean = false;
  viewingImage: string = null;

  resourceUrl: string = environment.RESOURCE_URL;

  constructor(
    private expenseService: ExpenseService,
    private loadingController: LoadingController,
    private storage: Storage,
    private toastService: ToastService,
  ) {}

  async ionViewWillEnter() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    const allClinics = await this.storage.get(environment.CLINICS);
    const onClinic   = await this.storage.get(environment.ON_CLINIC);
    this.clinics = allClinics || (onClinic ? [onClinic] : []);
    this.loadAssets();
  }

  async loadAssets() {
    this.loading = true;
    const loading = await this.loadingController.create({ message: 'Loading...' });
    await loading.present();

    this.expenseService.getAll(this.doctorId).subscribe(
      (res: any) => {
        loading.dismiss();
        this.loading = false;
        if (res.IsSuccess) {
          // Only Capital expenses belong in the Fixed Asset Register
          this.assets = (res.ResponseData || []).filter((e: any) => e.ExpenseType === 'Capital');

          // Build unique category list from the data
          const seen: any = {};
          this.categoryOptions = [];
          this.assets.forEach((a: any) => {
            const cat = a.Category || '';
            if (cat && !seen[cat]) { seen[cat] = true; this.categoryOptions.push(cat); }
          });
          this.categoryOptions.sort();

          this.applyFilters();
        } else {
          this.toastService.create(res.Message || 'Failed to load assets', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.loading = false;
        this.toastService.create('Failed to load assets', 'danger');
      }
    );
  }

  applyFilters() {
    this.filtered = this.assets.filter(a => {
      const clinicMatch    = this.selectedClinicId === null || a.ClinicId === this.selectedClinicId || a.IsShared;
      const categoryMatch  = !this.selectedCategory || a.Category === this.selectedCategory;
      return clinicMatch && categoryMatch;
    });
  }

  getClinicName(clinicId: number): string {
    if (!clinicId) return 'All Clinics';
    const c = this.clinics.find((x: any) => x.Id === clinicId);
    return c ? c.Name : 'Unknown';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Months between purchase date and today
  getAgeMonths(asset: any): number {
    if (!asset.ExpenseDate) return 0;
    const purchase = new Date(asset.ExpenseDate);
    const now      = new Date();
    return Math.max(0, (now.getFullYear() - purchase.getFullYear()) * 12 + (now.getMonth() - purchase.getMonth()));
  }

  // Monthly depreciation = cost ÷ (life in years × 12)
  getMonthlyDeprn(asset: any): number {
    const lifeMonths = (asset.ExpectedLifeYrs || 1) * 12;
    return asset.Amount / lifeMonths;
  }

  // Book value = cost − (monthly deprn × age months), floored at 0
  getBookValue(asset: any): number {
    const deprn = this.getMonthlyDeprn(asset) * this.getAgeMonths(asset);
    return Math.max(0, asset.Amount - deprn);
  }

  // Percentage of original cost remaining (for the bar)
  getBookValuePct(asset: any): number {
    if (!asset.Amount) return 0;
    return Math.round((this.getBookValue(asset) / asset.Amount) * 100);
  }

  isWarrantyExpired(asset: any): boolean {
    if (!asset.WarrantyExpiry) return false;
    return new Date(asset.WarrantyExpiry) < new Date();
  }

  viewImage(path: string) {
    this.viewingImage = path;
  }

  get totalCost(): number {
    return this.filtered.reduce((sum, a) => sum + (a.Amount || 0), 0);
  }

  get totalBookValue(): number {
    return this.filtered.reduce((sum, a) => sum + this.getBookValue(a), 0);
  }
}
