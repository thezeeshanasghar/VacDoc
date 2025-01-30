import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VaccineService } from 'src/app/services/vaccine.service';
import { ChildService } from 'src/app/services/child.service';
import { ToastService } from 'src/app/shared/toast.service';
import { LoadingController } from '@ionic/angular';
import * as moment from 'moment';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-fill',
  templateUrl: './fill.page.html',
  styleUrls: ['./fill.page.scss'],
})
export class FillPage implements OnInit {
  customActionSheetOptions: any = {
    header: 'Select Brand',
    cssClass: 'action-sheet-class'
  };

  fg: FormGroup;
  doctorId: any;
  vaccinId: any;
  vaccineData: any = [];
  vaccinesData: any;
  vaccineName: any;
  brandName: any;
  Date: any;
  todaydate: any;
  birthYear: any;
  MinAge: any;
  MinGap: any;
  todayDate: string = new Date().toISOString().split('T')[0];
  fgAddData: FormGroup;
  scheduleDate: string = '';  // Bind this to the ion-datetime value
  isScheduleDateInvalid: boolean = false;
  childId: number;
  // childService: any;
  childData: any;
  Type: any;
  Manufacturer:any;
  Lot:any;
  Expiry:any;
  Validity:any;

  constructor(
    public loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private storage: Storage,
    private route: ActivatedRoute,
    private vaccineService: VaccineService,
    private toastService: ToastService,
    private router: Router,
    private ref: ChangeDetectorRef,
    private childService: ChildService,
  ) { }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.doctorId = val;
    });
    this.storage.get('BirthYear').then((val) => {
      this.birthYear = moment(val, "DD-MM-YYYY").format("YYYY-MM-DD");
    });

    this.storage.get('vaccinesData').then((val) => {
      this.vaccinesData = val;
      this.addOHFToBrands(); // Add OHF to the list of brands
    });

    this.fg = this.formBuilder.group({
      'DoctorId': [''],
      'Id': [null],
      'IsDone': [null],
      ScheduleDate: [''],
      Weight: new FormControl(''),
      Height: new FormControl(''),
      Circle: new FormControl(''),
      Manufacturer: new FormControl(''),
      // ['', Validators.required], // Ensure this is initialized
      Lot: new FormControl(''),
      // ['', Validators.required],
      Expiry: new FormControl(''),
      // ['', Validators.required], // Add Expiry control
      Validity: new FormControl(''),
      // ['', Validators.required],
      'BrandId': new FormControl(''),
      'GivenDate': [null],
      'IsDisease': [false],
      'DiseaseYear': ['2019'],
    });

    this.fgAddData = this.formBuilder.group({
      'DoctorId': [''],
      'IsDone': [null],
      'BrandId': [null],
      'IsDisease': [false],
      'DiseaseYear': ['2019'],
      'DoseId': [null],
      'ChildId': [null],
      'Date': [null]
    });
    this.getVaccination();
    this.todaydate = new Date();
    this.todaydate = moment(this.todaydate, 'DD-MM-YYYY').format("YYYY-MM-DD");
    // this.route.params.subscribe(params => {
    //   this.childId = +params['childId']; // Assuming childId is part of the route
    // });
    // console.log( this.childId )
    // this.getChildData(this.childId)
  }
  // checkDate() {
  //   const today = new Date();
  //   const selectedDate = new Date(this.scheduleDate);

  //   // Compare both year, month, and day
  //   this.isScheduleDateInvalid = Date > today;
  // }

  async getVaccination() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();
    await this.vaccineService.getVaccineByVaccineId(this.route.snapshot.paramMap.get('id')).subscribe(
      res => {
        if (res.IsSuccess) {
          this.vaccineData = res.ResponseData;
          this.MinAge = this.vaccineData.Dose.Vaccine.MinAge;
          this.MinGap = this.vaccineData.Dose.MinGap;
          console.log(this.vaccineData);
          console.log(this.vaccineData.ChildId);
          this.childId=this.vaccineData.ChildId;
          console.log('Child ID:', this.childId); 
          this.getChildData(this.childId)
          this.vaccineName = this.vaccineData.Dose.Vaccine.Name;
          this.brandName = this.vaccineData.Brands;
          this.Date = this.vaccineData.Date;
          this.Date = moment(this.Date, 'DD-MM-YYYY').format('YYYY-MM-DD');
          // this.isScheduleDateValid(this.Date);
          this.fg.controls.GivenDate.setValue(this.Date);
          var brand = this.vaccinesData.filter(x => x.vaccineId == res.ResponseData.Dose.VaccineId);
          if (brand[0].brandId != null) {
            this.fg.controls['BrandId'].setValue(brand[0].brandId);
          }
          this.ref.detectChanges();
          loading.dismiss();
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger');
      }
    );
  };

  // getChildData(childId): void {
  //   console.log(childId);
  //   this.childService.getChildById(childId).subscribe(
  //     (data) => {
  //       this.childData = data;
  //       console.log(data)
  //     },
  //     (error) => {
  //       console.error('Error fetching child data:', error);
  //     }
  //   );
  // }
  
  async getChildData(childId) {
    if (!this.childService) {
      console.error('childService is not defined');
      return;
    }
  
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
  
    console.log(childId);
    await loading.present();
  
    this.childService.getChildById(childId).subscribe(
      res => {
        if (res.IsSuccess) {
          this.vaccineData = res.ResponseData;
          console.log(this.vaccineData);
          // this.MinAge = this.vaccineData.Dose.Vaccine.MinAge;
          // this.MinGap = this.vaccineData.Dose.MinGap;
          // console.log(this.vaccineData);
          // console.log(this.vaccineData.ChildId);
          this.childId = this.vaccineData.ChildId; // Assuming ChildId is the correct property to use
          console.log('Child ID:', this.childId); 
          this.Type = this.vaccineData.Type; // Retaining this line as it seems necessary
          // this.vaccineName = this.vaccineData.Dose.Vaccine.Name;
          // this.brandName = this.vaccineData.Brands;
          // this.Date = this.vaccineData.Date;
          // this.Date = moment(this.Date, 'DD-MM-YYYY').format('YYYY-MM-DD');
          // this.fg.controls.GivenDate.setValue(this.Date);
          // var brand = this.vaccinesData.filter(x => x.vaccineId == res.ResponseData.Dose.VaccineId);
          // if (brand[0].brandId != null) {
          //   this.fg.controls['BrandId'].setValue(brand[0].brandId);
          // }
          this.ref.detectChanges();
          loading.dismiss();
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger');
      }
    );
  }
  
  isScheduleDateValid(): boolean {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    const givenDate = this.fg.get('GivenDate').value; // Get the GivenDate value from the form

    return givenDate > today; // Return true if the GivenDate is greater than today's date
  }
  async fillVaccine() {
    const loading = await this.loadingController.create({
      message: 'Updating'
    });

    await loading.present();

    // Check if the selected brand is "OHF"
    if (this.fg.value.BrandId === 'OHF') {
      this.fg.value.BrandId = null; // Set BrandId to null if the brand is "OHF"
    }

    this.fg.value.Id = this.route.snapshot.paramMap.get('id');
    this.fg.value.DoctorId = this.doctorId;
    this.fg.value.IsDone = true;
    this.fg.value.DiseaseYear = moment(this.fg.value.DiseaseYear, 'YYYY-MM-DD').format('YYYY');
    let givenDateOfInjection: Date = this.fg.value.GivenDate;
    let scheduleDate: Date = this.addDays(givenDateOfInjection, this.MinGap, this.vaccineData.DoseId);

    const givenDate = new Date(this.fg.value.GivenDate);
    const currentDate = new Date();// Get the GivenDate value from the form

    givenDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    if (givenDate > currentDate) {
      this.toastService.create("Given date is not today. Cannot update injection.", 'danger');
      loading.dismiss();
      return;
    }

    console.log("givenDateOfInjection", givenDateOfInjection);
    console.log("sdate ", this.addDays(givenDateOfInjection, this.MinGap, this.vaccineData.DoseId));
    this.fg.value.GivenDate = moment(this.fg.value.GivenDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
    await this.vaccineService.fillUpChildVaccine(this.fg.value).subscribe(
      res => {
        if (res.IsSuccess) {
          if (this.vaccineData.Dose.Vaccine.isInfinite) {
            loading.dismiss();
            this.addNewVaccineInScheduleTable(scheduleDate);
          } else {
            this.router.navigate(['/members/child/vaccine/' + this.vaccineData.ChildId]);
          }
          loading.dismiss();
        } else {
          this.toastService.create("Error: Failed to update injection");
          loading.dismiss();
        }
      },
      err => {
        this.toastService.create("Error: Server Failure");
        loading.dismiss();
      }
    );
  }

  async addNewVaccineInScheduleTable(scheduleDate) {
    const loading = await this.loadingController.create({
      message: 'Updating Schedule'
    });

    await loading.present();

    this.fgAddData.value.DoctorId = this.fg.value.DoctorId;
    this.fgAddData.value.IsDone = false;
    this.fgAddData.value.BrandId = this.fg.value.BrandId;
    this.fgAddData.value.IsDisease = this.fg.value.IsDisease;
    this.fgAddData.value.DiseaseYear = this.fg.value.DiseaseYear;
    this.fgAddData.value.ChildId = this.vaccineData.ChildId;
    this.fgAddData.value.DoseId = this.vaccineData.DoseId;
    this.fgAddData.value.Date = scheduleDate;

    await this.vaccineService.AddChildSchedule(this.fgAddData.value).subscribe(
      res => {
        if (res.IsSuccess) {
          console.log(res.ResponseData);
          loading.dismiss();
          this.router.navigate(['/members/child/vaccine/' + this.vaccineData.ChildId]);
          loading.dismiss();
        } else {
          loading.dismiss();
          this.toastService.create("Error: Failed to Add injection");
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create("Error: Server Failure");
      }
    );
  }

  addDays(date, days, doseId) {
    var myDate = new Date(date);
    if (doseId === 30 && days === 1095) {
      myDate.setFullYear(myDate.getFullYear() + 3);
    } else {
      myDate.setDate(myDate.getDate() + days);
    }
    return myDate;
  }

  isBrandFilled(): boolean {
    return this.fg.get('BrandId').value !== null;
  }

  addOHFToBrands() {
    const OHFBrand = { brandId: 'OHF', name: 'OHF' };
    const existingOHF = this.vaccinesData.find(brand => brand.brandId === 'OHF');

    if (!existingOHF) {
      this.vaccinesData.push(OHFBrand);
    }
  }
}
