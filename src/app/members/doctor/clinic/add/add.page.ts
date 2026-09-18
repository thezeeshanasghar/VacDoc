import { Component, OnInit, Input, ViewChild, ChangeDetectorRef } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl
} from "@angular/forms";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ClinicService } from "src/app/services/clinic.service";
import { ToastService } from "src/app/shared/toast.service";
import { Router } from "@angular/router";
import { LoadingController } from "@ionic/angular";
import { SignupService } from "src/app/services/signup.service";
import { Geolocation } from "@ionic-native/geolocation/ngx";
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { File , FileEntry } from '@ionic-native/file/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { UploadService } from 'src/app/services/upload.service';
declare var google;

@Component({
  selector: "app-add",
  templateUrl: "./add.page.html",
  styleUrls: ["./add.page.scss"]
})
export class AddPage implements OnInit {
  fg1: FormGroup;
  map;
  myMarker;
  uploading = false;
  @ViewChild("mapElement", { static: true }) mapElement;
  clinics: any;
  DoctorId: any;
  section: boolean = false;
  latitude: any = 33.6328532;
  longitude: any = 72.93583679;
  resourceURL = environment.RESOURCE_URL;
  isWeb: any;
  http: any;
  RegNo: any;
  constructor(
    private formbuilder: FormBuilder,
    private router: Router,
    private loadingController: LoadingController,
    private clinicService: ClinicService,
    private toastService: ToastService,
    private signupService: SignupService,
    private uploadService: UploadService,
    private storage: Storage,
    private geolocation: Geolocation,
    private cdr: ChangeDetectorRef,
    private fileChooser: FileChooser,
    private file: File,
    private filePath: FilePath,
    private transfer: FileTransfer
  ) { }

  ngOnInit() {
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
          Validators.minLength(10),
          Validators.pattern("^[+0-9][0-9 ]*$")
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
      MonogramImage: [""],
      Lat: [null],
      Long: [null],
      IsOnline: false,
      childrenCount: 0,
      RegNo: new FormControl(
        "",
        Validators.compose([
          Validators.pattern("^[A-Za-z0-9@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?\\s]+$")
        ])
      ),
    });

    this.cdr.detectChanges();
  }

  private previewMonogramImage(file: FileList) {
    const reader = new FileReader();
    reader.onload = () => {
      this.fg1.value.MonogramImage1 = reader.result as string;
    };
    reader.readAsDataURL(file.item(0));
  }

  async SelectMonogramImage(monogramFile: FileList) {
    this.previewMonogramImage(monogramFile);
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

  getdata() {
    this.fg1.value.DoctorId = this.DoctorId;
    this.fg1.value.Lat = 33.63207;
    this.fg1.value.Long = 72.935488;
    this.fg1.value.regNo = this.fg1.get('RegNo').value;
    this.addNewClinic(this.fg1.value);
  }

  async addNewClinic(data) {
    console.log(data);
    {
      const loading = await this.loadingController.create({
        message: "Loading"
      });
      await loading.present();
      await this.clinicService.addClinic(data).subscribe(
        res => {
          if (res.IsSuccess) {
            loading.dismiss();
            this.toastService.create("successfully added Clinic");
            this.router.navigate(["/members/doctor/clinic"], { queryParams: { refresh: true } });
            window.location.reload();
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
        message: "Phone Number must be at least 10 Digits long."
      },
      { type: "pattern", message: "Only numbers, spaces and a leading + are allowed" }
    ],
    Address: [{ type: "required", message: "Address is required." }],
    RegNo: [
      { type: "required", message: "RegNo is required." },
      { type: "pattern", message: "RegNo can contain letters, numbers, and special characters." }
    ],
    ConsultationFee: [
      { type: "required", message: "Consultation Fee is required." },
      {
        type: "pattern",
        message: "Your Consultation Fee must contain number"
      }
    ],
  };
}
