import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  vaccineData: any;
  brandName: any;
  Date: any;
  constructor(
    public loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private storage: Storage,
    private route: ActivatedRoute,
    private vaccineService: VaccineService,
    private toastService: ToastService
  ) { }


  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.doctorId = val;
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
    });

    this.getVaccination();
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
          this.brandName = this.vaccineData.Brands;
          this.Date = this.vaccineData.Date;
          this.Date = moment(this.Date, 'DD-MM-YYYY').format('YYYY-MM-DD');
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
    this.fg.value.GivenDate = moment(this.fg.value.GivenDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
    console.log(this.fg.value);
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();
    await this.vaccineService.fillUpChildVaccine(this.fg.value).subscribe(
      res => {
        if (res.IsSuccess) {
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
