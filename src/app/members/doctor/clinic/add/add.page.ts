import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ClinicService } from 'src/app/services/clinic.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-add',
  templateUrl: './add.page.html',
  styleUrls: ['./add.page.scss'],
})
export class AddPage implements OnInit {

  fg1: FormGroup;
  fg2: FormGroup;
  doctorID: any;
  constructor(
    private formbuilder: FormBuilder,
    private router: Router,
    private loadingController: LoadingController,
    private clinicService: ClinicService,
    private toastService: ToastService,

    private storage: Storage
  ) { }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_ID).then((val) => {
      this.doctorID = val;
    })
    this.fg1 = this.formbuilder.group({

      'DoctorID': [null],
      'Name': [null],
      'PhoneNumber': [null],
      'Address': [null],
      'ConsultationFee': [null],
      'OffDays': [null],
      'ClinicTimings': [null],
      'Lat': [null],
      'Long': [null],
    });

    this.fg2 = this.formbuilder.group({
      'Monday': [false],
      'Mstart': [null],
      'Mend': [null],
      'Tuesday': [false],
      'Tustart': [null],
      'Tuend': [null],
      'Wednesday': [false],
      'Wstart': [null],
      'Wend': [null],
      'Thursday': [false],
      'Thstart': [null],
      'Thend': [null],
      'Friday': [false],
      'Fstart': [null],
      'Fend': [null],
      'Saturday': [false],
      'Sastart': [null],
      'Saend': [null],
      'Sunday': [false],
      'Sustart': [null],
      'Suend': [null],
    });
  }

  getdata() {
    this.fg1.value.DoctorID = this.doctorID;
    this.fg1.value.OffDays = 'Sunday';
    this.fg1.value.Lat = 33.632070;
    this.fg1.value.Long = 72.935488;
    var ct = []
    console.log(this.fg2.value);
    if (this.fg2.value.Monday) {
      let obj = { 'Day': 'Monday', 'StartTime': this.fg2.value.Mstart, 'EndTime': this.fg2.value.Mend, 'IsOpen': true, 'Session': 1 }
      ct.push(obj);
    }

    if (this.fg2.value.Tuesday) {
      let obj = { 'Day': 'Tuesday', 'StartTime': this.fg2.value.Tustart, 'EndTime': this.fg2.value.Tuend, 'IsOpen': true, 'Session': 1 }
      ct.push(obj);
    }

    if (this.fg2.value.Wednesday) {
      let obj = { 'Day': 'Wednesday', 'StartTime': this.fg2.value.Wstart, 'EndTime': this.fg2.value.Wend, 'IsOpen': true, 'Session': 1 }
      ct.push(obj);
    }

    if (this.fg2.value.Thursday) {
      let obj = { 'Day': 'Thursday', 'StartTime': this.fg2.value.Thstart, 'EndTime': this.fg2.value.Thend, 'IsOpen': true, 'Session': 1 }
      ct.push(obj);
    }

    if (this.fg2.value.Friday) {
      let obj = { 'Day': 'Friday', 'StartTime': this.fg2.value.Fstart, 'EndTime': this.fg2.value.Fend, 'IsOpen': true, 'Session': 1 }
      ct.push(obj);
    }

    if (this.fg2.value.Saturday) {
      let obj = { 'Day': 'Saturday', 'StartTime': this.fg2.value.Sastart, 'EndTime': this.fg2.value.Saend, 'IsOpen': true, 'Session': 1 }
      ct.push(obj);
    }

    if (this.fg2.value.Sunday) {
      let obj = { 'Day': 'Sunday', 'StartTime': this.fg2.value.Sustart, 'EndTime': this.fg2.value.Suend, 'IsOpen': true, 'Session': 1 }
      ct.push(obj);
    }
    this.fg1.value.ClinicTimings = ct;

    console.log(this.fg1.value);
    this.addNewClinic(this.fg1.value);
  }

  async addNewClinic(data) {
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    await this.clinicService.addClinic(data)
      .subscribe(res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create('successfully added');
          this.router.navigate(['/members/doctor/clinic']);
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
