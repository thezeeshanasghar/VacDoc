import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import * as moment from 'moment';
import { ClinicService } from 'src/app/services/clinic.service';
import { PaService } from 'src/app/services/pa.service';
import { StockService } from 'src/app/services/stock.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-sales-collection',
  templateUrl: './sales-collection.page.html',
  styleUrls: ['./sales-collection.page.scss'],
})
export class SalesCollectionPage implements OnInit {
  clinics: any[] = [];
  selectedClinicId: any;
  doctorId: any;
  usertype: any;
  clinicid: any;
  form: FormGroup;
  todaydate: string;

  constructor(
    private stockService: StockService,
    private clinicService: ClinicService,
    private paService: PaService,
    private loadingController: LoadingController,
    private toastService: ToastService,
    private storage: Storage,
    private fb: FormBuilder
  ) {
    this.todaydate = new Date().toISOString().slice(0, 10);
    this.form = this.fb.group({
      fromDate: [this.todaydate],
      toDate: [this.todaydate],
    });
  }

  async ngOnInit() {
    this.usertype = await this.storage.get(environment.USER);
    this.clinicid = await this.storage.get(environment.CLINIC_Id);
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    if (!this.doctorId) {
      this.toastService.create('Doctor ID not found', 'danger');
      return;
    }
    await this.loadClinics();
  }

  async loadClinics() {
    const loading = await this.loadingController.create({ message: 'Loading clinics...' });
    await loading.present();
    try {
      if (this.usertype && this.usertype.UserType === 'DOCTOR') {
        this.clinicService.getClinics(Number(this.doctorId)).subscribe({
          next: (res) => {
            loading.dismiss();
            if (res.IsSuccess) {
              this.clinics = res.ResponseData;
              this.selectedClinicId = this.clinicid || (this.clinics.length > 0 ? this.clinics[0].Id : null);
            } else {
              this.toastService.create(res.Message, 'danger');
            }
          },
          error: () => { loading.dismiss(); this.toastService.create('Failed to load clinics', 'danger'); }
        });
      } else if (this.usertype && this.usertype.UserType === 'PA') {
        this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
          next: (res) => {
            loading.dismiss();
            if (res.IsSuccess) {
              this.clinics = res.ResponseData;
              this.selectedClinicId = this.clinics.length > 0 ? this.clinics[0].Id : null;
            } else {
              this.toastService.create(res.Message, 'danger');
            }
          },
          error: () => { loading.dismiss(); this.toastService.create('Failed to load clinics', 'danger'); }
        });
      }
    } catch {
      loading.dismiss();
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  async downloadReport() {
    if (!this.selectedClinicId) {
      this.toastService.create('Please select a clinic', 'warning');
      return;
    }
    const fromDate = moment(this.form.value.fromDate).format('YYYY-MM-DD');
    const toDate = moment(this.form.value.toDate).format('YYYY-MM-DD');
    const loading = await this.loadingController.create({ message: 'Generating report...' });
    await loading.present();
    this.stockService.getSalesCollectionReportFile(this.selectedClinicId, new Date(fromDate), new Date(toDate)).subscribe({
      next: (response) => {
        loading.dismiss();
        const blob = new Blob([response], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `SalesReport_${this.selectedClinicId}_${fromDate}_${toDate}.pdf`;
        link.click();
        window.URL.revokeObjectURL(link.href);
        this.toastService.create('Report downloaded successfully', 'success');
      },
      error: (err) => {
        loading.dismiss();
        if (err.status === 404) {
          this.toastService.create('No sales data in the selected period', 'warning');
        } else {
          this.toastService.create('Failed to generate report', 'danger');
        }
      }
    });
  }
}
