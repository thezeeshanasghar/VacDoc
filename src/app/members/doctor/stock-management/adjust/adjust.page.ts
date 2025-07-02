import { Component, OnInit } from '@angular/core';
import { ToastService } from 'src/app/shared/toast.service';
import { BrandService } from 'src/app/services/brand.service';
import { StockService, AdjustStockDTO } from 'src/app/services/stock.service';
import { LoadingController } from '@ionic/angular';
import { ClinicService } from 'src/app/services/clinic.service';
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { PaService } from "src/app/services/pa.service";
interface StockAdjustment {
  brandName: any;
  brandId: number;
  type: 'increase' | 'decrease';
  date: string;
  quantity: number;
  price: number;
  reason: string;
}

@Component({
  selector: 'app-adjust',
  templateUrl: './adjust.page.html',
  styleUrls: ['./adjust.page.scss']
})
export class AdjustPage implements OnInit {
    isIncrease: boolean = false;
    isDecrease: boolean = false;
    adjustment: StockAdjustment = {
    brandName: null,
    brandId: null,
    type: null,
    date: new Date().toISOString(),
    quantity: null,
    price: null,
    reason: ''
  };
  brands = [];
  filteredBrands: any[] = [];
  doctorId: number;
  DoctorId: any;
  clinicid: string;
  selectedClinic: string = '';
  clinic: string = '';
  clinics: any[] = [];
  usertype: any;
  selectedClinicId: any;
  clinicId: any;

  constructor(
    private brandService: BrandService,
    private stockService: StockService,
    private toastService: ToastService,
    private loadingController: LoadingController,
    private clinicService: ClinicService,
    private storage: Storage,
    private paService: PaService
  ) {}

  async ngOnInit() {
    this.usertype = await this.storage.get(environment.USER);
    console.log('User Type:', this.usertype);
     this.clinicId = await this.storage.get(environment.CLINIC_Id);
    console.log('Clinic ID:', this.clinicId);
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    console.log('Doctor ID:', this.doctorId);
    await this.loadClinics();
  }
  // async ngOnInit() {
  //   try {
  //     this.doctorId = await this.storage.get(environment.DOCTOR_Id);
  //     this.clinicId = await this.storage.get(environment.CLINIC_Id);
  //     this.usertype = await this.storage.get(environment.USER);

  //     if (!this.doctorId || !this.usertype) {
  //       console.error("Doctor ID or User Type not found in storage.");
  //       this.toastService.create("Failed to load user data", "danger");
  //       return;
  //     }

  //     console.log("Doctor ID:", this.doctorId);
  //     console.log("Clinic ID:", this.clinicId);
  //     console.log("User Type:", this.usertype);

  //     await this.loadClinics();
  //   } catch (error) {
  //     console.error("Error during initialization:", error);
  //     this.toastService.create("An unexpected error occurred", "danger");
  //   }
  // }

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
              this.selectedClinic = this.clinicId || (this.clinics.length > 0 ? this.clinics[0].Id : null);
              // if (this.selectedClinicId) {
              //   this.getBill(this.selectedClinicId);
              // }
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
              this.selectedClinic = this.clinics.length > 0 ? this.clinics[0].Id : null;
              // if (this.selectedClinicId) {
              //   this.getBill(this.selectedClinicId);
              // }
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

  filterBrands(event: string) {
    const filterValue = event.toLowerCase();
    this.filteredBrands = this.brands.filter(brand =>
      brand.name.toLowerCase().includes(filterValue)
    );
  }

  selectBrand(event: any) {
    const selectedBrand = this.brands.find(brand => brand.name === event.option.value);
    if (selectedBrand) {
      this.adjustment.brandId = selectedBrand.id;
      this.adjustment.brandName = selectedBrand.name;
      this.adjustment.price = selectedBrand.price; 
    }
  }

  // async loadBrands() {
  //   try {
  //     this.brandService.getBrands().subscribe({
  //       next: (response) => {
  //         if (response.IsSuccess) {
  //           console.log('Brands:', response.ResponseData);
  //           this.brands = response.ResponseData.map(brand => ({
  //             id: brand.Id,
  //             name: brand.Name
  //           }));
  //         } else {
  //           this.toastService.create(response.Message, 'danger');
  //         }
  //       },
  //       error: (error) => {
  //         console.error('Error fetching brands:', error);
  //         this.toastService.create('Failed to load brands', 'danger');
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Error in loadBrands:', error);
  //     this.toastService.create('An unexpected error occurred', 'danger');
  //   }
  // }
  async loadBrands(id:any) {
    try {
      const loading = await this.loadingController.create({
        message: 'Loading brands...'
      });
      await loading.present();
      this.brandService.getBrandAmount(id).subscribe({
        next: (response) => {
          if (response.IsSuccess) {
            console.log('Brands:', response.ResponseData);
            this.brands = response.ResponseData.map(brand => ({
              id: brand.BrandId,
              name: brand.BrandName,
              price: brand.Amount,       
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
  onIncreaseChange() {
    if (this.isIncrease) {
        this.isDecrease = false;
        this.adjustment.type = 'increase';
    }
}

onDecreaseChange() {
    if (this.isDecrease) {
        this.isIncrease = false;
        this.adjustment.type = 'decrease';
    }
}
async onSubmit() {
    if (!this.isValid()) {
      return;
    }
    try {
      const loading = await this.loadingController.create({
        message: 'Adjusting stock...'
      });
      await loading.present();

      const dto: AdjustStockDTO = {
        DoctorId: this.doctorId,
        brandId: this.adjustment.brandId,
        adjustment: this.isIncrease ? this.adjustment.quantity : -this.adjustment.quantity,
        clinicId: this.selectedClinic,
        price: this.adjustment.price,
        reason: this.adjustment.reason,
        date: new Date(this.adjustment.date)
      };

      this.stockService.adjustStock(dto).subscribe({
        next: (response) => {
          loading.dismiss();
          if (response.IsSuccess) {
            this.toastService.create(response.Message, 'success');
            this.resetForm();
          } else {
            this.toastService.create(response.Message, 'danger');
          }
        },
        error: (error) => {
          loading.dismiss();
          console.error('Error adjusting stock:', error);
          this.toastService.create('Failed to adjust stock', 'danger');
        }
      });
    } catch (error) {
      console.error('Error in onSubmit:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  private isValid(): boolean {
    if (!this.adjustment.brandId) {
      this.toastService.create('Please select a brand', 'warning');
      return false;
    }
    if (!this.adjustment.quantity || this.adjustment.quantity <= 0) {
      this.toastService.create('Please enter a valid quantity', 'warning');
      return false;
    }
    if (!this.adjustment.reason) {
      this.toastService.create('Please enter a reason for adjustment', 'warning');
      return false;
    }
    if (!this.isIncrease && !this.isDecrease) {
      this.toastService.create('Please select adjustment type', 'warning');
      return false;
    }
    return true;
  }

  private resetForm() {
    this.adjustment = {
      brandName: null,
      brandId: null,
      type: null,
      date: new Date().toISOString(),
      quantity: null,
      price: null,
      reason: ''
    };
    this.isIncrease = false;
    this.isDecrease = false;
  }
}