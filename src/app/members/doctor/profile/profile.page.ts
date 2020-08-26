import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { DoctorService } from "src/app/services/doctor.service";
import { ToastService } from "src/app/shared/toast.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { FormGroup, FormBuilder, FormControl, Validators } from "@angular/forms";
// import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import { concat } from 'rxjs';
import { UploadService } from 'src/app/services/upload.service';
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { File , FileEntry } from '@ionic-native/file/ngx';
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

  // public profileUploader: FileUploader = new FileUploader({});
  // public signatureUploader: FileUploader = new FileUploader({});

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
    private transfer: FileTransfer

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
          Validators.pattern("^(0|[1-9][0-9]*)$")
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
      SignatureImage: new FormControl(
        "",
        Validators.compose([
          Validators.required
        ])
      ),
      ProfileImage: new FormControl(
        "",
        Validators.compose([
          Validators.required
        ])
      )
    });
  }


  uploadSignatureImage() {

    this.fileChooser.open().then(async uri =>
      {
        console.log(uri);
       await  this.filePath.resolveNativePath(uri).then(filePath =>
          {
            //this.filesPath = filePath;
            this.uploading = true;
            this.file.resolveLocalFilesystemUrl(filePath).then(fileInfo =>
              {
                let files = fileInfo as FileEntry;
                files.file(async success =>
                  {
                    //this.fileType   = success.type;
                    let filesName  = success.name;
                    console.log(filesName);
                    let options: FileUploadOptions = {
                      fileName: filesName
                    }
                    const fileTransfer: FileTransferObject = this.transfer.create();
                  await  fileTransfer.upload(uri, 'http://13.233.255.96:5002/api/upload', options)
                    .then((data) => {
                      // success
                      console.log(data);
                      this.uploading = false;
                      let dbpath = JSON.parse(data.response)
                      this.fg.value.SignatureImage = dbpath.dbPath;
                      console.log(this.fg.value.SignatureImage);
                    }, (err) => {
                      console.log(err)
                      // error
                    })
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

  uploadProfileImage() {

    this.fileChooser.open().then(async uri =>
      {
        console.log(uri);
       await  this.filePath.resolveNativePath(uri).then(filePath =>
          {
            //this.filesPath = filePath;
            this.uploading = true;
            this.file.resolveLocalFilesystemUrl(filePath).then(fileInfo =>
              {
                let files = fileInfo as FileEntry;
                files.file(async success =>
                  {
                    //this.fileType   = success.type;
                    let filesName  = success.name;
                    console.log(filesName);
                    let options: FileUploadOptions = {
                      fileName: filesName
                    }
                    const fileTransfer: FileTransferObject = this.transfer.create();
                  await  fileTransfer.upload(uri, 'http://13.233.255.96:5002/api/upload', options)
                    .then((data) => {
                      // success
                      console.log(data);
                      this.uploading = false;
                      let dbpath = JSON.parse(data.response)
                      this.fg.value.ProfileImage = dbpath.dbPath;
                      console.log(this.fg.value.ProfileImage);
                    }, (err) => {
                      console.log(err)
                      // error
                    })
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



  async getProfile() {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.doctorService.getDoctorProfile(this.DocotrId).subscribe(
      res => {
        if (res.IsSuccess) {
          this.doctorData = res.ResponseData;
          this.fg.controls["Id"].setValue(this.doctorData.Id);
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
      .updateDoctorProfile(this.DocotrId, this.fg.value)
      .subscribe(
        res => {
          if (res.IsSuccess) {
            let formData = new FormData();
            // var file1 = this.profileUploader.queue.pop().file;
            // var file2 = this.signatureUploader.queue.pop().file;
            // formData.append('ProfileImage', file1.rawFile, file1.name);
            // formData.append('SignatureImage', file2.rawFile, file2.name);
            this.uploadService.uploadFormData(this.DocotrId, formData).subscribe(
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
    ]
  };
}
