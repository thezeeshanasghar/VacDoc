import { Component, OnInit } from "@angular/core";
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { FormBuilder, FormGroup } from "@angular/forms";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { BrandService } from "src/app/services/brand.service";
import { ToastService } from "src/app/shared/toast.service";
import { Router, ActivatedRoute } from "@angular/router";
import { LoadingController, AlertController } from "@ionic/angular";
import { StockService, StockDTO } from 'src/app/services/stock.service';
import { SupplierService } from 'src/app/services/supplier.service';

interface StockItem {
  id?: number;
  brandName: string;
  brandId?: number;
  quantity: number;
  price: number;
  batchLot?: string;
  expiry?: string;
}

@Component({
  selector: "app-edit",
  templateUrl: "./edit.page.html",
  styleUrls: ["./edit.page.scss"]
})
export class EditPage implements OnInit {
  editMode = false;

  fg1: FormGroup;
  defaultDate = new Date().toISOString();

  stockItems: StockItem[] = [];
  brands: any[] = [];
  filteredBrands: any[] = [];
  brandSearchTerm = '';
  agents: any[] = [];
  originalAgents: any[] = [];
  selectedSupplierId: number | null = null;

  billId: number;
  billData: any;
  doctorId: any;
  clinicId: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private brandService: BrandService,
    private toastService: ToastService,
    private loadingController: LoadingController,
    private alertCtrl: AlertController,
    private stockService: StockService,
    private supplierService: SupplierService,
    private fb: FormBuilder,
    private storage: Storage,
  ) {}

  ngOnInit() {
    this.fg1 = this.fb.group({
      id:        [''],
      billNo:    [''],
      supplier:  [''],
      billDate:  [''],
      paidDate:  [''],
      isPaid:    [false],
      awtAmount: [null],
    });

    this.route.params.subscribe(params => {
      this.billId = +params['brandId'];
      if (this.billId) { this.loadBillData(); }
    });

    this.loadBrands();
    this.loadSuppliers();
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    if (!this.editMode) { this.loadBillData(); }
  }

  // ── Data loading ───────────────────────────────────────────────────────────
  async loadBillData() {
    const loading = await this.loadingController.create({ message: 'Loading...' });
    await loading.present();

    this.stockService.getBrandBills(this.billId).subscribe({
      next: (response: any) => {
        loading.dismiss();
        if (response.IsSuccess && response.ResponseData && response.ResponseData.length) {
          const data = response.ResponseData;
          const first = data[0];
          this.doctorId = first.DoctorId;
          this.clinicId = first.ClinicId;

          this.selectedSupplierId = first.SupplierId || null;
          this.fg1.patchValue({
            id:        first.BillId,
            billNo:    first.BillNo || '',
            supplier:  first.Supplier || '',
            billDate:  first.BillDate || '',
            paidDate:  first.PaidDate || '',
            isPaid:    first.IsPaid || false,
            awtAmount: first.AwtAmount || null,
          });

          this.stockItems = data.map((item: any) => ({
            id:        item.Id,
            brandId:   item.BrandId,
            brandName: item.BrandName || item.VaccineName || '',
            quantity:  item.Quantity,
            price:     item.StockAmount,
            batchLot:  item.BatchLot || '',
            expiry:    item.Expiry ? item.Expiry.split('T')[0] : '',
          }));
        } else {
          this.toastService.create(response.Message || 'Failed to load bill', 'danger');
        }
      },
      error: () => { loading.dismiss(); this.toastService.create('Failed to load bill', 'danger'); }
    });
  }

  loadSuppliers() {
    this.supplierService.getAll().subscribe({
      next: (res: any) => {
        if (res.IsSuccess) {
          this.agents = (res.ResponseData || []).filter((s: any) => s.IsActive);
          this.originalAgents = [...this.agents];
        }
      },
      error: () => {}
    });
  }

  filterSuppliers(value: any) {
    if (!value || typeof value !== 'string' || !value.trim()) { this.agents = [...this.originalAgents]; return; }
    this.agents = this.originalAgents.filter((s: any) =>
      s.Name.toLowerCase().includes(value.toLowerCase())
    );
  }

  selectSupplier(event: MatAutocompleteSelectedEvent) {
    const name: string = event.option.value;
    this.fg1.patchValue({ supplier: name });
    const found = this.originalAgents.find((s: any) => s.Name === name);
    this.selectedSupplierId = found ? found.Id : null;
  }

  async loadBrands() {
    const loading = await this.loadingController.create({ message: 'Loading brands...' });
    await loading.present();
    this.clinicId = this.clinicId || await this.storage.get(environment.CLINIC_Id);

    this.brandService.getBrands().subscribe({
      next: (res: any) => {
        if (!res || !res.IsSuccess) { loading.dismiss(); return; }
        const all = (res.ResponseData || []).map((b: any) => ({
          id: b.Id, name: b.Name, price: 0, displayName: b.Name
        }));

        if (!this.clinicId) {
          this.brands = all; this.filteredBrands = [...all]; loading.dismiss(); return;
        }

        this.brandService.getBrandAmount(this.clinicId).subscribe({
          next: (amtRes: any) => {
            const map = new Map<number, number>();
            if (amtRes && amtRes.IsSuccess) {
              (amtRes.ResponseData || []).forEach((b: any) => map.set(b.BrandId, b.PurchasedAmt || 0));
            }
            this.brands = all.map((b: any) => ({ ...b, price: map.get(b.id) || 0 }));
            this.filteredBrands = [...this.brands];
            loading.dismiss();
          },
          error: () => { this.brands = all; this.filteredBrands = [...all]; loading.dismiss(); }
        });
      },
      error: () => loading.dismiss()
    });
  }

  filterBrands(term: string) {
    const t = (term || '').toLowerCase().trim();
    this.filteredBrands = t
      ? this.brands.filter(b => b.displayName.toLowerCase().includes(t))
      : [...this.brands];
  }

  showAllBrands() {
    this.brandSearchTerm = '';
    this.filteredBrands = [...this.brands];
  }

  selectBrandById(brandId: number, item: StockItem) {
    const b = this.brands.find(x => x.id === brandId);
    if (b) { item.brandId = b.id; item.brandName = b.name; item.price = b.price || 0; }
  }

  // ── Row management ─────────────────────────────────────────────────────────
  addNewRow() {
    this.stockItems.push({ brandName: '', brandId: null, quantity: 0, price: 0, batchLot: '', expiry: '' });
  }

  removeRow(index: number) {
    this.stockItems.splice(index, 1);
  }

  calculateTotal(): number {
    return this.stockItems.reduce((s, i) => s + ((i.quantity || 0) * (i.price || 0)), 0);
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async saveStock() {
    if (!this.stockItems.length) {
      this.toastService.create('Add at least one item', 'danger'); return;
    }
    const loading = await this.loadingController.create({ message: 'Saving...' });
    await loading.present();

    const f = this.fg1.value;
    const payload: StockDTO[] = this.stockItems.map(item => ({
      Id:          item.id || 0,
      BrandId:     item.brandId || 0,
      BrandName:   item.brandName,
      BillId:      f.id,
      BillNo:      f.billNo,
      Supplier:    f.supplier,
      SupplierId:  this.selectedSupplierId,
      AwtAmount:   f.awtAmount || null,
      BillDate:    f.billDate ? new Date(f.billDate) : new Date(),
      IsPaid:      f.isPaid,
      PaidDate:    f.paidDate ? new Date(f.paidDate) : null,
      DoctorId:    this.doctorId,
      ClinicId:    this.clinicId,
      IsPAApprove: true,
      Quantity:    Number(item.quantity),
      StockAmount: Number(item.price),
      BatchLot:    item.batchLot || '',
      Expiry:      item.expiry ? new Date(item.expiry) : null,
    }));

    this.stockService.editStocks(payload).subscribe({
      next: (res: any) => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Bill updated successfully', 'success');
          this.editMode = false;
          this.loadBillData();
        } else {
          this.toastService.create(res && res.Message ? res.Message : 'Failed to save', 'danger', true);
        }
      },
      error: () => { loading.dismiss(); this.toastService.create('Failed to save', 'danger'); }
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async confirmDelete() {
    const alert = await this.alertCtrl.create({
      header: 'Delete Bill',
      message: `This will permanently delete this bill and reverse all stock quantities. This cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete & Reverse Stock',
          handler: () => { this.deleteBill(); }
        }
      ]
    });
    await alert.present();
  }

  async deleteBill() {
    const loading = await this.loadingController.create({ message: 'Deleting...' });
    await loading.present();
    this.stockService.deleteBillWithReversal(this.billId).subscribe({
      next: (res: any) => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Bill deleted and stock reversed', 'success');
          this.router.navigate(['/members/doctor/stock-management']);
        } else {
          this.toastService.create(res && res.Message ? res.Message : 'Failed to delete', 'danger');
        }
      },
      error: () => { loading.dismiss(); this.toastService.create('Failed to delete', 'danger'); }
    });
  }
}
