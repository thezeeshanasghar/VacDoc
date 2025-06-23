import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StockService } from 'src/app/services/stock.service';
import { LoadingController } from '@ionic/angular';
import { ToastService } from 'src/app/shared/toast.service';
import { ClinicService } from 'src/app/services/clinic.service';
import { BrandService } from 'src/app/services/brand.service';
import { PaService } from 'src/app/services/pa.service';
import { environment } from 'src/environments/environment';
import { Storage } from '@ionic/storage';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';

@Component({
  selector: 'app-itemreport',
  templateUrl: './itemreport.page.html',
  styleUrls: ['./itemreport.page.scss'],
})
export class ItemReportPage implements OnInit {
  clinics: any[] = [];
  selectedClinicId: any;
  doctorId: any;
  salesReportForm: FormGroup;
  salesReportData: any[] = [];
  todaydate: string;
  filteredBrands: any[] = [];
  usertype: any;
  clinicid: any;
  brands: { id: number; name: string; price: number; vaccineName?: string; displayName: string }[] = [];
  adjustment: { brandName: string; brandId?: number } = { brandName: '', brandId: null };
  constructor(
    private route: ActivatedRoute,
    private brandService: BrandService,
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
      fromDate: [this.todaydate, Validators.required],
      toDate: [this.todaydate, Validators.required],
    });
  }

  async ngOnInit() {
    try {
      this.usertype = await this.storage.get(environment.USER);
      this.clinicid = await this.storage.get(environment.CLINIC_Id);
      this.doctorId = await this.storage.get(environment.DOCTOR_Id);

      if (!this.doctorId) {
        this.toastService.create('Doctor ID not found', 'danger');
        return;
      }

      console.log('User Type:', this.usertype);
      console.log('Clinic ID:', this.clinicid);
      console.log('Doctor ID:', this.doctorId);

      await this.loadClinics();
      this.loadBrands();
      this.filteredBrands = this.brands;
    } catch (error) {
      console.error('Error during initialization:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  filterBrands(searchTerm: string) {
    if (!searchTerm) {
      this.filteredBrands = this.brands; // Show all brands if search term is empty
    } else {
      this.filteredBrands = this.brands.filter((brand) =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }

  selectBrand(event: any) {
    const selectedBrand = this.brands.find((brand) => brand.name === event.option.value);
    if (selectedBrand) {
      console.log('Selected Brand:', selectedBrand);
      this.adjustment.brandName = selectedBrand.name;
      this.adjustment.brandId = selectedBrand.id; // Set the brand ID
    }
  }

  async loadClinics() {
    const loading = await this.loadingController.create({
      message: 'Loading clinics...',
    });
    await loading.present();

    try {
      if (this.usertype.UserType === 'DOCTOR') {
        this.clinicService.getClinics(Number(this.doctorId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              this.selectedClinicId = this.clinicid || (this.clinics.length > 0 ? this.clinics[0].Id : null);
              console.log('Clinics:', this.clinics);
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
              this.selectedClinicId = this.clinics.length > 0 ? this.clinics[0].Id : null;
              console.log('PA Clinics:', this.clinics);
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
      loading.dismiss();
      console.error('Error in loadClinics:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  async getItemsReport() {
    const fromDateString = moment(this.salesReportForm.value.fromDate).format('YYYY-MM-DD'); // Format to YYYY-MM-DD
    const toDateString = moment(this.salesReportForm.value.toDate).format('YYYY-MM-DD'); // Format to YYYY-MM-DD
  //   const fromDate = new Date(fromDateString);
  // const toDate = new Date(toDateString);
    const payload = {
      clinicId: this.selectedClinicId,
      brandId: this.adjustment.brandId,
      fromDate: fromDateString, 
      toDate: toDateString,   
    };
  
    console.log('Payload:', payload);
  
    const loading = await this.loadingController.create({
      message: 'Fetching items report...',
    });
    await loading.present();
  
    try {
      this.stockService.getItemsReportFile(payload.clinicId, payload.brandId, payload.fromDate, payload.toDate).subscribe({
        next: (response) => {
          loading.dismiss();
          const blob = new Blob([response], { type: 'application/pdf' });
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = `ItemsReport_${payload.clinicId}_${payload.brandId}_${payload.fromDate}_${payload.toDate}.pdf`;
          link.click();
          window.URL.revokeObjectURL(link.href);
          this.toastService.create('Sales report downloaded successfully', 'success');
        },
        error: (error) => {
          loading.dismiss();
          console.error('Error fetching sales report:', error);
          this.toastService.create('Failed to fetch sales report', 'danger');
        },
      });
    } catch (error) {
      loading.dismiss();
      console.error('Error in getItemsReport:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  async loadBrands() {
        try {
          const loading = await this.loadingController.create({
            message: 'Loading brands...'
          });
          await loading.present();
          this.clinicid = await this.storage.get(environment.CLINIC_Id);
          this.brandService.getBrandAmount(this.clinicid).subscribe({
            next: (response) => {
              if (response.IsSuccess) {
                console.log('Brand Amounts:', response.ResponseData);
                this.brands = response.ResponseData.map(brand => ({
                  id: brand.BrandId,
                  name: brand.BrandName,
                  price: brand.PurchasedAmt,
                  vaccineName: brand.VaccineName || '',
                  displayName: brand.VaccineName ? `${brand.BrandName} (${brand.VaccineName})` : brand.BrandName
                }));
                this.filteredBrands = [...this.brands];
                loading.dismiss();
              } else {
                loading.dismiss();
                this.toastService.create(response.Message, 'danger');
              }
            },
            error: (error) => {
              loading.dismiss();
              console.error('Error fetching brand amounts:', error);
              this.toastService.create('Failed to load brands', 'danger');
            }
          });
      
        } catch (error) {
          console.error('Error in loadBrands:', error);
          this.toastService.create('An unexpected error occurred', 'danger');
        }
      }
}


// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { StockService } from 'src/app/services/stock.service';
// import { LoadingController } from '@ionic/angular';
// import { ToastService } from 'src/app/shared/toast.service';
// import { ClinicService } from 'src/app/services/clinic.service';
// import { PaService } from 'src/app/services/pa.service';
// import { environment } from 'src/environments/environment';
// import { Storage } from '@ionic/storage';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import * as moment from 'moment';

// @Component({
//   selector: 'app-itemreport',
//   templateUrl: './itemreport.page.html',
//   styleUrls: ['./itemreport.page.scss'],
// })
// export class ItemReportPage implements OnInit {
// clinics: any[] = [];
// selectedClinicId: any;
// doctorId: any;
// salesReportForm: FormGroup;
// salesReportData: any[] = [];
// todaydate;
// givenDatecheck: string;
// fromDateTime: string;
// toDateTime: string;
// usertype: any;
// clinicid: any;
// brands: { id: number; name: string; price: number; vaccineName?: string; displayName: string }[] = [];
// filteredBrands: any[];
//   constructor(
//     private route: ActivatedRoute,
//     private stockService: StockService,
//     public loadingController: LoadingController,
//     private storage: Storage,
//     private toastService: ToastService,
//     private clinicService: ClinicService,
//     private paService: PaService,
//     private formBuilder: FormBuilder,
//     private brandService: any 
//   ) {
//     this.todaydate = new Date().toISOString().slice(0, 10);
//     this.salesReportForm = this.formBuilder.group({
//       fromDate: [this.todaydate],
//       toDate: [this.todaydate],
//     });
//   }

//   async ngOnInit() {
//     this.usertype = await this.storage.get(environment.USER);
//     console.log('User Type:', this.usertype);
//     this.storage.get(environment.CLINIC_Id).then((val) => {
//       console.log('Clinic ID:', val);
//       this.clinicid = val;
//       // this.loadBrands();
//     });
//     this.doctorId = await this.storage.get(environment.DOCTOR_Id);
//     if (!this.doctorId) {
//       this.toastService.create('Doctor ID not found', 'danger');
//       return;
//     }
//     await this.loadClinics();
//   }

//   async loadClinics() {
//     const loading = await this.loadingController.create({
//       message: "Loading clinics...",
//     });
//     await loading.present();

//     try {
//       if (this.usertype.UserType === "DOCTOR") {
//         this.clinicService.getClinics(Number(this.doctorId)).subscribe({
//           next: (response) => {
//             loading.dismiss();
//             if (response.IsSuccess) {
//               this.clinics = response.ResponseData;
//               console.log("Clinics:", this.clinics);
//               this.selectedClinicId = this.clinicid || (this.clinics.length > 0 ? this.clinics[0].Id : null);
//             } else {
//               this.toastService.create(response.Message, "danger");
//             }
//           },
//           error: (error) => {
//             loading.dismiss();
//             console.error("Error fetching clinics:", error);
//             this.toastService.create("Failed to load clinics", "danger");
//           },
//         });
//       } else if (this.usertype.UserType === "PA") {
//         this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
//           next: (response) => {
//             loading.dismiss();
//             // if (response.IsSuccess) {
//               this.clinics = response.ResponseData;
//               console.log("PA Clinics:", this.clinics);
//               this.selectedClinicId = this.clinics.length > 0 ? this.clinics[0].Id : null;
//             } else {
//               this.toastService.create(response.Message, "danger");
//             }
//           },
//           error: (error) => {
//             loading.dismiss();
//             console.error("Error fetching PA clinics:", error);
//             this.toastService.create("Failed to load clinics", "danger");
//           },
//         });
//       }
//     } catch (error) {
//       loading.dismiss();
//       console.error("Error in loadClinics:", error);
//       this.toastService.create("An unexpected error occurred", "danger");
//     }
//   }

//   // filterBrands(event: string) {
//   //   const filterValue = event.toLowerCase();
//   //   this.filteredBrands = this.brands.filter(brand =>
//   //     brand.name.toLowerCase().includes(filterValue)
//   //   );
//   // }

//   // selectBrand(event: any) {
//   //   const selectedBrand = this.brands.find(brand => brand.name === event.option.value);
//   //   console.log('Selected Brand:', selectedBrand);
//   //   // if (selectedBrand) {
//   //   //   this.adjustment.brandId = selectedBrand.id;
//   //   //   this.adjustment.brandName = selectedBrand.name;
//   //   //   this.adjustment.price = selectedBrand.price; 
//   //   // }
//   // }

//   async getItemsReport() {
//     const fromDate = moment(this.salesReportForm.value.fromDate).format('YYYY-MM-DD'); 
//     const toDate = moment(this.salesReportForm.value.toDate).format('YYYY-MM-DD'); 
//     try {
//       const loading = await this.loadingController.create({
//         message: 'Fetching sales report...',
//       });
//       await loading.present();

//       this.stockService
//         .getSalesReportFile(this.selectedClinicId, new Date(fromDate), new Date(toDate))
//         .subscribe({
//           next: (response) => {
//             loading.dismiss();
//             const blob = new Blob([response], { type: 'application/pdf' });
//             const link = document.createElement('a');
//             link.href = window.URL.createObjectURL(blob);
//             link.download = `SalesReport_${this.selectedClinicId}_${fromDate}_${toDate}.pdf`;
//             link.click();
//             window.URL.revokeObjectURL(link.href);
//             this.toastService.create('Sales report downloaded successfully', 'success');
//           },
//           error: (error) => {
//             loading.dismiss();
//             this.toastService.create('Failed to fetch sales report', 'danger');
//           },
//         });
//     } catch (error) {
//       this.toastService.create('An unexpected error occurred', 'danger');
//     }
//   }

//   // async loadBrands() {
//   //   try {
//   //     const loading = await this.loadingController.create({
//   //       message: 'Loading brands...'
//   //     });
//   //     await loading.present();
//   //     this.clinicid = await this.storage.get(environment.CLINIC_Id);
//   //     this.brandService.getBrandAmount(this.clinicid).subscribe({
//   //       next: (response) => {
//   //         if (response.IsSuccess) {
//   //           this.brands = response.ResponseData.map(brand => ({
//   //             id: brand.BrandId,
//   //             name: brand.BrandName,
//   //             price: brand.PurchasedAmt,
//   //             vaccineName: brand.VaccineName || '',
//   //             displayName: brand.VaccineName ? `${brand.BrandName} (${brand.VaccineName})` : brand.BrandName
//   //           }));
//   //           this.filteredBrands = [...this.brands];
//   //           loading.dismiss();
//   //         } else {
//   //           loading.dismiss();
//   //           this.toastService.create(response.Message, 'danger');
//   //         }
//   //       },
//   //       error: (error) => {
//   //         loading.dismiss();
//   //         console.error('Error fetching brand amounts:', error);
//   //         this.toastService.create('Failed to load brands', 'danger');
//   //       }
//   //     });
  
//   //   } catch (error) {
//   //     console.error('Error in loadBrands:', error);
//   //     this.toastService.create('An unexpected error occurred', 'danger');
//   //   }
//   // }
// }