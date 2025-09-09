import { Component, OnInit } from "@angular/core";
import { ScheduleService } from "src/app/services/schedule.service";
import { LoadingController } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ToastService } from "src/app/shared/toast.service";
import { Router, RouterLink } from "@angular/router";
import {
  FormGroup,
  FormBuilder,
  FormArray,
  FormControl,
  Validators
} from "@angular/forms";
import { DoseService } from "src/app/services/dose.service";
import { ClinicService } from "src/app/services/clinic.service";

@Component({
  selector: "app-schedule",
  templateUrl: "./schedule.page.html",
  styleUrls: ["./schedule.page.scss"]
})
export class SchedulePage implements OnInit {
  fg: FormGroup;
  doses: any;
  vaccines: any;
  // alphabetically: any;
  IsActive = true;
  constructor(
    public loadingcontroller: LoadingController,
    private formBuilder: FormBuilder,
    private scheduleService: ScheduleService,
    private toastService: ToastService,
    private storage: Storage,
    private router: Router,
    private clinicService: ClinicService,
  ) {


  }
  ngOnInit() {


  }

  async ionViewDidEnter() {
    this.fg = this.formBuilder.group({}); // Initialize the form group
    await this.storage.get(environment.DOCTOR_Id).then(val => {
      this.getSchedule(val); // Fetch data and initialize form controls
    });
  }

  onSubmit() {
    this.addCustomSchedule();
  }

  async getSchedule(id) {
    let loading = await this.loadingcontroller.create({
      message: "Loading Schedule"
    });

    await loading.present();
    await this.scheduleService.getSchedule(id).subscribe(
      res => {
        if (res.IsSuccess) {
          this.doses = res.ResponseData;
          console.log(this.doses)
          this.doses.forEach(dose => {
            let value = dose.GapInDays == null ? 0 : dose.GapInDays;
            this.fg.addControl(
              dose.Dose.Name,
              new FormControl(value, Validators.required)
            );
          });
          loading.dismiss();

        } else {
          loading.dismiss();
          // this.toastService.create(res.Message, "danger");
          // this.router.navigate(["./members/doctor/schedule/addschedule"]);
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }
  returnZero() {
    return 0
  }
  async addCustomSchedule() {
    let var1 = [];
    let var2=[]

    for (let i = 0; i < this.doses.length; i++) {
    
      if (this.doses[i].IsActive==true) { // Check if dose is selected
        var1.push({
          Id: this.doses[i].Id,
          DoseId: this.doses[i].DoseId,
          DoctorId: this.doses[i].DoctorId,
          GapInDays: parseInt(this.fg.value[this.doses[i].Dose.Name]),
          IsActive: this.doses[i].IsActive
        });
      }
      else if (this.doses[i].IsActive==false) { // Check if dose is selected
        var2.push({
          Id: this.doses[i].Id,
          DoseId: this.doses[i].DoseId,
          DoctorId: this.doses[i].DoctorId,
          GapInDays: parseInt(this.fg.value[this.doses[i].Dose.Name]),
          IsActive: this.doses[i].IsActive
        });
      }
      else{
        console.log('hello else called')
      }
    }
    const loading = await this.loadingcontroller.create({
      message: "Loading"
    });

    await loading.present();
    console.log('var1',var1)
    console.log('var2',var2)
    loading.dismiss();
    await this.scheduleService.putDoctorSchedule(var1).subscribe(
      res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.router.navigate(['/members/doctor/schedule']);
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
    await this.scheduleService.putDoctorSchedule(var2).subscribe(
      res => {
        if (res.IsSuccess) {
          console.log('2nd success')
        } else {
          console.log('2nd fail')
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  async AddSchedule(){
    this.router.navigate(["/addschedule"]);
  }
}

