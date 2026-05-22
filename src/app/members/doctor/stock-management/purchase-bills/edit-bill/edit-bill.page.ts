import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { StockService } from 'src/app/services/stock.service';
import { SupplierService } from 'src/app/services/supplier.service';
import { BrandService } from 'src/app/services/brand.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-edit-bill',
  templateUrl: './edit-bill.page.html',
  styleUrls: ['./edit-bill.page.scss'],
})
export class EditBillPage implements OnInit {
  billId: number = 0;
  doctorId: number = 0;
  clinicId: number = 0;

  billNo: string = '';
  billDate: string = '';
  supplierId: number = null;
  supplierSearch: string = '';
  supplierDropOpen: boolean = false;
  awtPercent: number = 0;

  suppliers: any[] = [];
  brands: any[] = [];
  lines: any[] = [];

  get filteredSuppliers(): any[] {
    const q = (this.supplierSearch || '').toLowerCase();
    if (!q) return this.suppliers;
    return this.suppliers.filter((s: any) => (s.Name || '').toLowerCase().indexOf(q) >= 0);
  }

  get subtotal(): number {
    return this.lines.reduce((sum, l) => sum + (l.qty || 0) * (l.unitPrice || 0), 0);
  }

  get awtAmount(): number {
    return Math.round(this.subtotal * (this.awtPercent || 0) / 100 * 100) / 100;
  }

  get totalPayable(): number {
    return Math.round((this.subtotal + this.awtAmount) * 100) / 100;
  }

  brandDropTop: number = 0;
  brandDropLeft: number = 0;
  brandDropWidth: number = 200;
  activeLine: any = null;

  constructor(
    private stockService: StockService,
    private supplierService: SupplierService,
    private brandService: BrandService,
    private loadingController: LoadingController,
    private router: Router,
    private route: ActivatedRoute,
    private storage: Storage,
    private toastService: ToastService,
  ) {}

  async ngOnInit() {
    this.billId = parseInt(this.route.snapshot.paramMap.get('id') || '0', 10);
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    const clinic = await this.storage.get(environment.ON_CLINIC);
    this.clinicId = clinic ? clinic.Id : 0;

    await this.loadSuppliers();
    await this.loadBrands();
    await this.loadBill();
  }

  loadSuppliers(): Promise<void> {
    return new Promise((resolve) => {
      this.supplierService.getAll(this.doctorId).subscribe(
        (res: any) => {
          if (res.IsSuccess) this.suppliers = (res.ResponseData || []).filter((s: any) => s.IsActive);
          resolve();
        },
        () => resolve()
      );
    });
  }

  loadBrands(): Promise<void> {
    return new Promise((resolve) => {
      this.brandService.getBrandAmount(this.doctorId, this.clinicId).subscribe(
        (res: any) => {
          if (res.IsSuccess) this.brands = res.ResponseData || [];
          resolve();
        },
        () => resolve()
      );
    });
  }

  async loadBill() {
    const loading = await this.loadingController.create({ message: 'Loading...' });
    await loading.present();
    this.stockService.getBillById(this.billId).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res.IsSuccess) {
          const b = res.ResponseData;
          this.billNo = b.BillNo || '';
          const d = new Date(b.BillDate);
          const mm = (d.getMonth() + 1).toString().padStart(2, '0');
          const dd = d.getDate().toString().padStart(2, '0');
          this.billDate = d.getFullYear() + '-' + mm + '-' + dd;
          this.supplierId = b.SupplierId || null;
          this.supplierSearch = b.SupplierName || '';
          this.awtPercent = b.AwtPercent || 0;
          this.lines = (b.Lines || []).map((l: any) => {
            const brand = this.brands.find((br: any) => br.BrandId === l.BrandId);
            let expStr = '';
            if (l.Expiry) {
              const ed = new Date(l.Expiry);
              const em = (ed.getMonth() + 1).toString().padStart(2, '0');
              const eday = ed.getDate().toString().padStart(2, '0');
              expStr = ed.getFullYear() + '-' + em + '-' + eday;
            }
            return {
              brandId: l.BrandId,
              brandSearch: brand ? brand.BrandName : l.BrandName || '',
              brandDropOpen: false,
              batchLot: l.BatchLot || '',
              expiry: expStr,
              qty: l.Quantity,
              unitPrice: l.UnitPrice
            };
          });
        } else {
          this.toastService.create('Failed to load bill', 'danger');
          this.router.navigate(['/members/doctor/stock-management/purchase-bills']);
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to load bill', 'danger');
        this.router.navigate(['/members/doctor/stock-management/purchase-bills']);
      }
    );
  }

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

  selectSupplier(s: any) {
    this.supplierId = s.Id;
    this.supplierSearch = s.Name;
    this.supplierDropOpen = false;
  }

  clearSupplier() {
    this.supplierId = null;
    this.supplierSearch = '';
    this.supplierDropOpen = false;
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

  async save() {
    if (!this.billDate) { this.toastService.create('Bill date is required', 'danger'); return; }
    if (this.lines.length === 0) { this.toastService.create('Add at least one line item', 'danger'); return; }
    for (let i = 0; i < this.lines.length; i++) {
      const l = this.lines[i];
      if (!l.brandId) { this.toastService.create('Select brand for line ' + (i + 1), 'danger'); return; }
      if (!l.batchLot || l.batchLot.trim() === '') { this.toastService.create('Batch required for line ' + (i + 1), 'danger'); return; }
      if (!l.expiry) { this.toastService.create('Expiry required for line ' + (i + 1), 'danger'); return; }
      if (!l.qty || l.qty <= 0) { this.toastService.create('Qty must be > 0 for line ' + (i + 1), 'danger'); return; }
      if (!l.unitPrice || l.unitPrice <= 0) { this.toastService.create('Price must be > 0 for line ' + (i + 1), 'danger'); return; }
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
      Lines: this.lines.map((l: any) => ({
        BrandId: l.brandId,
        BatchLot: l.batchLot,
        Expiry: l.expiry,
        Quantity: l.qty,
        UnitPrice: l.unitPrice
      }))
    };

    this.stockService.updateBill(this.billId, payload).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Bill updated', 'success');
          this.router.navigate(['/members/doctor/stock-management/purchase-bills']);
        } else {
          this.toastService.create(res.Message || 'Failed to update', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to update bill', 'danger');
      }
    );
  }
}
