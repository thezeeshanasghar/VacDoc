import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { StockService } from 'src/app/services/stock.service';
import { BrandService } from 'src/app/services/brand.service';
import { ClinicService } from 'src/app/services/clinic.service';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-reporting',
  templateUrl: './reporting.page.html',
  styleUrls: ['./reporting.page.scss']
})
export class ReportingPage implements OnInit {
  clinics: any[] = [];
  brands: any[] = [];
  agents: { id: number; name: string }[] = [];
  selectedClinicId: any;
  selectedBrandId: any = null;
  selectedPurchaseBrandId: any = null;
  selectedAgent: string | null = null;
  purchaseReportType: 'item' | 'supplier' = 'item';
  form: FormGroup;

  stockPositionRows: any[] = [];
  stockPositionLoaded: boolean = false;
  hideZeroActivity: boolean = true;

  pickerOpen: boolean = false;
  pickerType: 'itemBrand' | 'purchaseBrand' | 'agent' | null = null;
  pickerSearch: string = '';
  todaydate: string;
  doctorId: any;
  usertype: any;
  clinicid: any;

  constructor(
    private fb: FormBuilder,
    private loadingCtrl: LoadingController,
    private storage: Storage,
    private stockService: StockService,
    private brandService: BrandService,
    private clinicService: ClinicService,
    private paService: PaService,
    private toastService: ToastService
  ) {
    this.todaydate = new Date().toISOString().slice(0, 10);
    this.form = this.fb.group({ fromDate: [this.todaydate], toDate: [this.todaydate] });
  }

  async ngOnInit() {
    this.usertype  = await this.storage.get(environment.USER);
    this.clinicid  = await this.storage.get(environment.CLINIC_Id);
    this.doctorId  = await this.storage.get(environment.DOCTOR_Id);
    await this.loadClinics();
    await this.loadBrands();
    this.loadAgents();
  }

  async loadClinics() {
    const loader = await this.loadingCtrl.create({ message: 'Loading...' });
    await loader.present();
    const isPA = this.usertype && this.usertype.UserType === 'PA';
    const obs = isPA ? this.paService.getPaClinics(Number(this.usertype.PAId)) : this.clinicService.getClinics(Number(this.doctorId));
    obs.subscribe({
      next: (res: any) => {
        loader.dismiss();
        if (res && res.IsSuccess) {
          this.clinics = res.ResponseData || [];
          this.selectedClinicId = this.clinicid || (this.clinics.length > 0 ? this.clinics[0].Id : null);
        }
      },
      error: () => loader.dismiss()
    });
  }

  async loadBrands() {
    this.brandService.getBrands().subscribe({
      next: (res: any) => {
        if (res && res.IsSuccess) {
          this.brands = (res.ResponseData || []).map((b: any) => ({ id: b.Id, name: b.Name, displayName: b.Name }));
        }
      },
      error: () => {}
    });
  }

  brandNameById(id: any): string {
    const b = this.brands.find((x: any) => x.id === id);
    return b ? b.displayName : '';
  }

  openPicker(type: 'itemBrand' | 'purchaseBrand' | 'agent') {
    this.pickerType = type;
    this.pickerSearch = '';
    this.pickerOpen = true;
  }

  closePicker() {
    this.pickerOpen = false;
    this.pickerType = null;
  }

  get filteredPickerOptions(): { label: string; value: any }[] {
    const q = (this.pickerSearch || '').toLowerCase();
    let source: { label: string; value: any }[] = [];
    if (this.pickerType === 'agent') {
      source = this.agents.map(a => ({ label: a.name, value: a.name }));
    } else {
      source = this.brands.map(b => ({ label: b.displayName, value: b.id }));
    }
    if (!q) return source;
    return source.filter(o => (o.label || '').toLowerCase().indexOf(q) >= 0);
  }

  isPickerOptionSelected(opt: { label: string; value: any }): boolean {
    if (this.pickerType === 'itemBrand') return this.selectedBrandId === opt.value;
    if (this.pickerType === 'purchaseBrand') return this.selectedPurchaseBrandId === opt.value;
    if (this.pickerType === 'agent') return this.selectedAgent === opt.value;
    return false;
  }

  selectPickerOption(opt: { label: string; value: any }) {
    if (this.pickerType === 'itemBrand') this.selectedBrandId = opt.value;
    if (this.pickerType === 'purchaseBrand') this.selectedPurchaseBrandId = opt.value;
    if (this.pickerType === 'agent') this.selectedAgent = opt.value;
    this.closePicker();
  }

  loadAgents() {
    this.stockService.getSuppliers(Number(this.doctorId)).subscribe({
      next: (res: any) => {
        this.agents = (res && res.ResponseData ? res.ResponseData : [])
          .map((s: any) => ({ id: s.Id, name: s.Name }));
      },
      error: () => {}
    });
  }

  onPurchaseTypeChange() {
    this.selectedPurchaseBrandId = null;
    this.selectedAgent = null;
  }

  async downloadPurchaseReport() {
    if (this.purchaseReportType === 'item') {
      await this.getItemPurchaseReport();
    } else {
      await this.getSupplierReport();
    }
  }

  private get fromDate() { return (this.form.value.fromDate || this.todaydate).toString().slice(0, 10); }
  private get toDate()   { return (this.form.value.toDate   || this.todaydate).toString().slice(0, 10); }

