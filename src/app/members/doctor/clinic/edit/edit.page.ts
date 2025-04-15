import { Component, OnInit } from "@angular/core";
import { LoadingController, Platform } from "@ionic/angular";
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
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { File, FileEntry } from '@ionic-native/file/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { Base64 } from '@ionic-native/base64/ngx';
import { HttpClient } from "@angular/common/http";
import { UploadService } from 'src/app/services/upload.service';

@Component({
  selector: "app-edit",
  templateUrl: "./edit.page.html",
  styleUrls: ["./edit.page.scss"]
})
export class EditPage implements OnInit {
  isWeb: boolean;
  fg1: FormGroup;
  fg2: FormGroup;
  updateClinic: any;
  clinicId: any;
  clinic: any;
  doctorId: any;
  uploading = false;
  resourceURL = environment.RESOURCE_URL;
  RegNo: any;

  private readonly DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm";
  

  constructor(
    public loadingController: LoadingController,
    public router: Router,
    public route: ActivatedRoute,
    private formbuilder: FormBuilder,
    private clinicService: ClinicService,
    private toastService: ToastService,
    private storage: Storage,
    private uploadService: UploadService,
    private fileChooser: FileChooser,
    private file: File,
    private filePath: FilePath,
    private transfer: FileTransfer,
    private base64: Base64,
    private http: HttpClient,
    private platform: Platform,
  ) {
    this.isWeb = !this.platform.is('cordova');
    console.log(this.isWeb)
  }

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
          Validators.pattern("^([0-9]*)$"),
        ])
      ),
      Address: [null],
      ConsultationFee: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.pattern("^(0|[1-9][0-9]*)$"),
        ])
      ),
      ClinicTimings: [null],
      Lat: [null],
      Long: [null],
      IsOnline: [false],
      MonogramImage: [null],
      RegNo: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.pattern("^[A-Za-z0-9]+$"),
        ])
      ),
    });

    this.fg2 = this.formbuilder.group({
      Monday: [false],
      MondayS1: [false],
      MondayS2: [false],
      Mstart: [null],
      Mstart2: [null],
      Mend: [null],
      Mend2: [null],
      M1Id: [null],
      M2Id: [null],

      Tuesday: [false],
      TuesdayS1: [false],
      TuesdayS2: [false],
      Tustart: [null],
      Tustart2: [null],
      Tuend: [null],
      Tuend2: [null],
      Tu1Id: [null],
      Tu2Id: [null],

      Wednesday: [false],
      WednesdayS1: [false],
      WednesdayS2: [false],
      Wstart: [null],
      Wstart2: [null],
      Wend: [null],
      Wend2: [null],
      W1Id: [null],
      W2Id: [null],

      Thursday: [false],
      ThursdayS1: [false],
      ThursdayS2: [false],
      Thstart: [null],
      Thstart2: [null],
      Thend: [null],
      Thend2: [null],
      Th1Id: [null],
      Th2Id: [null],

      Friday: [false],
      FridayS1: [false],
      FridayS2: [false],
      Fstart: [null],
      Fstart2: [null],
      Fend: [null],
      Fend2: [null],
      F1Id: [null],
      F2Id: [null],

      Saturday: [false],
      SaturdayS1: [false],
      SaturdayS2: [false],
      Sastart: [null],
      Sastart2: [null],
      Saend: [null],
      Saend2: [null],
      Sa1Id: [null],
      Sa2Id: [null],

      Sunday: [false],
      SundayS1: [false],
      SundayS2: [false],
      Sustart: [null],
      Sustart2: [null],
      Suend: [null],
      Suend2: [null],
      Su1Id: [null],
      Su2Id: [null],
    });
    this.clinicId = this.route.snapshot.paramMap.get("id");
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
    this.getClinic();
  }

  private previewMonogramImage(file: FileList, imagePath: string) {
    const reader = new FileReader();
    reader.onload = () => {
      if (imagePath == "monogram")
        this.fg1.value.MonogramImage2 = reader.result as string;
    };
    reader.readAsDataURL(file.item(0));
  }
  
  async SelectMonogramImage(monogramFile: FileList) {
    this.previewMonogramImage(monogramFile, "monogram");
  
    const loading = await this.loadingController.create({
      message: "Uploading Monogram Image"
    });
    await loading.present();
  
    const monogramData = new FormData();
    monogramData.append("MonogramImage", monogramFile.item(0));
  
    await this.uploadService.uploadImage(monogramData).subscribe(res => {
      if (res) {
        let mImage = res.dbPath;
        this.fg1.value.MonogramImage = mImage;
        console.log("MonogramImage = " + this.fg1.value.MonogramImage);
        loading.dismiss();
      } else {
        console.log("Error: Try Again! Failed to upload MonogramImage");
        this.toastService.create("Error: Try Again! Failed to upload MonogramImage.");
        loading.dismiss();
      }
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

  async getClinic() {
    const loading = await this.loadingController.create({ message: "Loading" });
    await this.clinicService.getClinicById(this.clinicId).subscribe(
      res => {
        if (res.IsSuccess) {
          this.clinic = res.ResponseData;
          this.fg1.controls["Name"].setValue(this.clinic.Name);
          this.fg1.controls["PhoneNumber"].setValue(this.clinic.PhoneNumber);
          this.fg1.controls["Address"].setValue(this.clinic.Address);
          this.fg1.controls["ConsultationFee"].setValue(this.clinic.ConsultationFee);
          this.fg1.controls["RegNo"].setValue(this.clinic.RegNo);
          // this.fg1.controls["MonogramImage"].setValue(this.resourceURL+this.clinic.MonogramImage);
          localStorage.setItem('monogramImage', this.clinic.MonogramImage);
          const monogramImageUrl = localStorage.getItem('monogramImage');
          console.log(monogramImageUrl)
          this.fg1.controls["MonogramImage"].setValue(monogramImageUrl)
          console.log(this.fg1.controls["MonogramImage"].setValue(monogramImageUrl))


          for (let index = 0; index < this.clinic.ClinicTimings.length; index++) {
            const clinicTiming = this.clinic.ClinicTimings[index];
            console.log(clinicTiming);
            switch (clinicTiming.Day) {
              case "Monday":
                this.fg2.controls["Monday"].setValue(true);
                if (clinicTiming.Session == 1 && clinicTiming.IsOpen == true) {
                  this.fg2.controls["MondayS1"].setValue(true);
                  this.fg2.controls["Mstart"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Mend"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["M1Id"].setValue(clinicTiming.Id);
                }
                if (clinicTiming.Session == 2 && clinicTiming.IsOpen == true) {
                  this.fg2.controls["MondayS2"].setValue(true);
                  this.fg2.controls["Mstart2"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Mend2"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["M2Id"].setValue(clinicTiming.Id);
                }
                break;

              case "Tuesday":
                this.fg2.controls["Tuesday"].setValue(true);
                if (clinicTiming.Session == 1 && clinicTiming.IsOpen == true) {
                  this.fg2.controls["TuesdayS1"].setValue(true);
                  this.fg2.controls["Tustart"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Tuend"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Tu1Id"].setValue(clinicTiming.Id);
                }
                if (clinicTiming.Session == 2 && clinicTiming.IsOpen == true) {
                  this.fg2.controls["TuesdayS2"].setValue(true);
                  this.fg2.controls["Tustart2"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Tuend2"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Tu2Id"].setValue(clinicTiming.Id);
                }
                break;

              case "Wednesday":
                this.fg2.controls["Wednesday"].setValue(true);
                if (clinicTiming.Session == 1 && clinicTiming.IsOpen == true) {
                  this.fg2.controls["WednesdayS1"].setValue(true);
                  this.fg2.controls["Wstart"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Wend"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["W1Id"].setValue(clinicTiming.Id);
                }
                if (clinicTiming.Session == 2 && clinicTiming.IsOpen == true) {
                  this.fg2.controls["WednesdayS2"].setValue(true);
                  this.fg2.controls["Wstart2"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Wend2"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["W2Id"].setValue(clinicTiming.Id);
                }
                break;

              case "Thursday":
                this.fg2.controls["Thursday"].setValue(true);
                if (clinicTiming.Session == 1 && clinicTiming.IsOpen == true) {
                  this.fg2.controls["ThursdayS1"].setValue(true);
                  this.fg2.controls["Thstart"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Thend"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  console.log(clinicTiming.Id);
                  this.fg2.controls["Th1Id"].setValue(clinicTiming.Id);
                }
                if (clinicTiming.Session == 2 && clinicTiming.IsOpen == true) {
                  this.fg2.controls["ThursdayS2"].setValue(true);
                  this.fg2.controls["Thstart2"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Thend2"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Th2Id"].setValue(clinicTiming.Id);
                }
                break;

              case "Friday":
                this.fg2.controls["Friday"].setValue(true);
                if (clinicTiming.Session == 1 && clinicTiming.IsOpen == true) {
                  this.fg2.controls["FridayS1"].setValue(true);
                  this.fg2.controls["Fstart"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Fend"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["F1Id"].setValue(clinicTiming.Id);
                }
                if (clinicTiming.Session == 2 && clinicTiming.IsOpen == true) {
                  this.fg2.controls["FridayS2"].setValue(true);
                  this.fg2.controls["Fstart2"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Fend2"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["F2Id"].setValue(clinicTiming.Id);
                }
                break;

              case "Saturday":
                this.fg2.controls["Saturday"].setValue(true);
                if (clinicTiming.Session == 1 && clinicTiming.IsOpen == true) {
                  this.fg2.controls["SaturdayS1"].setValue(true);
                  this.fg2.controls["Sastart"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Saend"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Sa1Id"].setValue(clinicTiming.Id);
                }
                if (clinicTiming.Session == 2 && clinicTiming.IsOpen == true) {
                  this.fg2.controls["SaturdayS2"].setValue(true);
                  this.fg2.controls["Sastart2"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Saend2"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Sa2Id"].setValue(clinicTiming.Id);
                }
                break;

              case "Sunday":
                this.fg2.controls["Sunday"].setValue(true);
                if (clinicTiming.Session == 1 && clinicTiming.IsOpen == true) {
                  this.fg2.controls["SundayS1"].setValue(true);
                  this.fg2.controls["Sustart"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Suend"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Su1Id"].setValue(clinicTiming.Id);
                }
                if (clinicTiming.Session == 2 && clinicTiming.IsOpen == true) {
                  this.fg2.controls["SundayS2"].setValue(true);
                  this.fg2.controls["Sustart2"].setValue(
                    moment(clinicTiming.StartTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Suend2"].setValue(
                    moment(clinicTiming.EndTime, "HH:mm").format(
                      this.DATE_TIME_FORMAT
                    )
                  );
                  this.fg2.controls["Su2Id"].setValue(clinicTiming.Id);
                }
                break;
            }
            console.log(res);
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
  getdata() {
    this.fg1.value.DoctorId = this.doctorId;
    this.fg1.value.Id = this.clinicId;
    this.fg1.value.Lat = 33.63207;
    this.fg1.value.Long = 72.935488;
    this.fg1.value.RegNo = this.fg1.get('RegNo').value;;
    var ct = [];
    if (this.fg2.value.Monday) {
      if (this.fg2.value.MondayS1) {
        this.fg2.value.Mstart = moment(
          this.fg2.value.Mstart,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        this.fg2.value.Mend = moment(
          this.fg2.value.Mend,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        const toggleValue = this.fg2.value.MondayS1;
        console.log('Toggle Value:', toggleValue);
        let obj = {
          Day: "Monday",
          StartTime: this.fg2.value.Mstart,
          EndTime: this.fg2.value.Mend,
          IsOpen: true,
          Session: 1,
          // Id: this.fg2.value.M1Id,
          ...(this.fg2.value.M1Id != null ? { Id: this.fg2.value.M1Id } : {})
        };
        ct.push(obj);
      }
      // For Session 2
      if (this.fg2.value.MondayS2) {
        this.fg2.value.Mstart2 = moment(
          this.fg2.value.Mstart2,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        this.fg2.value.Mend2 = moment(
          this.fg2.value.Mend2,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        let obj1 = {
          Day: "Monday",
          StartTime: this.fg2.value.Mstart2,
          EndTime: this.fg2.value.Mend2,
          IsOpen: true,
          Session: 2,
          // Id: this.fg2.value.M2Id,
          ...(this.fg2.value.M2Id != null ? { Id: this.fg2.value.M2Id } : {})
        };
        ct.push(obj1);
      }
    }else if (this.fg2.value.M1Id) {
        let obj = {
          Day: "Monday",
          IsOpen: 0,
          Session: 1,
          Id: this.fg2.value.M1Id
        };
        ct.push(obj);
      }
     else if (this.fg2.value.M2Id) {
        let obj = {
          Day: "Monday",
          IsOpen: 0,
          Session: 2,
          Id: this.fg2.value.M2Id
        };
        ct.push(obj);
      }
    

    if (this.fg2.value.Tuesday) {
      if (this.fg2.value.TuesdayS1) {
        this.fg2.value.Tustart = moment(
          this.fg2.value.Tustart,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        this.fg2.value.Tuend = moment(
          this.fg2.value.Tuend,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        let obj = {
          Day: "Tuesday",
          StartTime: this.fg2.value.Tustart,
          EndTime: this.fg2.value.Tuend,
          IsOpen: true,
          Session: 1,
          // Id: this.fg2.value.Tu1Id,
          ...(this.fg2.value.Tu1Id != null ? { Id: this.fg2.value.Tu1Id } : {})
        };
        ct.push(obj);
      }
      // session 2
      if (this.fg2.value.TuesdayS2) {
        this.fg2.value.Tustart2 = moment(
          this.fg2.value.Tustart2,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        this.fg2.value.Tuend2 = moment(
          this.fg2.value.Tuend2,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        let obj = {
          Day: "Tuesday",
          StartTime: this.fg2.value.Tustart2,
          EndTime: this.fg2.value.Tuend2,
          IsOpen: true,
          Session: 2,
          // Id: this.fg2.value.Tu2Id,
          ...(this.fg2.value.Tu2Id != null ? { Id: this.fg2.value.Tu2Id } : {})
        };
        ct.push(obj);
      }
    }else if (this.fg2.value.Tu1Id) {
        let obj = {
          Day: "Tuesday",
          IsOpen: 0,
          Session: 1,
          Id: this.fg2.value.Tu1Id
        };
        ct.push(obj);
      }else if (this.fg2.value.Tu2Id) {
        let obj = {
          Day: "Tuesday",
          IsOpen: 0,
          Session: 2,
          Id: this.fg2.value.Tu2Id
        };
        ct.push(obj);
      }
    

    if (this.fg2.value.Wednesday) {
      if (this.fg2.value.WednesdayS1) {
        this.fg2.value.Wstart = moment(
          this.fg2.value.Wstart,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        this.fg2.value.Wend = moment(
          this.fg2.value.Wend,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        let obj = {
          Day: "Wednesday",
          StartTime: this.fg2.value.Wstart,
          EndTime: this.fg2.value.Wend,
          IsOpen: true,
          Session: 1,
          // Id: this.fg2.value.W1Id,
          ...(this.fg2.value.W1Id != null ? { Id: this.fg2.value.W1Id } : {})
        };
        ct.push(obj);
      }
      // session 2
      if (this.fg2.value.WednesdayS2) {
        this.fg2.value.Wstart2 = moment(
          this.fg2.value.Wstart2,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        this.fg2.value.Wend2 = moment(
          this.fg2.value.Wend2,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        let obj = {
          Day: "Wednesday",
          StartTime: this.fg2.value.Wstart2,
          EndTime: this.fg2.value.Wend2,
          IsOpen: true,
          Session: 2,
          // Id: this.fg2.value.W2Id,
          ...(this.fg2.value.W2Id != null ? { Id: this.fg2.value.W2Id } : {})
        };
        ct.push(obj);
      }
    }else if (this.fg2.value.W1Id) {
        let obj = {
          Day: "Wednesday",
          IsOpen: 0,
          Session: 1,
          Id: this.fg2.value.W1Id
        };
        ct.push(obj);
      }
      else if (this.fg2.value.W2Id) {
        let obj = {
          Day: "Wednesday",
          IsOpen: 0,
          Session: 2,
          Id: this.fg2.value.W2Id
        };
        ct.push(obj);
      }
    

    if (this.fg2.value.Thursday) {
      if (this.fg2.value.ThursdayS1) {
        this.fg2.value.Thstart = moment(
          this.fg2.value.Thstart,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        this.fg2.value.Thend = moment(
          this.fg2.value.Thend,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        let obj = {
          Day: "Thursday",
          StartTime: this.fg2.value.Thstart,
          EndTime: this.fg2.value.Thend,
          IsOpen: true,
          Session: 1,
          // Id: this.fg2.value.Th1Id, // Use Th1Id in the object
          ...(this.fg2.value.Th1Id != null ? { Id: this.fg2.value.Th1Id } : {})
        };
        ct.push(obj);
      }
      // session 2
      if (this.fg2.value.ThursdayS2) {
        this.fg2.value.Thstart2 = moment(
          this.fg2.value.Thstart2,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        this.fg2.value.Thend2 = moment(
          this.fg2.value.Thend2,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        let obj = {
          Day: "Thursday",
          StartTime: this.fg2.value.Thstart2,
          EndTime: this.fg2.value.Thend2,
          IsOpen: true,
          Session: 2,
          // Id: this.fg2.value.Th2Id,
          ...(this.fg2.value.Th2Id != null ? { Id: this.fg2.value.Th2Id } : {})
        };
        ct.push(obj);
      }
    }else if (this.fg2.value.Th1Id) {
        let obj = {
          Day: "Thursday",
          IsOpen: 0,
          Session: 1,
          Id: this.fg2.value.Th1Id
        };
        ct.push(obj);
      }else if (this.fg2.value.Th2Id) {
        let obj = {
          Day: "Thursday",
          IsOpen: 0,
          Session: 2,
          Id: this.fg2.value.Th2Id
        };
        ct.push(obj);
      }
    

    if (this.fg2.value.Friday) {
      if (this.fg2.value.FridayS1) {
        this.fg2.value.Fstart = moment(
          this.fg2.value.Fstart,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        this.fg2.value.Fend = moment(
          this.fg2.value.Fend,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        let obj = {
          Day: "Friday",
          StartTime: this.fg2.value.Fstart,
          EndTime: this.fg2.value.Fend,
          IsOpen: true,
          Session: 1,
          // Id: this.fg2.value.F1Id,
          ...(this.fg2.value.F1Id != null ? { Id: this.fg2.value.F1Id } : {})
        };
        ct.push(obj);
      }
      // session
      if (this.fg2.value.FridayS2) {
        this.fg2.value.Fstart2 = moment(
          this.fg2.value.Fstart2,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        this.fg2.value.Fend2 = moment(
          this.fg2.value.Fend2,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        let obj = {
          Day: "Friday",
          StartTime: this.fg2.value.Fstart2,
          EndTime: this.fg2.value.Fend2,
          IsOpen: true,
          Session: 2,
          // Id: this.fg2.value.F2Id,
          ...(this.fg2.value.F2Id != null ? { Id: this.fg2.value.F2Id } : {})
        };
        ct.push(obj);
      }
    }else if (this.fg2.value.F1Id) {
        let obj = {
          Day: "Friday",
          IsOpen: 0,
          Session: 1,
          Id: this.fg2.value.F1Id
        };
        ct.push(obj);
      }else if (this.fg2.value.F2Id) {
        let obj = {
          Day: "Friday",
          IsOpen: 0,
          Session: 2,
          Id: this.fg2.value.F2Id
        };
        ct.push(obj);
      }

    if (this.fg2.value.Saturday) {
      if (this.fg2.value.SaturdayS1) {
        this.fg2.value.Sastart = moment(
          this.fg2.value.Sastart,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        this.fg2.value.Saend = moment(
          this.fg2.value.Saend,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        let obj = {
          Day: "Saturday",
          StartTime: this.fg2.value.Sastart,
          EndTime: this.fg2.value.Saend,
          IsOpen: true,
          Session: 1,
          // Id: this.fg2.value.Sa1Id,
          ...(this.fg2.value.Sa1Id != null ? { Id: this.fg2.value.Sa1Id } : {})
        };
        ct.push(obj);
      }
      if (this.fg2.value.SaturdayS2) {
        this.fg2.value.Sastart2 = moment(
          this.fg2.value.Sastart2,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        this.fg2.value.Saend2 = moment(
          this.fg2.value.Saend2,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        let obj = {
          Day: "Saturday",
          StartTime: this.fg2.value.Sastart2,
          EndTime: this.fg2.value.Saend2,
          IsOpen: true,
          Session: 2,
          // Id: this.fg2.value.Sa2Id,
          ...(this.fg2.value.Sa2Id != null ? { Id: this.fg2.value.Sa2Id } : {})
        };
        ct.push(obj);
      }
    }else if (this.fg2.value.Sa1Id) {
        let obj = {
          Day: "Saturday",
          IsOpen: 0,
          Session: 1,
          Id: this.fg2.value.Sa1Id
        };
        ct.push(obj);
      }else if (this.fg2.value.Sa2Id) {
        let obj = {
          Day: "Saturday",
          IsOpen: 0,
          Session: 2,
          Id: this.fg2.value.Sa2Id
        };
        ct.push(obj);
      }
    

    if (this.fg2.value.Sunday) {
      if (this.fg2.value.SundayS1) {
        this.fg2.value.Sustart = moment(
          this.fg2.value.Sustart,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        this.fg2.value.Suend = moment(
          this.fg2.value.Suend,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        let obj = {
          Day: "Sunday",
          StartTime: this.fg2.value.Sustart,
          EndTime: this.fg2.value.Suend,
          IsOpen: true,
          Session: 1,
          ...(this.fg2.value.Su1Id != null ? { Id: this.fg2.value.Su1Id } : {})
        };
        ct.push(obj);
      }
      if (this.fg2.value.SundayS2) {
        this.fg2.value.Sustart2 = moment(
          this.fg2.value.Sustart2,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        this.fg2.value.Suend2 = moment(
          this.fg2.value.Suend2,
          this.DATE_TIME_FORMAT
        ).format("HH:mm");
        let obj = {
          Day: "Sunday",
          StartTime: this.fg2.value.Sustart2,
          EndTime: this.fg2.value.Suend2,
          IsOpen: true,
          Session: 2,
          ...(this.fg2.value.Su2Id != null ? { Id: this.fg2.value.Su2Id } : {})
        };
        ct.push(obj);
      }
    }else{
      if (this.fg2.value.Su1Id) {
        let obj = {
          Day: "Sunday",
          IsOpen: 0,
          Session: 1,
          Id: this.fg2.value.Su1Id
        };
        ct.push(obj);
      }
      if (this.fg2.value.Su2Id) {
        let obj = {
          Day: "Sunday",
          IsOpen: 0,
          Session: 2,
          Id: this.fg2.value.Su2Id
        };
        ct.push(obj);
      }
    }

    // if (this.fg2.value.Sunday) {
    //   let obj = {
    //     Day: "Sunday",
    //     StartTime: moment(this.fg2.value.Sustart, this.DATE_TIME_FORMAT).format(
    //       "HH:mm"
    //     ),
    //     EndTime: moment(this.fg2.value.Suend, this.DATE_TIME_FORMAT).format(
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

      this.clinicService.UpdateClinicAndTimings(this.clinicId, data).subscribe(
        res => {
          console.log(this.clinicId);
          console.log(data);
          if (res) {
            this.storage.get('Clinics').then((val) => {
              this.updateClinic = val.filter(x => x.Id == this.clinicId);
              console.log(this.updateClinic);
              for (var i = 0; i < val.length; i++) {
                if (val[i].Id == this.clinicId) {
                  val[i].Name = this.fg1.value.Name;
                  val[i].ConsultationFee = this.fg1.value.ConsultationFee;
                  val[i].PhoneNumber = this.fg1.value.PhoneNumber;
                  // val[i].IsOnline = this.fg1.value.IsOnline;
                  val[i].Address = this.fg1.value.Address;
                  val[i].MonogramImage = this.fg1.value.MonogramImage;
                }
              }
              this.storage.set('Clinics', val);
              console.log(val);
              loading.dismiss();
              this.toastService.create("successfully updated clinic");
              this.router.navigate(["/members/doctor/clinic"], { queryParams: { refresh: true } });
            });
          } else {
            loading.dismiss();
            this.toastService.create("hello", "danger");
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
    RegNo: [
      { type: "required", message: "RegNo is required." },
      { type: "pattern", message: "RegNo must be alphanumeric." }
    ],
    MonogramImage:[
      { type: "required", message: "Monogram Image is required." },
    ],
    Mstart2: [{ type: "required", message: "Session 2 Must Start after Session 1" }],
    Mstart: [
      { type: "required", message: "End Time Must be after Start Time" }
    ],
    Mend: [{ type: "required", message: "End Time Must be after Start Time" }],
  };
}