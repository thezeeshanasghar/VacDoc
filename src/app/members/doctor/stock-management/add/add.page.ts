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
declare var google;

interface StockItem {
  brandName: string;
  brandId?: number;
  quantity: number;
  price: number;
  billNo?: string;
}
interface Brand {
  id: number;
  name: string;
}
@Component({
  selector: "app-add",
  templateUrl: "./add.page.html",
  styleUrls: ["./add.page.scss"]
})
export class AddPage implements OnInit {
  // brands: any;
  fg1: FormGroup;
  cities: string[] = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
  filteredCities: string[];
  purchaseDate: string;
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
  constructor(
    private brandService: BrandService,
    private toastService: ToastService,
    private loadingController: LoadingController,
    private stockService: StockService,
    private fb: FormBuilder
  ) {
    this.purchaseDate = this.defaultDate;
    this.filteredCities = this.cities;
  }
  
  ngOnInit() {
    this.loadBrands();
    this.fg1 = this.fb.group({
      city: [''],
      City2: ['']
    });
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
      // Show loading indicator
      const loading = await this.loadingController.create({
        message: 'Saving purchase...'
      });
      await loading.present();

      // Generate a unique bill number
      const billNo = `BILL-${this.bill}`;
    
      // Transform the data into the desired format
      const purchaseData = this.stockItems.map(item => (
        console.log('Purchase Data:', item),
        {
        BrandId: item.brandId,
        BillNo: billNo,
        Supplier: this.supplierName,
        Date: new Date(this.purchaseDate), // Convert directly to Date object
        IsPaid: this.isPaid,
        Quantity: item.quantity,
        StockAmount: item.price 
      }));
console.log('Purchase Data:', purchaseData);
      // Call the service to create bill
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
    }
  }

  private resetForm() {
    this.bill = '';
    this.stockItems = [];
    this.supplierName = '';
    this.purchaseDate = new Date().toISOString();
    this.isPaid = false;
  }

  async loadBrands() {
    try {
      const loading = await this.loadingController.create({
        message: 'Loading brands...'
      });
      await loading.present();

      this.brandService.getBrands().subscribe({
        next: (response) => {
          if (response.IsSuccess) {
            this.brands = response.ResponseData.map(brand => ({
              id: brand.Id,
              name: brand.Name
            }));
            this.filteredBrands = [...this.brands]; // Initialize filtered brands
            loading.dismiss();
          } else {
            loading.dismiss();
            this.toastService.create(response.Message, 'danger');
          }
        },
        error: (error) => {
          loading.dismiss();
          console.error('Error fetching brands:', error);
          this.toastService.create('Failed to load brands', 'danger');
        }
      });
    } catch (error) {
      console.error('Error in loadBrands:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }
  filter(event: any): void {
    const filterValue = event.toLowerCase();
    this.filteredCities = this.cities.filter(option => option.toLowerCase().includes(filterValue));
  }

  onCityChange(): void {
    // Handle city change logic here
    console.log('City changed:', this.fg1.get('city').value);
  }

  filterBrands(event: string) {
    const filterValue = event.toLowerCase();
    this.filteredBrands = this.brands.filter(brand => 
        brand.name.toLowerCase().includes(filterValue)
    );
}

selectBrand(event: MatAutocompleteSelectedEvent, item: StockItem) {
    const selectedBrand = this.brands.find(brand => brand.name === event.option.value);
    if (selectedBrand) {
        item.brandId = selectedBrand.id;
        item.brandName = selectedBrand.name;
    }
}

    addNewRow() {
        this.stockItems.push({
            brandName: '',
            quantity: null,
            price: null
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
  
//   fg1: FormGroup;
//   fg2: FormGroup;
//   map;
//   myMarker;
//   uploading = false;
//   @ViewChild("mapElement", { static: true }) mapElement;
//   clinics: any;
//   DoctorId: any;
//   section: boolean = false;
//   latitude: any = 33.6328532;
//   longitude: any = 72.93583679;
//   resourceURL = environment.RESOURCE_URL;
//   isWeb: any;
//   http: any;
//   constructor(
//     private formbuilder: FormBuilder,
//     private router: Router,
//     private loadingController: LoadingController,
//     private clinicService: ClinicService,
//     private toastService: ToastService,
//     private signupService: SignupService,
//     private uploadService: UploadService,
//     private storage: Storage,
//     private geolocation: Geolocation,
//     private cdr: ChangeDetectorRef,
//     private fileChooser: FileChooser,
//     private file: File,
//     private filePath: FilePath,
//     private transfer: FileTransfer
//   ) { }

//   ngOnInit() {
//     this.storage.get(environment.DOCTOR_Id).then(val => {
//       this.DoctorId = val;
//     });
//     // this.storage.get(environment.CLINICS).then(clinics => {
//     //   this.clinics = clinics;
//     //   console.log(this.clinicService.clinics);
//     // console.log(this.clinics);
//     // });

// //     this.fg1 = this.formbuilder.group({
// //       DoctorId: [null],
// //       Name: [null],
// //     PhoneNumber: new FormControl(
// //         "",
// //         Validators.compose([
// //           Validators.required,
// //           Validators.minLength(10),
// //           Validators.pattern("^([0-9]*)$")
// //         ])
// //       ),
// //       Address: [null],
// //       ConsultationFee: new FormControl(
// //         "",
// //         Validators.compose([
// //           Validators.required,
// //           Validators.pattern("^(0|[1-9][0-9]*)$")
// //         ])
// //       ),
// //       MonogramImage: [""],
// //       ClinicTimings: [null],
// //       Lat: [null],
// //       Long: [null],
// //       IsOnline: false,
// //       childrenCount: 0,
      
// //     });

// //     this.fg2 = this.formbuilder.group({
// //       Monday: [true],
// //       MondayS1: [true],
// //       MondayS2: [true],
// //       Mstart: [null],
// //       Mstart2: [null],
// //       Mend: [null],
// //       Mend2: [null],

// //       Tuesday: [true],
// //       TuesdayS1: [true],
// //       TuesdayS2: [true],
// //       Tustart: [null],
// //       Tustart2: [null],
// //       Tuend: [null],
// //       Tuend2: [null],

// //       Wednesday: [true],
// //       WednesdayS1: [true],
// //       WednesdayS2: [true],
// //       Wstart: [null],
// //       Wstart2: [null],
// //       Wend: [null],
// //       Wend2: [null],

// //       Thursday: [true],
// //       ThursdayS1: [true],
// //       ThursdayS2: [true],
// //       Thstart: [null],
// //       Thstart2: [null],
// //       Thend: [null],
// //       Thend2: [null],

// //       Friday: [true],
// //       FridayS1: [true],
// //       FridayS2: [true],
// //       Fstart: [null],
// //       Fstart2: [null],
// //       Fend: [null],
// //       Fend2: [null],

// //       Saturday: [true],
// //       SaturdayS1: [true],
// //       SaturdayS2: [true],
// //       Sastart: [null],
// //       Sastart2: [null],
// //       Saend: [null],
// //       Saend2: [null],

// //       Sunday: [true],
// //       SundayS1: [true],
// //       SundayS2: [true],
// //       Sustart: [null],
// //       Sustart2: [null],
// //       Suend: [null],
// //       Suend2: [null]
// //     });
// //     this.GetUserLocation();
// //     this.cdr.detectChanges();
// //   }
// //   hello(): void {
// //     //Called after ngOnInit when the component's or directive's content has been initialized.
// //     //Add 'implements AfterContentInit' to the class.
// //     this.map = new google.maps.Map(this.mapElement.nativeElement, {
// //       center: { lat: this.latitude, lng: this.longitude },
// //       zoom: 15
// //     });

// //     this.myMarker = new google.maps.Marker({
// //       position: { lat: this.latitude, lng: this.longitude },
// //       draggable: true
// //     });
// //     this.map.setCenter(this.myMarker.position);
// //     this.myMarker.setMap(this.map);

// //     google.maps.event.addListener(this.myMarker, "dragend", function (evt) {
// //       this.latitude = evt.latLng.lat().toFixed(3);
// //       this.longitude = evt.latLng.lng().toFixed(3);
// //     });
// //   }
// //   GetUserLocation() {
// //     this.geolocation
// //       .getCurrentPosition()
// //       .then(resp => {
// //         this.latitude = resp.coords.latitude;
// //         this.longitude = resp.coords.longitude;
// //         console.log(this.latitude);
// //         this.hello();
// //       })
// //       .catch(error => {
// //         console.log("Error getting location", error);
// //       });
// //   }
  
// //   private previewMonogramImage(file: FileList) {
// //     const reader = new FileReader();
// //     reader.onload = () => {
// //       this.fg1.value.MonogramImage1 = reader.result as string;
// //     };
// //     reader.readAsDataURL(file.item(0));
// //   }
  
// //   async SelectMonogramImage(monogramFile: FileList) {
// //     this.previewMonogramImage(monogramFile);
  
// //     const loading = await this.loadingController.create({
// //       message: "Uploading Monogram Image"
// //     });
// //     await loading.present();
  
// //     const monogramData = new FormData();
// //     monogramData.append("MonogramImage", monogramFile.item(0));
  
// //     await this.uploadService.uploadImage(monogramData).subscribe(res => {
// //       if (res) {
// //         let mImage = res.dbPath;
// //         this.fg1.value.MonogramImage = mImage;
// //         console.log("MonogramImage = " + this.fg1.value.MonogramImage);
// //         loading.dismiss();
// //       } else {
// //         console.log("Error: Try Again! Failed to upload MonogramImage");
// //         this.toastService.create("Error: Try Again! Failed to upload MonogramImage.");
// //         loading.dismiss();
// //       }
// //     });
// //   }
// //   setAllDaysValueStrat1() {
// //     this.fg2.controls["Tustart"].setValue(this.fg2.value.Mstart);
// //     this.fg2.controls["Wstart"].setValue(this.fg2.value.Mstart);
// //     this.fg2.controls["Thstart"].setValue(this.fg2.value.Mstart);
// //     this.fg2.controls["Fstart"].setValue(this.fg2.value.Mstart);
// //     this.fg2.controls["Sastart"].setValue(this.fg2.value.Mstart);
// //     this.fg2.controls["Sustart"].setValue(this.fg2.value.Mstart);
// //     this.setTimeValidatorsTuesday(); this.setTimeValidatorsWed();
// //     this.setTimeValidatorsThu(); this.setTimeValidatorsFri();
// //     this.setTimeValidatorsSat(); this.setTimeValidatorsSun();
// //   }
// //   setAllDaysValueStrat2() {
// //     this.fg2.controls["Tustart2"].setValue(this.fg2.value.Mstart2);
// //     this.fg2.controls["Wstart2"].setValue(this.fg2.value.Mstart2);
// //     this.fg2.controls["Thstart2"].setValue(this.fg2.value.Mstart2);
// //     this.fg2.controls["Fstart2"].setValue(this.fg2.value.Mstart2);
// //     this.fg2.controls["Sastart2"].setValue(this.fg2.value.Mstart2);
// //     this.fg2.controls["Sustart2"].setValue(this.fg2.value.Mstart2);
// //     this.setTimeValidatorsTuesday(); this.setTimeValidatorsWed();
// //     this.setTimeValidatorsThu(); this.setTimeValidatorsFri();
// //     this.setTimeValidatorsSat(); this.setTimeValidatorsSun();
// //   }
// //   setAllDaysValueEnd1() {
// //     this.fg2.controls["Tuend"].setValue(this.fg2.value.Mend);
// //     this.fg2.controls["Wend"].setValue(this.fg2.value.Mend);
// //     this.fg2.controls["Thend"].setValue(this.fg2.value.Mend);
// //     this.fg2.controls["Fend"].setValue(this.fg2.value.Mend);
// //     this.fg2.controls["Saend"].setValue(this.fg2.value.Mend);
// //     this.fg2.controls["Suend"].setValue(this.fg2.value.Mend);
// //     this.setTimeValidatorsTuesday(); this.setTimeValidatorsWed();
// //     this.setTimeValidatorsThu(); this.setTimeValidatorsFri();
// //     this.setTimeValidatorsSat(); this.setTimeValidatorsSun();
// //   }
// //   setAllDaysValueEnd2() {
// //     this.fg2.controls["Tuend2"].setValue(this.fg2.value.Mend2);
// //     this.fg2.controls["Wend2"].setValue(this.fg2.value.Mend2);
// //     this.fg2.controls["Thend2"].setValue(this.fg2.value.Mend2);
// //     this.fg2.controls["Fend2"].setValue(this.fg2.value.Mend2);
// //     this.fg2.controls["Saend2"].setValue(this.fg2.value.Mend2);
// //     this.fg2.controls["Suend2"].setValue(this.fg2.value.Mend2);
// //     this.setTimeValidatorsTuesday(); this.setTimeValidatorsWed();
// //     this.setTimeValidatorsThu(); this.setTimeValidatorsFri();
// //     this.setTimeValidatorsSat(); this.setTimeValidatorsSun();
// //   }

// //   getdata() {
// //     //this.fg2.controls["Tuend"].setValue(this.fg2.value.Mend);
// //     this.fg1.value.DoctorId = this.DoctorId;
// //     this.fg1.value.Lat = 33.63207;
// //     this.fg1.value.Long = 72.935488;
// //     var ct = [];
// //     if (this.fg2.value.Monday) {
// //       if (this.fg2.value.MondayS1) {
// //         if (this.fg2.value.Mstart && this.fg2.value.Mend) {
// //         this.fg2.value.Mstart = moment(
// //           this.fg2.value.Mstart,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         this.fg2.value.Mend = moment(
// //           this.fg2.value.Mend,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         let obj = {
// //           Day: "Monday",
// //           StartTime: this.fg2.value.Mstart,
// //           EndTime: this.fg2.value.Mend,
// //           IsOpen: true,
// //           Session: 1
// //         };
// //         ct.push(obj);
// //       }
// //       }
// //       // For Session 2
// //       if (this.fg2.value.MondayS2) {
// //         if (this.fg2.value.Mstart2 && this.fg2.value.Mend2) {
// //         this.fg2.value.Mstart2 = moment(
// //           this.fg2.value.Mstart2,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         this.fg2.value.Mend2 = moment(
// //           this.fg2.value.Mend2,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         let obj1 = {
// //           Day: "Monday",
// //           StartTime: this.fg2.value.Mstart2,
// //           EndTime: this.fg2.value.Mend2,
// //           IsOpen: true,
// //           Session: 2
// //         };
// //         ct.push(obj1);
// //         }
// //       }
// //     }

// //     if (this.fg2.value.Tuesday) {
// //       if (this.fg2.value.TuesdayS1) {
// //         if (this.fg2.value.Tustart && this.fg2.value.Tuend) {
// //         this.fg2.value.Tustart = moment(
// //           this.fg2.value.Tustart,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         this.fg2.value.Tuend = moment(
// //           this.fg2.value.Tuend,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         let obj = {
// //           Day: "Tuesday",
// //           StartTime: this.fg2.value.Tustart,
// //           EndTime: this.fg2.value.Tuend,
// //           IsOpen: true,
// //           Session: 1
// //         };
// //         ct.push(obj);
// //       }
// //       }
// //       // session 2
// //       if (this.fg2.value.TuesdayS2) {
// //         if (this.fg2.value.Tustart2 && this.fg2.value.Tuend2) {
// //         this.fg2.value.Tustart2 = moment(
// //           this.fg2.value.Tustart2,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         this.fg2.value.Tuend2 = moment(
// //           this.fg2.value.Tuend2,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         let obj = {
// //           Day: "Tuesday",
// //           StartTime: this.fg2.value.Tustart2,
// //           EndTime: this.fg2.value.Tuend2,
// //           IsOpen: true,
// //           Session: 2
// //         };
// //         ct.push(obj);
// //       }
// //       }
// //     }

// //     if (this.fg2.value.Wednesday) {
// //       if (this.fg2.value.WednesdayS1) {
// //         if (this.fg2.value.Wstart && this.fg2.value.Wend) {
// //         this.fg2.value.Wstart = moment(
// //           this.fg2.value.Wstart,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         this.fg2.value.Wend = moment(
// //           this.fg2.value.Wend,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         let obj = {
// //           Day: "Wednesday",
// //           StartTime: this.fg2.value.Wstart,
// //           EndTime: this.fg2.value.Wend,
// //           IsOpen: true,
// //           Session: 1
// //         };
// //         ct.push(obj);
// //       }
// //       }
// //       // session 2
// //       if (this.fg2.value.WednesdayS2) {
// //         if (this.fg2.value.Wstart2 && this.fg2.value.Wend2) {
// //         this.fg2.value.Wstart2 = moment(
// //           this.fg2.value.Wstart2,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         this.fg2.value.Wend2 = moment(
// //           this.fg2.value.Wend2,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         let obj = {
// //           Day: "Wednesday",
// //           StartTime: this.fg2.value.Wstart2,
// //           EndTime: this.fg2.value.Wend2,
// //           IsOpen: true,
// //           Session: 2
// //         };
// //         ct.push(obj);
// //       }
// //       }
// //     }

// //     if (this.fg2.value.Thursday) {
// //       if (this.fg2.value.ThursdayS1) {
// //         if (this.fg2.value.Thstart && this.fg2.value.Thend) {
// //         this.fg2.value.Thstart = moment(
// //           this.fg2.value.Thstart,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         this.fg2.value.Thend = moment(
// //           this.fg2.value.Thend,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         let obj = {
// //           Day: "Thursday",
// //           StartTime: this.fg2.value.Thstart,
// //           EndTime: this.fg2.value.Thend,
// //           IsOpen: true,
// //           Session: 1
// //         };
// //         ct.push(obj);
// //       }
// //       }
// //       // session 2
// //       if (this.fg2.value.ThursdayS2) {
// //         if (this.fg2.value.Thstart2 && this.fg2.value.Thend2) {
// //         this.fg2.value.Thstart2 = moment(
// //           this.fg2.value.Thstart2,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         this.fg2.value.Thend2 = moment(
// //           this.fg2.value.Thend2,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         let obj = {
// //           Day: "Thursday",
// //           StartTime: this.fg2.value.Thstart2,
// //           EndTime: this.fg2.value.Thend2,
// //           IsOpen: true,
// //           Session: 2
// //         };
// //         ct.push(obj);
// //       }
// //       }
// //     }
// //     if (this.fg2.value.Friday) {
// //       if (this.fg2.value.FridayS1) {
// //         if (this.fg2.value.Fstart && this.fg2.value.Fend) {
// //         this.fg2.value.Fstart = moment(
// //           this.fg2.value.Fstart,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         this.fg2.value.Fend = moment(
// //           this.fg2.value.Fend,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         let obj = {
// //           Day: "Friday",
// //           StartTime: this.fg2.value.Fstart,
// //           EndTime: this.fg2.value.Fend,
// //           IsOpen: true,
// //           Session: 1
// //         };
// //         ct.push(obj);
// //       }
// //       }
// //       if (this.fg2.value.FridayS2) {
// //         if (this.fg2.value.Fstart2 && this.fg2.value.Fend2) {
// //         this.fg2.value.Fstart2 = moment(
// //           this.fg2.value.Fstart2,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         this.fg2.value.Fend2 = moment(
// //           this.fg2.value.Fend2,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         let obj = {
// //           Day: "Friday",
// //           StartTime: this.fg2.value.Fstart2,
// //           EndTime: this.fg2.value.Fend2,
// //           IsOpen: true,
// //           Session: 2
// //         };
// //         ct.push(obj);
// //       }
// //       }
// //     }
// //     if (this.fg2.value.Saturday) {
// //       if (this.fg2.value.SaturdayS1) {
// //         if (this.fg2.value.Sastart && this.fg2.value.Saend) {
// //         this.fg2.value.Sastart = moment(
// //           this.fg2.value.Sastart,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         this.fg2.value.Saend = moment(
// //           this.fg2.value.Saend,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         let obj = {
// //           Day: "Saturday",
// //           StartTime: this.fg2.value.Sastart,
// //           EndTime: this.fg2.value.Saend,
// //           IsOpen: true,
// //           Session: 1
// //         };
// //         ct.push(obj);
// //       }
// //       }
// //       if (this.fg2.value.SaturdayS2) {
// //         if (this.fg2.value.Sastart2 && this.fg2.value.Saend2) {
// //         this.fg2.value.Sastart2 = moment(
// //           this.fg2.value.Sastart2,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         this.fg2.value.Saend2 = moment(
// //           this.fg2.value.Saend2,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         let obj = {
// //           Day: "Saturday",
// //           StartTime: this.fg2.value.Sastart2,
// //           EndTime: this.fg2.value.Saend2,
// //           IsOpen: true,
// //           Session: 2
// //         };
// //         ct.push(obj);
// //       }
// //       }
// //     }
// //     if (this.fg2.value.Sunday) {
// //       if (this.fg2.value.SundayS1) {
// //         if (this.fg2.value.Sustart && this.fg2.value.Suend) {
// //         this.fg2.value.Sustart = moment(
// //           this.fg2.value.Sustart,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         this.fg2.value.Suend = moment(
// //           this.fg2.value.Suend,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         let obj = {
// //           Day: "Sunday",
// //           StartTime: this.fg2.value.Sustart,
// //           EndTime: this.fg2.value.Suend,
// //           IsOpen: true,
// //           Session: 1
// //         };
// //         ct.push(obj);
// //       }
// //       }
// //       if (this.fg2.value.SundayS2) {
// //         if (this.fg2.value.Sustart2 && this.fg2.value.Suend2) {
// //         this.fg2.value.Sustart2 = moment(
// //           this.fg2.value.Sustart2,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         this.fg2.value.Suend2 = moment(
// //           this.fg2.value.Suend2,
// //           "YYYY-MM-DD HH:mm"
// //         ).format("HH:mm");
// //         let obj = {
// //           Day: "Sunday",
// //           StartTime: this.fg2.value.Sustart2,
// //           EndTime: this.fg2.value.Suend2,
// //           IsOpen: true,
// //           Session: 2
// //         };
// //         ct.push(obj);
// //       }
// //       }
// //     }
// //     this.fg1.value.ClinicTimings = ct;
// //     this.addNewClinic(this.fg1.value);
// //   }
// //   async addNewClinic(data) {
// //     {
// //       const loading = await this.loadingController.create({
// //         message: "Loading"
// //       });
// //       await loading.present();
// //         //   window.location.reload();
// //       await this.clinicService.addClinic(data).subscribe(
// //         res => {
// //           if (res.IsSuccess) {
// //             loading.dismiss();
// //             this.toastService.create("successfully added Clinic");
// //             this.router.navigate(["/members/doctor/clinic"], { queryParams: { refresh: true } });
// //             window.location.reload();
// //           } else {
// //             loading.dismiss();
// //             this.toastService.create(res.Message, "danger");
// //           }
// //         },
// //         err => {
// //           loading.dismiss();
// //           this.toastService.create(err, "danger");
// //         }
// //       );
// //     }
// //   }
// //   async setTimeValidatorsMonday() {
// //     if (this.fg2.value.Monday) {
// //       if (this.fg2.value.MondayS1 && this.fg2.value.MondayS2) {
// //         const MEnd1 = await Date.parse(this.fg2.value.Mend);
// //         const MStart2 = await Date.parse(this.fg2.value.Mstart2);
// //         if (MStart2 <= MEnd1) {
// //           console.log(5);
// //           //Mstart2c.setValidators([Validators.maxLength(0)]);
// //           this.fg2.controls["Mstart2"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Mstart2"].setErrors(null);
// //         }
// //       } else {
// //         this.fg2.controls["Mstart2"].setErrors(null);
// //       }
// //       if (this.fg2.value.MondayS1) {
// //         const MStart1 = await Date.parse(this.fg2.value.Mstart);
// //         const MEnd1 = await Date.parse(this.fg2.value.Mend);
// //         // if (!MStart1 || !MEnd1)
// //         //   this.fg2.controls["Mend2"].setErrors({ required: true });
// //         console.log(5);
// //         if (MEnd1 <= MStart1) {
// //           console.log(5);
// //           //Mstart2c.setValidators([Validators.maxLength(0)]);
// //           this.fg2.controls["Mstart"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Mstart"].setErrors(null);
// //         }
// //       } else {
// //         this.fg2.controls["Mstart"].setErrors(null);
// //         this.fg2.controls["Mstart2"].setErrors(null);
// //       }
// //       if (this.fg2.value.MondayS2) {
// //         const MStart2 = await Date.parse(this.fg2.value.Mstart2);
// //         const MEnd2 = await Date.parse(this.fg2.value.Mend2);
// //         // if (!MStart2 || !MEnd2)
// //         //   this.fg2.controls["Mend2"].setErrors({ required: true });
// //         if (MEnd2 <= MStart2) {
// //           console.log(5);
// //           //Mstart2c.setValidators([Validators.maxLength(0)]);
// //           this.fg2.controls["Mend"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Mend"].setErrors(null);
// //         }
// //       } else {
// //         this.fg2.controls["Mend"].setErrors(null);
// //         this.fg2.controls["Mstart2"].setErrors(null);
// //       }
// //     }
// //     else {
// //       this.fg2.controls["Mend"].setErrors(null);
// //       this.fg2.controls["Mstart2"].setErrors(null);
// //       this.fg2.controls["Mstart"].setErrors(null);
// //     }
// //   }
// //   setTimeValidatorsTuesday() {
// //     if (this.fg2.value.Tuesday) {
// //       if (this.fg2.value.TuesdayS1 && this.fg2.value.TuesdayS2) {
// //         const TuEnd1 = Date.parse(this.fg2.value.Tuend);
// //         const TuStart2 = Date.parse(this.fg2.value.Tustart2);
// //         if (TuStart2 <= TuEnd1) {
// //           console.log(5);
// //           //Mstart2c.setValidators([Validators.maxLength(0)]);
// //           this.fg2.controls["Tustart2"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Tustart2"].setErrors(null);
// //         }
// //       } else {
// //         this.fg2.controls["Tustart2"].setErrors(null);
// //       }
// //       if (this.fg2.value.TuesdayS1) {
// //         const MStart1 = Date.parse(this.fg2.value.Tustart);
// //         const MEnd1 = Date.parse(this.fg2.value.Tuend);
// //         if (MEnd1 <= MStart1) {
// //           console.log(5);
// //           this.fg2.controls["Tustart"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Tustart"].setErrors(null);
// //         }
// //       }else {
// //         this.fg2.controls["Tustart"].setErrors(null);
// //         this.fg2.controls["Tustart2"].setErrors(null);
// //       }
// //       if (this.fg2.value.TuesdayS2) {
// //         const MStart2 = Date.parse(this.fg2.value.Tustart2);
// //         const MEnd2 = Date.parse(this.fg2.value.Tuend2);
// //         if (MEnd2 <= MStart2) {
// //           console.log(5);
// //           //Mstart2c.setValidators([Validators.maxLength(0)]);
// //           this.fg2.controls["Tuend"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Tuend"].setErrors(null);
// //         }
// //       }else{
// //         this.fg2.controls["Tuend"].setErrors(null);
// //         this.fg2.controls["Tustart2"].setErrors(null);
// //       }
// //     }
// //     else {
// //       this.fg2.controls["Tuend"].setErrors(null);
// //       this.fg2.controls["Tustart2"].setErrors(null);
// //       this.fg2.controls["Tustart"].setErrors(null);
// //     }
// //   }
// //   setTimeValidatorsWed() {
// //     if (this.fg2.value.Wednesday) {
// //       if (this.fg2.value.WednesdayS1 && this.fg2.value.WednesdayS2) {
// //         const TuEnd1 = Date.parse(this.fg2.value.Wend);
// //         const TuStart2 = Date.parse(this.fg2.value.Wstart2);
// //         if (TuStart2 <= TuEnd1) {
// //           console.log(5);
// //           this.fg2.controls["Wstart2"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Wstart2"].setErrors(null);
// //         }
// //       } else {
// //         this.fg2.controls["Wstart2"].setErrors(null);
// //       }

// //       if (this.fg2.value.WednesdayS1) {
// //         const MStart1 = Date.parse(this.fg2.value.Wstart);
// //         const MEnd1 = Date.parse(this.fg2.value.Wend);
// //         if (MEnd1 <= MStart1) {
// //           console.log(5);
// //           this.fg2.controls["Wstart"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Wstart"].setErrors(null);
// //         }
// //       }
// //       else {
// //         this.fg2.controls["Wstart"].setErrors(null);
// //         this.fg2.controls["Wstart2"].setErrors(null);
// //       }
// //       if (this.fg2.value.WednesdayS2) {
// //         const MStart2 = Date.parse(this.fg2.value.Wstart2);
// //         const MEnd2 = Date.parse(this.fg2.value.Wend2);
// //         if (MEnd2 <= MStart2) {
// //           console.log(5);
// //           //Mstart2c.setValidators([Validators.maxLength(0)]);
// //           this.fg2.controls["Wend"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Wend"].setErrors(null);
// //         }
// //       }
// //       else{
// //         this.fg2.controls["Wend"].setErrors(null);
// //         this.fg2.controls["Wstart2"].setErrors(null);
// //       }
// //     }
// //     else {
// //       this.fg2.controls["Wend"].setErrors(null);
// //       this.fg2.controls["Wstart2"].setErrors(null);
// //       this.fg2.controls["Wstart"].setErrors(null);
// //     }
// //   }
// //   setTimeValidatorsThu() {
// //     if (this.fg2.value.Thursday) {
// //       if (this.fg2.value.ThursdayS1 && this.fg2.value.ThursdayS2) {
// //         const TuEnd1 = Date.parse(this.fg2.value.Thend);
// //         const TuStart2 = Date.parse(this.fg2.value.Thstart2);
// //         if (TuStart2 <= TuEnd1) {
// //           console.log(5);
// //           //Mstart2c.setValidators([Validators.maxLength(0)]);
// //           this.fg2.controls["Thstart2"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Thstart2"].setErrors(null);
// //         }
// //       } else {
// //         this.fg2.controls["Thstart2"].setErrors(null);
// //       }

// //       if (this.fg2.value.ThursdayS1) {
// //         const MStart1 = Date.parse(this.fg2.value.Thstart);
// //         const MEnd1 = Date.parse(this.fg2.value.Thend);
// //         if (MEnd1 <= MStart1) {
// //           console.log(5);
// //           this.fg2.controls["Thstart"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Thstart"].setErrors(null);
// //         }
// //       }
// //       else {
// //         this.fg2.controls["Thstart"].setErrors(null);
// //         this.fg2.controls["Thstart2"].setErrors(null);
// //       }

// //       if (this.fg2.value.ThursdayS2) {
// //         const MStart2 = Date.parse(this.fg2.value.Thstart2);
// //         const MEnd2 = Date.parse(this.fg2.value.Thend2);
// //         if (MEnd2 <= MStart2) {
// //           console.log(5);
// //           this.fg2.controls["Thend"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Thend"].setErrors(null);
// //         }
// //       }
// //       else{
// //         this.fg2.controls["Thend"].setErrors(null);
// //         this.fg2.controls["Thstart2"].setErrors(null);
// //       }
// //     }
// //     else {
// //       this.fg2.controls["Thend"].setErrors(null);
// //       this.fg2.controls["Thstart2"].setErrors(null);
// //       this.fg2.controls["Thstart"].setErrors(null);
// //     }
// //   }
// //   setTimeValidatorsFri() {
// //     if (this.fg2.value.Friday) {
// //       if (this.fg2.value.FridayS1 && this.fg2.value.FridayS2) {
// //         const TuEnd1 = Date.parse(this.fg2.value.Fend);
// //         const TuStart2 = Date.parse(this.fg2.value.Fstart2);
// //         if (TuStart2 <= TuEnd1) {
// //           console.log(5);
// //           //Mstart2c.setValidators([Validators.maxLength(0)]);
// //           this.fg2.controls["Fstart2"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Fstart2"].setErrors(null);
// //         }
// //       } else {
// //         this.fg2.controls["Fstart2"].setErrors(null);
// //       }
// //       if (this.fg2.value.FridayS1) {
// //         const MStart1 = Date.parse(this.fg2.value.Fstart);
// //         const MEnd1 = Date.parse(this.fg2.value.Fend);
// //         if (MEnd1 <= MStart1) {
// //           console.log(5);
// //           this.fg2.controls["Fstart"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Fstart"].setErrors(null);
// //         }
// //       }
// //       else {
// //         this.fg2.controls["Fstart"].setErrors(null);
// //         this.fg2.controls["Fstart2"].setErrors(null);
// //       }
// //       if (this.fg2.value.FridayS2) {
// //         const MStart2 = Date.parse(this.fg2.value.Fstart2);
// //         const MEnd2 = Date.parse(this.fg2.value.Fend2);
// //         if (MEnd2 <= MStart2) {
// //           console.log(5);
// //           this.fg2.controls["Fend"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Fend"].setErrors(null);
// //         }
// //       }
// //       else{
// //         this.fg2.controls["Fend"].setErrors(null);
// //         this.fg2.controls["Fstart2"].setErrors(null);
// //       }
// //     }
// //     else {
// //       this.fg2.controls["Fend"].setErrors(null);
// //       this.fg2.controls["Fstart2"].setErrors(null);
// //       this.fg2.controls["Fstart"].setErrors(null);
// //     }
// //   }
// //   setTimeValidatorsSat() {
// //     if (this.fg2.value.Saturday) {
// //       if (this.fg2.value.SaturdayS1 && this.fg2.value.SaturdayS2) {
// //         const TuEnd1 = Date.parse(this.fg2.value.Saend);
// //         const TuStart2 = Date.parse(this.fg2.value.Sastart2);
// //         if (TuStart2 <= TuEnd1) {
// //           console.log(5);
// //           //Mstart2c.setValidators([Validators.maxLength(0)]);
// //           this.fg2.controls["Sastart2"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Sastart2"].setErrors(null);
// //         }
// //       } else {
// //         this.fg2.controls["Sastart2"].setErrors(null);
// //       }
// //       if (this.fg2.value.SaturdayS1) {
// //         const MStart1 = Date.parse(this.fg2.value.Sastart);
// //         const MEnd1 = Date.parse(this.fg2.value.Saend);
// //         if (MEnd1 <= MStart1) {
// //           console.log(5);
// //           this.fg2.controls["Sastart"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Sastart"].setErrors(null);
// //         }
// //       }
// //       else {
// //         this.fg2.controls["Sastart"].setErrors(null);
// //         this.fg2.controls["Sastart2"].setErrors(null);
// //       }
// //       if (this.fg2.value.SaturdayS2) {
// //         const MStart2 = Date.parse(this.fg2.value.Sastart2);
// //         const MEnd2 = Date.parse(this.fg2.value.Saend2);
// //         if (MEnd2 <= MStart2) {
// //           console.log(5);
// //           this.fg2.controls["Saend"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Saend"].setErrors(null);
// //         }
// //       }
// //       else{
// //         this.fg2.controls["Saend"].setErrors(null);
// //         this.fg2.controls["Sastart2"].setErrors(null);
// //       }
// //     }
// //     else {
// //       this.fg2.controls["Saend"].setErrors(null);
// //       this.fg2.controls["Sastart2"].setErrors(null);
// //       this.fg2.controls["Sastart"].setErrors(null);
// //     }
// //   }
// //   setTimeValidatorsSun() {
// //     if (this.fg2.value.Sunday) {
// //       if (this.fg2.value.SundayS1 && this.fg2.value.SundayS2) {
// //         const TuEnd1 = Date.parse(this.fg2.value.Suend);
// //         const TuStart2 = Date.parse(this.fg2.value.Sustart2);
// //         if (TuStart2 <= TuEnd1) {
// //           console.log(5);
// //           //Mstart2c.setValidators([Validators.maxLength(0)]);
// //           this.fg2.controls["Sustart2"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Sustart2"].setErrors(null);
// //         }
// //       } else {
// //         this.fg2.controls["Sustart2"].setErrors(null);
// //       }
// //       if (this.fg2.value.SundayS1) {
// //         const MStart1 = Date.parse(this.fg2.value.Sustart);
// //         const MEnd1 = Date.parse(this.fg2.value.Suend);
// //         if (MEnd1 <= MStart1) {
// //           console.log(5);
// //           this.fg2.controls["Sustart"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Sustart"].setErrors(null);
// //         }
// //       }
// //       else {
// //         this.fg2.controls["Sustart"].setErrors(null);
// //         this.fg2.controls["Sustart2"].setErrors(null);
// //       }
// //       if (this.fg2.value.SundayS2) {
// //         const MStart2 = Date.parse(this.fg2.value.Sustart2);
// //         const MEnd2 = Date.parse(this.fg2.value.Suend2);
// //         if (MEnd2 <= MStart2) {
// //           console.log(5);
// //           this.fg2.controls["Suend"].setErrors({ required: true });
// //         } else {
// //           this.fg2.controls["Suend"].setErrors(null);
// //         }
// //       }
// //       else{
// //         this.fg2.controls["Suend"].setErrors(null);
// //         this.fg2.controls["Sustart2"].setErrors(null);
// //       }
// //     }
// //     else {
// //       this.fg2.controls["Suend"].setErrors(null);
// //       this.fg2.controls["Sustart2"].setErrors(null);
// //       this.fg2.controls["Sustart"].setErrors(null);
// //     }
// //   }
// //   validation_messages = {
// //     Name: [{ type: "required", message: "Name is required." }],
// //     phoneNumber: [
// //       { type: "required", message: "Phone number is required" },

// //       {
// //         type: "minlength",
// //         message: "Phone Number must be at least 10 Digits long."
// //       },
// //       { type: "pattern", message: "Enter Must be Number" }
// //     ],
// //     Address: [{ type: "required", message: "Address is required." }],
// //     ConsultationFee: [
// //       { type: "required", message: "Consultation Fee is required." },
// //       {
// //         type: "pattern",
// //         message: "Your Consultation Fee must contain number"
// //       }
// //     ],
// //     MonogramImage:[
// //       { type: "required", message: "Monogram Image is required." },
// //     ],
// //     Mstart2: [
// //       { type: "required", message: "Session 2 Must Start after Session 1" }
// //     ],
// //     Mstart: [
// //       { type: "required", message: "End Time Must be after Start Time" }
// //     ],
// //     Mend: [{ type: "required", message: "End Time Must be after Start Time" }],
// //     Tustart2: [
// //       { type: "required", message: "Session 2 Must Start after Session 1" }
// //     ],
// //     Tustart: [
// //       { type: "required", message: "End Time Must be after Start Time" }
// //     ],
// //     Tuend: [
// //       { type: "required", message: "End Time Must be after Start Time" }
// //     ],
// //     Wstart2: [
// //       { type: "required", message: "Session 2 Must Start after Session 1" }
// //     ],
// //     Wstart: [
// //       { type: "required", message: "End Time Must be after Start Time" }
// //     ],
// //     Wend: [
// //       { type: "required", message: "End Time Must be after Start Time" }
// //     ],
// //     Thstart2: [
// //       { type: "required", message: "Session 2 Must Start after Session 1" }
// //     ],
// //     Thstart: [
// //       { type: "required", message: "End Time Must be after Start Time" }
// //     ],
// //     Thend: [
// //       { type: "required", message: "End Time Must be after Start Time" }
// //     ],
// //     Fstart2: [
// //       { type: "required", message: "Session 2 Must Start after Session 1" }
// //     ],
// //     Fstart: [
// //       { type: "required", message: "End Time Must be after Start Time" }
// //     ],
// //     Fend: [
// //       { type: "required", message: "End Time Must be after Start Time" }
// //     ],
// //     Sastart2: [
// //       { type: "required", message: "Session 2 Must Start after Session 1" }
// //     ],
// //     Sastart: [
// //       { type: "required", message: "End Time Must be after Start Time" }
// //     ],
// //     Saend: [
// //       { type: "required", message: "End Time Must be after Start Time" }
// //     ],
// //     Sustart2: [
// //       { type: "required", message: "Session 2 Must Start after Session 1" }
// //     ],
// //     Sustart: [
// //       { type: "required", message: "End Time Must be after Start Time" }
// //     ],
// //     Suend: [
// //       { type: "required", message: "End Time Must be after Start Time" }
// //     ],
  

