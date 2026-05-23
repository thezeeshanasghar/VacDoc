import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { StockService } from 'src/app/services/stock.service';
import { BrandService } from 'src/app/services/brand.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

interface TransferItem {
  brandId: number;
  brandSearch: string;
  brandDropOpen: boolean;
  batchLot: string;
  expiryDate: string;
  availableQty: number;
  qty: number;
  unitPrice: number;
  batches: any[];
  batchModalOpen: boolean;
  brandDropTop: number;
  brandDropLeft: number;
  brandDropWidth: number;
}

@Component({
  selector: 'app-stock-transfer',
  templateUrl: './stock-transfer.page.html',
  styleUrls: ['./stock-transfer.page.scss'],
})
export class StockTransferPage {
  doctorId: number = 0;
  fromClinicId: number = 0;
  toClinicId: number = 0;
  clinics: any[] = [];
  brands: any[] = [];

  // Form fields
  items: TransferItem[] = [];
  awtPercent: number = 0;
  transferDate: string = '';
  reason: string = '';

  // History
  history: any[] = [];
  historySearch: string = '';

  get toClinicOptions(): any[] {
    var self = this;
    return this.clinics.filter(function(c: any) { return c.Id !== self.fromClinicId; });
  }

  get filteredHistory(): any[] {
    var q = (this.historySearch || '').toLowerCase();
    if (!q) return this.history;
    return this.history.filter(function(h: any) {
      return (h.BrandName || '').toLowerCase().indexOf(q) >= 0 ||
             (h.VaccineName || '').toLowerCase().indexOf(q) >= 0 ||
             (h.Reason || '').toLowerCase().indexOf(q) >= 0 ||
             (h.BillNo || '').toLowerCase().indexOf(q) >= 0;
    });
  }

  get subTotal(): number {
    var total = 0;
    for (var i = 0; i < this.items.length; i++) {
      total += (this.items[i].unitPrice || 0) * (this.items[i].qty || 0);
    }
    return total;
  }

  get awtAmount(): number {
    return Math.round(this.subTotal * (this.awtPercent || 0) / 100 * 100) / 100;
  }

  get grandTotal(): number {
    return this.subTotal + this.awtAmount;
  }

  constructor(
    private stockService: StockService,
    private brandService: BrandService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private storage: Storage,
    private toastService: ToastService,
  ) {}

  async ionViewWillEnter() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    const clinic = await this.storage.get(environment.ON_CLINIC);
    this.fromClinicId = clinic ? clinic.Id : 0;
    const allClinics = await this.storage.get(environment.CLINICS);
    this.clinics = allClinics || (clinic ? [clinic] : []);

    const other = this.clinics.filter(function(c: any) { return c.Id !== clinic.Id; });
    this.toClinicId = other.length > 0 ? other[0].Id : 0;

    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    this.transferDate = today.getFullYear() + '-' + mm + '-' + dd;

