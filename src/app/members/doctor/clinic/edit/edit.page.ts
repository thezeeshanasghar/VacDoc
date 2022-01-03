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
import { HttpClient, HttpEventType } from '@angular/common/http';
import { environment } from "src/environments/environment";
import { Storage } from "@ionic/storage";
import * as moment from "moment";
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { File , FileEntry } from '@ionic-native/file/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import {FileTransfer , FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { Base64 } from '@ionic-native/base64/ngx';
import { Platform } from '@ionic/angular';


@Component({
  selector: "app-edit",
  templateUrl: "./edit.page.html",
  styleUrls: ["./edit.page.scss"]
})
export class EditPage implements OnInit {
  fg1: FormGroup;
  fg2: FormGroup;
  updateClinic:any;
  clinicId: any;
  clinic: any;
  doctorId: any;
  uploading = false;
  resourceURL = environment.RESOURCE_URL;

  constructor(
    public loadingController: LoadingController,
    public router: Router,
    public route: ActivatedRoute,
    private formbuilder: FormBuilder,
    private clinicService: ClinicService,
    private toastService: ToastService,
    private storage: Storage,
    private fileChooser: FileChooser,
    private file: File,
    private filePath: FilePath,
    private transfer: FileTransfer,
    private base64: Base64,
    public platform: Platform,
    private http: HttpClient
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
          Validators.minLength(10),
          Validators.pattern("^([0-9]*)$")
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
      IsOnline: [false],
      MonogramImage: [null]
    });

    this.fg2 = this.formbuilder.group({
      Monday: [false],
      MondayS1: [false],
      MondayS2: [false],
      Mstart: [null],
      Mstart2: [null],
      Mend: [null],
      Mend2: [null],

      Tuesday: [false],
      TuesdayS1: [false],
      TuesdayS2: [false],
      Tustart: [null],
      Tustart2: [null],
      Tuend: [null],
      Tuend2: [null],

      Wednesday: [false],
      WednesdayS1: [false],
      WednesdayS2: [false],
      Wstart: [null],
      Wstart2: [null],
      Wend: [null],
      Wend2: [null],

      Thursday: [false],
      ThursdayS1: [false],
      ThursdayS2: [false],
      Thstart: [null],
      Thstart2: [null],
      Thend: [null],
      Thend2: [null],

      Friday: [false],
      FridayS1: [false],
      FridayS2: [false],
      Fstart: [null],
      Fstart2: [null],
      Fend: [null],
      Fend2: [null],

      Saturday: [false],
      SaturdayS1: [false],
      SaturdayS2: [false],
      Sastart: [null],
      Sastart2: [null],
      Saend: [null],
      Saend2: [null],

      Sunday: [false],
      SundayS1: [false],
      SundayS2: [false],
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
    await this.clinicService.getClinicById(this.clinicId).subscribe(
        res => {
          if (res.IsSuccess) {
            this.clinic = res.ResponseData;
   // await loading.present();
    //  this.clinic = this.clinicService.clinics.find(x=> x.Id == this.clinicId);
    //  console.log(this.clinic);
     this.fg1.controls["Name"].setValue(this.clinic.Name);
           this.fg1.controls["PhoneNumber"].setValue(this.clinic.PhoneNumber);
           this.fg1.controls["Address"].setValue(this.clinic.Address);
           this.fg1.controls["ConsultationFee"].setValue(this.clinic.ConsultationFee);
           this.fg1.controls["MonogramImage"].setValue(this.clinic.MonogramImage);
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
                if(clinicTiming.Session == 1){
                this.fg2.controls["MondayS1"].setValue(true);
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
                  }
                  if(clinicTiming.Session == 2){
                    this.fg2.controls["MondayS2"].setValue(true);
                    this.fg2.controls["Mstart2"].setValue(
                      moment(clinicTiming.StartTime, "HH:mm").format(
                        "YYYY-MM-DD HH:mm"
                      )
                    );
                    this.fg2.controls["Mend2"].setValue(
                      moment(clinicTiming.EndTime, "HH:mm").format(
                        "YYYY-MM-DD HH:mm"
                      )
                    );
                      }
                break;

              case "Tuesday":
                this.fg2.controls["Tuesday"].setValue(true);
                if(clinicTiming.Session == 1 ) {
                  this.fg2.controls["TuesdayS1"].setValue(true);
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
                  }
                  if(clinicTiming.Session == 2 ) {
                    this.fg2.controls["TuesdayS2"].setValue(true);
                  this.fg2.controls["Tustart2"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      "YYYY-MM-DD HH:mm"
                    )
                  );
                  this.fg2.controls["Tuend2"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      "YYYY-MM-DD HH:mm"
                    )
                  );
                    }
                break;

              case "Wednesday":
                this.fg2.controls["Wednesday"].setValue(true);
                if (clinicTiming.Session ==1)
                {
                  this.fg2.controls["WednesdayS1"].setValue(true);
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
                  }
                  if (clinicTiming.Session ==2)
                {
                  this.fg2.controls["WednesdayS2"].setValue(true);
                this.fg2.controls["Wstart2"].setValue(
                  moment(clinicTiming.StartTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                this.fg2.controls["Wend2"].setValue(
                  moment(clinicTiming.EndTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                  }
                break;

              case "Thursday":
                this.fg2.controls["Thursday"].setValue(true);
                if (clinicTiming.Session ==1)
                {
                  this.fg2.controls["ThursdayS1"].setValue(true);
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
                  }
                  if (clinicTiming.Session === 2)
                {
                  this.fg2.controls["ThursdayS2"].setValue(true);
                this.fg2.controls["Thstart2"].setValue(
                  moment(clinicTiming.StartTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                this.fg2.controls["Thend2"].setValue(
                  moment(clinicTiming.EndTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                  }
                break;

              case "Friday":
                this.fg2.controls["Friday"].setValue(true);
                if (clinicTiming.Session === 1){
                this.fg2.controls["FridayS1"].setValue(true);
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
                  }
                  if (clinicTiming.Session === 2){
                    this.fg2.controls["FridayS2"].setValue(true);
                    this.fg2.controls["Fstart2"].setValue(
                      moment(clinicTiming.StartTime, "HH:mm").format(
                        "YYYY-MM-DD HH:mm"
                      )
                    );
                    this.fg2.controls["Fend2"].setValue(
                      moment(clinicTiming.EndTime, "HH:mm").format(
                        "YYYY-MM-DD HH:mm"
                      )
                    );
                      }

                break;

              case "Saturday":
                this.fg2.controls["Saturday"].setValue(true);
                if (clinicTiming.Session === 1) {
                  this.fg2.controls["SaturdayS1"].setValue(true);
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
                  }
                  if (clinicTiming.Session === 2) {
                    this.fg2.controls["SaturdayS2"].setValue(true);
                    this.fg2.controls["Sastart2"].setValue(
                      moment(clinicTiming.StartTime, "HH:mm").format(
                        "YYYY-MM-DD HH:mm"
                      )
                    );
                    this.fg2.controls["Saend2"].setValue(
                      moment(clinicTiming.EndTime, "HH:mm").format(
                        "YYYY-MM-DD HH:mm"
                      )
                    );
                      }
                break;

              case "Sunday":
                this.fg2.controls["Sunday"].setValue(true);
                if (clinicTiming.Session === 1) 
                {
                  this.fg2.controls["SundayS1"].setValue(true);
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
                  }
                  if (clinicTiming.Session === 2) 
                {
                  this.fg2.controls["SundayS2"].setValue(true);
                this.fg2.controls["Sustart2"].setValue(
                  moment(clinicTiming.StartTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                this.fg2.controls["Suend2"].setValue(
                  moment(clinicTiming.EndTime, "HH:mm").format(
                    "YYYY-MM-DD HH:mm"
                  )
                );
                  }
                break;
            }
          }
          loading.dismiss();
              } 
              
              else {
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

    // await this.clinicService.getClinicById(this.clinicId).subscribe(
    //   res => {
    //     if (res.IsSuccess) {
    //       this.clinic = res.ResponseData;
    //       console.log(this.clinic);
    //       this.fg1.controls["Name"].setValue(this.clinic.Name);
    //       this.fg1.controls["PhoneNumber"].setValue(this.clinic.PhoneNumber);
    //       this.fg1.controls["Address"].setValue(this.clinic.Address);
    //       this.fg1.controls["ConsultationFee"].setValue(
    //       this.clinic.ConsultationFee
    //       );

    //       // moment(clinicTiming.StartTime,"HH:mm" ).format( "YYYY-MM-DD HH:mm");
    //       for (
    //         let index = 0;
    //         index < this.clinic.ClinicTimings.length;
    //         index++
    //       ) {
    //         const clinicTiming = this.clinic.ClinicTimings[index];
    //         switch (clinicTiming.Day) {
    //           case "Monday":
    //             this.fg2.controls["Monday"].setValue(true);
    //             this.fg2.controls["Mstart"].setValue(
    //               moment(clinicTiming.StartTime, "HH:mm").format(
    //                 "YYYY-MM-DD HH:mm"
    //               )
    //             );
    //             this.fg2.controls["Mend"].setValue(
    //               moment(clinicTiming.EndTime, "HH:mm").format(
    //                 "YYYY-MM-DD HH:mm"
    //               )
    //             );
    //             break;

    //           case "Tuesday":
    //             this.fg2.controls["Tuesday"].setValue(true);
    //             this.fg2.controls["Tustart"].setValue(
    //               moment(clinicTiming.StartTime, "HH:mm").format(
    //                 "YYYY-MM-DD HH:mm"
    //               )
    //             );
    //             this.fg2.controls["Tuend"].setValue(
    //               moment(clinicTiming.EndTime, "HH:mm").format(
    //                 "YYYY-MM-DD HH:mm"
    //               )
    //             );
    //             break;

    //           case "Wednesday":
    //             this.fg2.controls["Wednesday"].setValue(true);
    //             this.fg2.controls["Wstart"].setValue(
    //               moment(clinicTiming.StartTime, "HH:mm").format(
    //                 "YYYY-MM-DD HH:mm"
    //               )
    //             );
    //             this.fg2.controls["Wend"].setValue(
    //               moment(clinicTiming.EndTime, "HH:mm").format(
    //                 "YYYY-MM-DD HH:mm"
    //               )
    //             );
    //             break;

    //           case "Thursday":
    //             this.fg2.controls["Thursday"].setValue(true);
    //             this.fg2.controls["Thstart"].setValue(
    //               moment(clinicTiming.StartTime, "HH:mm").format(
    //                 "YYYY-MM-DD HH:mm"
    //               )
    //             );
    //             this.fg2.controls["Thend"].setValue(
    //               moment(clinicTiming.EndTime, "HH:mm").format(
    //                 "YYYY-MM-DD HH:mm"
    //               )
    //             );
    //             break;

    //           case "Friday":
    //             this.fg2.controls["Friday"].setValue(true);
    //             this.fg2.controls["Fstart"].setValue(
    //               moment(clinicTiming.StartTime, "HH:mm").format(
    //                 "YYYY-MM-DD HH:mm"
    //               )
    //             );
    //             this.fg2.controls["Fend"].setValue(
    //               moment(clinicTiming.EndTime, "HH:mm").format(
    //                 "YYYY-MM-DD HH:mm"
    //               )
    //             );
    //             break;

    //           case "Saturday":
    //             this.fg2.controls["Saturday"].setValue(true);
    //             this.fg2.controls["Sastart"].setValue(
    //               moment(clinicTiming.StartTime, "HH:mm").format(
    //                 "YYYY-MM-DD HH:mm"
    //               )
    //             );
    //             this.fg2.controls["Saend"].setValue(
    //               moment(clinicTiming.EndTime, "HH:mm").format(
    //                 "YYYY-MM-DD HH:mm"
    //               )
    //             );
    //             break;

    //           case "Sunday":
    //             this.fg2.controls["Sunday"].setValue(true);
    //             this.fg2.controls["Sustart"].setValue(
    //               moment(clinicTiming.StartTime, "HH:mm").format(
    //                 "YYYY-MM-DD HH:mm"
    //               )
    //             );
    //             this.fg2.controls["Suend"].setValue(
    //               moment(clinicTiming.EndTime, "HH:mm").format(
    //                 "YYYY-MM-DD HH:mm"
    //               )
    //             );
    //             break;
    //         }
    //       }
    //       loading.dismiss();
    //     } else {
    //       loading.dismiss();
    //       this.toastService.create(res.Message, "danger");
    //     }
    //   },
    //   err => {
    //     loading.dismiss();
    //     this.toastService.create(err, "danger");
    //   }
    // );
  

  getdata() {
    this.fg1.value.DoctorId = this.doctorId;
    this.fg1.value.Id = this.clinicId;
    this.fg1.value.Lat = 33.63207;
    this.fg1.value.Long = 72.935488;
    var ct = [];
    if (this.fg2.value.Monday) {
      if (this.fg2.value.MondayS1) {
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
      // For Session 2
      if (this.fg2.value.MondayS2) {
        this.fg2.value.Mstart2 = moment(
          this.fg2.value.Mstart2,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        this.fg2.value.Mend2 = moment(
          this.fg2.value.Mend2,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        let obj1 = {
          Day: "Monday",
          StartTime: this.fg2.value.Mstart2,
          EndTime: this.fg2.value.Mend2,
          IsOpen: true,
          Session: 2
        };
        ct.push(obj1);
      }
    }
    // if (this.fg2.value.Monday) {
    //   let obj = {
    //     Day: "Monday",
    //     StartTime: moment(this.fg2.value.Mstart, "YYYY-MM-DD HH:mm").format(
    //       "HH:mm"
    //     ),
    //     EndTime: moment(this.fg2.value.Mend, "YYYY-MM-DD HH:mm").format(
    //       "HH:mm"
    //     ),
    //     IsOpen: true,
    //     Session: 1,
    //     ClinicId: this.clinicId
    //   };
    //   ct.push(obj);
    // }
    if (this.fg2.value.Tuesday) {
      if (this.fg2.value.TuesdayS1) {
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
      // session 2
      if (this.fg2.value.TuesdayS2) {
        this.fg2.value.Tustart2 = moment(
          this.fg2.value.Tustart2,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        this.fg2.value.Tuend2 = moment(
          this.fg2.value.Tuend2,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        let obj = {
          Day: "Tuesday",
          StartTime: this.fg2.value.Tustart2,
          EndTime: this.fg2.value.Tuend2,
          IsOpen: true,
          Session: 2
        };
        ct.push(obj);
      }
    }

    // if (this.fg2.value.Tuesday) {
    //   let obj = {
    //     Day: "Tuesday",
    //     StartTime: moment(this.fg2.value.Tustart, "YYYY-MM-DD HH:mm").format(
    //       "HH:mm"
    //     ),
    //     EndTime: moment(this.fg2.value.Tuend, "YYYY-MM-DD HH:mm").format(
    //       "HH:mm"
    //     ),
    //     IsOpen: true,
    //     Session: 1,
    //     ClinicId: this.clinicId
    //   };
    //   ct.push(obj);
    // }

    if (this.fg2.value.Wednesday) {
      if (this.fg2.value.WednesdayS1) {
        this.fg2.value.Wstart = moment(
          this.fg2.value.Wstart,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        this.fg2.value.Wend = moment(
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
      // session 2
      if (this.fg2.value.WednesdayS2) {
        this.fg2.value.Wstart2 = moment(
          this.fg2.value.Wstart2,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        this.fg2.value.Wend2 = moment(
          this.fg2.value.Wend2,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        let obj = {
          Day: "Wednesday",
          StartTime: this.fg2.value.Wstart2,
          EndTime: this.fg2.value.Wend2,
          IsOpen: true,
          Session: 2
        };
        ct.push(obj);
      }
    }

    // if (this.fg2.value.Wednesday) {
    //   let obj = {
    //     Day: "Wednesday",
    //     StartTime: moment(this.fg2.value.Wstart, "YYYY-MM-DD HH:mm").format(
    //       "HH:mm"
    //     ),
    //     EndTime: moment(this.fg2.value.Wend, "YYYY-MM-DD HH:mm").format(
    //       "HH:mm"
    //     ),
    //     IsOpen: true,
    //     Session: 1,
    //     ClinicId: this.clinicId
    //   };
    //   ct.push(obj);
    // }

    if (this.fg2.value.Thursday) {
      if (this.fg2.value.ThursdayS1) {
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
      // session 2
      if (this.fg2.value.ThursdayS2) {
        this.fg2.value.Thstart2 = moment(
          this.fg2.value.Thstart2,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        this.fg2.value.Thend2 = moment(
          this.fg2.value.Thend2,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        let obj = {
          Day: "Thursday",
          StartTime: this.fg2.value.Thstart2,
          EndTime: this.fg2.value.Thend2,
          IsOpen: true,
          Session: 2
        };
        ct.push(obj);
      }
    }
    // if (this.fg2.value.Thursday) {
    //   let obj = {
    //     Day: "Thursday",
    //     StartTime: moment(this.fg2.value.Thstart, "YYYY-MM-DD HH:mm").format(
    //       "HH:mm"
    //     ),
    //     EndTime: moment(this.fg2.value.Thend, "YYYY-MM-DD HH:mm").format(
    //       "HH:mm"
    //     ),
    //     IsOpen: true,
    //     Session: 1,
    //     ClinicId: this.clinicId
    //   };
    //   ct.push(obj);
    // }

    if (this.fg2.value.Friday) {
      if (this.fg2.value.FridayS1) {
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
      // session
      if (this.fg2.value.FridayS2) {
        this.fg2.value.Fstart2 = moment(
          this.fg2.value.Fstart2,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        this.fg2.value.Fend2 = moment(
          this.fg2.value.Fend2,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        let obj = {
          Day: "Friday",
          StartTime: this.fg2.value.Fstart2,
          EndTime: this.fg2.value.Fend2,
          IsOpen: true,
          Session: 2
        };
        ct.push(obj);
      }
    }
    // if (this.fg2.value.Friday) {
    //   let obj = {
    //     Day: "Friday",
    //     StartTime: moment(this.fg2.value.Fstart, "YYYY-MM-DD HH:mm").format(
    //       "HH:mm"
    //     ),
    //     EndTime: moment(this.fg2.value.Fend, "YYYY-MM-DD HH:mm").format(
    //       "HH:mm"
    //     ),
    //     IsOpen: true,
    //     Session: 1,
    //     ClinicId: this.clinicId
    //   };
    //   ct.push(obj);
    // }

    if (this.fg2.value.Saturday) {
      if (this.fg2.value.SaturdayS1) {
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
      if (this.fg2.value.SaturdayS2) {
        this.fg2.value.Sastart2 = moment(
          this.fg2.value.Sastart2,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        this.fg2.value.Saend2 = moment(
          this.fg2.value.Saend2,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        let obj = {
          Day: "Saturday",
          StartTime: this.fg2.value.Sastart2,
          EndTime: this.fg2.value.Saend2,
          IsOpen: true,
          Session: 2
        };
        ct.push(obj);
      }
    }
    // if (this.fg2.value.Saturday) {
    //   let obj = {
    //     Day: "Saturday",

    //     //  this.fg2.value.Sustart =

    //     StartTime: moment(this.fg2.value.Sastart, "YYYY-MM-DD HH:mm").format(
    //       "HH:mm"
    //     ),
    //     EndTime: moment(this.fg2.value.Saend, "YYYY-MM-DD HH:mm").format(
    //       "HH:mm"
    //     ),
    //     IsOpen: true,
    //     Session: 1,
    //     ClinicId: this.clinicId
    //   };
    //   ct.push(obj);
    // }

    if (this.fg2.value.Sunday) {
      if (this.fg2.value.SundayS1) {
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
      if (this.fg2.value.SundayS2) {
        this.fg2.value.Sustart2 = moment(
          this.fg2.value.Sustart2,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        this.fg2.value.Suend2 = moment(
          this.fg2.value.Suend2,
          "YYYY-MM-DD HH:mm"
        ).format("HH:mm");
        let obj = {
          Day: "Sunday",
          StartTime: this.fg2.value.Sustart2,
          EndTime: this.fg2.value.Suend2,
          IsOpen: true,
          Session: 2
        };
        ct.push(obj);
      }
    }

    // if (this.fg2.value.Sunday) {
    //   let obj = {
    //     Day: "Sunday",
    //     StartTime: moment(this.fg2.value.Sustart, "YYYY-MM-DD HH:mm").format(
    //       "HH:mm"
    //     ),
    //     EndTime: moment(this.fg2.value.Suend, "YYYY-MM-DD HH:mm").format(
    //       "HH:mm"
    //     ),
    //     IsOpen: true,
    //     Session: 1,
    //     ClinicId: this.clinicId
    //   };
    //   ct.push(obj);
    // }
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
            this.storage.get('Clinics').then((val) => {
           this.updateClinic=val.filter(x=>x.Id===this.clinicId);
           console.log(this.updateClinic);
           for(var i=0;i<val.length;i++){
             if(val[i].Id==this.clinicId){
               val[i].Name=this.fg1.value.Name;
              val[i].ConsultationFee=this.fg1.value.ConsultationFee;
              val[i].PhoneNumber=this.fg1.value.PhoneNumber;
              val[i].IsOnline=this.fg1.value.IsOnline;
              val[i].Address=this.fg1.value.Address;
              }
           }
           this.storage.set('Clinics',val);
           
        
      
     });


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

  setTimeValidatorsMonday() {
    if (this.fg2.value.MondayS1 && this.fg2.value.MondayS2) {
      const MEnd1 = Date.parse(this.fg2.value.Mend);
      const MStart2 = Date.parse(this.fg2.value.Mstart2);
      if (MStart2 <= MEnd1) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Mstart2"].setErrors({ required: true });
      } else {
        this.fg2.controls["Mstart2"].setErrors(null);
      }
    } else {
      this.fg2.controls["Mstart2"].setErrors(null);
    }

    if (this.fg2.value.MondayS1) {
      const MStart1 = Date.parse(this.fg2.value.Mstart);
      const MEnd1 = Date.parse(this.fg2.value.Mend);
      if (MEnd1 <= MStart1) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Mstart"].setErrors({ required: true });
      } else {
        this.fg2.controls["Mstart"].setErrors(null);
      }
    }

    if (this.fg2.value.MondayS2) {
      const MStart2 = Date.parse(this.fg2.value.Mstart2);
      const MEnd2 = Date.parse(this.fg2.value.Mend2);
      if (MEnd2 <= MStart2) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Mend"].setErrors({ required: true });
      } else {
        this.fg2.controls["Mend"].setErrors(null);
      }
    }
  }
  setTimeValidatorsTuesday() {
    if (this.fg2.value.TuesdayS1 && this.fg2.value.TuesdayS2) {
      const TuEnd1 = Date.parse(this.fg2.value.Tuend);
      const TuStart2 = Date.parse(this.fg2.value.Tustart2);
      if (TuStart2 <= TuEnd1) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Tustart2"].setErrors({ required: true });
      } else {
        this.fg2.controls["Tustart2"].setErrors(null);
      }
    } else {
      this.fg2.controls["Tustart2"].setErrors(null);
    }

    if (this.fg2.value.TuesdayS1) {
      const MStart1 = Date.parse(this.fg2.value.Tustart);
      const MEnd1 = Date.parse(this.fg2.value.Tuend);
      if (MEnd1 <= MStart1) {
        console.log(5);
        this.fg2.controls["Tustart"].setErrors({ required: true });
      } else {
        this.fg2.controls["Tustart"].setErrors(null);
      }
    }

    if (this.fg2.value.TuesdayS2) {
      const MStart2 = Date.parse(this.fg2.value.Tustart2);
      const MEnd2 = Date.parse(this.fg2.value.Tuend2);
      if (MEnd2 <= MStart2) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Tuend"].setErrors({ required: true });
      } else {
        this.fg2.controls["Tuend"].setErrors(null);
      }
    }
  }
  setTimeValidatorsWed() {
    if (this.fg2.value.WednesdayS1 && this.fg2.value.WednesdayS2) {
      const TuEnd1 = Date.parse(this.fg2.value.Wend);
      const TuStart2 = Date.parse(this.fg2.value.Wstart2);
      if (TuStart2 <= TuEnd1) {
        console.log(5);
        this.fg2.controls["Wstart2"].setErrors({ required: true });
      } else {
        this.fg2.controls["Wstart2"].setErrors(null);
      }
    } else {
      this.fg2.controls["Wstart2"].setErrors(null);
    }

    if (this.fg2.value.WednesdayS1) {
      const MStart1 = Date.parse(this.fg2.value.Wstart);
      const MEnd1 = Date.parse(this.fg2.value.Wend);
      if (MEnd1 <= MStart1) {
        console.log(5);
        this.fg2.controls["Wstart"].setErrors({ required: true });
      } else {
        this.fg2.controls["Wstart"].setErrors(null);
      }
    }

    if (this.fg2.value.WednesdayS2) {
      const MStart2 = Date.parse(this.fg2.value.Wstart2);
      const MEnd2 = Date.parse(this.fg2.value.Wend2);
      if (MEnd2 <= MStart2) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Wend"].setErrors({ required: true });
      } else {
        this.fg2.controls["Wend"].setErrors(null);
      }
    }
  }
  setTimeValidatorsThu() {
    if (this.fg2.value.ThursdayS1 && this.fg2.value.ThursdayS2) {
      const TuEnd1 = Date.parse(this.fg2.value.Thend);
      const TuStart2 = Date.parse(this.fg2.value.Thstart2);
      if (TuStart2 <= TuEnd1) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Thstart2"].setErrors({ required: true });
      } else {
        this.fg2.controls["Thstart2"].setErrors(null);
      }
    } else {
      this.fg2.controls["Thstart2"].setErrors(null);
    }

    if (this.fg2.value.ThursdayS1) {
      const MStart1 = Date.parse(this.fg2.value.Thstart);
      const MEnd1 = Date.parse(this.fg2.value.Thend);
      if (MEnd1 <= MStart1) {
        console.log(5);
        this.fg2.controls["Thstart"].setErrors({ required: true });
      } else {
        this.fg2.controls["Thstart"].setErrors(null);
      }
    }

    if (this.fg2.value.ThursdayS2) {
      const MStart2 = Date.parse(this.fg2.value.Thstart2);
      const MEnd2 = Date.parse(this.fg2.value.Thend2);
      if (MEnd2 <= MStart2) {
        console.log(5);
        this.fg2.controls["Thend"].setErrors({ required: true });
      } else {
        this.fg2.controls["Thend"].setErrors(null);
      }
    }
  }
  setTimeValidatorsFri() {
    if (this.fg2.value.FridayS1 && this.fg2.value.FridayS2) {
      const TuEnd1 = Date.parse(this.fg2.value.Fend);
      const TuStart2 = Date.parse(this.fg2.value.Fstart2);
      if (TuStart2 <= TuEnd1) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Fstart2"].setErrors({ required: true });
      } else {
        this.fg2.controls["Fstart2"].setErrors(null);
      }
    } else {
      this.fg2.controls["Fstart2"].setErrors(null);
    }
    if (this.fg2.value.FridayS1) {
      const MStart1 = Date.parse(this.fg2.value.Fstart);
      const MEnd1 = Date.parse(this.fg2.value.Fend);
      if (MEnd1 <= MStart1) {
        console.log(5);
        this.fg2.controls["Fstart"].setErrors({ required: true });
      } else {
        this.fg2.controls["Fstart"].setErrors(null);
      }
    }

    if (this.fg2.value.FridayS2) {
      const MStart2 = Date.parse(this.fg2.value.Fstart2);
      const MEnd2 = Date.parse(this.fg2.value.Fend2);
      if (MEnd2 <= MStart2) {
        console.log(5);
        this.fg2.controls["Fend"].setErrors({ required: true });
      } else {
        this.fg2.controls["Fend"].setErrors(null);
      }
    }
  }
  setTimeValidatorsSat() {
    if (this.fg2.value.SaturdayS1 && this.fg2.value.SaturdayS2) {
      const TuEnd1 = Date.parse(this.fg2.value.Saend);
      const TuStart2 = Date.parse(this.fg2.value.Sastart2);
      if (TuStart2 <= TuEnd1) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Sastart2"].setErrors({ required: true });
      } else {
        this.fg2.controls["Sastart2"].setErrors(null);
      }
    } else {
      this.fg2.controls["Sastart2"].setErrors(null);
    }

    if (this.fg2.value.SaturdayS1) {
      const MStart1 = Date.parse(this.fg2.value.Sastart);
      const MEnd1 = Date.parse(this.fg2.value.Saend);
      if (MEnd1 <= MStart1) {
        console.log(5);
        this.fg2.controls["Sastart"].setErrors({ required: true });
      } else {
        this.fg2.controls["Sastart"].setErrors(null);
      }
    }

    if (this.fg2.value.SaturdayS2) {
      const MStart2 = Date.parse(this.fg2.value.Sastart2);
      const MEnd2 = Date.parse(this.fg2.value.Saend2);
      if (MEnd2 <= MStart2) {
        console.log(5);
        this.fg2.controls["Saend"].setErrors({ required: true });
      } else {
        this.fg2.controls["Saend"].setErrors(null);
      }
    }
  }
  setTimeValidatorsSun() {
    if (this.fg2.value.SundayS1 && this.fg2.value.SundayS2) {
      const TuEnd1 = Date.parse(this.fg2.value.Suend);
      const TuStart2 = Date.parse(this.fg2.value.Sustart2);
      if (TuStart2 <= TuEnd1) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Sustart2"].setErrors({ required: true });
      } else {
        this.fg2.controls["Sustart2"].setErrors(null);
      }
    } else {
      this.fg2.controls["Sustart2"].setErrors(null);
    }
    if (this.fg2.value.SundayS1) {
      const MStart1 = Date.parse(this.fg2.value.Sustart);
      const MEnd1 = Date.parse(this.fg2.value.Suend);
      if (MEnd1 <= MStart1) {
        console.log(5);
        this.fg2.controls["Sustart"].setErrors({ required: true });
      } else {
        this.fg2.controls["Sustart"].setErrors(null);
      }
    }
    if (this.fg2.value.SundayS2) {
      const MStart2 = Date.parse(this.fg2.value.Sustart2);
      const MEnd2 = Date.parse(this.fg2.value.Suend2);
      if (MEnd2 <= MStart2) {
        console.log(5);
        this.fg2.controls["Suend"].setErrors({ required: true });
      } else {
        this.fg2.controls["Suend"].setErrors(null);
      }
    }
  }

  uploadMonogram() {

    this.fileChooser.open().then(async uri =>
      {
        console.log(uri);
       await  this.filePath.resolveNativePath(uri).then(filePath =>
          {
            console.log (filePath);        
            this.uploading = true;
            this.file.resolveLocalFilesystemUrl(filePath).then(fileInfo =>
              {
                let files = fileInfo as FileEntry;
                files.file(async success =>
                  {
                    let filesName  = success.name;
                    if (success.size < 100000){
                    let options: FileUploadOptions = {
                      fileName: filesName
                    }
                    const fileTransfer: FileTransferObject = this.transfer.create();
                  await  fileTransfer.upload(uri, 'http://13.233.255.96:5002/api/upload', options)
                    .then((data) => {
                      // success
                     console.log(data);
                     this.toastService.create("successfully Uploaded");
                      this.uploading = false;
                      let dbpath = JSON.parse(data.response)                      
                      this.fg1.value.MonogramImage = dbpath.dbPath;
                      console.log(this.fg1.value.MonogramImage);
                    }, (err) => {
                      console.log(err)
                      // error
                    })
                  }
                  else 
                  this.toastService.create("File size must be less than 100kb" , 'danger');
                  });
              },err =>
              {
                console.log(err);
                throw err;
              });
          },err =>
          {
            console.log(err);
            throw err;
          });
      },err =>
      {
        console.log(err);
        throw err;
      });
  
  }

  upoadfromweb = files =>{
    const fileToUpload = files[0];
    const formData = new FormData();
    formData.append('file', fileToUpload , fileToUpload.name);
    this.http.post(environment.BASE_URL + 'upload', formData, { reportProgress: true, observe: 'events' }).subscribe(event => {
       if (event.type === HttpEventType.Response) {
        this.fg1.value.MonogramImage = event.body['dbPath'];
      }
    });
}

  validation_messages = {
    Name: [{ type: "required", message: "Name is required." }],
    phoneNumber: [
      { type: "required", message: "Phone number is required" },
      {
        type: "minlength",
        message: "Phone Number must be at least 10 Digits long."
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
    ],
    Mstart2:[{type: "required" , message:"Session 2 Must Start after Session 1"}],
    Mstart: [
      { type: "required", message: "End Time Must be after Start Time" }
    ],
    Mend: [{ type: "required", message: "End Time Must be after Start Time" }],
  };
}
