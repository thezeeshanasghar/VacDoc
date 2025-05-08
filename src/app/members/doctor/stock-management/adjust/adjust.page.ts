import { Component, OnInit } from '@angular/core';
import { ToastService } from 'src/app/shared/toast.service';
import { BrandService } from 'src/app/services/brand.service';
import { StockService, AdjustStockDTO } from 'src/app/services/stock.service';
import { LoadingController } from '@ionic/angular';
import { ClinicService } from 'src/app/services/clinic.service';
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";

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
  // clinicService: any;
  selectedClinic: string = '';
  clinic: string = '';
  clinics: any[] = [];

  constructor(
    private brandService: BrandService,
    private stockService: StockService,
    private toastService: ToastService,
    private loadingController: LoadingController,
    private clinicService: ClinicService,
    private storage: Storage,
  ) {}

  async ngOnInit() {
    this.loadBrands();
    this.DoctorId = await this.storage.get(environment.DOCTOR_Id);
    console.log('Doctor ID:', this.DoctorId);
    await this.loadClinics(this.DoctorId);
  }

  async loadClinics(id:number) {
    try {
      const loading = await this.loadingController.create({
        message: "Loading clinics...",
      });
      await loading.present();
      console.log("Doctor ID:", id);

      this.clinicService.getClinics(id).subscribe({
        next: (response) => {
          loading.dismiss();
          // if (response.IsSuccess) {
            this.clinics = response.ResponseData;
            console.log("Clinics:", this.clinics);
            this.storage.get(environment.CLINIC_Id).then((val) => {
              console.log('Clinic ID:', val);
              this.selectedClinic = val;
            });
          // } else {
          //   this.toastService.create(response.Message, "danger");
          // }
        },
        error: (error) => {
          loading.dismiss();
          console.error("Error fetching clinics:", error);
          this.toastService.create("Failed to load clinics", "danger");
        },
      });
    } catch (error) {
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
  async loadBrands() {
    try {
      const loading = await this.loadingController.create({
        message: 'Loading brands...'
      });
      await loading.present();
  
      // const doctorId = await this.storage.get(environment.DOCTOR_Id);
      this.clinicid = await this.storage.get(environment.CLINIC_Id);
      
      this.brandService.getBrandAmount( this.clinicid).subscribe({
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
        DoctorId: this.DoctorId,
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