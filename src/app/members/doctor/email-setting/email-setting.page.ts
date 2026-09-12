import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { LoadingController } from "@ionic/angular";
import { SmtpTestService } from "src/app/services/smtp-test.service";
import { ToastService } from "src/app/shared/toast.service";

@Component({
  selector: "app-email-setting",
  templateUrl: "./email-setting.page.html",
  styleUrls: ["./email-setting.page.scss"]
})
export class EmailSettingPage implements OnInit {
  fg: FormGroup;
  resultMessage: string = null;
  resultSuccess = false;

  constructor(
    private formBuilder: FormBuilder,
    private smtpTestService: SmtpTestService,
    private toastService: ToastService,
    public loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.fg = this.formBuilder.group({
      Host: ["", Validators.required],
      Port: [587, [Validators.required, Validators.pattern("^[0-9]+$")]],
      UseSsl: [true],
      Username: ["", Validators.required],
      Password: ["", Validators.required],
      FromEmail: ["", [Validators.required, Validators.email]],
      FromName: [""],
      ToEmail: ["", [Validators.required, Validators.email]],
      Subject: ["SMTP Test Email"],
      Body: ["This is a test email sent from VaccineAPI to verify SMTP settings."]
    });
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

    const payload = {
      ...this.fg.value,
      Port: parseInt(this.fg.value.Port, 10)
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
    Host: [{ type: "required", message: "SMTP host is required." }],
    Port: [
      { type: "required", message: "Port is required." },
      { type: "pattern", message: "Port must be a number." }
    ],
    Username: [{ type: "required", message: "Username is required." }],
    Password: [{ type: "required", message: "Password is required." }],
    FromEmail: [
      { type: "required", message: "From email is required." },
      { type: "email", message: "Enter a valid email." }
    ],
    ToEmail: [
      { type: "required", message: "Recipient email is required." },
      { type: "email", message: "Enter a valid email." }
    ]
  };
}
