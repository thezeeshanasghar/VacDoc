import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ClinicService } from 'src/app/services/clinic.service';
import { ToastService } from 'src/app/shared/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.page.html',
  styleUrls: ['./edit.page.scss'],
})
export class EditPage implements OnInit {

  fg1: FormGroup;
  fg2: FormGroup;
  clinicID: any;
  clinic: any;

  constructor(
    public loadingController: LoadingController,
    public router: Router,
    public route: ActivatedRoute,
    private formbuilder: FormBuilder,
    private clinicService: ClinicService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.fg1 = this.formbuilder.group({
      'ID': [null],
      'DoctorID': [null],
      'Name': [null],
      'PhoneNumber': [null],
      'Address': [null],
      'ConsultationFee': [null],
      'OffDays': [null],
      'ClinicTimings': [null],
      'Lat': [null],
      'Long': [null],
      'IsOnline': [null],
      'Monday': [false],
      'Tuesday': [false],
      'Wednesday': [false],
      'Thursday': [false]
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
    this.clinicID = this.route.snapshot.paramMap.get('id');
    this.getClinic();
  }

  async getClinic() {
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();
    await this.clinicService.getClinicById(this.clinicID).subscribe(
      res => {
        if (res.IsSuccess) {
          this.clinic = res.ResponseData;
          this.fg1.controls['Name'].setValue(this.clinic.Name);
          this.fg1.controls['PhoneNumber'].setValue(this.clinic.PhoneNumber);
          this.fg1.controls['Address'].setValue(this.clinic.Address);
          this.fg1.controls['ConsultationFee'].setValue(this.clinic.ConsultationFee);

          if (this.clinic.ClinicTimings[0] && this.clinic.ClinicTimings[0].Day == "Monday") {
            this.fg2.controls['Monday'].setValue(this.clinic.ClinicTimings[0].Day = "Monday" ? true : false);
            this.fg2.controls['Mstart'].setValue(this.clinic.ClinicTimings[0].StartTime);
            this.fg2.controls['Mend'].setValue(this.clinic.ClinicTimings[0].EndTime);
            console.log("monday");
          }
          if (this.clinic.ClinicTimings[2] && this.clinic.ClinicTimings[2].Day == "Tuesday") {
            this.fg2.controls['Tuesday'].setValue(this.clinic.ClinicTimings[2].Day = "Tuesday" ? true : false);
            this.fg2.controls['Tustart'].setValue(this.clinic.ClinicTimings[2].StartTime);
            this.fg2.controls['Tuend'].setValue(this.clinic.ClinicTimings[2].EndTime);
          }
          if (this.clinic.ClinicTimings[4] && this.clinic.ClinicTimings[4].Day == "Wednesday") {
            this.fg2.controls['Wednesday'].setValue(this.clinic.ClinicTimings[4].Day = "Wednesday" ? true : false);
            this.fg2.controls['Wstart'].setValue(this.clinic.ClinicTimings[4].StartTime);
            this.fg2.controls['Wend'].setValue(this.clinic.ClinicTimings[4].EndTime);
          }
          if (this.clinic.ClinicTimings[6] && this.clinic.ClinicTimings[6].Day == "Thursday") {
            this.fg2.controls['Thursday'].setValue(this.clinic.ClinicTimings[6].Day = "Thursday" ? true : false);
            this.fg2.controls['Thstart'].setValue(this.clinic.ClinicTimings[6].StartTime);
            this.fg2.controls['Thend'].setValue(this.clinic.ClinicTimings[6].EndTime);
          }
          if (this.clinic.ClinicTimings[8] && this.clinic.ClinicTimings[8].Day == "Friday") {
            this.fg2.controls['Friday'].setValue(this.clinic.ClinicTimings[8].Day = "Friday" ? true : false);
            this.fg2.controls['Fstart'].setValue(this.clinic.ClinicTimings[8].StartTime);
            this.fg2.controls['Fend'].setValue(this.clinic.ClinicTimings[8].EndTime);
          }
          if (this.clinic.ClinicTimings[10] && this.clinic.ClinicTimings[10].Day == "Saturday") {
            this.fg2.controls['Saturday'].setValue(this.clinic.ClinicTimings[10].Day = "Saturday" ? true : false);
            this.fg2.controls['Sastart'].setValue(this.clinic.ClinicTimings[10].StartTime);
            this.fg2.controls['Saend'].setValue(this.clinic.ClinicTimings[10].EndTime);
          }
          if (this.clinic.ClinicTimings[12] && this.clinic.ClinicTimings[12].Day == "Sunday") {
            this.fg2.controls['Sunday'].setValue(this.clinic.ClinicTimings[12].Day = "Sunday" ? true : false);
            this.fg2.controls['Sustart'].setValue(this.clinic.ClinicTimings[12].StartTime);
            this.fg2.controls['Suend'].setValue(this.clinic.ClinicTimings[12].EndTime);
          }
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

  getdata() {
    var ct = []
    console.log(this.fg2.value);
    if (this.fg2.value.Monday) {
      let obj = { 'Day': 'Monday', 'StartTime': this.fg2.value.Mstart, 'EndTime': this.fg2.value.Mend, 'IsOpen': true, 'Session': 1, ClinicID: this.clinicID }
      ct.push(obj);
    }

    if (this.fg2.value.Tuesday) {
      let obj = { 'Day': 'Tuesday', 'StartTime': this.fg2.value.Mstart, 'EndTime': this.fg2.value.Mend, 'IsOpen': true, 'Session': 1, ClinicID: this.clinicID }
      ct.push(obj);
    }

    if (this.fg2.value.Wednesday) {
      let obj = { 'Day': 'Wednesday', 'StartTime': this.fg2.value.Mstart, 'EndTime': this.fg2.value.Mend, 'IsOpen': true, 'Session': 1, ClinicID: this.clinicID }
      ct.push(obj);
    }

    if (this.fg2.value.Thursday) {
      let obj = { 'Day': 'Thursday', 'StartTime': this.fg2.value.Mstart, 'EndTime': this.fg2.value.Mend, 'IsOpen': true, 'Session': 1, ClinicID: this.clinicID }
      ct.push(obj);
    }

    if (this.fg2.value.Friday) {
      let obj = { 'Day': 'Friday', 'StartTime': this.fg2.value.Mstart, 'EndTime': this.fg2.value.Mend, 'IsOpen': true, 'Session': 1, ClinicID: this.clinicID }
      ct.push(obj);
    }

    if (this.fg2.value.Saturday) {
      let obj = { 'Day': 'Saturday', 'StartTime': this.fg2.value.Mstart, 'EndTime': this.fg2.value.Mend, 'IsOpen': true, 'Session': 1, ClinicID: this.clinicID }
      ct.push(obj);
    }

    if (this.fg2.value.Sunday) {
      let obj = { 'Day': 'Sunday', 'StartTime': this.fg2.value.Mstart, 'EndTime': this.fg2.value.Mend, 'IsOpen': true, 'Session': 1, ClinicID: this.clinicID }
      ct.push(obj);
    }
    this.fg1.value.ClinicTimings = ct;

    console.log(this.fg1.value);
  }
  async getChildVaccinefromUser() {

  }
}
