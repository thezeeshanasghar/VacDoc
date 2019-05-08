import { Component, OnInit, Input } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ClinicService } from "src/app/services/clinic.service";
import { ToastService } from "src/app/shared/toast.service";
import { Router } from "@angular/router";
import { LoadingController } from "@ionic/angular";
import { SignupService } from "src/app/services/signup.service";

@Component({
  selector: "app-add1",
  templateUrl: "./add.page.html"
})
export class AddPage implements OnInit {
  @Input("mode") mode: string = "";
  fg1: FormGroup;
  fg2: FormGroup;
  doctorID: any;
  section: boolean = false;
  constructor(
    private formbuilder: FormBuilder,
    private router: Router,
    private loadingController: LoadingController,
    private clinicService: ClinicService,
    private toastService: ToastService,
    private signupService: SignupService,
    private storage: Storage
  ) {}

  ngOnInit() {
    this.storage.get(environment.DOCTOR_ID).then(val => {
      this.doctorID = val;
    });
    this.fg1 = this.formbuilder.group({
      DoctorID: [null],
      Name: [null],
      PhoneNumber: [null],
      Address: [null],
      ConsultationFee: [null],
      OffDays: [null],
      ClinicTimings: [null],
      Lat: [null],
      Long: [null]
    });

    this.fg2 = this.formbuilder.group({
      Monday: [false],
      Mstart: [null],
      Mstart2: [null],
      Mend: [null],
      Mend2: [null],

      Tuesday: [false],
      Tustart: [null],
      Tustart2: [null],
      Tuend: [null],
      Tuend2: [null],

      Wednesday: [false],
      Wstart: [null],
      Wstart2: [null],
      Wend: [null],
      Wend2: [null],

      Thursday: [false],
      Thstart: [null],
      Thstart2: [null],
      Thend: [null],
      Thend2: [null],

      Friday: [false],
      Fstart: [null],
      Fstart2: [null],
      Fend: [null],
      Fend2: [null],

      Saturday: [false],
      Sastart: [null],
      Sastart2: [null],
      Saend: [null],
      Saend2: [null],

      Sunday: [false],
      Sustart: [null],
      Sustart2: [null],
      Suend: [null],
      Suend2: [null]
    });
  }
  setAllDaysValueStrat1() {
    this.fg2.controls["Tustart"].setValue(this.fg2.value.Mstart);
    this.fg2.controls["Wstart"].setValue(this.fg2.value.Mstart);
    this.fg2.controls["Thstart"].setValue(this.fg2.value.Mstart);
    this.fg2.controls["Fstart"].setValue(this.fg2.value.Mstart);
    this.fg2.controls["Sastart"].setValue(this.fg2.value.Mstart);
    this.fg2.controls["Sustart"].setValue(this.fg2.value.Mstart);
  }
  setAllDaysValueStrat2() {
    this.fg2.controls["Tustart2"].setValue(this.fg2.value.Mstart2);
    this.fg2.controls["Wstart2"].setValue(this.fg2.value.Mstart2);
    this.fg2.controls["Thstart2"].setValue(this.fg2.value.Mstart2);
    this.fg2.controls["Fstart2"].setValue(this.fg2.value.Mstart2);
    this.fg2.controls["Sastart2"].setValue(this.fg2.value.Mstart2);
    this.fg2.controls["Sustart2"].setValue(this.fg2.value.Mstart2);
  }
  setAllDaysValueEnd1() {
    this.fg2.controls["Tuend"].setValue(this.fg2.value.Mend);
    this.fg2.controls["Wend"].setValue(this.fg2.value.Mend);
    this.fg2.controls["Thend"].setValue(this.fg2.value.Mend);
    this.fg2.controls["Fend"].setValue(this.fg2.value.Mend);
    this.fg2.controls["Saend"].setValue(this.fg2.value.Mend);
    this.fg2.controls["Suend"].setValue(this.fg2.value.Mend);
  }
  setAllDaysValueEnd2() {
    this.fg2.controls["Tuend2"].setValue(this.fg2.value.Mend2);
    this.fg2.controls["Wend2"].setValue(this.fg2.value.Mend2);
    this.fg2.controls["Thend2"].setValue(this.fg2.value.Mend2);
    this.fg2.controls["Fend2"].setValue(this.fg2.value.Mend2);
    this.fg2.controls["Saend2"].setValue(this.fg2.value.Mend2);
    this.fg2.controls["Suend2"].setValue(this.fg2.value.Mend2);
  }

  getdata() {
    this.fg2.controls["Tuend"].setValue(this.fg2.value.Mend);
    this.fg1.value.DoctorID = this.doctorID;
    this.fg1.value.OffDays = "Sunday";
    this.fg1.value.Lat = 33.63207;
    this.fg1.value.Long = 72.935488;
    var ct = [];
    if (this.fg2.value.Monday) {
      let obj = {
        Day: "Monday",
        StartTime: this.fg2.value.Mstart,
        EndTime: this.fg2.value.Mend,
        IsOpen: true,
        Session: 1
      };
      ct.push(obj);
    }

    if (this.fg2.value.Tuesday) {
      let obj = {
        Day: "Tuesday",
        StartTime: this.fg2.value.Tustart,
        EndTime: this.fg2.value.Tuend,
        IsOpen: true,
        Session: 1
      };
      ct.push(obj);
    }

    if (this.fg2.value.Wednesday) {
      let obj = {
        Day: "Wednesday",
        StartTime: this.fg2.value.Wstart,
        EndTime: this.fg2.value.Wend,
        IsOpen: true,
        Session: 1
      };
      ct.push(obj);
    }

    if (this.fg2.value.Thursday) {
      let obj = {
        Day: "Thursday",
        StartTime: this.fg2.value.Thstart,
        EndTime: this.fg2.value.Thend,
        IsOpen: true,
        Session: 1
      };
      ct.push(obj);
    }

    if (this.fg2.value.Friday) {
      let obj = {
        Day: "Friday",
        StartTime: this.fg2.value.Fstart,
        EndTime: this.fg2.value.Fend,
        IsOpen: true,
        Session: 1
      };
      ct.push(obj);
    }

    if (this.fg2.value.Saturday) {
      let obj = {
        Day: "Saturday",
        StartTime: this.fg2.value.Sastart,
        EndTime: this.fg2.value.Saend,
        IsOpen: true,
        Session: 1
      };
      ct.push(obj);
    }

    if (this.fg2.value.Sunday) {
      let obj = {
        Day: "Sunday",
        StartTime: this.fg2.value.Sustart,
        EndTime: this.fg2.value.Suend,
        IsOpen: true,
        Session: 1
      };
      ct.push(obj);
    }
    this.fg1.value.ClinicTimings = ct;

    this.addNewClinic(this.fg1.value);
  }

  async addNewClinic(data) {
    {
      const loading = await this.loadingController.create({
        message: "Loading"
      });
      await loading.present();

      console.log(this.mode);
      if (this.mode && this.mode == "1") {
        this.signupService.clientData = this.fg1.value;
        //this.signupService.clientData();
        console.log(this.mode);
        loading.dismiss();
        this.router.navigate(["/sigup/vschedule"]);
      } else {
        await this.clinicService.addClinic(data).subscribe(
          res => {
            if (res.IsSuccess) {
              loading.dismiss();
              this.toastService.create("successfully added");
              this.router.navigate(["/members/doctor/clinic"]);
            } else {
              loading.dismiss();
              this.toastService.create(res.Message, "danger");
            }
          },
          err => {
            loading.dismiss();
            this.toastService.create(err, "danger");
          }
        );
      }
    }
  }
}
