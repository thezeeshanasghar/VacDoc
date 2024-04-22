import { Component, OnInit } from "@angular/core";
import { LoadingController, Platform } from "@ionic/angular";
import { DoctorService } from "src/app/services/doctor.service";
import { ToastService } from "src/app/shared/toast.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { FormGroup, FormBuilder, FormControl, Validators } from "@angular/forms";
// import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import { concat } from 'rxjs';
import { UploadService } from 'src/app/services/upload.service';
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { File, FileEntry } from '@ionic-native/file/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';

@Component({
  selector: "app-profile",
  templateUrl: "./profile.page.html",
  styleUrls: ["./profile.page.scss"]
})

export class ProfilePage implements OnInit {
  fg: FormGroup;
  doctorData: any;
  DocotrId: any;
  uploading: any;
  profileImagePath: any;
  // signatureImagePath: any;
  resourceURL = environment.RESOURCE_URL;
  profileImagePath2: any;

  constructor(
    public loadingController: LoadingController,
    private doctorService: DoctorService,
    private toastService: ToastService,
    private storage: Storage,
    private formBuilder: FormBuilder,
    private uploadService: UploadService,
    private fileChooser: FileChooser,
    private file: File,
    private filePath: FilePath,
    private transfer: FileTransfer,
    private platform: Platform

  ) { }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.DocotrId = val;
    });

    this.getProfile();

    this.fg = this.formBuilder.group({
      Id: [null],
      FirstName: [null],
      LastName: [null],
      DisplayName: [null],
      Email: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.pattern(
            "^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$"
          )
        ])
      ),
      MobileNumber: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.pattern("[0-9]{10}$")
        ])
      ),
      ShowMobile: [null],
      PhoneNo: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.minLength(7),
          Validators.maxLength(11),
          Validators.pattern("^([0-9]*)$")
        ])
      ),
      ShowPhone: [null],
      PMDC: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.pattern("^[0-9-\\+]*-[A-Z]$")
        ])
      ),
      AdditionalInfo:["", [Validators.required,this.fourLinesValidator,]],
      Qualification:[null],
      // SignatureImage: new FormControl([null]),
      ProfileImage: new FormControl([null])

    });
  }
  fourLinesValidator(control: FormControl) {
    const value = control.value || "";
    const lines = value.split('\n').filter(line => line.trim() !== '');
    return lines.length >= 4 ? null : { insufficientLines: true };
  }
  private previewImage(file: FileList, imagePath: string) {
    const reader = new FileReader();
    reader.onload = () => {
      if (imagePath == "profile")
        this.profileImagePath2 = reader.result as string;
      // else if (imagePath == "signature")
      //   this.signatureImagePath = reader.result as string;
    }
    reader.readAsDataURL(file.item(0));
  }

  
  async SelectProfileImage(profileFile: FileList) {

    this.previewImage(profileFile, "profile");

    const loading = await this.loadingController.create({
      message: "Uploading Image"
    });
    await loading.present();
    const profileData = new FormData();
    profileData.append("ProfileImage", profileFile.item(0));

    await this.uploadService.uploadImage(profileData).subscribe(res => {
      if (res) {
        let pImage = res.dbPath;
        this.fg.value.ProfileImage = pImage;
        console.log("ProfileImage = " + this.fg.value.ProfileImage);
        loading.dismiss();
      }
      else {
        console.log(res.Message);
        console.log("Error: Try Again! Failed to upload ProfileImage");
        this.toastService.create("Error: Try Again! Failed to upload ProfileImage.")
        loading.dismiss();
      }
    });
  }

  // async SelectSignatureImage(signatureFile: FileList) {

  //   this.previewImage(signatureFile, "signature");

  //   const loading = await this.loadingController.create({
  //     message: "Uploading Image"
  //   });
  //   await loading.present();
  //   const signatureData = new FormData();
  //   signatureData.append("SignatureImage", signatureFile.item(0));

  //   await this.uploadService.uploadImage(signatureData).subscribe(res => {
  //     if (res) {
  //       let sData = res.dbPath;
  //       this.fg.value.SignatureImage = environment.RESOURCE_URL+sData;
  //       console.log("SignatureImage = " + this.fg.value.SignatureImage);
  //       loading.dismiss();
  //     }
  //     else {
  //       console.log(res.Message);
  //       console.log("Error: Try Again! Failed to upload SignatureImage");
  //       this.toastService.create("Error: Try Again! Failed to upload SignatureImage.")
  //       loading.dismiss();
  //     }
  //   });
  // }

  async getProfile() {
    const loading = await this.loadingController.create({
      message: "Loading Profile"
    });

    await loading.present();
    await this.doctorService.getDoctorProfile(this.DocotrId).subscribe(
      res => {
        if (res.IsSuccess) {
          this.doctorData = res.ResponseData;
          console.log(this.doctorData);
          this.fg.controls["Id"].setValue(this.doctorData.Id);
          this.fg.controls["FirstName"].setValue(this.doctorData.FirstName);
          this.fg.controls["LastName"].setValue(this.doctorData.LastName);
          this.fg.controls["DisplayName"].setValue(this.doctorData.DisplayName);
          this.fg.controls["Email"].setValue(this.doctorData.Email);
          this.fg.controls["MobileNumber"].setValue(this.doctorData.MobileNumber);
          this.fg.controls["ShowMobile"].setValue(this.doctorData.ShowMobile);
          this.fg.controls["PhoneNo"].setValue(this.doctorData.PhoneNo);
          this.fg.controls["ShowPhone"].setValue(this.doctorData.ShowPhone);
          this.fg.controls["PMDC"].setValue(this.doctorData.PMDC);
          this.fg.controls["AdditionalInfo"].setValue(this.doctorData.AdditionalInfo);
          this.fg.controls["Qualification"].setValue(this.doctorData.Qualification);
          // this.fg.controls["SignatureImage"].setValue(this.doctorData.SignatureImage);
          this.fg.controls["ProfileImage"].setValue(this.doctorData.ProfileImage);
          this.profileImagePath = this.doctorData.ProfileImage;
          // this.signatureImagePath = this.doctorData.SignatureImage;

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

  async updateProfile() {

    const loading = await this.loadingController.create({
      message: "Updating Profile"
    });

    console.log(this.fg.value);
    await loading.present();
    await this.doctorService
      .updateDoctorProfile(this.DocotrId, this.fg.value)
      .subscribe(
        res => {
          if (res.IsSuccess) {
            loading.dismiss();
            console.log(res.ResponseData);
            this.toastService.create("Profile Updated !");
          } else {
            this.toastService.create(res.Message, "danger");
            loading.dismiss();
          }
        },
        err => {
          this.toastService.create(err, "danger");
          loading.dismiss();
        }
      );
  }

  validation_messages = {
    FirstName: [{ type: "required", message: "Name is required." }],
    LastName: [{ type: "required", message: "Last Name is required." }],
    DisplayName: [{ type: "required", message: "Last Name is required." }],
    Email: [
      { type: "required", message: "Email is required." },
      { type: "pattern", message: "Please enter a valid email." }
    ],
    MobileNumber: [
      { type: "required", message: "MobileNumber is required." },
      { type: "pattern", message: "Mobile number is required like 3331231231" }
    ],
    PhoneNo: [
      { type: "required", message: "Phone number is required" },
      {
        type: "minlength",
        message: "Phone Number must be at least 7 Digits long."
      },
      { type: "pattern", message: "Enter Must be Number" }
    ],
    PMDC: [
      { type: "required", message: "PMDC is required." },
      { type: "pattern", message: "PMDC is required like 12345-A" }
    ],
    AdditionalInfo: [
      { type: "required", message: "Additional Info is required." },
      {
        type: "insufficientLines",
        message: "Input must contain at least four lines.",
      },
    ],
  };
}
