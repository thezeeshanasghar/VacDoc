import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StockService } from 'src/app/services/stock.service';
import { LoadingController } from '@ionic/angular';
import { ToastService } from 'src/app/shared/toast.service';
import { ClinicService } from 'src/app/services/clinic.service';
import { environment } from 'src/environments/environment';
import { Storage } from '@ionic/storage';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-salesreport',
  templateUrl: './salesreport.page.html',
  styleUrls: ['./salesreport.page.scss'],
})
export class SalesReportPage implements OnInit {

clinics: any[] = [];
selectedClinicId: any;
doctorId: any;
salesReportForm: FormGroup;
salesReportData: any[] = [];
todaydate;

  constructor(
    private route: ActivatedRoute,
    private stockService: StockService,
    public loadingController: LoadingController,
    private storage: Storage,
    private toastService: ToastService,
    private clinicService: ClinicService,
    private formBuilder: FormBuilder
  ) {
    this.todaydate = new Date().toISOString().slice(0, 10);
    this.salesReportForm = this.formBuilder.group({
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
    });
  }

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    if (!this.doctorId) {
      this.toastService.create('Doctor ID not found', 'danger');
      return;
    }

    await this.loadClinics();
  }


  async loadClinics() {
    try {
      const loading = await this.loadingController.create({
        message: 'Loading clinics...',
      });
      await loading.present();

      this.clinicService.getClinics(Number(this.doctorId)).subscribe({
        next: (response) => {
          loading.dismiss();
          if (response.IsSuccess) {
            this.clinics = response.ResponseData;
            this.selectedClinicId = this.clinics.length > 0 ? this.clinics[0].Id : null;
          } else {
            this.toastService.create(response.Message, 'danger');
          }
        },
        error: (error) => {
          loading.dismiss();
          this.toastService.create('Failed to load clinics', 'danger');
        },
      });
    } catch (error) {
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  async getSalesReport() {
    if (!this.selectedClinicId) {
      this.toastService.create('Please select a clinic', 'danger');
      return;
    }

    if (!this.salesReportForm.valid) {
      this.toastService.create('Please select valid dates', 'danger');
      return;
    }
    const { fromDate, toDate } = this.salesReportForm.value;

    try {
      const loading = await this.loadingController.create({
        message: 'Fetching sales report...',
      });
      await loading.present();

      this.stockService
        .getSalesReportFile(this.selectedClinicId, fromDate, toDate)
        .subscribe({
          next: (response) => {
            loading.dismiss();

            const blob = new Blob([response], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `SalesReport_${this.selectedClinicId}_${fromDate}_${toDate}.pdf`;
            link.click();
            window.URL.revokeObjectURL(link.href);

            this.toastService.create('Sales report downloaded successfully', 'success');
          },
          error: (error) => {
            loading.dismiss();
            this.toastService.create('Failed to fetch sales report', 'danger');
          },
        });
    } catch (error) {
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }
}