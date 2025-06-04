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
  vaccine: any;
  doseId: any;
  usertype: any;
  scheduleDatecheck: string;

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
    private activatedRoute: ActivatedRoute,
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

    this.storage.get(environment.USER).then((user) => {
      if (user) {
        console.log('Retrieved user from storage:', user);
        this.usertype = user.UserType; // Ensure this is set correctly
      } else {
        console.error('No user data found in storage.');
      }
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
      // ['', Validators.required], 
      Lot: new FormControl(''),
      // ['', Validators.required],
      Expiry: [],
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
          console.log(this.vaccineData);
          this.Validity = this.vaccineData.Dose.Vaccine.Validity;
          this.fg.controls['Validity'].setValue(this.Validity + '');
          this.MinAge = this.vaccineData.Dose.Vaccine.MinAge;
          this.MinGap = this.vaccineData.Dose.MinGap;
          this.vaccine=this.vaccineData.Dose.Vaccine.isInfinite;
          this.childId=this.vaccineData.ChildId;
          this.doseId=this.vaccineData.DoseId;
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
          this.childId = this.vaccineData.Id; // Assuming ChildId is the correct property to use
          this.Type = this.vaccineData.Type; // Retaining this line as it seems necessary
          console.log(this.vaccineData.Type);
          this.Validity = this.vaccineData.Validity; // Retaining this line as it seems necessary
          console.log(this.vaccineData.validity);
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
    const today = new Date().toISOString().split('T')[0]; 
    const givenDate = this.fg.get('GivenDate').value; 
    return givenDate > today;
  }

  async fillVaccine() {
    const loading = await this.loadingController.create({
      message: 'Updating'
    });
    await loading.present();
    if (this.fg.value.BrandId === 'OHF') {
      this.fg.value.BrandId = null; 
    }
    console.log(this.usertype)
    if (this.usertype === 'DOCTOR') {
      this.fg.value.IsPAApprove = true;
    } else {
      this.fg.value.IsPAApprove = false;
    }
    this.fg.value.Id = this.route.snapshot.paramMap.get('id');
    this.fg.value.DoctorId = this.doctorId;
    this.fg.value.IsDone = true;
    this.fg.value.DiseaseYear = moment(this.fg.value.DiseaseYear, 'YYYY-MM-DD').format('YYYY');
    let givenDateOfInjection: Date = this.fg.value.GivenDate;
    let scheduleDate: Date = this.addDays(givenDateOfInjection,this.MinGap,this.doseId);
    console.log('Schedule Date:', scheduleDate);
    this.scheduleDatecheck = moment(scheduleDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
    console.log('Schedule Date Check:', this.scheduleDatecheck);
    const givenDate = new Date(this.fg.value.GivenDate);
    const currentDate = new Date();
    givenDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    if (givenDate > currentDate) {
      this.toastService.create("Given date is not today. Cannot update injection.", 'danger');
      loading.dismiss();66
      return;
    }
    loading.dismiss();
    this.fg.value.GivenDate = moment(this.fg.value.GivenDate, 'YYYY-MM-DD').format('DD-MM-YYYY');

    if (this.fg.value.Expiry) {
      this.fg.value.Expiry = moment(this.fg.value.Expiry, 'YYYY-MM-DD').format('YYYY-MM-DD');
    } else {
      this.fg.value.Expiry = null;
    }


    await this.vaccineService.fillUpChildVaccine(this.fg.value).subscribe(
      res => {
        if (res.IsSuccess) {
          if (this.vaccine) {
            loading.dismiss();
            this.addNewVaccineInScheduleTable(this.scheduleDatecheck);
          } else {
            loading.dismiss();
            this.router.navigate(['/members/child/vaccine/' + this.childId]);
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
    let VaccineData = {
    DoctorId : this.fg.value.DoctorId,
    IsDone : false,
    BrandId : this.fg.value.BrandId,
    ChildId : this.childId,
    DoseId : this.doseId,
    Date : scheduleDate,
    GivenDate:this.fg.value.GivenDate,
    Height:this.fg.value.Height,
    Weight: this.fg.value.Weight,
    IsSkip: false
    };
  
    await this.vaccineService.AddChildSchedule(VaccineData).subscribe(
      res => {
        console.log(res);
        console.log(VaccineData);
        if (res.IsSuccess) {
          this.router.navigate(['/members/child/vaccine/' + this.childId]);
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

  addDays(date: Date | string, days: number, doseId: number): Date {
    // Ensure we have a proper Date object
    const myDate = date instanceof Date ? new Date(date.getTime()) : new Date(date);
    
    if (isNaN(myDate.getTime())) {
      console.error('Invalid date provided to addDays:', date);
      return new Date(); // Return current date as fallback
    }

    if (doseId === 30 && days === 1095) {
      const currentYear = myDate.getFullYear();
      myDate.setFullYear(currentYear + 3);
      if (myDate.getMonth() === 1 && myDate.getDate() === 29 && !this.isLeapYear(myDate.getFullYear())) {
        myDate.setDate(28);
      }
    } else {
      myDate.setDate(myDate.getDate() + days);
    }
    return myDate;
  }
  
  isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
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
