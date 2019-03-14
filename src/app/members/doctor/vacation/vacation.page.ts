import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ClinicService } from 'src/app/services/clinic.service';
import { Storage } from '@ionic/storage';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { VacationService } from 'src/app/services/vacation.service';
import { Router } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'app-vacation',
  templateUrl: './vacation.page.html',
  styleUrls: ['./vacation.page.scss'],
})
export class VacationPage implements OnInit {

  fg2: FormGroup;
  clinics: any = [];

  doctorID: any;
  clinicID: any = [];
  todaydate;

  constructor(
    public loadingController: LoadingController,
    private router: Router,
    public formBuilder: FormBuilder,
    private storage: Storage,
    private clinicService: ClinicService,
    private vacationService: VacationService,
    private toastService: ToastService,

  ) {
    this.todaydate = new Date();
    this.todaydate = moment(this.todaydate, "DD-MM-YYYY").format('YYYY-MM-DD');
    this.fg2 = this.formBuilder.group({
      clinics: new FormArray([]),
      'formDate': [null],
      'ToDate': [null]
    });
  }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_ID).then((val) => {
      this.doctorID = val;
    });
    this.getClinics();

  }
  pickFromDate($event) {
    this.fg2.value.formDate = $event.detail.value;
  }
  pickTodayDate($event) {
    this.fg2.value.ToDate = $event.detail.value;
  }

  getChildVaccinefromUser() {
    for (let i = 0; i <= this.clinics.length; i++) {
      if (this.fg2.value.clinics[i] == true) {
        this.clinicID.push(this.clinics[i].ID);
      }
    }
    let data = { 'Clinics': this.clinicID, 'FromDate': this.fg2.value.formDate, 'ToDate': this.fg2.value.ToDate }
    this.addVacation(data)
  }

  async getClinics() {
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    await this.clinicService.getClinics(this.doctorID).subscribe(
      res => {
        if (res.IsSuccess) {
          this.clinics = res.ResponseData;
          const controls = this.clinics.map(c => new FormControl(false));
          this.fg2 = this.formBuilder.group({
            clinics: new FormArray(controls),
            'formDate': [null],
            'ToDate': [null]
          });
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
  async addVacation(data) {
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    await this.vacationService.addVaccation(data)
      .subscribe(res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create('successfully added');
          this.router.navigate(['/members/']);
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      }, (err) => {
        loading.dismiss();
        this.toastService.create(err, 'danger')
      });
  }
}

// https://coryrylan.com/blog/creating-a-dynamic-checkbox-list-in-angular