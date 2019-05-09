import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { DoseService } from "src/app/services/dose.service";
import { ToastService } from "src/app/shared/toast.service";
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators
} from "@angular/forms";
import { SignupService } from "src/app/services/signup.service";
import { Router } from "@angular/router";

//https://www.joshmorony.com/dynamic-infinite-input-fields-in-an-ionic-application/

@Component({
  selector: "app-step3",
  templateUrl: "./step3.page.html",
  styleUrls: ["./step3.page.scss"]
})
export class Step3Page implements OnInit {
  public fg: FormGroup;

  doses: any;
  constructor(
    private loadingController: LoadingController,
    private doseService: DoseService,
    private signupService: SignupService,
    private toastService: ToastService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    this.fg = this.formBuilder.group({});

    this.getVaccineInfo();
  }

  async getVaccineInfo() {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.doseService.getDoses().subscribe(
      res => {
        if (res.IsSuccess) {
          this.doses = res.ResponseData;

          this.doses.forEach(dose => {
            let value = dose.MinGap == null ? "" : dose.MinGap;
            this.fg.addControl(
              dose.Name,
              new FormControl(value, Validators.required)
            );
          });

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

  onSubmit() {
    this.addNewDoctor();
  }

  async addNewDoctor() {
    await this.signupService.addDoctor().subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create("successfully added");
          this.router.navigate(["/login"]);
        } else {
          this.toastService.create(res.Message, "danger");
        }
      },
      err => {
        this.toastService.create(err, "danger");
      }
    );
  }
}
