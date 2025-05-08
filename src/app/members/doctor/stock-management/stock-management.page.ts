import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { BrandService } from 'src/app/services/brand.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { FormGroup, FormBuilder, FormControl, FormArray } from '@angular/forms';
import { StockService, BillDetails, Response } from 'src/app/services/stock.service';
import { ClinicService } from 'src/app/services/clinic.service';

interface BrandAmountDTO {
  BrandId: string;
  VaccineName: string;
  BrandName: string;
  Amount: number;
  Count: number;
  // Add other properties as needed
}
// export interface BillDetails {
//   BrandId: number;
//   VaccineName: string;
//   BrandName: string;
//   Amount: number;
//   Count: number;
//   // Add other properties as needed 
// }
@Component({
  selector: 'app-stock-management',
  templateUrl: './stock-management.page.html',
})
export class StockManagementPage implements OnInit {

  brandAmounts: BrandAmountDTO[] = [];
  fg: FormGroup
  data: BillDetails[];
  clinics: any;
  clinicId: any;
  selectedClinicId: any;
  doctorId: any;
  // clinicService: any;
  constructor(
    public loadingController: LoadingController,
    private storage: Storage,
    private brandService: BrandService,
    private toastService: ToastService,
    private clinicService: ClinicService,
    private stockService: StockService,
  ) { }

  ngOnInit() {
    // this.storage.get(environment.DOCTOR_Id).then((val) => {
    //   this.getBrandAmount(val);
    // });
    this.storage.get(environment.CLINIC_Id).then((val) => {
      console.log('Clinic ID:', val);
      this.getBrandAmount(val);
    });
    this.storage.get(environment.DOCTOR_Id).then((val) => {
      console.log('Doctor ID:', val);
      this.doctorId = val;
      this.loadClinics(this.doctorId);
    });
  }
  onClinicChange(event: any) {
    const clinicId = event.detail.value;
    console.log('Selected Clinic ID:', clinicId);
    this.getBrandAmount(clinicId);
  }
  async loadClinics(id: number) {
    try {
      const loading = await this.loadingController.create({
        message: 'Loading clinics...',
      });
      await loading.present();

      this.clinicService.getClinics(Number(id)).subscribe({
        next: (response) => {
          loading.dismiss();
          if (response.IsSuccess) {
            this.clinics = response.ResponseData;
            console.log('Clinics:', this.clinics);
           
              console.log('Clinic ID:', this.clinicId);
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
    } catch (error) {
      console.error('Error in loadClinics:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  async getBrandAmount(id: string) {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();

    this.stockService.getBills(Number(id)).subscribe(
      (res: Response<BillDetails[]>) => {
        loading.dismiss();
        if (res.IsSuccess) {
          console.log('Bills:', res.ResponseData);
          this.data=res.ResponseData;
          console.log('Data:', this.data);
          // this.brandAmounts = res.ResponseData.map(bill => ({
          //   BrandId: bill.billNo,
          //   VaccineName: bill.VaccineName,
          //   BrandName: bill.BrandName,
          //   Amount: bill.Amount,
          //   Count: bill.Count
          // }));
          console.log('Brand Amounts:', this.brandAmounts);
          // this.brandAmounts.sort((a, b) => {
          //   const vaccineComparison = a.VaccineName.localeCompare(b.VaccineName);
          //   return vaccineComparison !== 0 ? vaccineComparison : a.BrandName.localeCompare(b.BrandName);
          // });
          console.log('Brand Amounts:', this.brandAmounts);
        } else {
          this.toastService.create(res.Message || 'Failed to fetch brand amounts', 'danger');
        }
      },
      err => {
        loading.dismiss();
        console.error('Error fetching brand amounts:', err);
        this.toastService.create('Failed to fetch brand amounts', 'danger');
      }
    );
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

}