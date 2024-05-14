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
  MinGap:any;

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
  ) {

  }

  

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.doctorId = val;
    });
    this.storage.get('BirthYear').then((val) => {
      this.birthYear = moment(val, "DD-MM-YYYY").format("YYYY-MM-DD");
    });

    this.storage.get('vaccinesData').then((val) => {
      this.vaccinesData = val;
    });

    this.fg = this.formBuilder.group({
      'DoctorId': [''],
      'Id': [null],
      'IsDone': [null],
      Weight: new FormControl('', [Validators.required, Validators.pattern('^[0-9.]*$')    ]),
      Height: new FormControl('', [Validators.required, Validators.pattern('^[0-9.]*$')]),
      Circle: new FormControl('', [Validators.required, Validators.pattern('^[0-9.]*$')]),
      'BrandId': [null],
      'GivenDate': [null],
      'IsDisease': [false],
      'DiseaseYear': ['2019'],

    });

    this.fgAddData = this.formBuilder.group({
      'DoctorId': [''],
      'IsDone': [null],
      // 'Weight': [null],
      // 'Height': [null],
      // 'Circle': [null],
      'BrandId': [null],
      // 'GivenDate': [null],
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
          // console.log('Minage= ' + this.MinAge);
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
        }
        else {
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
    
    this.fg.value.Id = this.route.snapshot.paramMap.get('id');
    this.fg.value.DoctorId = this.doctorId;
    this.fg.value.IsDone = true;
    this.fg.value.DiseaseYear = moment(this.fg.value.DiseaseYear, 'YYYY-MM-DD').format('YYYY');
    let givenDateOfInjection: Date = this.fg.value.GivenDate;
    let scheduleDate: Date = this.addDays(givenDateOfInjection, this.MinGap);
    this.fg.value.GivenDate = moment(this.fg.value.GivenDate, 'YYYY-MM-DD').format('DD-MM-YYYY');

    await this.vaccineService.fillUpChildVaccine(this.fg.value).subscribe(
      res => {
        if (res.IsSuccess) {
          // this.toastService.create('Update successfull');
          if (this.vaccineData.Dose.Vaccine.isInfinite) {
            this.addNewVaccineInScheduleTable(scheduleDate);
          } else {
            this.router.navigate(['/members/child/vaccine/' + this.vaccineData.ChildId]);
          }
          loading.dismiss();
        }
        else {
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

    // console.log('Added Data');
    // console.log(this.fgAddData.value);

    await this.vaccineService.AddChildSchedule(this.fgAddData.value).subscribe(
      res => {
        if (res.IsSuccess) {
          console.log(res.ResponseData);
          this.router.navigate(['/members/child/vaccine/' + this.vaccineData.ChildId]);
          loading.dismiss();
        }
        else {
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
 
  addDays(date, days) {
    console.log("date");
    console.log(date);

    var myDate = new Date(date);
    myDate.setDate(myDate.getDate() + days);
    
    console.log("scheduleDate");
    console.log(myDate);
    return myDate;
  }

  isBrandFilled(): boolean{
    return this.fg.get('BrandId').value !== null; 
  }
  

}
