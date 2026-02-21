import { Component, OnInit, Input, ViewChild, ChangeDetectorRef } from "@angular/core";
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl
} from "@angular/forms";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { BrandService } from "src/app/services/brand.service";
import { ToastService } from "src/app/shared/toast.service";
import { Router } from "@angular/router";
import { LoadingController } from "@ionic/angular";
import { SignupService } from "src/app/services/signup.service";
import * as moment from "moment";
import { Geolocation } from "@ionic-native/geolocation/ngx";
//import { validateConfig } from "@angular/router/src/config";
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { File , FileEntry } from '@ionic-native/file/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { StockService, StockDTO } from 'src/app/services/stock.service';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { UploadService } from 'src/app/services/upload.service';
import { ClinicService } from "src/app/services/clinic.service";
import { PaService } from 'src/app/services/pa.service';
declare var google;

interface StockItem {
  brandName: string;
  brandId?: number;
  quantity: number;
  price: number;
  billNo?: string;
  batchLot?: string;
  expiry?: string;
}

interface BrandAmountDTO {
  BrandId: number;
  BrandName: string;
  VaccineName: string;
  PurchasedAmt?: number;
}

interface Supplier {
  Name: string;
}

interface Brand {
  price: number;
  id: number;
  name: string;
  vaccineName?: string;
  displayName?: string;
  PurchasedAmt?: number;
  [key: string]: string | number | undefined;
}
@Component({
  selector: "app-add",
  templateUrl: "./add.page.html",
  styleUrls: ["./add.page.scss"]
})
export class AddPage implements OnInit {
  suppliers: string[] =[];
  filteredSuppliers: string[];
  fg1: FormGroup;
  cities: string[] = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
  filteredCities: string[];
  purchaseDate: string;
  paymentDate: string;
  selectedClinic: string = '';
  defaultDate = new Date().toISOString();
  brand: string = '';
  supplierName: string = '';
  inventory: number = 0;
  purchasePrice: number = 0;
  stockItems: StockItem[] = [];
  brands: Brand[] = [];
  loading: boolean = false;
  error: string = null;
  isPaid: boolean = false;
  filteredBrands = [];
  bill: string;
  agents: string[] = [];
  originalAgents: any[];
  filteredClinics: any[] = []; // Filtered clinics for autocomplete
  clinic: string = '';
  clinics: any[] = []; // All clinics
  doctorId: string = '';
  clinicid: any;
  usertype: any;
  clinicId: any;
  constructor(
    private brandService: BrandService,
    private toastService: ToastService,
    private loadingController: LoadingController,
    private stockService: StockService,
    private fb: FormBuilder,
    private storage: Storage,
    private clinicService: ClinicService,
    private paService: PaService,
  ) {
    this.purchaseDate = this.defaultDate;
    this.paymentDate = this.defaultDate;
    this.filteredCities = this.cities;
  }
  
  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    if (!this.doctorId) {
      console.error("Doctor ID not found");
      this.toastService.create("Doctor ID not found", "danger");
      return;
    }
    this.storage.get(environment.USER).then((user) => {
      if (user) {
        console.log('Retrieved user from storage:', user);
        this.usertype = user.UserType; // Ensure this is set correctly
      } else {
        console.error('No user data found in storage.');
      }
    });
    this.usertype = await this.storage.get(environment.USER); // Fetch user type (e.g., 'DOCTOR' or 'PA')
    console.log('User Type:', this.usertype);
    this.clinicId = await this.storage.get(environment.CLINIC_Id);
    console.log('Clinic ID:', this.clinicId);
    this.loadBrands();
    this.fetchAgent();
    await this.loadClinics();
    this.fg1 = this.fb.group({
      agent: [''],
      city: [''], // Initialize form controls
      City2: ['']
    });
  }

  // async loadSuppliers() {
  //   try {
  //     const loading = await this.loadingController.create({
  //       message: 'Loading suppliers...'
  //     });
  //     await loading.present();

  //     this.stockService.getSuppliers().subscribe({
  //       next: (response) => {
  //         if (response.IsSuccess) {
  //           this.suppliers = response.ResponseData;
  //           console.log('Suppliers:', this.suppliers);

  //           this.filteredSuppliers = [...this.suppliers];
  //           loading.dismiss();
  //         } else {
  //           loading.dismiss();
  //           this.toastService.create(response.Message, 'danger');
  //         }
  //       },
  //       error: (error) => {
  //         loading.dismiss();
  //         console.error('Error loading suppliers:', error);
  //         this.toastService.create('Failed to load suppliers', 'danger');
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Error in loadSuppliers:', error);
  //     this.toastService.create('An unexpected error occurred', 'danger');
  //   }
  // }
  fetchAgent() {
    this.stockService.getSuppliers().subscribe(
      (agents: any) => {
        console.log('Fetched agents:', agents);
        this.agents = agents.ResponseData;
        this.originalAgents = [...this.agents]; // Store original agents for filtering
        console.log('Fetched agents:', agents.ResponseData); 
        console.log('Fetched agents:', agents.ResponseData.length);
      },
      (error: any) => {
        console.error('Error fetching agents:', error);
      }
    );
  }

  filterSuppliers(value: string) {
    if (!value.trim()) {
      this.agents = [...this.originalAgents]; // Restore original agents if input is empty
    } else {
      this.agents = this.originalAgents.filter(agent =>
        agent.toLowerCase().includes(value.toLowerCase())
      );
    }
  }

  // if (storedClinicId) {
  //   this.selectedClinic = storedClinicId; // Preselect the clinic
  //   console.log("Preselected Clinic ID:", this.selectedClinic);
  // }


  // filterSuppliers(event: string) {
  //   if (!event) {
  //     this.filteredSuppliers = [...this.suppliers];
  //     return;
  //   }

  //   const filterValue = event.toLowerCase();
  //   this.filteredSuppliers = this.suppliers.filter(supplier => 
  //     supplier.toLowerCase().includes(filterValue)
  //   );
  //   console.log('Filtered suppliers:', this.filteredSuppliers);
  // }

  selectSupplier(event: MatAutocompleteSelectedEvent) {
    const selectedSupplier = event.option.value;
    if (selectedSupplier) {
      this.supplierName = selectedSupplier;
      console.log('Selected supplier:', selectedSupplier);
    }
  }
  // saveStock() {
  //   // Generate a unique bill number
  //   const billNo = `BILL-${Math.floor(1000 + Math.random() * 9000)}`;
    
  //   // Transform the data into the desired format
  //   const purchaseData = this.stockItems.map(item => ({
  //     BrandId: item.brandId,
  //     BillNo: billNo,
  //     Supplier: this.supplierName,
  //     Date: new Date(this.purchaseDate).toISOString(),
  //     IsPaid: this.IsPaid,
  //     Quantity: item.quantity,
  //     StockAmount: item.price * item.quantity
  //   }));
  
  //   // Log the formatted data
  //   console.log('Purchase Data:', purchaseData);
  
  //   // Also log individual entries for verification
  //   purchaseData.forEach(entry => {
  //     console.log('Stock Entry:', {
  //       billNo: entry.BillNo,
  //       supplier: entry.Supplier,
  //       date: new Date(entry.Date).toLocaleDateString(),
  //       brand: entry.BrandId,
  //       quantity: entry.Quantity,
  //       amount: entry.StockAmount.toFixed(2),
  //       paymentStatus: entry.IsPaid ? 'Paid' : 'Pending'
  //     });
  //   });
  
  //   // Calculate and log totals
  //   const totalQuantity = purchaseData.reduce((sum, item) => sum + item.Quantity, 0);
  //   const totalAmount = purchaseData.reduce((sum, item) => sum + item.StockAmount, 0);
  
  //   console.log('Summary:', {
  //     billNo: billNo,
  //     totalItems: purchaseData.length,
  //     totalQuantity: totalQuantity,
  //     totalAmount: totalAmount.toFixed(2),
  //     paymentStatus: this.IsPaid ? 'Paid' : 'Pending'
  //   });
  
  //   return purchaseData; // Return the formatted data for API submission
  // }

  async saveStock() {
    try {
      const loading = await this.loadingController.create({
        message: 'Saving purchase...'
      });
      await loading.present();
      const doctorId = await this.storage.get(environment.DOCTOR_Id);
      console.log('Doctor ID:', doctorId);
      if (!doctorId) {
        throw new Error('Doctor ID not found');
      }
      const doctorIdNumber = parseInt(doctorId, 10);
      const billNo = `BILL-${this.bill}`;
      const purchaseData = this.stockItems.map(item => {
        const data: any = {
          BrandId: item.brandId,
          BillNo: billNo,
          Supplier: this.supplierName,
          BillDate: new Date(this.purchaseDate), // Renamed from Date to BillDate
          clinicId: this.selectedClinic,
          IsPaid: this.isPaid,
          Quantity: item.quantity,
          StockAmount: item.price,
          BatchLot: item.batchLot ? item.batchLot.trim() : '',
          Expiry: item.expiry ? new Date(item.expiry) : null,
          DoctorId: doctorIdNumber,
          IsPAApprove: this.usertype === 'DOCTOR' ? true : false,
        };
        if (this.isPaid) {
          data.PaidDate = new Date(this.paymentDate);
        }else {
          data.PaidDate = "01-01-0001"; // Set to null if not paid   
        }
        return data;
      });
      console.log('Purchase Data:', purchaseData);
      this.stockService.createBill(purchaseData).subscribe({
        next: (response) => {
          loading.dismiss();
          if (response.IsSuccess) {
            this.toastService.create('Purchase bill created successfully', 'success');
            this.resetForm();
          } else {
            this.toastService.create(response.Message, 'danger');
          }
        },
        error: (error) => {
          loading.dismiss();
          console.error('Error creating bill:', error);
          this.toastService.create('Failed to create purchase bill', 'danger');
        }
      });
    } catch (error) {
      console.error('Error in saveStock:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
      this.loadingController.dismiss();
    }
  }

  private resetForm() {
    this.bill = '';
    this.stockItems = [];
    this.supplierName = '';
    this.purchaseDate = new Date().toISOString(); // Reset Bill Date
    this.paymentDate =  new Date().toISOString(); // Reset Payment Date
    this.isPaid = false; // Reset Payment Status
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

  // async loadClinics() {
  //   try {
  //     const loading = await this.loadingController.create({
  //       message: "Loading clinics...",
  //     });
  //     await loading.present();

  //     this.clinicService.getClinics(Number(this.doctorId)).subscribe({
  //       next: (response) => {
  //         loading.dismiss();
  //           this.clinics = response.ResponseData;
  //           console.log("Clinics:", this.clinics);
  //           this.storage.get(environment.CLINIC_Id).then((val) => {
  //             console.log('Clinic ID:', val);
  //             this.selectedClinic = val;
  //           });
  //       },
  //       error: (error) => {
  //         loading.dismiss();
  //         console.error("Error fetching clinics:", error);
  //         this.toastService.create("Failed to load clinics", "danger");
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Error in loadClinics:", error);
  //     this.toastService.create("An unexpected error occurred", "danger");
  //   }
  // }

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
              this.selectedClinic = this.clinicId || (this.clinics.length > 0 ? this.clinics[0].Id : null);
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
              this.selectedClinic =  (this.clinics.length > 0 ? this.clinics[0].Id : null);
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

  // filterClinics(searchTerm: string) {
  //   if (!searchTerm) {
  //     this.filteredClinics = this.clinics;
  //   } else {
  //     this.filteredClinics = this.clinics.filter((clinic) =>
  //       clinic.Name.toLowerCase().includes(searchTerm.toLowerCase())
  //     );
  //   }
  // }

  filter(event: any): void {
    const filterValue = event.toLowerCase();
    this.filteredCities = this.cities.filter(option => option.toLowerCase().includes(filterValue));
  }

  onCityChange(): void {
    console.log('City changed:', this.fg1.get('city').value);
  }

  filterBrands(event: string) {
    const filterValue = event.toLowerCase();
    this.filteredBrands = this.brands.filter(brand => 
        brand.name.toLowerCase().includes(filterValue) || 
        (brand.vaccineName && brand.vaccineName.toLowerCase().includes(filterValue))
    );
  }

  selectBrand(event: MatAutocompleteSelectedEvent, item: StockItem) {
    const selectedBrand = this.brands.find(brand => brand.displayName === event.option.value || brand.name === event.option.value);
    if (selectedBrand) {
        item.brandId = selectedBrand.id;
        item.brandName = selectedBrand.name; // Keep storing just the brand name
        item.price = selectedBrand.price; // Auto-populates but can be edited
        console.log('Selected brand with suggested price:', selectedBrand);
    }
  }

  addNewRow() {
      this.stockItems.push({
          brandName: '',
          quantity: null,
        price: null,
        batchLot: '',
        expiry: ''
      });
  }  

  calculateTotal(): number {
    return this.stockItems.reduce((total, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + (price * quantity);
    }, 0);
  }

  removeRow(index: number) {
      this.stockItems.splice(index, 1);
  }

  // saveStock() {
  //     if (this.stockItems.length > 0) {
  //         console.log('Saving stock items:', this.stockItems);
  //         // Add your save logic here
  //     }
  // }
}