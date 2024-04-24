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
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-vacation',
  templateUrl: './vacation.page.html',
  styleUrls: ['./vacation.page.scss'],
})
export class VacationPage implements OnInit {

  fg2: FormGroup;
  clinics: any = [];

  DoctorId: any;
  ClinicId: any = [];
  todaydate;

  constructor(
    public loadingController: LoadingController,
    private router: Router,
    public formBuilder: FormBuilder,
    private storage: Storage,
    private clinicService: ClinicService,
    private vacationService: VacationService,
    private toastService: ToastService,
    private http: HttpClient

  ) {
    this.todaydate = new Date();
    //this.todaydate = moment(this.todaydate, "DD-MM-YYYY").format('YYYY-MM-DD');
    this.fg2 = this.formBuilder.group({
      clinics: new FormArray([]),
      'formDate': [this.todaydate],
      'ToDate': [this.todaydate]
    });
  }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.DoctorId = val;
    });
    this.getClinics();

  }
  pickFromDate($event) {
    this.fg2.controls['formDate'].setValue($event.detail.value);
  }
  pickTodayDate($event) {
    this.fg2.controls['ToDate'].setValue($event.detail.value);
  }

  getChildVaccinefromUser() {
    // for (let i = 0; i <= this.clinics.length; i++) {
    //   if (this.fg2.value.clinics[i] == true) {
    //     this.ClinicId.push({'Id':this.clinics[i].Id});
    //   }
    // }
    // let data = { 'Clinics': this.ClinicId, 'FromDate': this.fg2.value.formDate, 'ToDate': this.fg2.value.ToDate }
    // this.addVacation(data)
   
    this.addVacation()


  }

  async getClinics() {
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    await this.clinicService.getClinics(this.DoctorId).subscribe(
      res => {
        if (res.IsSuccess) {
          this.clinics = res.ResponseData;
          const controls = this.clinics.map(c => new FormControl(false));
          this.fg2 = this.formBuilder.group({
            clinics: new FormArray(controls),
             'formDate': [this.todaydate],
             'ToDate': [this.todaydate]
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
  async addVacation() {

    const clinicId = 56; // Example clinic IDs
    const fromDate = '2024-04-23'; // Example from date
    const toDate = '2024-04-24';

    this.vacationService.patchChildIdsWithSchedules(clinicId, fromDate, toDate)
      .subscribe(
        (response) => {
          console.log('Data patched successfully:', response);
          // Add your success handling code here
        },
        (error) => {
          console.error('Failed to patch data:', error);
          // Add your error handling code here
        }
      );
  
    // const loading = await this.loadingController.create({ message: 'Loading' });
    // await loading.present();

    // await this.vacationService.addVaccation(data)
    //   .subscribe(res => {
    //     if (res.IsSuccess) {
    //       loading.dismiss();
    //       this.toastService.create('successfully added');
    //       this.router.navigate(['/members/']);
    //     }
    //     else {
    //       loading.dismiss();
    //       this.toastService.create(res.Message, 'danger');
    //     }
    //   }, (err) => {
    //     loading.dismiss();
    //     this.toastService.create(err, 'danger')
    //   });
  }
}

// https://coryrylan.com/blog/creating-a-dynamic-checkbox-list-in-angular