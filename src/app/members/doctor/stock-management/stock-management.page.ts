import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import { BrandService } from "src/app/services/brand.service";
import { ToastService } from "src/app/shared/toast.service";
import { environment } from "src/environments/environment";
import { StockService, BillDetails, Response } from "src/app/services/stock.service";
import { ClinicService } from "src/app/services/clinic.service";
import { PaService } from "src/app/services/pa.service";

interface BrandAmountDTO {
  BrandId: string;
  VaccineName: string;
  BrandName: string;
  Amount: number;
  Count: number;
}

@Component({
  selector: "app-stock-management",
  templateUrl: "./stock-management.page.html",
})
export class StockManagementPage implements OnInit {
  brandAmounts: BrandAmountDTO[] = [];
  data: BillDetails[];
  clinics: any[] = [];
  clinicId: any;
  selectedClinicId: any;
  doctorId: any;
  usertype: any;

  constructor(
    private loadingController: LoadingController,
    private storage: Storage,
    private brandService: BrandService,
    private toastService: ToastService,
    private clinicService: ClinicService,
    private stockService: StockService,
    private paService: PaService
  ) {}

  async ngOnInit() {
    try {
      this.doctorId = await this.storage.get(environment.DOCTOR_Id);
      this.clinicId = await this.storage.get(environment.CLINIC_Id);
      this.usertype = await this.storage.get(environment.USER);

      if (!this.doctorId || !this.usertype) {
        console.error("Doctor ID or User Type not found in storage.");
        this.toastService.create("Failed to load user data", "danger");
        return;
      }

      console.log("Doctor ID:", this.doctorId);
      console.log("Clinic ID:", this.clinicId);
      console.log("User Type:", this.usertype);

      await this.loadClinics();
    } catch (error) {
      console.error("Error during initialization:", error);
      this.toastService.create("An unexpected error occurred", "danger");
    }
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
              this.selectedClinicId = this.clinicId || (this.clinics.length > 0 ? this.clinics[0].Id : null);
              if (this.selectedClinicId) {
                this.getBill(this.selectedClinicId);
              }
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
              if (this.selectedClinicId) {
                this.getBill(this.selectedClinicId);
              }
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

  async getBill(clinicId: string) {
    const loading = await this.loadingController.create({
      message: "Loading bills...",
    });
    await loading.present();

    this.stockService.getBills(Number(clinicId)).subscribe({
      next: (res: Response<BillDetails[]>) => {
        loading.dismiss();
        if (res.IsSuccess) {
          console.log("Bills:", res.ResponseData);
          this.data = res.ResponseData;
        } else {
          this.toastService.create(res.Message || "Failed to fetch bills", "danger");
        }
      },
      error: (err) => {
        loading.dismiss();
        console.error("Error fetching bills:", err);
        this.toastService.create("Failed to fetch bills", "danger");
      },
    });
  }

  async updateBrandAmount() {
    const loading = await this.loadingController.create({
      message: "Updating brand amounts...",
    });
    await loading.present();

    this.brandService.putBrandAmount(this.brandAmounts).subscribe({
      next: (res) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create("Successfully updated brand amounts", "success");
        } else {
          this.toastService.create(res.Message, "danger");
        }
      },
      error: (err) => {
        loading.dismiss();
        console.error("Error updating brand amounts:", err);
        this.toastService.create("Failed to update brand amounts", "danger");
      },
    });
  }

  async approvePurchase(billId: number) {
    const loading = await this.loadingController.create({
      message: "Approving purchase...",
    });
    await loading.present();

    this.stockService.patchIsApproved(billId).subscribe({
      next: (response: any) => {
        loading.dismiss();
        console.log("API Response:", response);
        this.toastService.create(response.message, "success");
        this.getBill(response.schedule.ClinicId); // Refresh the data
      },
      error: (error) => {
        loading.dismiss();
        console.error("Error approving purchase:", error);
        this.toastService.create(error.error.message || "Failed to approve purchase", "danger");
      },
    });
  }
}
// import { Component, OnInit } from "@angular/core";
// import { LoadingController } from "@ionic/angular";
// import { Storage } from "@ionic/storage";
// import { BrandService } from "src/app/services/brand.service";
// import { ToastService } from "src/app/shared/toast.service";
// import { environment } from "src/environments/environment";
// import { FormGroup, FormBuilder, FormControl, FormArray } from "@angular/forms";
// import { StockService, BillDetails, Response } from "src/app/services/stock.service";
// import { ClinicService } from "src/app/services/clinic.service";
// import { PaService } from "src/app/services/pa.service";

