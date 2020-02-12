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
import * as moment from "moment";

@Component({
  selector: "app-edit",
  templateUrl: "./edit.page.html",
  styleUrls: ["./edit.page.scss"]
})
export class EditPage implements OnInit {
  fg1: FormGroup;
  fg2: FormGroup;
  clinicId: any;
  clinic: any;
  doctorId: any;

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
      Id: [null],
      DoctorId: [null],
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
      IsOnline: [false]
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
    this.clinicId = this.route.snapshot.paramMap.get("id");
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
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
    await this.clinicService.getClinicById(this.clinicId).subscribe(
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

          // moment(clinicTiming.StartTime,"HH:mm" ).format( "YYYY-MM-DD HH:mm");
          for (
            let index = 0;
            index < this.clinic.ClinicTimings.length;
            index++
          ) {
            const clinicTiming = this.clinic.ClinicTimings[index];
            switch (clinicTiming.Day) {
              case "Monday":
                this.fg2.controls["Monday"].setValue(true);
                this.fg2.controls["Mstart"].setValue(
                  moment(clinicTiming.StartTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                this.fg2.controls["Mend"].setValue(
                  moment(clinicTiming.EndTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                break;

              case "Tuesday":
                this.fg2.controls["Tuesday"].setValue(true);
                this.fg2.controls["Tustart"].setValue(
                  moment(clinicTiming.StartTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                this.fg2.controls["Tuend"].setValue(
                  moment(clinicTiming.EndTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                break;

              case "Wednesday":
                this.fg2.controls["Wednesday"].setValue(true);
                this.fg2.controls["Wstart"].setValue(
                  moment(clinicTiming.StartTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                this.fg2.controls["Wend"].setValue(
                  moment(clinicTiming.EndTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                break;

              case "Thursday":
                this.fg2.controls["Thursday"].setValue(true);
                this.fg2.controls["Thstart"].setValue(
                  moment(clinicTiming.StartTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                this.fg2.controls["Thend"].setValue(
                  moment(clinicTiming.EndTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                break;

              case "Friday":
                this.fg2.controls["Friday"].setValue(true);
                this.fg2.controls["Fstart"].setValue(
                  moment(clinicTiming.StartTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                this.fg2.controls["Fend"].setValue(
                  moment(clinicTiming.EndTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                break;

              case "Saturday":
                this.fg2.controls["Saturday"].setValue(true);
                this.fg2.controls["Sastart"].setValue(
                  moment(clinicTiming.StartTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                this.fg2.controls["Saend"].setValue(
                  moment(clinicTiming.EndTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                break;

              case "Sunday":
                this.fg2.controls["Sunday"].setValue(true);
                this.fg2.controls["Sustart"].setValue(
                  moment(clinicTiming.StartTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                this.fg2.controls["Suend"].setValue(
                  moment(clinicTiming.EndTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                break;
            }
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
    this.fg1.value.DoctorId = this.doctorId;
    this.fg1.value.Id = this.clinicId;
    this.fg1.value.Lat = 33.63207;
    this.fg1.value.Long = 72.935488;
    var ct = [];
    if (this.fg2.value.Monday) {
      let obj = {
        Day: "Monday",
        StartTime: moment(this.fg2.value.Mstart, "YYYY-MM-DD HH:mm").format(
          "HH:mm"
        ),
        EndTime: moment(this.fg2.value.Mend, "YYYY-MM-DD HH:mm").format(
          "HH:mm"
        ),
        IsOpen: true,
        Session: 1,
        ClinicId: this.clinicId
      };
      ct.push(obj);
    }

    if (this.fg2.value.Tuesday) {
      let obj = {
        Day: "Tuesday",
        StartTime: moment(this.fg2.value.Tustart, "YYYY-MM-DD HH:mm").format(
          "HH:mm"
        ),
        EndTime: moment(this.fg2.value.Tuend, "YYYY-MM-DD HH:mm").format(
          "HH:mm"
        ),
        IsOpen: true,
        Session: 1,
        ClinicId: this.clinicId
      };
      ct.push(obj);
    }

    if (this.fg2.value.Wednesday) {
      let obj = {
        Day: "Wednesday",
        StartTime: moment(this.fg2.value.Wstart, "YYYY-MM-DD HH:mm").format(
          "HH:mm"
        ),
        EndTime: moment(this.fg2.value.Wend, "YYYY-MM-DD HH:mm").format(
          "HH:mm"
        ),
        IsOpen: true,
        Session: 1,
        ClinicId: this.clinicId
      };
      ct.push(obj);
    }

    if (this.fg2.value.Thursday) {
      let obj = {
        Day: "Thursday",
        StartTime: moment(this.fg2.value.Thstart, "YYYY-MM-DD HH:mm").format(
          "HH:mm"
        ),
        EndTime: moment(this.fg2.value.Thend, "YYYY-MM-DD HH:mm").format(
          "HH:mm"
        ),
        IsOpen: true,
        Session: 1,
        ClinicId: this.clinicId
      };
      ct.push(obj);
    }

    if (this.fg2.value.Friday) {
      let obj = {
        Day: "Friday",
        StartTime: moment(this.fg2.value.Fstart, "YYYY-MM-DD HH:mm").format(
          "HH:mm"
        ),
        EndTime: moment(this.fg2.value.Fend, "YYYY-MM-DD HH:mm").format(
          "HH:mm"
        ),
        IsOpen: true,
        Session: 1,
        ClinicId: this.clinicId
      };
      ct.push(obj);
    }

    if (this.fg2.value.Saturday) {
      let obj = {
        Day: "Saturday",

        //  this.fg2.value.Sustart =

        StartTime: moment(this.fg2.value.Sastart, "YYYY-MM-DD HH:mm").format(
          "HH:mm"
        ),
        EndTime: moment(this.fg2.value.Saend, "YYYY-MM-DD HH:mm").format(
          "HH:mm"
        ),
        IsOpen: true,
        Session: 1,
        ClinicId: this.clinicId
      };
      ct.push(obj);
    }

    if (this.fg2.value.Sunday) {
      let obj = {
        Day: "Sunday",
        StartTime: moment(this.fg2.value.Sustart, "YYYY-MM-DD HH:mm").format(
          "HH:mm"
        ),
        EndTime: moment(this.fg2.value.Suend, "YYYY-MM-DD HH:mm").format(
          "HH:mm"
        ),
        IsOpen: true,
        Session: 1,
        ClinicId: this.clinicId
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

      await this.clinicService.putClinic(this.clinicId, data).subscribe(
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
