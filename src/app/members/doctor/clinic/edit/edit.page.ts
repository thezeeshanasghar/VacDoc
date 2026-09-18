import { Component, OnInit } from "@angular/core";
import { LoadingController, Platform } from "@ionic/angular";
import { AlertService } from "src/app/shared/alert.service";
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
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { File, FileEntry } from '@ionic-native/file/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { Base64 } from '@ionic-native/base64/ngx';
import { HttpClient } from "@angular/common/http";
import { UploadService } from 'src/app/services/upload.service';
import { PaService } from 'src/app/services/pa.service';

@Component({
  selector: "app-edit",
  templateUrl: "./edit.page.html",
  styleUrls: ["./edit.page.scss"]
})
export class EditPage implements OnInit {
  isWeb: boolean;
  fg1: FormGroup;
  updateClinic: any;
  clinicId: any;
  clinic: any;
  doctorId: any;
  uploading = false;
  resourceURL = environment.RESOURCE_URL;
  RegNo: any;
  otherClinics: any[] = [];
  selectedTransferClinicId: any = null;

  usertype: any;
  canEdit = true;
  allowInventory = false;

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
    private alertService: AlertService,
    private paService: PaService,
  ) {
    this.isWeb = !this.platform.is('cordova');
    console.log(this.isWeb)
  }

  ngOnInit() {
     this.storage.get(environment.USER).then((user) => {
      if (user) {
        console.log('Retrieved user from storage:', user);
        this.usertype = user.UserType;
        // Only doctors with inventory permission may toggle per-clinic stock maintenance.
        this.allowInventory = user.UserType === 'DOCTOR' && user.AllowInventory === true;
        if (user.UserType === 'PA') {
          this.paService.getPaPermissions(Number(user.PAId)).subscribe(perm => {
            this.canEdit = (perm && perm.EditClinic) || false;
            if (!this.canEdit) {
              this.toastService.create('You do not have permission to edit clinics', 'danger');
              this.router.navigate(['/members/doctor/clinic']);
            }
          });
        }
      } else {
        console.error('No user data found in storage.');
      }
    });
    this.fg1 = this.formbuilder.group({
      Id: [null],
      DoctorId: [null],
      Name: [null],
      PhoneNumber: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.minLength(10),
          Validators.pattern("^[+0-9][0-9 ]*$"),
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
      Lat: [null],
      Long: [null],
      IsOnline: [false],
      MaintainInventory: [true],
      MonogramImage: [null],
      RegNo: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.pattern("^[A-Za-z0-9@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?\\s]+$"),
        ])
      ),
    });

    this.clinicId = this.route.snapshot.paramMap.get("id");
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
    this.getClinic();
    this.storage.get(environment.CLINICS).then(clinics => {
      if (clinics) {
        this.otherClinics = clinics.filter((c: any) => String(c.Id) !== String(this.clinicId));
      }
    });
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
          this.fg1.controls["MaintainInventory"].setValue(this.clinic.MaintainInventory !== false);
          localStorage.setItem('monogramImage', this.clinic.MonogramImage);
          const monogramImageUrl = localStorage.getItem('monogramImage');
          this.fg1.controls["MonogramImage"].setValue(monogramImageUrl)
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
    this.fg1.value.RegNo = this.fg1.get('RegNo').value;
    this.editClinic(this.fg1.value);
  }

  async editClinic(data) {
    {
      const loading = await this.loadingController.create({
        message: "Loading"
      });
      await loading.present();

      this.clinicService.editClinicDetails(this.clinicId, data).subscribe(
        res => {
          if (res.IsSuccess) {
            this.storage.get('Clinics').then((val) => {
              this.updateClinic = val.filter(x => x.Id == this.clinicId);
              for (var i = 0; i < val.length; i++) {
                if (val[i].Id == this.clinicId) {
                  val[i].Name = this.fg1.value.Name;
                  val[i].ConsultationFee = this.fg1.value.ConsultationFee;
                  val[i].PhoneNumber = this.fg1.value.PhoneNumber;
                  val[i].Address = this.fg1.value.Address;
                  val[i].MonogramImage = this.fg1.value.MonogramImage;
                }
              }
              this.storage.set('Clinics', val);
              loading.dismiss();
              this.toastService.create("successfully updated clinic");
              this.router.navigate(["/members/doctor/clinic"], { queryParams: { refresh: true } });
            });
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

  async confirmTransfer() {
    if (!this.selectedTransferClinicId) return;
    const target = this.otherClinics.find((c: any) => c.Id == this.selectedTransferClinicId);
    const targetName = target ? target.Name : '';
    const yes = await this.alertService.confirmAlert(
      `Transfer all patients to "${targetName}" and permanently close this clinic? This cannot be undone.`,
      'Confirm Transfer'
    );
    if (yes) this.doTransferAndDelete();
  }

  async doTransferAndDelete() {
    const loading = await this.loadingController.create({ message: 'Transferring patients...' });
    await loading.present();
    this.clinicService.transferPatients(this.clinicId, this.selectedTransferClinicId).subscribe(
      res => {
        if (res.IsSuccess) {
          this.clinicService.deleteClinic(this.clinicId).subscribe(
            delRes => {
              loading.dismiss();
              if (delRes.IsSuccess) {
                this.storage.get(environment.CLINICS).then(clinics => {
                  if (clinics) {
                    this.storage.set(environment.CLINICS, clinics.filter((c: any) => String(c.Id) !== String(this.clinicId)));
                  }
                });
                this.toastService.create('Patients transferred and clinic closed');
                this.router.navigate(['/members/doctor/clinic'], { queryParams: { refresh: true } });
              } else {
                this.toastService.create(delRes.Message, 'danger');
              }
            },
            err => { loading.dismiss(); this.toastService.create(err, 'danger'); }
          );
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => { loading.dismiss(); this.toastService.create(err, 'danger'); }
    );
  }

  async confirmDelete() {
    const yes = await this.alertService.confirmAlert(
      'Delete this clinic permanently? All bills and stock linked to it will be removed.',
      'Delete Clinic'
    );
    if (yes) this.doDeleteClinic();
  }

  async doDeleteClinic() {
    const loading = await this.loadingController.create({ message: 'Deleting...' });
    await loading.present();
    this.clinicService.deleteClinic(this.clinicId).subscribe(
      res => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.storage.get(environment.CLINICS).then(clinics => {
            if (clinics) {
              this.storage.set(environment.CLINICS, clinics.filter((c: any) => String(c.Id) !== String(this.clinicId)));
            }
          });
          this.toastService.create('Clinic deleted');
          this.router.navigate(['/members/doctor/clinic'], { queryParams: { refresh: true } });
        } else {
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => { loading.dismiss(); this.toastService.create(err, 'danger'); }
    );
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
    ConsultationFee: [
      { type: "required", message: "Consultation Fee is required." },
      {
        type: "pattern",
        message: "Your Consultation Fee must contain positive number"
      }
    ],
    RegNo: [
      { type: "required", message: "RegNo is required." },
      { type: "pattern", message: "RegNo can contain letters, numbers, and special characters." }
    ],
  };
}