// interface BrandAmountDTO {
//   BrandId: string;
//   VaccineName: string;
//   BrandName: string;
//   Amount: number;
//   Count: number;
//   // Add other properties as needed
// }
// // export interface BillDetails {
// //   BrandId: number;
// //   VaccineName: string;
// //   BrandName: string;
// //   Amount: number;
// //   Count: number;
// //   // Add other properties as needed
// // }
// @Component({
//   selector: "app-stock-management",
//   templateUrl: "./stock-management.page.html",
// })
// export class StockManagementPage implements OnInit {
//   brandAmounts: BrandAmountDTO[] = [];
//   fg: FormGroup;
//   data: BillDetails[];
//   clinics: any;
//   clinicId: any;
//   selectedClinicId: any;
//   doctorId: any;
//   usertype: any;

//   clinic: any;
//   // clinicService: any;
//   constructor(
//      public loadingController: LoadingController,
//      private storage: Storage, 
//      private brandService: BrandService, 
//      private toastService: ToastService, 
//      private clinicService: ClinicService, 
//      private stockService: StockService,
//      private paService: PaService,
//     ){}


//   async ngOnInit() {
//     // this.storage.get(environment.DOCTOR_Id).then((val) => {
//     //   this.getBill(val);
//     // });
//     this.storage.get(environment.CLINIC_Id).then((val) => {

//       console.log("Clinic ID:", val);
//       this.clinic = val;

//       this.getBill(val);
//     });
//     this.storage.get(environment.DOCTOR_Id).then((val) => {
//       console.log("Doctor ID:", val);
//       this.doctorId = val;
//     });
//     this.loadClinics();
//     this.storage.get(environment.USER).then((user) => {
//       if (user) {
//         console.log('Retrieved user from storage:', user);
//         this.usertype = user.UserType; // Ensure this is set correctly
//       } else {
//         console.error('No user data found in storage.');
//       }
//     });
//   }

//   onClinicChange(event: any) {
//     const clinicId = event.detail.value;
//     console.log("Selected Clinic ID:", clinicId);
//     this.getBill(clinicId);
//   }

//   // async loadClinics(id: number) {
//   //   try {
//   //     const loading = await this.loadingController.create({
//   //       message: "Loading clinics...",
//   //     });
//   //     await loading.present();
//   //     this.clinicService.getClinics(Number(id)).subscribe({
//   //       next: (response) => {
//   //         loading.dismiss();
//   //         if (response.IsSuccess) {
//   //           this.clinics = response.ResponseData;
//   //           console.log("Clinics:", this.clinics);
//   //           console.log("Clinic ID:", this.clinicId);
//   //           this.selectedClinicId = this.clinic;
//   //           if (this.selectedClinicId) {
//   //             this.getBill(this.selectedClinicId);
//   //           }
//   //         } else {
//   //           this.toastService.create(response.Message, "danger");
//   //         }
//   //       },
//   //       error: (error) => {
//   //         loading.dismiss();
//   //         console.error("Error fetching clinics:", error);
//   //         this.toastService.create("Failed to load clinics", "danger");
//   //       },
//   //     });
//   //   } catch (error) {
//   //     console.error("Error in loadClinics:", error);
//   //     this.toastService.create("An unexpected error occurred", "danger");
//   //   }
//   // }

