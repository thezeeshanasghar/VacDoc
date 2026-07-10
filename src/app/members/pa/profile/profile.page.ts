import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import { FormGroup, FormBuilder, FormControl, Validators } from "@angular/forms";
import { environment } from "src/environments/environment";
import { PaService } from "src/app/services/pa.service";
import { UploadService } from "src/app/services/upload.service";
import { ToastService } from "src/app/shared/toast.service";

@Component({
  selector: "app-pa-profile",
  templateUrl: "./profile.page.html",
  styleUrls: ["./profile.page.scss"]
})
export class PaProfilePage implements OnInit {
  fg: FormGroup;
  paId: any;
  resourceURL = environment.RESOURCE_URL;
  // The picture actually shown: a data-URI preview once a new file is chosen,
  // otherwise the RESOURCE_URL-prefixed stored filename.
  previewImage: string = null;
  storedImagePath: string = null;
  // Read-only: the login mobile, shown locked because it is the WhatsApp
  // number parents see. Never sent back to the server.
  mobileNumber: string = "";
  countryCode: string = "";

  constructor(
    public loadingController: LoadingController,
    private storage: Storage,
    private formBuilder: FormBuilder,
    private paService: PaService,
    private uploadService: UploadService,
    private toastService: ToastService,
  ) { }

  ngOnInit() {
    this.fg = this.formBuilder.group({
      Name: [null, Validators.required],
      Email: new FormControl(
        "",
        Validators.compose([
          Validators.pattern(
            "^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$"
          )
        ])
      ),
      // Filename returned by the upload endpoint; empty means "photo unchanged".
      ProfileImage: [""]
    });

    this.storage.get(environment.USER).then(user => {
      this.paId = user ? user.PAId : null;
      this.getProfile();
    });
  }

  async getProfile() {
    const loading = await this.loadingController.create({ message: "Loading Profile" });
    await loading.present();
    this.paService.getPa(this.paId).subscribe(
      res => {
        loading.dismiss();
        // getPa returns the PA row directly (with its User included).
        const pa = res && res.ResponseData ? res.ResponseData : res;
        if (!pa) {
          this.toastService.create("Could not load profile.", "danger");
          return;
        }
        this.fg.controls["Name"].setValue(pa.Name);
        this.fg.controls["Email"].setValue(pa.Email);
        this.storedImagePath = pa.ProfileImage;
        this.mobileNumber = pa.User ? pa.User.MobileNumber : "";
        this.countryCode = pa.User ? pa.User.CountryCode : "";
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  get displayImage(): string {
    if (this.previewImage) return this.previewImage;
    if (this.storedImagePath) return this.resourceURL + this.storedImagePath;
    return null;
  }

  private showLocalPreview(file: File) {
    const reader = new FileReader();
    reader.onload = () => { this.previewImage = reader.result as string; };
    reader.readAsDataURL(file);
  }

  async selectProfileImage(fileList: FileList) {
    if (!fileList || fileList.length === 0) return;
    this.showLocalPreview(fileList.item(0));

    const loading = await this.loadingController.create({ message: "Uploading Image" });
    await loading.present();

    const formData = new FormData();
    formData.append("ProfileImage", fileList.item(0));

    this.uploadService.uploadImage(formData).subscribe(
      res => {
        loading.dismiss();
        if (res && res.dbPath) {
          this.fg.controls["ProfileImage"].setValue(res.dbPath);
        } else {
          this.previewImage = null;
          this.toastService.create("Error: failed to upload photo. Try again.", "danger");
        }
      },
      err => {
        loading.dismiss();
        this.previewImage = null;
        this.toastService.create(err, "danger");
      }
    );
  }

  async updateProfile() {
    if (this.fg.invalid) {
      this.toastService.create("Please fix the highlighted fields.", "danger");
      return;
    }
    const loading = await this.loadingController.create({ message: "Updating Profile" });
    await loading.present();

    // Only name / email / photo go up. Mobile number is deliberately omitted.
    const payload = {
      Name: this.fg.value.Name,
      Email: this.fg.value.Email,
      ProfileImage: this.fg.value.ProfileImage
    };

    this.paService.updatePaProfile(this.paId, payload).subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create("Profile Updated !");
          window.location.reload();
        } else {
          this.toastService.create(res && res.Message ? res.Message : "Update failed.", "danger");
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  validation_messages = {
    Name: [{ type: "required", message: "Name is required." }],
    Email: [{ type: "pattern", message: "Please enter a valid email." }]
  };
}
