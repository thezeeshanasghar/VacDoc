import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { ClinicService } from "src/app/services/clinic.service";
import { ToastService } from "src/app/shared/toast.service";
import { ActivatedRoute, Router } from "@angular/router";
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators
} from "@angular/forms";
import { environment } from "src/environments/environment";
import { Storage } from "@ionic/storage";

@Component({
  selector: "app-edit",
  templateUrl: "./edit.page.html",
  styleUrls: ["./edit.page.scss"]
})
export class EditPage implements OnInit {
  fg1: FormGroup;
  fg2: FormGroup;
  clinicID: any;
  clinic: any;
  doctorID: any;

  constructor(
    public loadingController: LoadingController,
    public router: Router,
    public route: ActivatedRoute,
    private formbuilder: FormBuilder,
    private clinicService: ClinicService,
    private toastService: ToastService,
    private storage: Storage
  ) {}

  ngOnInit() {
    this.fg1 = this.formbuilder.group({
      ID: [null],
      DoctorID: [null],
      Name: [null],
      PhoneNumber: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.minLength(7),
          Validators.pattern("^(0|[1-9][0-9]*)$")
        ])
      ),
      Address: [null],
      ConsultationFee: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.pattern("^(0|[1-9][0-9]*)$")
        ])
      ),
      OffDays: ["sunday"],
      ClinicTimings: [null],
      Lat: [null],
      Long: [null],
      IsOnline: []
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
    this.clinicID = this.route.snapshot.paramMap.get("id");
    this.storage.get(environment.DOCTOR_ID).then(val => {
      this.doctorID = val;
    });
    this.getClinic();
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

  async getClinic() {
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();
    await this.clinicService.getClinicById(this.clinicID).subscribe(
      res => {
        if (res.IsSuccess) {
          this.clinic = res.ResponseData;
          console.log(this.clinic);
          this.fg1.controls["Name"].setValue(this.clinic.Name);
          this.fg1.controls["PhoneNumber"].setValue(this.clinic.PhoneNumber);
          this.fg1.controls["Address"].setValue(this.clinic.Address);
          this.fg1.controls["ConsultationFee"].setValue(
            this.clinic.ConsultationFee
          );

          if (
            this.clinic.ClinicTimings[0] &&
            this.clinic.ClinicTimings[0].Day == "Monday"
          ) {
            this.fg2.controls["Monday"].setValue(
              (this.clinic.ClinicTimings[0].Day = "Monday" ? true : false)
            );
            this.fg2.controls["Mstart"].setValue(
              this.clinic.ClinicTimings[0].StartTime
            );
            this.fg2.controls["Mend"].setValue(
              this.clinic.ClinicTimings[0].EndTime
            );
            console.log("monday");
          }
          if (
            this.clinic.ClinicTimings[2] &&
            this.clinic.ClinicTimings[2].Day == "Tuesday"
          ) {
            this.fg2.controls["Tuesday"].setValue(
              (this.clinic.ClinicTimings[2].Day = "Tuesday" ? true : false)
            );
            this.fg2.controls["Tustart"].setValue(
              this.clinic.ClinicTimings[2].StartTime
            );
            this.fg2.controls["Tuend"].setValue(
              this.clinic.ClinicTimings[2].EndTime
            );
          }
          if (
            this.clinic.ClinicTimings[4] &&
            this.clinic.ClinicTimings[4].Day == "Wednesday"
          ) {
            this.fg2.controls["Wednesday"].setValue(
              (this.clinic.ClinicTimings[4].Day = "Wednesday" ? true : false)
            );
            this.fg2.controls["Wstart"].setValue(
              this.clinic.ClinicTimings[4].StartTime
            );
            this.fg2.controls["Wend"].setValue(
              this.clinic.ClinicTimings[4].EndTime
            );
          }
          if (
            this.clinic.ClinicTimings[6] &&
            this.clinic.ClinicTimings[6].Day == "Thursday"
          ) {
            this.fg2.controls["Thursday"].setValue(
              (this.clinic.ClinicTimings[6].Day = "Thursday" ? true : false)
            );
            this.fg2.controls["Thstart"].setValue(
              this.clinic.ClinicTimings[6].StartTime
            );
            this.fg2.controls["Thend"].setValue(
              this.clinic.ClinicTimings[6].EndTime
            );
          }
          if (
            this.clinic.ClinicTimings[8] &&
            this.clinic.ClinicTimings[8].Day == "Friday"
          ) {
            this.fg2.controls["Friday"].setValue(
              (this.clinic.ClinicTimings[8].Day = "Friday" ? true : false)
            );
            this.fg2.controls["Fstart"].setValue(
              this.clinic.ClinicTimings[8].StartTime
            );
            this.fg2.controls["Fend"].setValue(
              this.clinic.ClinicTimings[8].EndTime
            );
          }
          if (
            this.clinic.ClinicTimings[10] &&
            this.clinic.ClinicTimings[10].Day == "Saturday"
          ) {
            this.fg2.controls["Saturday"].setValue(
              (this.clinic.ClinicTimings[10].Day = "Saturday" ? true : false)
            );
            this.fg2.controls["Sastart"].setValue(
              this.clinic.ClinicTimings[10].StartTime
            );
            this.fg2.controls["Saend"].setValue(
              this.clinic.ClinicTimings[10].EndTime
            );
          }
          if (
            this.clinic.ClinicTimings[12] &&
            this.clinic.ClinicTimings[12].Day == "Sunday"
          ) {
            this.fg2.controls["Sunday"].setValue(
              (this.clinic.ClinicTimings[12].Day = "Sunday" ? true : false)
            );
            this.fg2.controls["Sustart"].setValue(
              this.clinic.ClinicTimings[12].StartTime
            );
            this.fg2.controls["Suend"].setValue(
              this.clinic.ClinicTimings[12].EndTime
            );
          }
          loading.dismiss();
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

  getdata() {
    this.fg1.value.DoctorID = this.doctorID;
    this.fg1.value.ID = this.clinicID;
    this.fg1.value.Lat = 33.63207;
    this.fg1.value.Long = 72.935488;
    var ct = [];
    if (this.fg2.value.Monday) {
      let obj = {
        Day: "Monday",
        StartTime: this.fg2.value.Mstart,
        EndTime: this.fg2.value.Mend,
        IsOpen: true,
        Session: 1,
        ClinicID: this.clinicID
      };
      ct.push(obj);
    }

    if (this.fg2.value.Tuesday) {
      let obj = {
        Day: "Tuesday",
        StartTime: this.fg2.value.Mstart,
        EndTime: this.fg2.value.Mend,
        IsOpen: true,
        Session: 1,
        ClinicID: this.clinicID
      };
      ct.push(obj);
    }

    if (this.fg2.value.Wednesday) {
      let obj = {
        Day: "Wednesday",
        StartTime: this.fg2.value.Mstart,
        EndTime: this.fg2.value.Mend,
        IsOpen: true,
        Session: 1,
        ClinicID: this.clinicID
      };
      ct.push(obj);
    }

    if (this.fg2.value.Thursday) {
      let obj = {
        Day: "Thursday",
        StartTime: this.fg2.value.Mstart,
        EndTime: this.fg2.value.Mend,
        IsOpen: true,
        Session: 1,
        ClinicID: this.clinicID
      };
      ct.push(obj);
    }

    if (this.fg2.value.Friday) {
      let obj = {
        Day: "Friday",
        StartTime: this.fg2.value.Mstart,
        EndTime: this.fg2.value.Mend,
        IsOpen: true,
        Session: 1,
        ClinicID: this.clinicID
      };
      ct.push(obj);
    }

    if (this.fg2.value.Saturday) {
      let obj = {
        Day: "Saturday",
        StartTime: this.fg2.value.Mstart,
        EndTime: this.fg2.value.Mend,
        IsOpen: true,
        Session: 1,
        ClinicID: this.clinicID
      };
      ct.push(obj);
    }

    if (this.fg2.value.Sunday) {
      let obj = {
        Day: "Sunday",
        StartTime: this.fg2.value.Mstart,
        EndTime: this.fg2.value.Mend,
        IsOpen: true,
        Session: 1,
        ClinicID: this.clinicID
      };
      ct.push(obj);
    }
    this.fg1.value.ClinicTimings = ct;
    console.log(this.fg1.value);
    this.editClinic(this.fg1.value);
  }

  async editClinic(data) {
    {
      const loading = await this.loadingController.create({
        message: "Loading"
      });
      await loading.present();

      await this.clinicService.putClinic(this.clinicID, data).subscribe(
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
  validation_messages = {
    Name: [{ type: "required", message: "Name is required." }],
    phoneNumber: [
      { type: "required", message: "Phone number is required" },
      {
        type: "minlength",
        message: "Phone Number must be at least 7 Digits long."
      },
      { type: "pattern", message: "Enter Must be Number" }
    ],
    Address: [{ type: "required", message: "Address is required." }],
    ConsultationFee: [
      { type: "required", message: "Consultation Fee is required." },
      {
        type: "pattern",
        message: "Your Consultation Fee must contain positive number"
      }
    ]
  };
}
