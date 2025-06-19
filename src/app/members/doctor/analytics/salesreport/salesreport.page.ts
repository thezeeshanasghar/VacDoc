import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StockService } from 'src/app/services/stock.service';
import { LoadingController } from '@ionic/angular';
import { ToastService } from 'src/app/shared/toast.service';
import { ClinicService } from 'src/app/services/clinic.service';
import { PaService } from 'src/app/services/pa.service';
import { environment } from 'src/environments/environment';
import { Storage } from '@ionic/storage';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';

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
givenDatecheck: string;
fromDateTime: string;
toDateTime: string;
usertype: any;
clinicid: any;

  constructor(
    private route: ActivatedRoute,
    private stockService: StockService,
    public loadingController: LoadingController,
    private storage: Storage,
    private toastService: ToastService,
    private clinicService: ClinicService,
    private paService: PaService,
    private formBuilder: FormBuilder
  ) {
    this.todaydate = new Date().toISOString().slice(0, 10);
    this.salesReportForm = this.formBuilder.group({
      fromDate: [this.todaydate],
      toDate: [this.todaydate],
    });
  }

  async ngOnInit() {
    this.usertype = await this.storage.get(environment.USER);
    console.log('User Type:', this.usertype);
    this.storage.get(environment.CLINIC_Id).then((val) => {
      console.log('Clinic ID:', val);
      this.clinicid = val;
    });
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    if (!this.doctorId) {
      this.toastService.create('Doctor ID not found', 'danger');
      return;
    }
    await this.loadClinics();
  }

  async loadClinics() {
    const loading = await this.loadingController.create({
      message: "Loading clinics...",
    });
    await loading.present();

    try {
      if (this.usertype.UserType === "DOCTOR") {
        this.clinicService.getClinics(Number(this.doctorId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              console.log("Clinics:", this.clinics);
              this.selectedClinicId = this.clinicid || (this.clinics.length > 0 ? this.clinics[0].Id : null);
            } else {
              this.toastService.create(response.Message, "danger");
            }
          },
          error: (error) => {
            loading.dismiss();
            console.error("Error fetching clinics:", error);
            this.toastService.create("Failed to load clinics", "danger");
          },
        });
      } else if (this.usertype.UserType === "PA") {
        this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              console.log("PA Clinics:", this.clinics);
              this.selectedClinicId = this.clinics.length > 0 ? this.clinics[0].Id : null;
            } else {
              this.toastService.create(response.Message, "danger");
            }
          },
          error: (error) => {
            loading.dismiss();
            console.error("Error fetching PA clinics:", error);
            this.toastService.create("Failed to load clinics", "danger");
          },
        });
      }
    } catch (error) {
      loading.dismiss();
      console.error("Error in loadClinics:", error);
      this.toastService.create("An unexpected error occurred", "danger");
    }
  }

  async getSalesReport() {
    const fromDate = moment(this.salesReportForm.value.fromDate).format('YYYY-MM-DD'); 
    const toDate = moment(this.salesReportForm.value.toDate).format('YYYY-MM-DD'); 
    try {
      const loading = await this.loadingController.create({
        message: 'Fetching sales report...',
      });
      await loading.present();

      this.stockService
        .getSalesReportFile(this.selectedClinicId, new Date(fromDate), new Date(toDate))
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