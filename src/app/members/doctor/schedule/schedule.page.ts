import { Component, OnInit } from "@angular/core";
import { ScheduleService } from "src/app/services/schedule.service";
import { LoadingController } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ToastService } from "src/app/shared/toast.service";
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
  schedule: any;
  vaccines: any;
  constructor(
    public loadingcontroller: LoadingController,
    private formBuilder: FormBuilder,
    private scheduleService: ScheduleService,
    private toastService: ToastService,
    private storage: Storage
  ) {}

  ngOnInit() {
    this.fg = this.formBuilder.group({});
    this.storage.get(environment.DOCTOR_ID).then(val => {
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
          this.schedule = res.ResponseData;

          this.schedule.forEach(dose => {
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
    for (let i = 0; i < this.schedule.length; i++) {
      var1.push({
        ID: this.schedule[i].ID,
        DoseID: this.schedule[i].DoseID,
        DoctorID: this.schedule[i].DoctorID,
        GapInDays: this.fg.value[this.schedule[i].Dose.Name]
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
