import { Component, OnInit } from "@angular/core";
import { ScheduleService } from "src/app/services/schedule.service";
import { LoadingController } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ToastService } from "src/app/shared/toast.service";
import { Router } from "@angular/router";
import {
  FormGroup,
  FormBuilder,
  FormArray,
  FormControl,
  Validators
} from "@angular/forms";
import { DoseService } from "src/app/services/dose.service";

@Component({
  selector: "app-schedule",
  templateUrl: "./schedule.page.html",
  styleUrls: ["./schedule.page.scss"]
})
export class SchedulePage implements OnInit {
  fg: FormGroup;
  doses: any;
  vaccines: any;
  constructor(
    public loadingcontroller: LoadingController,
    private formBuilder: FormBuilder,
    private scheduleService: ScheduleService,
    private toastService: ToastService,
    private storage: Storage,
    private router: Router,
  ) {}

  ngOnInit() {
    this.fg = this.formBuilder.group({});
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.getSchedule(val);
    });
  }

  onSubmit() {
    this.addCustomSchedule();
  }

  async getSchedule(id) {
    let loading = await this.loadingcontroller.create({ message: "Loading" });
    await loading.present();
    await this.scheduleService.getSchedule(id).subscribe(
      res => {
        if (res.IsSuccess) {
          this.doses = res.ResponseData;
          this.doses.forEach(dose => {
            //console.log(dose.Dose.Name);
            let value = dose.GapInDays == null ? 0 : dose.GapInDays;
            this.fg.addControl(
              dose.Dose.Name,
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

  async addCustomSchedule() {
    let var1 = [];
    for (let i = 0; i < this.doses.length; i++) {
      var1.push({
        Id: this.doses[i].Id,
        DoseId: this.doses[i].DoseId,
        DoctorId: this.doses[i].DoctorId,
        GapInDays: parseInt(this.fg.value[this.doses[i].Dose.Name])
      });
    }
    const loading = await this.loadingcontroller.create({
      message: "Loading"
    });

    await loading.present();

    await this.scheduleService.putDoctorSchedule(var1).subscribe(
      res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.router.navigate(['/members/dashboard']);
          this.toastService.create("successfully updated");
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

// { ID: "", DoseID: "", DoctorID: "", GapInDays: "", Doctor: "", Dose: "" }
