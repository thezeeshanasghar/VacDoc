import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ClinicService } from 'src/app/services/clinic.service';
import { BrandService } from 'src/app/services/brand.service';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { StockTransferService } from 'src/app/services/stock-transfer.service';
import { DirectSaleService } from 'src/app/services/direct-sale.service';

@Component({
  selector: 'app-direct-sale',
  templateUrl: './direct-sale.page.html',
  styleUrls: ['./direct-sale.page.scss']
})
export class DirectSalePage implements OnInit {
  clinics: any[] = [];
  brands: any[] = [];
  filteredBrands: any[] = [];
  brandAmounts: any[] = [];

  selectedClinic: any = null;
  selectedBrandId: any = null;
  brandSearchTerm = '';
  availableBatches: any[] = [];
  selectedBatch = '';

  expiry = '';
  availableQty = 0;
  salePrice = 0;
  purchasePrice = 0;
  quantity: any = null;
  clientName = '';
  paymentMode = 'Cash';
  notes = '';
  saleDate = new Date().toISOString().split('T')[0];

  private doctorId: any;
  private usertype: any;

  constructor(
    private loadingCtrl: LoadingController,
    private storage: Storage,
    private clinicService: ClinicService,
    private brandService: BrandService,
    private paService: PaService,
    private toastService: ToastService,
    private transferService: StockTransferService,
    private directSaleService: DirectSaleService
  ) {}

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    this.usertype = await this.storage.get(environment.USER);
    await this.loadClinics();
    await this.loadBrands();
  }

  async loadClinics() {
    const loader = await this.loadingCtrl.create({ message: 'Loading clinics...' });
    await loader.present();
    const isPA = this.usertype && this.usertype.UserType === 'PA';
    const obs = isPA
      ? this.paService.getPaClinics(Number(this.usertype.PAId))
      : this.clinicService.getClinics(Number(this.doctorId));
    obs.subscribe({
      next: (res: any) => {
        loader.dismiss();
        if (res && res.IsSuccess) { this.clinics = res.ResponseData || []; }
        else { this.toastService.create(res && res.Message ? res.Message : 'Failed to load clinics', 'danger'); }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to load clinics', 'danger'); }
    });
  }

  async loadBrands() {
    this.brandService.getBrands().subscribe({
      next: (res: any) => {
        if (res && res.IsSuccess) {
          this.brands = (res.ResponseData || []).map((b: any) => ({ id: b.Id, name: b.Name }));
          this.filteredBrands = this.brands.slice();
        }
      },
      error: () => {}
    });
  }

  filterBrands(term: string) {
    const t = (term || '').toLowerCase().trim();
    this.filteredBrands = t ? this.brands.filter(b => b.name.toLowerCase().includes(t)) : this.brands.slice();
  }

  showAllBrands() { this.brandSearchTerm = ''; this.filteredBrands = this.brands.slice(); }

  onClinicChange() {
    this.selectedBrandId = null;
    this.availableBatches = [];
    this.selectedBatch = '';
    this.resetFields();
  }

  async onBrandSelected(brandId: number) {
    this.resetFields();
    if (!this.selectedClinic) { this.toastService.create('Please select a clinic first.', 'danger'); return; }

    // Get sale price from BrandAmount
    this.brandService.getBrandAmount(this.selectedClinic).subscribe({
      next: (res: any) => {
        if (res && res.IsSuccess) {
          const ba = (res.ResponseData || []).find((b: any) => b.BrandId === brandId);
          if (ba) { this.salePrice = ba.Amount || 0; this.purchasePrice = ba.PurchasedAmt || 0; }
        }
      },
      error: () => {}
    });

    // Load available batches
    const loader = await this.loadingCtrl.create({ message: 'Loading batches...' });
    await loader.present();
    this.transferService.getAvailableBatches(brandId, this.selectedClinic).subscribe({
      next: (res) => {
        loader.dismiss();
        if (res && res.IsSuccess) {
          this.availableBatches = res.ResponseData || [];
          if (!this.availableBatches.length) {
            this.toastService.create('No stock found for this brand in selected clinic.', 'danger');
          }
        }
      },
      error: () => loader.dismiss()
    });
  }

  onBatchSelected(batchLot: string) {
    const batch = this.availableBatches.find(b => (b.BatchLot || '') === batchLot);
    if (batch) {
      this.expiry = batch.Expiry || '';
      this.availableQty = batch.AvailableQuantity;
      this.purchasePrice = batch.CostPrice || this.purchasePrice;
    }
  }

  get totalSaleValue(): number { return (this.quantity || 0) * this.salePrice; }
  get totalCost(): number      { return (this.quantity || 0) * this.purchasePrice; }
  get profit(): number         { return this.totalSaleValue - this.totalCost; }

  private resetFields() {
    this.expiry = ''; this.availableQty = 0; this.salePrice = 0;
    this.purchasePrice = 0; this.quantity = null; this.selectedBatch = '';
    this.availableBatches = [];
  }

  validate(): any {
    if (!this.selectedClinic)    return 'Please select a clinic.';
    if (!this.selectedBrandId)   return 'Please select a brand.';
    if (!this.quantity || this.quantity <= 0) return 'Quantity must be greater than zero.';
    if (this.availableQty > 0 && this.quantity > this.availableQty) return 'Quantity exceeds available stock.';
    if (!this.salePrice || this.salePrice <= 0) return 'Sale price must be greater than zero.';
    return null;
  }

  async onSubmit() {
    const err = this.validate();
    if (err) { this.toastService.create(err, 'danger'); return; }

    const loader = await this.loadingCtrl.create({ message: 'Recording sale...' });
    await loader.present();

    this.directSaleService.createSale({
      BrandId:          this.selectedBrandId,
      ClinicId:         this.selectedClinic,
      DoctorId:         Number(this.doctorId),
      BatchLot:         this.selectedBatch || null,
      ExpiryDate:       this.expiry || null,
      Quantity:         Number(this.quantity),
      SalePricePerUnit: Number(this.salePrice),
      ClientName:       this.clientName || null,
      PaymentMode:      this.paymentMode,
      Notes:            this.notes || null,
      SaleDate:         this.saleDate || new Date().toISOString()
    }).subscribe({
      next: (res) => {
        loader.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Direct sale recorded successfully!', 'success');
          this.resetAll();
        } else {
          this.toastService.create(res && res.Message ? res.Message : 'Failed to record sale', 'danger', true);
        }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to record sale', 'danger'); }
    });
  }

  private resetAll() {
    this.selectedBrandId = null;
    this.selectedBatch = '';
    this.clientName = '';
    this.paymentMode = 'Cash';
    this.notes = '';
    this.saleDate = new Date().toISOString().split('T')[0];
    this.resetFields();
    this.filteredBrands = this.brands.slice();
  }
}
