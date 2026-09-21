import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { LoadingController } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { DoctorWebsiteService } from "src/app/services/doctor-website.service";
import { ToastService } from "src/app/shared/toast.service";

@Component({
  selector: "app-website-setting",
  templateUrl: "./website-setting.page.html",
  styleUrls: ["./website-setting.page.scss"]
})
export class WebsiteSettingPage implements OnInit {
  fg: FormGroup;
  doctorId: number;

  constructor(
    private formBuilder: FormBuilder,
    private storage: Storage,
    private doctorWebsiteService: DoctorWebsiteService,
    private toastService: ToastService,
    public loadingController: LoadingController
  ) {}

  async ngOnInit() {
    this.fg = this.formBuilder.group({
      WebsiteUrl: ["", [Validators.required, Validators.pattern("^https?://.+")]]
    });

    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    if (this.doctorId) {
      this.loadSettings();
    }
  }

  async loadSettings() {
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();
    this.doctorWebsiteService.get(this.doctorId).subscribe(
      res => {
        loading.dismiss();
        if (res && res.WebsiteUrl) {
          this.fg.patchValue(res);
        }
      },
      err => {
        loading.dismiss();
        console.log(err);
      }
    );
  }

  async saveSettings() {
    if (this.fg.invalid) {
      this.fg.markAllAsTouched();
      this.toastService.create("Please enter a valid website link (starting with http:// or https://).", "danger");
      return;
    }

    const loading = await this.loadingController.create({ message: "Saving" });
    await loading.present();

    const payload = {
      AllowOwnWebsite: true,
      ...this.fg.value
    };

    this.doctorWebsiteService.save(this.doctorId, payload).subscribe(
      res => {
        loading.dismiss();
        this.toastService.create(res.IsSuccess ? "Website settings saved." : res.Message, res.IsSuccess ? "success" : "danger");
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  validation_messages = {
    WebsiteUrl: [
      { type: "required", message: "Website link is required." },
      { type: "pattern", message: "Enter a full link starting with http:// or https://" }
    ]
  };

  get verificationUrl(): string {
    const raw = this.fg && this.fg.value ? this.fg.value.WebsiteUrl : "";
    const url = (raw || "").trim().replace(/\/+$/, "");
    return url ? `${url}/verify` : "";
  }
}