    this.loadBrands();
    this.loadHistory();
    if (this.items.length === 0) {
      this.addItem();
    }
  }

  newItem(): TransferItem {
    return {
      brandId: null,
      brandSearch: '',
      brandDropOpen: false,
      batchLot: '',
      expiryDate: '',
      availableQty: 0,
      qty: null,
      unitPrice: null,
      batches: [],
      batchModalOpen: false,
      brandDropTop: 0,
      brandDropLeft: 0,
      brandDropWidth: 200
    };
  }

  addItem() {
    this.items.push(this.newItem());
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
  }

  onFromClinicChange() {
    if (this.toClinicId === this.fromClinicId) {
      var self = this;
      var other = this.clinics.filter(function(c: any) { return c.Id !== self.fromClinicId; });
      this.toClinicId = other.length > 0 ? other[0].Id : 0;
    }
    this.resetItems();
    this.loadBrands();
    this.loadHistory();
  }

  onToClinicChange() {
    this.loadHistory();
  }

  loadBrands() {
    var self = this;
    this.brandService.getBrandAmount(this.doctorId, this.fromClinicId).subscribe(
      function(res: any) {
        if (res.IsSuccess) {
          self.brands = res.ResponseData || [];
        }
      },
      function() {}
    );
  }

  loadHistory() {
    var self = this;
    this.stockService.getTransfers(this.doctorId, this.fromClinicId).subscribe(
      function(res: any) {
        if (res.IsSuccess) {
          self.history = res.ResponseData || [];
        }
      },
      function() {}
    );
  }

  filteredBrands(search: string): any[] {
    var q = (search || '').toLowerCase();
    if (!q) return this.brands;
    return this.brands.filter(function(b: any) {
      return (b.VaccineName || '').toLowerCase().indexOf(q) >= 0 ||
             (b.BrandName || '').toLowerCase().indexOf(q) >= 0;
    });
  }

  openBrandDrop(event: any, item: TransferItem) {
    var rect = event.target.getBoundingClientRect();
    item.brandDropTop = rect.bottom + window.scrollY;
    item.brandDropLeft = rect.left + window.scrollX;
    item.brandDropWidth = Math.max(rect.width, 220);
    item.brandDropOpen = true;
  }

  selectBrand(b: any, item: TransferItem) {
    item.brandId = b.BrandId;
    item.brandSearch = b.BrandName;
    item.brandDropOpen = false;
    item.batchLot = '';
    item.expiryDate = '';
    item.availableQty = 0;
    item.unitPrice = null;
    this.loadBatchesForItem(item);
  }

  clearBrand(item: TransferItem) {
    item.brandId = null;
    item.brandSearch = '';
    item.brandDropOpen = false;
    item.batchLot = '';
    item.expiryDate = '';
    item.availableQty = 0;
    item.unitPrice = null;
    item.batches = [];
  }

  loadBatchesForItem(item: TransferItem) {
    if (!item.brandId) return;
    var self = this;
    this.stockService.getBatchLotsByBrand(item.brandId, this.fromClinicId).subscribe(
      function(res: any) {
        if (res.IsSuccess) {
          item.batches = res.ResponseData || [];
          if (item.batches.length > 0) {
            var first = item.batches[0];
            item.batchLot = first.BatchLot || '';
            item.expiryDate = first.Expiry ? self.formatDateInput(first.Expiry) : '';
            item.availableQty = first.Quantity || 0;
            item.unitPrice = first.StockAmount || null;
          } else {
            item.batchLot = '';
            item.expiryDate = '';
            item.availableQty = 0;
            item.unitPrice = null;
          }
        }
      },
      function() {}
    );
  }

  openBatchModal(item: TransferItem) {
    if (!item.brandId) return;
    item.batchModalOpen = true;
  }

  closeBatchModal(item: TransferItem) {
    item.batchModalOpen = false;
  }

  selectBatch(batch: any, item: TransferItem) {
    item.batchLot = batch.BatchLot || '';
    item.expiryDate = batch.Expiry ? this.formatDateInput(batch.Expiry) : '';
    item.availableQty = batch.Quantity || 0;
    item.unitPrice = batch.StockAmount || null;
    item.batchModalOpen = false;
  }

  formatDateInput(d: string): string {
    if (!d) return '';
    var dt = new Date(d);
    var mm = (dt.getMonth() + 1).toString().padStart(2, '0');
    var dd = dt.getDate().toString().padStart(2, '0');
    return dt.getFullYear() + '-' + mm + '-' + dd;
  }

  async save() {
    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i];
      if (!item.brandId) {
        this.toastService.create('Select a brand for item ' + (i + 1), 'danger');
        return;
      }
      if (!item.batchLot || item.batchLot.trim() === '') {
        this.toastService.create('Batch is required for item ' + (i + 1), 'danger');
        return;
      }
      if (!item.qty || item.qty <= 0) {
        this.toastService.create('Quantity must be greater than 0 for item ' + (i + 1), 'danger');
        return;
      }
      if (item.qty > item.availableQty) {
        this.toastService.create('Cannot transfer more than available (' + item.availableQty + ') for item ' + (i + 1), 'danger');
        return;
      }
      if (!item.unitPrice || item.unitPrice < 0) {
        this.toastService.create('Unit price is required for item ' + (i + 1), 'danger');
        return;
      }
    }
    if (!this.transferDate) {
      this.toastService.create('Date is required', 'danger');
      return;
    }
    if (!this.toClinicId || this.toClinicId === this.fromClinicId) {
      this.toastService.create('Select a different destination clinic', 'danger');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Saving...' });
    await loading.present();

    var itemPayloads: any[] = [];
    for (var j = 0; j < this.items.length; j++) {
      var it = this.items[j];
      itemPayloads.push({
        BrandId: it.brandId,
        BatchLot: it.batchLot,
        ExpiryDate: it.expiryDate ? it.expiryDate : null,
        Quantity: it.qty,
        UnitPrice: it.unitPrice || 0
      });
    }

    var payload = {
      DoctorId: this.doctorId,
      FromClinicId: this.fromClinicId,
      ToClinicId: this.toClinicId,
      AwtPercent: this.awtPercent || 0,
      Reason: this.reason || '',
      TransferDate: this.transferDate,
      Items: itemPayloads
    };

    var self = this;
    this.stockService.createTransfer(payload).subscribe(
      function(res: any) {
        loading.dismiss();
        if (res.IsSuccess) {
          self.toastService.create('Transfer recorded successfully', 'success');
          self.resetItems();
          self.loadHistory();
          self.loadBrands();
        } else {
          self.toastService.create(res.Message || 'Failed to save', 'danger');
        }
      },
      function() {
        loading.dismiss();
        self.toastService.create('Failed to save transfer', 'danger');
      }
    );
  }

  async confirmDelete(id: number) {
    var self = this;
    const alert = await this.alertController.create({
      header: 'Reverse Transfer',
      message: 'This will undo the entire transfer and restore source stock. Are you sure?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reverse',
          role: 'destructive',
          handler: function() { self.deleteTransfer(id); }
        }
      ]
    });
    await alert.present();
  }

  deleteTransfer(id: number) {
    var self = this;
    this.stockService.deleteTransfer(id).subscribe(
      function(res: any) {
        if (res.IsSuccess) {
          self.toastService.create('Transfer reversed', 'success');
          self.loadHistory();
          self.loadBrands();
        } else {
          self.toastService.create(res.Message || 'Failed to reverse', 'danger');
        }
      },
      function() {
        self.toastService.create('Failed to reverse transfer', 'danger');
      }
    );
  }

  downloadPdf(billId: number, billNo: string) {
    this.stockService.downloadTransferPdf(billId).subscribe(
      function(response: any) {
        var blob = new Blob([response], { type: 'application/pdf' });
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'Transfer-' + billNo + '.pdf';
        link.click();
        window.URL.revokeObjectURL(link.href);
      },
      function() {}
    );
  }

  resetItems() {
    this.items = [this.newItem()];
    this.awtPercent = 0;
    this.reason = '';
    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    this.transferDate = today.getFullYear() + '-' + mm + '-' + dd;
  }

  formatDate(d: string): string {
    if (!d) return '—';
    var dt = new Date(d);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return dt.getDate() + ' ' + months[dt.getMonth()] + ' ' + dt.getFullYear();
  }

  isExpired(expiryStr: string): boolean {
    if (!expiryStr) return false;
    return new Date(expiryStr) < new Date();
  }

  isExpiringSoon(expiryStr: string): boolean {
    if (!expiryStr) return false;
    var expiry = new Date(expiryStr);
    var today = new Date();
    var diffDays = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 90 && diffDays >= 0;
  }
}
