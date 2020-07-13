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
import { Router, ActivatedRoute } from "@angular/router";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { SMS } from '@ionic-native/sms/ngx';
import { TitleCasePipe } from '@angular/common';

//https://www.joshmorony.com/dynamic-infinite-input-fields-in-an-ionic-application/

@Component({
  selector: "app-schedueedit",
  templateUrl: "./sceduleedit.page.html",
  styleUrls: ["./sceduleedit.page.scss"]
})
export class SceduleEditPage implements OnInit {
  public fg: FormGroup;
  doctorId: any;

  doses: any;
  constructor(
    private loadingController: LoadingController,
    private doseService: DoseService,
    private signupService: SignupService,
    private toastService: ToastService,
    private formBuilder: FormBuilder,
    private router: Router,
    private storage: Storage,
    private activatedRoute: ActivatedRoute,
    private androidPermissions: AndroidPermissions ,
    private sms: SMS,
    private titlecasePipe: TitleCasePipe
    
  ) {}
 async ngOnInit() {
    this.fg = this.formBuilder.group({});
    await this.storage.get(environment.DOCTOR_Id).then(docId => {
      this.doctorId = docId;
    });
    this.getVaccineInfo(this.doctorId);
  }

  async getVaccineInfo(id) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.doseService.getNewDoses(id).subscribe(
      res => {
        if (res.IsSuccess) {
          this.doses = res.ResponseData;
         // this.signupService.vaccineData2 = this.doses;
          this.doses.forEach(dose => {
         //   let value = dose.MinGap == null ? 0 : dose.MinGap;
              let value = dose.MinAge == null ? 0 : dose.MinAge;
          //    let minage = value;
            this.fg.addControl(
              dose.Name,
              new FormControl(value, Validators.required)
            );
            // this.fg.addControl(
            //   dose.MinAge,
            //   new FormControl(minage, Validators.required)
            // );
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
    
  }

 

  async updateDoctorSchedule(id) {
    this.signupService.vaccineData = this.fg.value;
    await this.signupService.addSchedule(id).subscribe(
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

 

  checkScheduleValidity(minage,key) {
  console.log(minage);
  console.log(key);
//  console.log(select);

 // this.fg.controls[key].setErrors({ required: true });
  }
  validation_messages = {
    MinAge: [{ type: "required", message: "Can not reschedule" }]
  };
}
