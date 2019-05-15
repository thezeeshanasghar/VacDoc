import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { DoctorService } from "src/app/services/doctor.service";
import { ToastService } from "src/app/shared/toast.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { FormGroup, FormBuilder } from "@angular/forms";
import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import { concat } from 'rxjs';
import { UploadService } from "src/app/services/UploadService";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.page.html",
  styleUrls: ["./profile.page.scss"]
})
export class ProfilePage implements OnInit {
  fg: FormGroup;
  doctorData: any;
  docotrID: any;

  public profileUploader: FileUploader = new FileUploader({});
  public signatureUploader: FileUploader = new FileUploader({});

  constructor(
    public loadingController: LoadingController,
    private doctorService: DoctorService,
    private toastService: ToastService,
    private storage: Storage,
    private formBuilder: FormBuilder,
    private uploadService: UploadService
  ) { }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_ID).then(val => {
      this.docotrID = val;
    });
    this.getProfile();
    this.fg = this.formBuilder.group({
      ID: [null],
      FirstName: [null],
      LastName: [null],
      DisplayName: [null],
      Email: [null],
      MobileNumber: [null],
      ShowMobile: [null],
      PhoneNo: [null],
      ShowPhone: [null],
      PMDC: [null]
    });
  }

  async getProfile() {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.doctorService.getDoctorProfile(this.docotrID).subscribe(
      res => {
        if (res.IsSuccess) {
          this.doctorData = res.ResponseData;
          this.fg.controls["ID"].setValue(this.doctorData.ID);
          this.fg.controls["FirstName"].setValue(this.doctorData.FirstName);
          this.fg.controls["LastName"].setValue(this.doctorData.LastName);
          this.fg.controls["DisplayName"].setValue(this.doctorData.DisplayName);
          this.fg.controls["Email"].setValue(this.doctorData.Email);
          this.fg.controls["MobileNumber"].setValue(
            this.doctorData.MobileNumber
          );
          this.fg.controls["ShowMobile"].setValue(this.doctorData.ShowMobile);
          this.fg.controls["PhoneNo"].setValue(this.doctorData.PhoneNo);
          this.fg.controls["ShowPhone"].setValue(this.doctorData.ShowPhone);
          this.fg.controls["PMDC"].setValue(this.doctorData.PMDC);
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
      message: "Loading"
    });
    await loading.present();
    await this.doctorService
      .updateDoctorProfile(this.docotrID, this.fg.value)
      .subscribe(
        res => {
          if (res.IsSuccess) {
            let formData = new FormData();
            var file1 = this.profileUploader.queue.pop().file;
            var file2 = this.signatureUploader.queue.pop().file;
            formData.append('ProfileImage', file1.rawFile, file1.name);
            formData.append('SignatureImage', file2.rawFile, file2.name);
            this.uploadService.uploadFormData(this.docotrID, formData).subscribe(
              (res1) => {
                this.toastService.create("Profile updated successfully.");
                loading.dismiss();
              },
              (err1) => {
                console.log(err1);
              }
            );

          } else {
            this.toastService.create(res.Message, "danger");
          }
        },
        err => {
          this.toastService.create(err, "danger");
        }
      );
  }

  // uploadFiles() {

  //   let requests = [];
  //   let formData = new FormData();
  //   var file1 = this.profileUploader.queue.pop().file;
  //   var file2 = this.signatureUploader.queue.pop().file;
  //   formData.append('ProfileImage', file1.rawFile, file1.name);
  //   formData.append('SignatureImage', file2.rawFile, file2.name);
  //   requests.push(this.uploadService.uploadFormData(this.docotrID, formData));

  //   concat(...requests).subscribe(
  //     (res) => {
  //       this.toastService.create("Profile updated successfully.");
  //     },
  //     (err) => {
  //       console.log(err);
  //     }
  //   );
  // }

}
