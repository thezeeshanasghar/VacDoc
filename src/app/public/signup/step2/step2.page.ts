import { Component, OnInit, Input, ViewChild } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from "@angular/forms";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ClinicService } from "src/app/services/clinic.service";
import { ToastService } from "src/app/shared/toast.service";
import { Router } from "@angular/router";
import { LoadingController } from "@ionic/angular";
import { SignupService } from "src/app/services/signup.service";
import * as moment from "moment";
import { validateConfig } from "@angular/router/src/config";
declare var google;

@Component({
  selector: "app-step2",
  templateUrl: "./step2.page.html",
  styleUrls: ["./step2.page.scss"]
})
export class Step2Page implements OnInit {
  map;
  myMarker;
  @ViewChild("mapElement") mapElement;
  fg1: FormGroup;
  fg2: FormGroup;
  DoctorId: any;
  latitude: any;
  longitude: any;
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
    this.hello();
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.DoctorId = val;
    });
    this.fg1 = this.formbuilder.group({
      DoctorId: [null],
      Name: [null],
      PhoneNumber: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.minLength(7),
          Validators.maxLength(11),
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

  hello(): void {
    //Called after ngOnInit when the component's or directive's content has been initialized.
    //Add 'implements AfterContentInit' to the class.
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      center: { lat: 33.632553, lng: 72.934592 },
      zoom: 15
    });
    this.myMarker = new google.maps.Marker({
      position: { lat: 33.632553, lng: 72.934592 },
      draggable: true
    });
    this.map.setCenter(this.myMarker.position);
    this.myMarker.setMap(this.map);

    google.maps.event.addListener(this.myMarker, "dragend", function(evt) {
      this.lat = evt.latLng.lat().toFixed(3);
      this.lng = evt.latLng.lng().toFixed(3);
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
    this.fg1.value.DoctorId = this.DoctorId;
    this.fg1.value.Lat = this.myMarker.lat;
    this.fg1.value.Long = this.myMarker.lng;
    console.log(this.fg1.value);
    this.fg1.value.OffDays = "Sunday";
    var ct = [];
    if (this.fg2.value.Monday) {
      this.fg2.value.Mstart = moment(
        this.fg2.value.Mstart,
        "YYYY-MM-DD HH:mm"
      ).format("HH:mm");
      this.fg2.value.Mend = moment(
        this.fg2.value.Mend,
        "YYYY-MM-DD HH:mm"
      ).format("HH:mm");
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
      this.fg2.value.Tustart = moment(
        this.fg2.value.Tustart,
        "YYYY-MM-DD HH:mm"
      ).format("HH:mm");
      this.fg2.value.Tuend = moment(
        this.fg2.value.Tuend,
        "YYYY-MM-DD HH:mm"
      ).format("HH:mm");
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
      this.fg2.value.Tuend = moment(
        this.fg2.value.Wstart,
        "YYYY-MM-DD HH:mm"
      ).format("HH:mm");
      this.fg2.value.Tuend = moment(
        this.fg2.value.Wend,
        "YYYY-MM-DD HH:mm"
      ).format("HH:mm");
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
      this.fg2.value.Thstart = moment(
        this.fg2.value.Thstart,
        "YYYY-MM-DD HH:mm"
      ).format("HH:mm");
      this.fg2.value.Thend = moment(
        this.fg2.value.Thend,
        "YYYY-MM-DD HH:mm"
      ).format("HH:mm");
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
      this.fg2.value.Fstart = moment(
        this.fg2.value.Fstart,
        "YYYY-MM-DD HH:mm"
      ).format("HH:mm");
      this.fg2.value.Fend = moment(
        this.fg2.value.Fend,
        "YYYY-MM-DD HH:mm"
      ).format("HH:mm");
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
      this.fg2.value.Sastart = moment(
        this.fg2.value.Sastart,
        "YYYY-MM-DD HH:mm"
      ).format("HH:mm");
      this.fg2.value.Saend = moment(
        this.fg2.value.Saend,
        "YYYY-MM-DD HH:mm"
      ).format("HH:mm");
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
      this.fg2.value.Sustart = moment(
        this.fg2.value.Sustart,
        "YYYY-MM-DD HH:mm"
      ).format("HH:mm");
      this.fg2.value.Suend = moment(
        this.fg2.value.Suend,
        "YYYY-MM-DD HH:mm"
      ).format("HH:mm");
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
    this.signupService.clinicData = this.fg1.value;
    this.router.navigate(["/signup/step3"]);
    //this.addNewClinic(this.fg1.value);
  }

  validation_messages = {
    Name: [{ type: "required", message: "Name is required." }],
    Address: [{ type: "required", message: "Address is required." }],
    phoneNumber: [
      { type: "required", message: "Phone number is required" },

      {
        type: "minlength",
        message: "Phone Number must be at least 7 Digits long."
      },
      { type: "pattern", message: "Enter Must be Number" },
      {
        type: "maxlength",
        message: "Phone Number must be at least 11 Digits long."
      }
    ],
    ConsultationFee: [
      { type: "required", message: "ConsultationFee is required." },
      {
        type: "pattern",
        message: "Your Consultation Fee must contain positive number"
      }
    ]
  };
}
