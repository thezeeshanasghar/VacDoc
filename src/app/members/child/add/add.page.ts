import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, FormArray, Validators } from '@angular/forms';
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
      ClinicID: [''],
      Name: new FormControl('', Validators.required),
      FatherName: new FormControl('', Validators.required),
      Email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$')
      ])),
      DOB: new FormControl(this.todaydate, Validators.required),
      CountryCode: [null],
      MobileNumber: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('[0-9]{10}$')
      ])),
      PreferredDayOfWeek: [null],
      Gender: [null],
      City: [null],
      PreferredDayOfReminder: [null],
      PreferredSchedule: [null],
      IsEPIDone: [null],
      IsVerified: [null],
      Password: [null],
      ChildVaccines: [null],
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
    this.PasswordGenerator();
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
    this.addNewChild(vaccine);
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

  validation_messages = {
    'name': [
      { type: 'required', message: 'Name is required.' }
    ],
    'fatherName': [
      { type: 'required', message: 'Father name is required.' }
    ],
    'email': [
      { type: 'required', message: 'Email is required.' },
      { type: 'pattern', message: 'Please enter a valid email.' }
    ],
    'DOB': [
      { type: 'required', message: 'Date of Birth is required.' },
    ],
    'mobileNumber': [
      { type: 'required', message: 'Mobile number is required like 3331231231' },
      { type: 'pattern', message: 'Mobile number is required like 3331231231' }
    ],
    'gender': [
      { type: 'required', message: 'Gender is required.' }
    ],
  };
}
