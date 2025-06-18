import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { BrandService, BrandAmountDTO } from 'src/app/services/brand.service';
import { ClinicService } from 'src/app/services/clinic.service'; 
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { FormGroup, FormBuilder, FormControl, FormArray } from '@angular/forms';

// import { Response, BrandAmountDTO } from 'src/app/models/response.model'; // adjust the import path as needed

@Component({
  selector: 'app-brand-amount',
  templateUrl: './brand-amount.page.html',
  styleUrls: ['./brand-amount.page.scss'],
})
export class BrandAmountPage implements OnInit {

  brandAmounts: BrandAmountDTO[] = [];
  fg: FormGroup
  clinics: any;
  selectedClinicId: any;
  doctorId: any;
  usertype: any; // Default user type, can be set dynamically based on the logged-in user
  online: Promise<any>;
  clinicId: any;
  constructor(
    public loadingController: LoadingController,
    private storage: Storage,
    private brandService: BrandService,
    private toastService: ToastService,
    private clinicService: ClinicService,
    private paService: PaService,
  ) { }

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    console.log('Doctor ID:', this.doctorId);
    if (!this.doctorId) {
      console.error('Doctor ID not found');
      this.toastService.create('Doctor ID not found', 'danger');
      return;
    }
    this.usertype = await this.storage.get(environment.USER); // Fetch user type (e.g., 'DOCTOR' or 'PA')
    console.log('User Type:', this.usertype);
    this.clinicId = await this.storage.get(environment.CLINIC_Id);
    console.log('Clinic ID:', this.clinicId);
    if (!this.doctorId) {
      console.error('Doctor ID not found');
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
  
      if (this.usertype.UserType === 'DOCTOR') {
        this.clinicService.getClinics(Number(this.doctorId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              console.log('Clinics:', this.clinics);
              this.selectedClinicId = this.clinicId || (this.clinics.length > 0 ? this.clinics[0].Id : null);
              if (this.selectedClinicId) {
                this.getBrandAmount(this.selectedClinicId);
              }
            } else {
              this.toastService.create(response.Message, 'danger');
            }
          },
          error: (error) => {
            loading.dismiss();
            console.error('Error fetching clinics:', error);
            this.toastService.create('Failed to load clinics', 'danger');
          },
        });
      } else if (this.usertype.UserType === 'PA') {
        this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              console.log('PA Clinics:', this.clinics);
              this.selectedClinicId = this.clinicId || (this.clinics.length > 0 ? this.clinics[0].Id : null);
              if (this.selectedClinicId) {
                this.getBrandAmount(this.selectedClinicId);
              }
            } else {
              this.toastService.create(response.Message, 'danger');
            }
          },
          error: (error) => {
            loading.dismiss();
            console.error('Error fetching PA clinics:', error);
            this.toastService.create('Failed to load clinics', 'danger');
          },
        });
      }
    } catch (error) {
      console.error('Error in loadClinics:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  async getBrandAmount(id: string) {
    const loading = await this.loadingController.create({
      message: 'Loading...',
    });
    await loading.present();

    this.brandService.getBrandAmount(id).subscribe(
      (res: { IsSuccess: boolean; ResponseData: BrandAmountDTO[]; Message: string }) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.brandAmounts = res.ResponseData.sort((a, b) => a.BrandName.localeCompare(b.BrandName));
          console.log('Brand Amounts:', this.brandAmounts);
        } else {
          this.toastService.create(res.Message || 'Failed to fetch brand amounts', 'danger');
        }
      },
      (err) => {
        loading.dismiss();
        console.error('Error fetching brand amounts:', err);
        this.toastService.create('Failed to fetch brand amounts', 'danger');
      }
    );
  }

  onClinicChange(event: any) {
    const clinicId = event.detail.value;
    console.log('Selected Clinic ID:', clinicId);
    this.getBrandAmount(clinicId);
  }

  async updateBrandAmount() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.brandService.putBrandAmount(this.brandAmounts)
      .subscribe(res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create("successfully updated");
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      }, (err) => {
        loading.dismiss();
        this.toastService.create(err, 'danger')
      });
  }
 
async downloadPDF() {
  try {
    const loading = await this.loadingController.create({
      message: 'Downloading PDF...'
    });
    await loading.present();

    const doctorId = await this.storage.get(environment.DOCTOR_Id);
    
    this.brandService.downloadPdf(doctorId, { observe: 'response', responseType: 'blob' }).subscribe(
      (response) => {
        const blob = response.body;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `brand-report-${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        loading.dismiss();
        this.toastService.create('PDF downloaded successfully', 'success');
      },
      error => {
        loading.dismiss();
        console.error('Error downloading PDF:', error);
        this.toastService.create('Failed to download PDF', 'danger');
      }
    );
  } catch (error) {
    console.error('Error in downloadPDF:', error);
    this.toastService.create('An unexpected error occurred', 'danger');
    this.loadingController.dismiss();
  }
}
}