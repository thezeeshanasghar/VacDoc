import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
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
  isDoctor = true;   // reconcile is doctor-only (§7); integrity check is read-only for anyone

  constructor(
    private stockService: StockService,
    private loadingController: LoadingController,
    private storage: Storage,
    private toastService: ToastService,
    private alertController: AlertController,
  ) {}

  async ionViewWillEnter() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    const user = await this.storage.get(environment.USER);
    this.isDoctor = !(user && user.UserType === 'PA');
    const clinic = await this.storage.get(environment.ON_CLINIC);
    this.clinicId = clinic ? clinic.Id : 0;
    const allClinics = await this.storage.get(environment.CLINICS);
    this.clinics = allClinics || (clinic ? [clinic] : []);
    this.loadOverview();
  }

  // v2 §7 — audit the counters against the ledger, then offer to reconcile (doctor only).
  async checkIntegrity() {
    const loading = await this.loadingController.create({ message: 'Checking stock integrity...' });
    await loading.present();
    this.stockService.checkIntegrity(this.clinicId).subscribe(
      async (res: any) => {
        loading.dismiss();
        if (!res || !res.IsSuccess) {
          this.toastService.create((res && res.Message) || 'Integrity check failed', 'danger');
          return;
        }
        if (res.IsClean) {
          this.toastService.create('Stock is clean — counters match the ledger.', 'success');
          return;
        }
        // Build a short summary of the drift.
        const lines = (res.Mismatches || []).slice(0, 12).map((m: any) =>
          `${m.BrandName}: shows ${m.CounterCount}, ledger ${m.LedgerBalance} (drift ${m.Drift})`
        );
        const more = res.MismatchCount > 12 ? `\n…and ${res.MismatchCount - 12} more.` : '';
        const buttons: any[] = [{ text: 'Close', role: 'cancel' }];
        if (this.isDoctor) {
          buttons.push({
            text: 'Reconcile to ledger',
            handler: () => this.reconcile()
          });
        }
        const alert = await this.alertController.create({
          header: `${res.MismatchCount} item(s) drifted`,
          message: lines.join('\n') + more +
            (this.isDoctor ? '\n\nReconcile rewrites the shown counts from the ledger (no stock is invented).'
                           : '\n\nAsk a doctor to reconcile.'),
          buttons
        });
        await alert.present();
      },
      () => {
        loading.dismiss();
        this.toastService.create('Integrity check failed', 'danger');
      }
    );
  }

  private async reconcile() {
    const loading = await this.loadingController.create({ message: 'Reconciling to ledger...' });
    await loading.present();
    this.stockService.reconcileStock(this.clinicId).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create(res.Message || 'Reconciled.', 'success');
          this.loadOverview();
        } else {
          this.toastService.create((res && res.Message) || 'Reconcile failed', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Reconcile failed', 'danger');
      }
    );
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
          this.brands = (res.ResponseData || []).sort((a: any, b: any) =>
            (a.BrandName || '').localeCompare(b.BrandName || '', undefined, { sensitivity: 'base' })
          );
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
    if (expiry < today) return false;
    const sixMonths = new Date(today);
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    return expiry <= sixMonths;
  }

  isExpired(expiryStr: string): boolean {
    if (!expiryStr) return false;
    return new Date(expiryStr) < new Date();
  }

  trackByBrandId(_index: number, brand: any): any {
    return brand.BrandId;
  }

  trackByBatchLot(index: number, batch: any): any {
    return batch.BatchLot || index;
  }
}
