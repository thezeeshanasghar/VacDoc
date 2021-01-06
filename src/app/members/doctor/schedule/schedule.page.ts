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
  IsActive = true;
  constructor(
    public loadingcontroller: LoadingController,
    private formBuilder: FormBuilder,
    private scheduleService: ScheduleService,
    private toastService: ToastService,
    private storage: Storage,
    private router: Router,
  ) {}
ngOnInit(){}
  ionViewDidEnter() {
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
// (ngModelChange)="checkMinGap(control.key , control.value.value , doses[i].Dose.MinAge, doses[i].Dose.DoseOrder , doses[i].Dose.VaccineId)"
 //async checkMinGap(key , val , adminvalue , order ,vaccineId){
    // console.log(key);
    // console.log(val);
    // console.log(adminvalue);
    // console.log(vaccineId);
    // console.log(order);
    // var increment = val - adminvalue;
    // var nextdoses = this.doses.filter(x=>x.Dose.VaccineId == vaccineId);
    // console.log(nextdoses);
    // await nextdoses.forEach(element => {
    //  // if (increment > 0)
    //   if (element.Dose.DoseOrder == (order+1))
    //   {
    //     var currentvalue = parseInt(this.fg.value[element.Dose.Name]);
    //     console.log("loop");
    //     console.log(currentvalue);
    //     console.log(element.Dose.MinGap);
    //     var daysdiff = currentvalue - val;
    //     if (daysdiff < element.Dose.MinGap)
    //     this.fg.controls[key].setValue( currentvalue - element.MinGap , {onlySelf: false , emitEvent:false});
    //     // var cname = element.Dose.Name;
    //     // this.fg.controls[cname].setValue(currentvalue + increment , {onlySelf: false , emitEvent:false});  
    //   }
    //   else
    //   return true;
      
    // });
  //}

  async addCustomSchedule() {
    let var1 = [];
    // to check admin rules
    // for (let i = 0; i < this.doses.length; i++) {
    //   if (this.doses[i].Dose.DoseOrder == 1) {
    //     var previousDose = 0;
    //     var currentDose = 0;
    //     var nextdoses = this.doses.filter(x => x.Dose.VaccineId == this.doses[i].Dose.VaccineId);
    //     console.log(nextdoses);
    //     await nextdoses.forEach(element => {
    //       if (element.Dose.DoseOrder > 1) {
    //         element.Dose.MinGap == null ? element.Dose.MinGap = 0 : "";
    //         currentDose = parseInt(this.fg.value[element.Dose.Name]);
    //         if ((currentDose - previousDose) < element.Dose.MinGap)
    //           this.fg.controls[element.Dose.Name].setValue((previousDose + element.Dose.MinGap), { onlySelf: false, emitEvent: false });
    //       }
    //       previousDose = parseInt(this.fg.value[element.Dose.Name]);
    //     });
    //   }
    // }
    // 
    for (let i = 0; i < this.doses.length; i++) {
      var1.push({
        Id: this.doses[i].Id,
        DoseId: this.doses[i].DoseId,
        DoctorId: this.doses[i].DoctorId,
        GapInDays: parseInt(this.fg.value[this.doses[i].Dose.Name]),
        IsActive: this.doses[i].IsActive
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
