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
import { Router, ActivatedRoute } from "@angular/router";
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
declare var google;

interface StockItem {
  brandName: string;
  brandId?: number;
  quantity: number;
  price: number;
  billNo?: string;
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
  PurchasedAmt?: number;
  [key: string]: string | number | undefined;
}
@Component({
  selector: "app-edit",
  templateUrl: "./edit.page.html",
  styleUrls: ["./edit.page.scss"]
})
export class EditPage implements OnInit {
  stockDTOs: StockDTO[] = []; 
  suppliers: string[] =[];
  filteredSuppliers: string[];
  fg1: FormGroup;
  cities: string[] = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
  filteredCities: string[];
  purchaseDate: string;
  paymentDate: string;
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
  brandId: number; // To store the brand ID from the route
  brandData: any; // To store the data for the brand being edited
  paid: any;
  id: any;
  billId: number;
  clinicId: any;
  constructor(
    private route: ActivatedRoute,
    private brandService: BrandService,
    private toastService: ToastService,
    private loadingController: LoadingController,
    private stockService: StockService,
    private fb: FormBuilder,
    private storage: Storage,
    private router: Router,
  ) {
    this.purchaseDate = this.defaultDate;
    this.paymentDate = this.defaultDate;
    this.filteredCities = this.cities;
  }
  
  ngOnInit() {
    this.route.params.subscribe(params => {
      this.billId = +params['brandId']; // Get brandId from route
      console.log('Brand ID from route:', this.brandId);
      if (this.brandId) {
        this.loadBrandData(); // Load data for the brand
      }
    });
    this.fg1 = this.fb.group({
      // clinicId: [''],
      id: [''],
      billNo: [''],
      supplier: [''],
      billDate: [''],
      paidDate: [''],
      isPaid: [false],
    });
  
    this.loadBrandData();
  }
  
