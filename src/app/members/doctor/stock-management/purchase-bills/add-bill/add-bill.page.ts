import { Component } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { StockService } from 'src/app/services/stock.service';
import { SupplierService } from 'src/app/services/supplier.service';
import { BrandService } from 'src/app/services/brand.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-bill',
  templateUrl: './add-bill.page.html',
  styleUrls: ['./add-bill.page.scss'],
})
export class AddBillPage {
  doctorId: number = 0;
  clinicId: number = 0;
  clinics: any[] = [];

  billNo: string = '';
  billDate: string = '';
  supplierId: number = null;
  supplierSearch: string = '';
  supplierDropOpen: boolean = false;
  supplierModalOpen: boolean = false;
  awtPercent: number = 0;
  amountPaid: number = 0;
  paymentMethod: string = 'Cash';

  suppliers: any[] = [];
  brands: any[] = [];

  get filteredSuppliers(): any[] {
    const q = (this.supplierSearch || '').toLowerCase();
    if (!q) return this.suppliers;
    return this.suppliers.filter((s: any) => (s.Name || '').toLowerCase().indexOf(q) >= 0);
  }

  lines: any[] = [];

  get subtotal(): number {
    return this.lines.reduce((sum, l) => sum + (l.qty || 0) * (l.unitPrice || 0), 0);
  }

  get awtAmount(): number {
    return Math.round(this.subtotal * (this.awtPercent || 0) / 100 * 100) / 100;
  }

  get totalPayable(): number {
    return Math.round((this.subtotal + this.awtAmount) * 100) / 100;
  }

  constructor(
    private stockService: StockService,
    private supplierService: SupplierService,
    private brandService: BrandService,
    private loadingController: LoadingController,
    private router: Router,
    private storage: Storage,
    private toastService: ToastService,
  ) {}

  async ionViewWillEnter() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    const clinic = await this.storage.get(environment.ON_CLINIC);
    this.clinicId = clinic ? clinic.Id : 0;
    const allClinics = await this.storage.get(environment.CLINICS);
    this.clinics = allClinics || (clinic ? [clinic] : []);

    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    this.billDate = today.getFullYear() + '-' + mm + '-' + dd;

    if (this.lines.length === 0) this.addLine();
    this.loadSuppliers();
    this.loadBrands();
  }

  onClinicChange() {
    this.loadBrands();
  }

  loadSuppliers() {
    this.supplierService.getAll(this.doctorId).subscribe(
      (res: any) => {
        if (res.IsSuccess) {
          this.suppliers = (res.ResponseData || []).filter((s: any) => s.IsActive);
        } else {
          this.toastService.create(res.Message || 'Failed to load suppliers', 'danger');
        }
      },
      (err: any) => {
        this.toastService.create('Failed to load suppliers', 'danger');
      }
    );
  }

  loadBrands() {
    this.brandService.getBrandAmount(this.doctorId, this.clinicId).subscribe(
      (res: any) => {
        if (res.IsSuccess) {
          this.brands = res.ResponseData || [];
        }
      },
      () => {}
    );
  }

  brandDropTop: number = 0;
  brandDropLeft: number = 0;
  brandDropWidth: number = 200;
  activeLine: any = null;

  filteredBrands(search: string): any[] {
    const q = (search || '').toLowerCase();
    if (!q) return this.brands;
    return this.brands.filter((b: any) =>
      (b.VaccineName || '').toLowerCase().indexOf(q) >= 0 ||
      (b.BrandName || '').toLowerCase().indexOf(q) >= 0
    );
  }

  openBrandDrop(event: any, line: any) {
    const rect = event.target.getBoundingClientRect();
    this.brandDropTop = rect.bottom + window.scrollY;
    this.brandDropLeft = rect.left + window.scrollX;
    this.brandDropWidth = Math.max(rect.width, 200);
    this.activeLine = line;
    line.brandDropOpen = true;
  }

  openSupplierModal() {
    this.supplierSearch = '';
    this.supplierModalOpen = true;
  }

  closeSupplierModal() {
    this.supplierModalOpen = false;
    if (this.supplierId) {
      const s = this.suppliers.find((x: any) => x.Id === this.supplierId);
      this.supplierSearch = s ? s.Name : '';
    }
  }

  onSupplierSearch() {}

  selectSupplier(s: any) {
    this.supplierId = s.Id;
    this.supplierSearch = s.Name;
    this.supplierDropOpen = false;
    this.supplierModalOpen = false;
  }

  clearSupplier() {
    this.supplierId = null;
    this.supplierSearch = '';
    this.supplierDropOpen = false;
    this.supplierModalOpen = false;
  }

  selectBrand(line: any, b: any) {
    line.brandId = b.BrandId;
    line.brandSearch = b.BrandName;
    line.brandDropOpen = false;
    this.activeLine = null;
  }

  clearLineBrand(line: any) {
    line.brandId = null;
    line.brandSearch = '';
    line.brandDropOpen = false;
  }

  addLine() {
    this.lines.push({ brandId: null, brandSearch: '', brandDropOpen: false, batchLot: '', expiry: '', qty: null, unitPrice: null });
  }

  removeLine(i: number) {
    this.lines.splice(i, 1);
  }

  brandLabel(brandId: number): string {
    const b = this.brands.find((x: any) => x.BrandId === brandId);
    return b ? b.VaccineName + ' - ' + b.BrandName : '';
  }

  async save() {
    if (!this.billDate) {
      this.toastService.create('Bill date is required', 'danger');
      return;
    }
    if (this.lines.length === 0) {
      this.toastService.create('Add at least one line item', 'danger');
      return;
    }
    for (let i = 0; i < this.lines.length; i++) {
      const l = this.lines[i];
      if (!l.brandId) {
        this.toastService.create('Select brand for line ' + (i + 1), 'danger');
        return;
      }
      if (!l.batchLot || l.batchLot.trim() === '') {
        this.toastService.create('Batch/Lot required for line ' + (i + 1), 'danger');
        return;
      }
      if (!l.expiry) {
        this.toastService.create('Expiry date required for line ' + (i + 1), 'danger');
        return;
      }
      if (!l.qty || l.qty <= 0) {
        this.toastService.create('Quantity must be > 0 for line ' + (i + 1), 'danger');
        return;
      }
      if (!l.unitPrice || l.unitPrice <= 0) {
        this.toastService.create('Unit price must be > 0 for line ' + (i + 1), 'danger');
        return;
      }
    }

    const loading = await this.loadingController.create({ message: 'Saving...' });
    await loading.present();

    const payload = {
      BillNo: this.billNo || null,
      BillDate: this.billDate,
      SupplierId: this.supplierId || null,
      SupplierName: null,
      DoctorId: this.doctorId,
      ClinicId: this.clinicId,
      AwtPercent: this.awtPercent || 0,
      AmountPaid: this.amountPaid || 0,
      PaymentMethod: (this.amountPaid && this.amountPaid > 0 && this.paymentMethod) ? this.paymentMethod : null,
      Lines: this.lines.map((l: any) => ({
        BrandId: l.brandId,
        BatchLot: l.batchLot,
        Expiry: l.expiry,
        Quantity: l.qty,
        UnitPrice: l.unitPrice
      }))
    };

    this.stockService.createBill(payload).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Bill saved — ' + res.ResponseData.BillNo, 'success');
          this.router.navigate(['/members/doctor/stock-management/purchase-bills']);
        } else {
          this.toastService.create(res.Message || 'Failed to save', 'danger');
        }
      },
      (err: any) => {
        loading.dismiss();
        this.toastService.create('Failed to save bill', 'danger');
      }
    );
  }
}
