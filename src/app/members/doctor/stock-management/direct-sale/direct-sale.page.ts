import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { StockService } from 'src/app/services/stock.service';
import { BrandService } from 'src/app/services/brand.service';
import { ToastService } from 'src/app/shared/toast.service';
import { PaService } from 'src/app/services/pa.service';
import { environment } from 'src/environments/environment';

interface SaleItem {
  brandId: number;
  brandSearch: string;
  brandDropOpen: boolean;
  batchLot: string;
  expiryDate: string;
  availableQty: number;
  qty: number;
  salePrice: number;
  batches: any[];
  batchModalOpen: boolean;
}

@Component({
  selector: 'app-direct-sale',
  templateUrl: './direct-sale.page.html',
  styleUrls: ['./direct-sale.page.scss'],
})
export class DirectSalePage {
  doctorId: number = 0;
  clinicId: number = 0;
  brands: any[] = [];

  // Form fields
  items: SaleItem[] = [];
  clientName: string = '';
  paymentMode: string = 'Cash';
  onlineService: string = '';
  notes: string = '';
  saleDate: string = '';

  // PA / sheet
  clinicPAs: any[] = [];
  usertype: string = '';
  sheetOpen: boolean = false;
  sheetPaId: number = null;
  sheetSaleBillNo: string = '';

  // History
  history: any[] = [];
  historySearch: string = '';

  // Group history by SaleBillNo for display
  get groupedHistory(): any[] {
    var groups: any = {};
    for (var i = 0; i < this.history.length; i++) {
      var h = this.history[i];
      var key = h.SaleBillNo || ('id-' + h.Id);
      if (!groups[key]) {
        groups[key] = {
          SaleBillNo: h.SaleBillNo,
          ClientName: h.ClientName,
          PaymentMode: h.PaymentMode,
          OnlineService: h.OnlineService,
          Notes: h.Notes,
          SaleDate: h.SaleDate,
          items: [],
          grandTotal: 0,
          firstId: h.Id
        };
      }
      groups[key].items.push(h);
      groups[key].grandTotal += h.TotalSaleValue;
    }
    var result: any[] = [];
    var keys = Object.keys(groups);
    for (var j = 0; j < keys.length; j++) {
      result.push(groups[keys[j]]);
    }
    return result;
  }

  get filteredHistory(): any[] {
    var q = (this.historySearch || '').toLowerCase();
    if (!q) return this.groupedHistory;
    return this.groupedHistory.filter(function(g: any) {
      var match = (g.ClientName || '').toLowerCase().indexOf(q) >= 0 ||
                  (g.SaleBillNo || '').toLowerCase().indexOf(q) >= 0 ||
                  (g.PaymentMode || '').toLowerCase().indexOf(q) >= 0 ||
                  (g.Notes || '').toLowerCase().indexOf(q) >= 0;
      if (match) return true;
      for (var i = 0; i < g.items.length; i++) {
        var it = g.items[i];
        if ((it.BrandName || '').toLowerCase().indexOf(q) >= 0) return true;
        if ((it.VaccineName || '').toLowerCase().indexOf(q) >= 0) return true;
        if ((it.BatchLot || '').toLowerCase().indexOf(q) >= 0) return true;
      }
      return false;
    });
  }

  get subTotal(): number {
    var total = 0;
    for (var i = 0; i < this.items.length; i++) {
      total += (this.items[i].salePrice || 0) * (this.items[i].qty || 0);
    }
    return total;
  }

  constructor(
    private stockService: StockService,
    private brandService: BrandService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private storage: Storage,
    private toastService: ToastService,
    private paService: PaService,
  ) {}

  async ionViewWillEnter() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    const clinic = await this.storage.get(environment.ON_CLINIC);
    this.clinicId = clinic ? clinic.Id : 0;

    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    this.saleDate = today.getFullYear() + '-' + mm + '-' + dd;

    const user = await this.storage.get(environment.USER);
    if (user) {
      this.usertype = user.UserType || '';
      if (user.UserType === 'DOCTOR' && user.DoctorId) {
        this.paService.getPAsByDoctorId(String(user.DoctorId)).subscribe(res => {
          if (res && res.IsSuccess && res.ResponseData) {
            this.clinicPAs = res.ResponseData;
          }
        });
      }
    }

