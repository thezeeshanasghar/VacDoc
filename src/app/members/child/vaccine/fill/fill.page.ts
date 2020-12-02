import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute , Router } from '@angular/router';
import { VaccineService } from 'src/app/services/vaccine.service';
import { ToastService } from 'src/app/shared/toast.service';
import { LoadingController } from '@ionic/angular';
import * as moment from 'moment';
import { FormGroup, FormBuilder } from '@angular/forms';
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
  vaccineName:any;
  brandName: any;
  Date: any;
  todaydate: any;
  birthYear: any;
  constructor(
    public loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private storage: Storage,
    private route: ActivatedRoute,
    private vaccineService: VaccineService,
    private toastService: ToastService,
    private router: Router,
    private ref: ChangeDetectorRef
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
    });

    this.fg = this.formBuilder.group({
      'DoctorId': [''],
      'Id': [null],
      'IsDone': [null],
      'Weight': [null],
      'Height': [null],
      'Circle': [null],
      'BrandId': [null],
      'GivenDate': [null],
      'IsDisease': [false],
      'DiseaseYear': ['2019'],

    });
    this.getVaccination();
    this.todaydate = new Date();
    this.todaydate = moment(this.todaydate,'DD-MM-YYYY').format("YYYY-MM-DD");
   // this.fg.value.DiseaseYear = this.todaydate;
  }

  async getVaccination() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();
    await this.vaccineService.getVaccineByVaccineId(this.route.snapshot.paramMap.get('id')).subscribe(
      res => {
        if (res.IsSuccess) {
          console.log(res.ResponseData);
          this.vaccineData = res.ResponseData;
          this.vaccineName = this.vaccineData.Dose.Vaccine.Name;
          this.brandName = this.vaccineData.Brands;
          this.Date = this.vaccineData.Date;
          this.Date = moment(this.Date, 'DD-MM-YYYY').format('YYYY-MM-DD');
          this.fg.controls.GivenDate.setValue(this.Date);
          var brand = this.vaccinesData.filter(x=>x.vaccineId == res.ResponseData.Dose.VaccineId);
          if (brand[0].brandId != null)
          this.fg.controls['BrandId'].setValue(brand[0].brandId);
          this.ref.detectChanges();
          console.log(brand);
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
    this.fg.value.Id = this.route.snapshot.paramMap.get('id');
    this.fg.value.DoctorId = this.doctorId;
    this.fg.value.IsDone = true;
    this.fg.value.DiseaseYear = moment(this.fg.value.DiseaseYear, 'YYYY-MM-DD').format('YYYY');
    console.log(this.fg.value.GivenDate);
    this.fg.value.GivenDate = moment(this.fg.value.GivenDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
    console.log(this.fg.value);
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();
    await this.vaccineService.fillUpChildVaccine(this.fg.value).subscribe(
      res => {
        if (res.IsSuccess) {
          this.router.navigate(['/members/child/vaccine/'+this.vaccineData.ChildId]);
          this.toastService.create('Succfully Update');
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
}
