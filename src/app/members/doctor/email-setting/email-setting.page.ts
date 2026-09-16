import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { LoadingController } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { SmtpTestService } from "src/app/services/smtp-test.service";
import { DoctorSmtpService } from "src/app/services/doctor-smtp.service";
import { ToastService } from "src/app/shared/toast.service";

@Component({
  selector: "app-email-setting",
  templateUrl: "./email-setting.page.html",
  styleUrls: ["./email-setting.page.scss"]
})
export class EmailSettingPage implements OnInit {
  fg: FormGroup;
  doctorId: number;
  resultMessage: string = null;
  resultSuccess = false;

  constructor(
    private formBuilder: FormBuilder,
    private storage: Storage,
    private smtpTestService: SmtpTestService,
    private doctorSmtpService: DoctorSmtpService,
    private toastService: ToastService,
    public loadingController: LoadingController
  ) {}

  async ngOnInit() {
    this.fg = this.formBuilder.group({
      SmtpHost: ["", Validators.required],
      SmtpPort: [587, [Validators.required, Validators.pattern("^[0-9]+$")]],
      SmtpUseSsl: [true],
      SmtpUsername: ["", Validators.required],
      SmtpPassword: ["", Validators.required],
      SmtpFromEmail: ["", [Validators.required, Validators.email]],
      SmtpFromName: [""]
    });

    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    if (this.doctorId) {
      this.loadSettings();
    }
  }

  async loadSettings() {
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();
    this.doctorSmtpService.get(this.doctorId).subscribe(
      res => {
        loading.dismiss();
        if (res && res.SmtpHost) {
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
      this.toastService.create("Please fill in all required fields.", "danger");
      return;
    }

    const loading = await this.loadingController.create({ message: "Saving" });
    await loading.present();

    const payload = {
      AllowOwnEmail: true,
      ...this.fg.value,
      SmtpPort: parseInt(this.fg.value.SmtpPort, 10)
    };

    this.doctorSmtpService.save(this.doctorId, payload).subscribe(
      res => {
        loading.dismiss();
        this.toastService.create(res.IsSuccess ? "Email settings saved." : res.Message, res.IsSuccess ? "success" : "danger");
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  async sendTestEmail() {
    if (this.fg.invalid) {
      this.fg.markAllAsTouched();
      this.toastService.create("Please fill in all required fields.", "danger");
      return;
    }

    this.resultMessage = null;

    const loading = await this.loadingController.create({
      message: "Sending test email..."
    });
    await loading.present();

    const v = this.fg.value;
    const payload = {
      Host: v.SmtpHost,
      Port: parseInt(v.SmtpPort, 10),
      UseSsl: v.SmtpUseSsl,
      Username: v.SmtpUsername,
      Password: v.SmtpPassword,
      FromEmail: v.SmtpFromEmail,
      FromName: v.SmtpFromName,
      ToEmail: v.SmtpFromEmail,
      Subject: "SMTP Test Email",
      Body: "This is a test email sent from VacDoc to verify your SMTP settings."
    };

    this.smtpTestService.sendTestEmail(payload).subscribe(
      res => {
        loading.dismiss();
        this.resultSuccess = !!res.IsSuccess;
        this.resultMessage = res.Message;
        this.toastService.create(res.Message, res.IsSuccess ? "success" : "danger");
      },
      err => {
        loading.dismiss();
        this.resultSuccess = false;
        this.resultMessage = err;
        this.toastService.create(err, "danger");
      }
    );
  }

  validation_messages = {
    SmtpHost: [{ type: "required", message: "SMTP host is required." }],
    SmtpPort: [
      { type: "required", message: "Port is required." },
      { type: "pattern", message: "Port must be a number." }
    ],
    SmtpUsername: [{ type: "required", message: "Username is required." }],
    SmtpPassword: [{ type: "required", message: "Password is required." }],
    SmtpFromEmail: [
      { type: "required", message: "From email is required." },
      { type: "email", message: "Enter a valid email." }
    ]
  };
}
