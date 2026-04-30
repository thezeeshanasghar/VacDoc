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
  agents: string[] = [];
  selectedClinicId: any;
  selectedBrandId: any = null;
  selectedAgent: any = null;
  filteredBrands: any[] = [];
  brandSearchTerm = '';
  form: FormGroup;
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
          this.filteredBrands = this.brands.slice();
        }
      },
      error: () => {}
    });
  }

  loadAgents() {
    this.stockService.getSuppliers().subscribe({
      next: (res: any) => { this.agents = res && res.ResponseData ? res.ResponseData : []; },
      error: () => {}
    });
  }

  filterBrands(term: string) {
    const t = (term || '').toLowerCase().trim();
    this.filteredBrands = t ? this.brands.filter(b => b.displayName.toLowerCase().includes(t)) : this.brands.slice();
  }
  showAllBrands() { this.brandSearchTerm = ''; this.filteredBrands = this.brands.slice(); }

  private get fromDate() { return (this.form.value.fromDate || this.todaydate).toString().slice(0, 10); }
  private get toDate()   { return (this.form.value.toDate   || this.todaydate).toString().slice(0, 10); }

  async getSalesReport() {
    if (!this.selectedClinicId) { this.toastService.create('Please select a clinic', 'danger'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Generating sales report...' });
    await loader.present();
    this.stockService.getSalesReportFile(this.selectedClinicId, new Date(this.fromDate), new Date(this.toDate))
      .subscribe({
        next: (res) => { loader.dismiss(); this.downloadBlob(res, `SalesReport_${this.fromDate}_${this.toDate}.pdf`); },
        error: (err: any) => { loader.dismiss(); if (err.status === 404) this.toastService.create('No sales in period', 'warning'); else this.toastService.create('Failed', 'danger'); }
      });
  }

  async getItemReport() {
    if (!this.selectedClinicId || !this.selectedBrandId) { this.toastService.create('Select clinic and brand', 'danger'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Generating item report...' });
    await loader.present();
    this.stockService.getItemsReportFile(this.selectedClinicId, this.selectedBrandId, this.fromDate, this.toDate)
      .subscribe({ next: (res) => { loader.dismiss(); this.downloadBlob(res, `ItemReport_${this.fromDate}.pdf`); }, error: () => { loader.dismiss(); this.toastService.create('Failed', 'danger'); } });
  }

  async getItemPurchaseReport() {
    if (!this.selectedClinicId || !this.selectedBrandId) { this.toastService.create('Select clinic and brand', 'danger'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Generating purchase report...' });
    await loader.present();
    this.stockService.getItemsPurchaseReportFile(this.selectedClinicId, this.selectedBrandId, this.fromDate, this.toDate)
      .subscribe({ next: (res) => { loader.dismiss(); this.downloadBlob(res, `PurchaseReport_${this.fromDate}.pdf`); }, error: () => { loader.dismiss(); this.toastService.create('Failed', 'danger'); } });
  }

  async getSupplierReport() {
    if (!this.selectedClinicId || !this.selectedAgent) { this.toastService.create('Select clinic and supplier', 'danger'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Generating supplier report...' });
    await loader.present();
    this.stockService.getItemsSupplierReportFile(this.selectedClinicId, this.selectedAgent, this.fromDate, this.toDate)
      .subscribe({ next: (res) => { loader.dismiss(); this.downloadBlob(res, `SupplierReport_${this.fromDate}.pdf`); }, error: () => { loader.dismiss(); this.toastService.create('Failed', 'danger'); } });
  }

  private downloadBlob(blob: any, filename: string) {
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
    this.toastService.create('Report downloaded', 'success');
  }
}
