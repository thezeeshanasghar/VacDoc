import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VaccineService } from 'src/app/services/vaccine.service';
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

  fgAddData: FormGroup;

  constructor(
    public loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private storage: Storage,
    private route: ActivatedRoute,
    private vaccineService: VaccineService,
    private toastService: ToastService,
    private router: Router,
    private ref: ChangeDetectorRef
  ) {}

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
      Weight: new FormControl(''),
      Height: new FormControl(''),
      Circle: new FormControl(''),
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
          this.vaccineName = this.vaccineData.Dose.Vaccine.Name;
          this.brandName = this.vaccineData.Brands;
          this.Date = this.vaccineData.Date;
          this.Date = moment(this.Date, 'DD-MM-YYYY').format('YYYY-MM-DD');
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
    
    // New check: if scheduleDate is greater than today, do not update
    if (scheduleDate > new Date() && scheduleDate.toDateString() !== new Date().toDateString()) {
      this.toastService.create("Schedule date is in the future. Cannot update injection.", 'danger');
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
