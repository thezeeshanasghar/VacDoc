import { Component } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { StockService } from 'src/app/services/stock.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-stock-overview',
  templateUrl: './stock-overview.page.html',
  styleUrls: ['./stock-overview.page.scss'],
})
export class StockOverviewPage {
  brands: any[] = [];
  filteredBrands: any[] = [];
  searchTerm: string = '';
  expandedBrands: { [brandId: number]: boolean } = {};
  doctorId: number = 0;
  clinicId: number = 0;
  clinics: any[] = [];

  constructor(
    private stockService: StockService,
    private loadingController: LoadingController,
    private storage: Storage,
    private toastService: ToastService,
  ) {}

  async ionViewWillEnter() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    const clinic = await this.storage.get(environment.ON_CLINIC);
    this.clinicId = clinic ? clinic.Id : 0;
    const allClinics = await this.storage.get(environment.CLINICS);
    this.clinics = allClinics || (clinic ? [clinic] : []);
    this.loadOverview();
  }

  onClinicChange() {
    this.expandedBrands = {};
    this.loadOverview();
  }

  async loadOverview() {
    const loading = await this.loadingController.create({ message: 'Loading stock...' });
    await loading.present();
    this.stockService.getStockOverview(this.doctorId, this.clinicId).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.brands = res.ResponseData || [];
          this.applyFilter();
        } else {
          this.toastService.create(res.Message || 'Failed to load stock', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to load stock', 'danger');
      }
    );
  }

  applyFilter() {
    const q = (this.searchTerm || '').toLowerCase();
    if (!q) {
      this.filteredBrands = this.brands;
      return;
    }
    this.filteredBrands = this.brands.filter((b: any) =>
      (b.BrandName || '').toLowerCase().indexOf(q) >= 0 ||
      (b.VaccineName || '').toLowerCase().indexOf(q) >= 0
    );
  }

  toggleBrand(brandId: number) {
    this.expandedBrands[brandId] = !this.expandedBrands[brandId];
  }

  isExpanded(brandId: number): boolean {
    return !!this.expandedBrands[brandId];
  }

  downloadPdf() {
    const url = environment.BASE_URL + 'stockoverview/pdf?doctorId=' + this.doctorId + '&clinicId=' + this.clinicId;
    window.open(url, '_blank');
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return dt.getDate() + ' ' + months[dt.getMonth()] + ' ' + dt.getFullYear();
  }

  isExpiringSoon(expiryStr: string): boolean {
    if (!expiryStr) return false;
    const expiry = new Date(expiryStr);
    const today = new Date();
    const diffDays = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 90 && diffDays >= 0;
  }

  isExpired(expiryStr: string): boolean {
    if (!expiryStr) return false;
    return new Date(expiryStr) < new Date();
  }
}