  async getSalesReport() {
    if (!this.selectedClinicId) { this.toastService.create('Please select a clinic', 'danger'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Generating sales report...' });
    await loader.present();
    this.stockService.getSalesReportFile(this.selectedClinicId, Number(this.doctorId), new Date(this.fromDate), new Date(this.toDate))
      .subscribe({
        next: (res) => { loader.dismiss(); this.downloadBlob(res, `SalesReport_${this.fromDate}_${this.toDate}.pdf`); },
        error: (err: any) => { loader.dismiss(); if (err.status === 404) this.toastService.create('No sales in period', 'warning'); else this.toastService.create('Failed', 'danger'); }
      });
  }

  async getItemReport() {
    if (!this.selectedClinicId || !this.selectedBrandId) { this.toastService.create('Select clinic and brand', 'danger'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Generating item stock report...' });
    await loader.present();
    this.stockService.getItemsReportFile(this.selectedClinicId, Number(this.doctorId), this.selectedBrandId, this.fromDate, this.toDate)
      .subscribe({ next: (res) => { loader.dismiss(); this.downloadBlob(res, `ItemStockReport_${this.fromDate}.pdf`); }, error: () => { loader.dismiss(); this.toastService.create('Failed', 'danger'); } });
  }

  async getItemPurchaseReport() {
    if (!this.selectedClinicId || !this.selectedPurchaseBrandId) { this.toastService.create('Select clinic and brand', 'danger'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Generating purchase report...' });
    await loader.present();
    this.stockService.getItemsPurchaseReportFile(this.selectedClinicId, Number(this.doctorId), this.selectedPurchaseBrandId, this.fromDate, this.toDate)
      .subscribe({ next: (res) => { loader.dismiss(); this.downloadBlob(res, `PurchaseReport_${this.fromDate}.pdf`); }, error: () => { loader.dismiss(); this.toastService.create('Failed', 'danger'); } });
  }

  async getSupplierReport() {
    if (!this.selectedClinicId || !this.selectedAgent) { this.toastService.create('Select clinic and supplier', 'danger'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Generating supplier report...' });
    await loader.present();
    this.stockService.getItemsSupplierReportFile(this.selectedClinicId, Number(this.doctorId), this.selectedAgent, this.fromDate, this.toDate)
      .subscribe({ next: (res) => { loader.dismiss(); this.downloadBlob(res, `SupplierReport_${this.fromDate}.pdf`); }, error: () => { loader.dismiss(); this.toastService.create('Failed', 'danger'); } });
  }

  get visibleStockPositionRows(): any[] {
    if (!this.hideZeroActivity) return this.stockPositionRows;
    return this.stockPositionRows.filter(r => r.Opening > 0 || r.Closing > 0);
  }

  get stockPositionTotals(): any {
    return this.visibleStockPositionRows.reduce((t, r) => ({
      Opening: t.Opening + r.Opening,
      Purchased: t.Purchased + r.Purchased,
      DirectSale: t.DirectSale + r.DirectSale,
      Given: t.Given + r.Given,
      Adjusted: t.Adjusted + r.Adjusted,
      Transfer: t.Transfer + r.Transfer,
      Closing: t.Closing + r.Closing
    }), { Opening: 0, Purchased: 0, DirectSale: 0, Given: 0, Adjusted: 0, Transfer: 0, Closing: 0 });
  }

  async loadStockPositionReport() {
    if (!this.selectedClinicId) { this.toastService.create('Please select a clinic', 'danger'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Loading stock position...' });
    await loader.present();
    this.stockService.getStockPositionReport(this.selectedClinicId, Number(this.doctorId), this.fromDate, this.toDate)
      .subscribe({
        next: (res: any) => {
          loader.dismiss();
          this.stockPositionRows = (res && res.Rows) || [];
          this.stockPositionLoaded = true;
        },
        error: (err: any) => {
          loader.dismiss();
          this.stockPositionRows = [];
          this.stockPositionLoaded = true;
          if (err.status === 404) this.toastService.create('No stock movement in period', 'warning');
          else this.toastService.create('Failed to load stock position', 'danger');
        }
      });
  }

  async downloadStockPositionReport() {
    if (!this.selectedClinicId) { this.toastService.create('Please select a clinic', 'danger'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Generating stock position report...' });
    await loader.present();
    this.stockService.getStockPositionReportFile(this.selectedClinicId, Number(this.doctorId), this.fromDate, this.toDate)
      .subscribe({
        next: (res) => { loader.dismiss(); this.downloadBlob(res, `StockPositionReport_${this.fromDate}.pdf`); },
        error: (err: any) => {
          loader.dismiss();
          if (err.status === 404) this.toastService.create('No stock movement in period', 'warning');
          else this.toastService.create('Failed', 'danger');
        }
      });
  }

  // Prefers the filename the server actually sent via Content-Disposition (already includes
  // the clinic name, see ReportFileName.Build on the backend) — falls back to `defaultFilename`
  // only if that header is missing.
  private downloadBlob(res: any, defaultFilename: string) {
    const blob: Blob = res.body;
    const disposition: string | null = (res.headers && typeof res.headers.get === 'function') ? res.headers.get('content-disposition') : null;
    let filename = defaultFilename;
    if (disposition) {
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
      if (match && match[1]) filename = decodeURIComponent(match[1]);
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    this.toastService.create('Report downloaded', 'success');
  }
}