    this.loadBrands();
    this.loadHistory();
    if (this.items.length === 0) {
      this.addItem();
    }
  }

  newItem(): SaleItem {
    return {
      brandId: null,
      brandSearch: '',
      brandDropOpen: false,
      batchLot: '',
      expiryDate: '',
      availableQty: 0,
      qty: null,
      salePrice: null,
      batches: [],
      batchModalOpen: false
    };
  }

  addItem() {
    this.items.push(this.newItem());
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
  }

  loadBrands() {
    var self = this;
    this.brandService.getBrandAmount(this.doctorId, this.clinicId).subscribe(
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
    this.stockService.getDirectSales(this.doctorId, this.clinicId).subscribe(
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

  openBrandDrop(event: any, item: SaleItem) {
    item.brandDropOpen = true;
  }

  selectBrand(b: any, item: SaleItem) {
    item.brandId = b.BrandId;
    item.brandSearch = b.BrandName;
    item.brandDropOpen = false;
    item.batchLot = '';
    item.expiryDate = '';
    item.availableQty = 0;
    item.salePrice = b.Amount || null;
    this.loadBatchesForItem(item);
  }

  clearBrand(item: SaleItem) {
    item.brandId = null;
    item.brandSearch = '';
    item.brandDropOpen = false;
    item.batchLot = '';
    item.expiryDate = '';
    item.availableQty = 0;
    item.salePrice = null;
    item.batches = [];
  }

  loadBatchesForItem(item: SaleItem) {
    if (!item.brandId) return;
    var self = this;
    this.stockService.getBatchLotsByBrand(item.brandId, this.clinicId).subscribe(
      function(res: any) {
        if (res.IsSuccess) {
          item.batches = res.ResponseData || [];
          if (item.batches.length > 0) {
            var first = item.batches[0];
            item.batchLot = first.BatchLot || '';
            item.expiryDate = first.Expiry ? self.formatDateInput(first.Expiry) : '';
            item.availableQty = first.Quantity || 0;
          } else {
            item.batchLot = '';
            item.expiryDate = '';
            item.availableQty = 0;
          }
        }
      },
      function() {}
    );
  }

  openBatchModal(item: SaleItem) {
    if (!item.brandId) return;
    item.batchModalOpen = true;
  }

  closeBatchModal(item: SaleItem) {
    item.batchModalOpen = false;
  }

  selectBatch(batch: any, item: SaleItem) {
    item.batchLot = batch.BatchLot || '';
    item.expiryDate = batch.Expiry ? this.formatDateInput(batch.Expiry) : '';
    item.availableQty = batch.Quantity || 0;
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
    if (!this.clientName || this.clientName.trim() === '') {
      this.toastService.create('Client name is required', 'danger');
      return;
    }
    if (!this.paymentMode) {
      this.toastService.create('Payment mode is required', 'danger');
      return;
    }
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
        this.toastService.create('Cannot sell more than available (' + item.availableQty + ') for item ' + (i + 1), 'danger');
        return;
      }
      if (item.salePrice === null || item.salePrice === undefined || item.salePrice < 0) {
        this.toastService.create('Sale price is required for item ' + (i + 1), 'danger');
        return;
      }
    }
    if (!this.saleDate) {
      this.toastService.create('Date is required', 'danger');
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
        SalePricePerUnit: it.salePrice || 0
      });
    }

    var payload = {
      DoctorId: this.doctorId,
      ClinicId: this.clinicId,
      ClientName: this.clientName,
      PaymentMode: this.paymentMode,
      OnlineService: this.onlineService || '',
      Notes: this.notes || '',
      SaleDate: this.saleDate,
      Items: itemPayloads
    };

    var self = this;
    var showSheet = this.isToday(this.saleDate);
    this.stockService.createDirectSale(payload).subscribe(
      function(res: any) {
        loading.dismiss();
        if (res.IsSuccess) {
          self.toastService.create('Sale recorded successfully', 'success');
          if (showSheet) {
            self.sheetSaleBillNo = res.ResponseData ? (res.ResponseData.SaleBillNo || '') : '';
            self.sheetPaId = null;
            self.sheetOpen = true;
            self.resetForm();
            self.loadHistory();
            self.loadBrands();
          } else {
            self.resetForm();
            self.loadHistory();
            self.loadBrands();
          }
        } else {
          self.toastService.create(res.Message || 'Failed to save', 'danger');
        }
      },
      function() {
        loading.dismiss();
        self.toastService.create('Failed to save sale', 'danger');
      }
    );
  }

  async confirmDelete(firstId: number) {
    var self = this;
    const alert = await this.alertController.create({
      header: 'Reverse Sale',
      message: 'This will undo the entire sale and restore stock. Are you sure?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reverse',
          role: 'destructive',
          handler: function() { self.deleteSale(firstId); }
        }
      ]
    });
    await alert.present();
  }

  deleteSale(id: number) {
    var self = this;
    this.stockService.deleteDirectSale(id).subscribe(
      function(res: any) {
        if (res.IsSuccess) {
          self.toastService.create('Sale reversed', 'success');
          self.loadHistory();
          self.loadBrands();
        } else {
          self.toastService.create(res.Message || 'Failed to reverse', 'danger');
        }
      },
      function() {
        self.toastService.create('Failed to reverse sale', 'danger');
      }
    );
  }

  downloadPdf(saleBillNo: string) {
    this.stockService.downloadDirectSalePdf(saleBillNo).subscribe(
      function(response: any) {
        var blob = new Blob([response], { type: 'application/pdf' });
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'Sale-' + saleBillNo + '.pdf';
        link.click();
        window.URL.revokeObjectURL(link.href);
      },
      function() {}
    );
  }

  resetForm() {
    this.items = [this.newItem()];
    this.clientName = '';
    this.paymentMode = 'Cash';
    this.onlineService = '';
    this.notes = '';
    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    this.saleDate = today.getFullYear() + '-' + mm + '-' + dd;
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

  isToday(dateStr: string): boolean {
    var d = new Date(dateStr);
    var today = new Date();
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth()    === today.getMonth()    &&
           d.getDate()     === today.getDate();
  }

  closeSaleSheet() {
    this.sheetOpen = false;
  }
}