  async loadBrandData() {
    try {
      const loading = await this.loadingController.create({
        message: 'Loading brand data...',
      });
      await loading.present();
  
      this.stockService.getBrandBills(this.billId).subscribe({
        next: (response) => {
          loading.dismiss();
          if (response.IsSuccess) {
            this.brandData = response.ResponseData;
            console.log('Brand data loaded:', this.brandData);
  this.paid= this.brandData[0].IsPaid;
  // this.clinicId= this.brandData[0].ClinicId;
            // Populate the form with the loaded data
            this.id=this.brandData[0].BillId;
            this.fg1.patchValue({
              id: this.brandData[0].BillId,
              billNo: this.brandData[0].BillNo || '',
              supplier: this.brandData[0].Supplier || '',
              billDate: this.brandData[0].BillDate || '',
              paidDate: this.brandData[0].PaidDate || '',
              isPaid: this.brandData[0].IsPaid || false,
            });
            this.stockItems = this.brandData[0].Items || [];
          } else {
            this.toastService.create(response.Message, 'danger');
          }
        },
        error: (error) => {
          loading.dismiss();
          console.error('Error loading brand data:', error);
          this.toastService.create('Failed to load brand data', 'danger');
        },
      });
    } catch (error) {
      console.error('Error in loadBrandData:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  // setFormData() {
  //   if (this.brandData) {
  //     // this.fg1.get('supplierName').setValue(this.brandData.Supplier || '');
  //     this.purchaseDate = this.brandData.BillDate || this.defaultDate;
  //     this.paymentDate = this.brandData.PaidDate || this.defaultDate;
  //     this.isPaid = this.brandData.IsPaid || false;
  //     this.bill = this.brandData.BillNo || '';
  //     this.stockItems = this.brandData.Items || [];
  //     console.log('Form data set:', this.brandData);
  //   }
  // }

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

//   filterSuppliers(event: string) {
//     if (!event) {
//       this.filteredSuppliers = [...this.suppliers];
//       return;
//     }

//     const filterValue = event.toLowerCase();
//     this.filteredSuppliers = this.suppliers.filter(supplier => 
//       supplier.toLowerCase().includes(filterValue)
//     );
//     console.log('Filtered suppliers:', this.filteredSuppliers);
//   }


//   selectSupplier(event: MatAutocompleteSelectedEvent) {
//     const selectedSupplier = event.option.value;
//     if (selectedSupplier) {
//       this.supplierName = selectedSupplier;
//       console.log('Selected supplier:', selectedSupplier);
//     }
//   }
//   // saveStock() {
//   //   // Generate a unique bill number
//   //   const billNo = `BILL-${Math.floor(1000 + Math.random() * 9000)}`;
    
//   //   // Transform the data into the desired format
//   //   const purchaseData = this.stockItems.map(item => ({
//   //     BrandId: item.brandId,
//   //     BillNo: billNo,
//   //     Supplier: this.supplierName,
//   //     Date: new Date(this.purchaseDate).toISOString(),
//   //     IsPaid: this.IsPaid,
//   //     Quantity: item.quantity,
//   //     StockAmount: item.price * item.quantity
//   //   }));
  
//   //   // Log the formatted data
//   //   console.log('Purchase Data:', purchaseData);
  
//   //   // Also log individual entries for verification
//   //   purchaseData.forEach(entry => {
//   //     console.log('Stock Entry:', {
//   //       billNo: entry.BillNo,
//   //       supplier: entry.Supplier,
//   //       date: new Date(entry.Date).toLocaleDateString(),
//   //       brand: entry.BrandId,
//   //       quantity: entry.Quantity,
//   //       amount: entry.StockAmount.toFixed(2),
//   //       paymentStatus: entry.IsPaid ? 'Paid' : 'Pending'
//   //     });
//   //   });
  
//   //   // Calculate and log totals
//   //   const totalQuantity = purchaseData.reduce((sum, item) => sum + item.Quantity, 0);
//   //   const totalAmount = purchaseData.reduce((sum, item) => sum + item.StockAmount, 0);
  
//   //   console.log('Summary:', {
//   //     billNo: billNo,
//   //     totalItems: purchaseData.length,
//   //     totalQuantity: totalQuantity,
//   //     totalAmount: totalAmount.toFixed(2),
//   //     paymentStatus: this.IsPaid ? 'Paid' : 'Pending'
//   //   });
  
//   //   return purchaseData; // Return the formatted data for API submission
//   // }

//   async saveStock() {
//     try {
//       const loading = await this.loadingController.create({
//         message: 'Saving purchase...'
//       });
//       await loading.present();
  
//       const doctorId = await this.storage.get(environment.DOCTOR_Id);
//       console.log('Doctor ID:', doctorId);
//       if (!doctorId) {
//         throw new Error('Doctor ID not found');
//       }
  
//       const doctorIdNumber = parseInt(doctorId, 10);
//       const billNo = `${this.bill}`;
  
//       const purchaseData = this.stockItems.map(item => {
//         const data: any = {
//           BrandId: item.brandId,
//           BillNo: billNo,
//           Supplier: this.supplierName,
//           BillDate: new Date(this.purchaseDate), 
//           IsPaid: this.isPaid,
//           Quantity: item.quantity,
//           StockAmount: item.price,
//           DoctorId: doctorIdNumber
//         };
//         if (this.isPaid) {
//           data.PaidDate = new Date(this.paymentDate);
//         }else {
//           data.PaidDate = "01-01-0001";   
//         }
//         return data;
//       });
//       console.log('Purchase Data:', purchaseData);
//       this.stockService.createBill(purchaseData).subscribe({
//         next: (response) => {
//           loading.dismiss();
//           if (response.IsSuccess) {
//             this.toastService.create('Purchase bill created successfully', 'success');
//             this.resetForm();
//           } else {
//             this.toastService.create(response.Message, 'danger');
//           }
//         },
//         error: (error) => {
//           loading.dismiss();
//           console.error('Error creating bill:', error);
//           this.toastService.create('Failed to create purchase bill', 'danger');
//         }
//       });
//     } catch (error) {
//       console.error('Error in saveStock:', error);
//       this.toastService.create('An unexpected error occurred', 'danger');
//       this.loadingController.dismiss();
//     }
//   }

//   private resetForm() {
//     this.bill = '';
//     this.stockItems = [];
//     this.supplierName = '';
//     this.purchaseDate = new Date().toISOString(); // Reset Bill Date
//     this.paymentDate =  new Date().toISOString(); // Reset Payment Date
//     this.isPaid = false; // Reset Payment Status
//   }

//   async loadBrands() {
//     try {
//       const loading = await this.loadingController.create({
//         message: 'Loading brands...'
//       });
//       await loading.present();
  
//       const doctorId = await this.storage.get(environment.DOCTOR_Id);
      
//       this.brandService.getBrandAmount(doctorId).subscribe({
//         next: (response) => {
//           if (response.IsSuccess) {
//             console.log('Brand amounts:', response.ResponseData);
//             this.brands = response.ResponseData.map(brand => ({
//               id: brand.BrandId,
//               name: brand.BrandName,
//               price: brand.PurchasedAmt
//             }));
//             this.filteredBrands = [...this.brands];
//             loading.dismiss();
//           } else {
//             loading.dismiss();
//             this.toastService.create(response.Message, 'danger');
//           }
//         },
//         error: (error) => {
//           loading.dismiss();
//           console.error('Error fetching brand amounts:', error);
//           this.toastService.create('Failed to load brands', 'danger');
//         }
//       });
  
//     } catch (error) {
//       console.error('Error in loadBrands:', error);
//       this.toastService.create('An unexpected error occurred', 'danger');
//     }
//   }

//   filter(event: any): void {
//     const filterValue = event.toLowerCase();
//     this.filteredCities = this.cities.filter(option => option.toLowerCase().includes(filterValue));
//   }

//   onCityChange(): void {
//     // Handle city change logic here
//     console.log('City changed:', this.fg1.get('city').value);
//   }

//   filterBrands(event: string) {
//     const filterValue = event.toLowerCase();
//     this.filteredBrands = this.brands.filter(brand => 
//         brand.name.toLowerCase().includes(filterValue)
//     );
// }

// selectBrand(event: MatAutocompleteSelectedEvent, item: StockItem) {
//   const selectedBrand = this.brands.find(brand => brand.name === event.option.value);
//   if (selectedBrand) {
//       item.brandId = selectedBrand.id;
//       item.brandName = selectedBrand.name;
//       item.price = selectedBrand.price; // Auto-populates but can be edited
//       console.log('Selected brand with suggested price:', selectedBrand);
//   }
// }

    addNewRow() {
        this.stockItems.push({
            brandName: '',
            quantity: null,
            price: null
        });
    }  

//     calculateTotal(): number {
//       return this.stockItems.reduce((total, item) => {
//           const price = Number(item.price) || 0;
//           const quantity = Number(item.quantity) || 0;
//           return total + (price * quantity);
//       }, 0);
//   }

    removeRow(index: number) {
        this.stockItems.splice(index, 1);
    }

    saveStock() {
      console.log('Saving stock with items:', this.fg1.value);
      console.log('Stock items:', this.id);
      // console.log('Stock items:', this.clinicId);
      this.stockService.editStocks(this.id,this.fg1.value).subscribe(
        (response) => {
          // if (response.Message) {
          //   console.log('Stocks updated successfully:', response.ResponseData);
            this.toastService.create(response.message, 'success');
            // this.router.navigate(["/members/doctor/stock-management/brandlist/${this.id}"]);
            this.router.navigate(['/members/doctor/stock-management/brandlist', this.id]);
          // } else {
          //   console.error('Failed to update stocks:', response.Message);
          //   this.toastService.create(response.Message, 'danger');
          // }
        },
        (error) => {
          console.error('Error updating stocks:', error);
          this.toastService.create('An error occurred while updating stocks.', 'danger');
        }
      );
    }

// Set the value of the checkbox programmatically
// this.isPaid = true; // or false, depending on the desired state

}