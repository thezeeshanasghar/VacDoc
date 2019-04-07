import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, FormArray } from '@angular/forms';
import * as moment from 'moment';
import { LoadingController } from '@ionic/angular';
import { VaccineService } from 'src/app/services/vaccine.service';
import { ToastService } from 'src/app/shared/toast.service';
import { ChildService } from 'src/app/services/child.service';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ClinicService } from 'src/app/services/clinic.service';

@Component({
  selector: 'app-add',
  templateUrl: './add.page.html',
  styleUrls: ['./add.page.scss'],
})
export class AddPage implements OnInit {

  fg1: FormGroup;
  fg2: FormGroup;
  formcontroll: boolean = false;
  vaccines: any;
  doctorID: any;
  clinics: any;
  todaydate: any;
  gender: any;

  constructor(
    public loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private vaccineService: VaccineService,
    private childService: ChildService,
    private toastService: ToastService,
    private router: Router,
    private storage: Storage,
    private clinicService: ClinicService
  ) { }

  ngOnInit() {
    this.todaydate = new Date();
    this.todaydate = moment(this.todaydate, "DD-MM-YYYY").format('YYYY-MM-DD');

    this.getVaccine();
    this.fg1 = this.formBuilder.group({
      'ClinicID': [''],
      'Name': [null],
      'FatherName': [null],
      'Email': [null],
      'DOB': [this.todaydate],
      'CountryCode': [null],
      'MobileNumber': [null],
      'PreferredDayOfWeek': [null],
      'Gender': [null],
      'City': [null],
      'PreferredDayOfReminder': [null],
      'PreferredSchedule': [null],
      'IsEPIDone': [null],
      'IsVerified': [null],
      'Password': [null],
      'ChildVaccines': [null],
    });
    this.storage.get(environment.DOCTOR_ID).then((val) => {
      this.doctorID = val;
    });
    this.getClinics();

    this.storage.get(environment.CLINIC_ID).then((val) => {
      this.fg1.controls['ClinicID'].setValue(val);
    });

  }

  moveNextStep() {
    this.fg1.value.DOB = moment(this.fg1.value.DOB, 'YYYY-MM-DD').format('DD-MM-YYYY');
    this.formcontroll = true;
    this.fg1.value.Gender = this.gender;
    console.log(this.fg1.value);
  }
  updateGender(g) {
    this.gender = g;
  }

  getChildVaccinefromUser() {
    this.fg2.value.ChildVaccines = this.fg2.value.ChildVaccines
      .map((v, i) => v ? this.vaccines[i].ID : null)
      .filter(v => v !== null);

    this.fg2.value.ChildVaccines = this.fg2.value.ChildVaccines;
    let vaccine = this.fg1.value;
    vaccine.ChildVaccines = [];
    for (let i = 0; i < this.fg2.value.ChildVaccines.length; i++) {
      vaccine.ChildVaccines.push({ ID: this.fg2.value.ChildVaccines[i] });
    }
    console.log(vaccine)
    this.addNewChild(vaccine);
  }

  getClinicforCheckOnline() {

  }

  async getClinics() {
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    await this.clinicService.getClinics(this.doctorID).subscribe(
      res => {

        this.clinics = res.ResponseData;
        loading.dismiss();
        if (res.IsSuccess) {
          for (let i = 0; i < this.clinics.length; i++) {
            if (this.clinics[i].IsOnline == true) {
              this.storage.set(environment.CLINIC_ID, this.clinics[i].ID)
            }
          }
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

  PasswordGenerator() {
    var length = 4,
      charset = "0123456789",
      retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    this.fg1.value.Password = retVal;
  }



  async getVaccine() {
    const loading = await this.loadingController.create({
      message: 'loading'
    });
    await loading.present();
    await this.vaccineService.getVaccine().subscribe(
      res => {
        if (res.IsSuccess) {
          this.vaccines = res.ResponseData;
          this.PasswordGenerator();

          const controls = this.vaccines.map(c => new FormControl(true));
          this.fg2 = this.formBuilder.group({
            ChildVaccines: new FormArray(controls),
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
    )
  }

  async addNewChild(data) {
    await this.childService.addChild(data)
      .subscribe(res => {
        if (res.IsSuccess) {
          this.toastService.create('successfully added');
          this.router.navigate(['/members/child']);
        }
        else {
          this.formcontroll = false;
          this.toastService.create(res.Message, 'danger');
        }
      }, (err) => {
        this.formcontroll = false;
        this.toastService.create(err, 'danger')
      });
  }
}