//   async loadClinics() {
//     try {
//       const loading = await this.loadingController.create({
//         message: 'Loading clinics...',
//       });
//       await loading.present();
//       if (this.usertype.UserType === 'DOCTOR') {
//         this.clinicService.getClinics(Number(this.doctorId)).subscribe({
//           next: (response) => {
//             loading.dismiss();
//             if (response.IsSuccess) {
//               loading.dismiss();
//               this.clinics = response.ResponseData;
//               console.log('Clinics:', this.clinics);
//               this.selectedClinicId = this.clinicId || (this.clinics.length > 0 ? this.clinics[1].Id : null);
//               console.log('Selected Clinic ID:', this.selectedClinicId);
//               if (this.selectedClinicId) {
//                 this.getBill(this.selectedClinicId);
//               }
//             } else {
//               loading.dismiss();
//               this.toastService.create(response.Message, 'danger');
//             }
//           },
//           error: (error) => {
//             loading.dismiss();
//             console.error('Error fetching clinics:', error);
//             this.toastService.create('Failed to load clinics', 'danger');
//           },
//         });
//       } else if (this.usertype.UserType === 'PA') {
//         this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
//           next: (response) => {
//             loading.dismiss();
//             if (response.IsSuccess) {
//               loading.dismiss();
//               this.clinics = response.ResponseData;
//               console.log('PA Clinics:', this.clinics);
//               this.selectedClinicId = (this.clinics.length > 0 ? this.clinics[0].Id : null);
//               console.log('Selected PA Clinic ID:', this.selectedClinicId);
//               if (this.selectedClinicId) {
//                 this.getBill(this.selectedClinicId);
//               }
//             } else {
//               loading.dismiss();
//               this.toastService.create(response.Message, 'danger');
//             }
//           },
//           error: (error) => {
//             loading.dismiss();
//             console.error('Error fetching PA clinics:', error);
//             this.toastService.create('Failed to load clinics', 'danger');
//           },
//         });
//       }
//     } catch (error) {
//       console.error('Error in loadClinics:', error);
//       this.toastService.create('An unexpected error occurred', 'danger');
//     }
//   }

//   async getBill(id: string) {
//     const loading = await this.loadingController.create({
//       message: "Loading",
//     });
//     await loading.present();
//     this.stockService.getBills(Number(id)).subscribe(
//       (res: Response<BillDetails[]>) => {
//         loading.dismiss();
//         if (res.IsSuccess) {

//           console.log("Bills:", res.ResponseData);
//           this.data = res.ResponseData;
//           console.log("Data:", this.data);
//           // this.brandAmounts = res.ResponseData.map(bill => ({
//           //   BrandId: bill.billNo,
//           //   VaccineName: bill.VaccineName,
//           //   BrandName: bill.BrandName,
//           //   Amount: bill.Amount,
//           //   Count: bill.Count
//           // }));
//           console.log("Brand Amounts:", this.brandAmounts);
//           // this.brandAmounts.sort((a, b) => {
//           //   const vaccineComparison = a.VaccineName.localeCompare(b.VaccineName);
//           //   return vaccineComparison !== 0 ? vaccineComparison : a.BrandName.localeCompare(b.BrandName);
//           // });
//           console.log("Brand Amounts:", this.brandAmounts);
//         } else {
//           this.toastService.create(res.Message || "Failed to fetch brand amounts", "danger");
//         }
//       },
//       (err) => {
//         loading.dismiss();
//         console.error("Error fetching brand amounts:", err);
//         this.toastService.create("Failed to fetch brand amounts", "danger");
//       }
//     );
//   }

//   async updateBrandAmount() {
//     const loading = await this.loadingController.create({
//       message: "Loading",
//     });
//     await loading.present();
//     await this.brandService.putBrandAmount(this.brandAmounts).subscribe(
//       (res) => {
//         if (res.IsSuccess) {
//           loading.dismiss();
//           this.toastService.create("successfully updated");
//         } else {
//           loading.dismiss();
//           this.toastService.create(res.Message, "danger");
//         }
//       },
//       (err) => {
//         loading.dismiss();
//         this.toastService.create(err, "danger");
//       }
//     );
//   }


//   async approvePurchase(billId: number) {
//     const loading = await this.loadingController.create({
//       message: 'approved',
//     });
//     await loading.present();
  
//   // Define the data object
//     this.stockService.patchIsApproved(billId).subscribe(
//       (response: any) => {
//         console.log('API Response:', response);
//         this.toastService.create(response.message, 'success');
//         loading.dismiss();
//         this.getBill(response.schedule.ClinicId); // Refresh the vaccination data
//       },
//       (error) => {
//         console.error('Error updating IsPAApprove:', error);
//         this.toastService.create(error.error.message, 'danger');
//         loading.dismiss();
//       }
//     );
//   }

// }

