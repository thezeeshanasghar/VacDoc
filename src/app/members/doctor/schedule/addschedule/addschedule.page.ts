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
  selector: "app-addschedule",
  templateUrl: "./addschedule.page.html",
  styleUrls: ["./addschedule.page.scss"]
})
export class AddschedulePage implements OnInit {
  public fg: FormGroup;

  doses: any;
  DoctorId: any;
  constructor(
    private loadingController: LoadingController,
    private doseService: DoseService,
    private signupService: SignupService,
    private toastService: ToastService,
    private formBuilder: FormBuilder,
    private router: Router,
    private storage: Storage,
    private activatedRoute: ActivatedRoute,
    private androidPermissions: AndroidPermissions,
    private sms: SMS,
    private titlecasePipe: TitleCasePipe
  ) { }
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
          // this.signupService.vaccineData2 = this.doses;
          this.doses.forEach(dose => {

            let value = dose.MinAge == null ? 0 : dose.MinAge;
            let name = dose.Name;


            this.fg.addControl(
              dose.Name,
              new FormControl(value, Validators.required)
            );
            dose.IsSpecial = true;
            // changes in old copy
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

  // onSubmit() {
  //   this.addNewClinic();
  // }


  // async addNewClinic() {
  //   const loading = await this.loadingController.create({
  //     message: "Loading"
  //   });
  //   await loading.present();
  //   await this.signupService.addDoctor().subscribe(
  //     res => {
  //       if (res.IsSuccess) {
  //         this.addDoctorSchedule(res.ResponseData.Id);

  //         loading.dismiss();
  //       } else {
  //         loading.dismiss();
  //         this.toastService.create(res.Message, "danger");
  //       }
  //     },
  //     err => {
  //       loading.dismiss();
  //       this.toastService.create(err, "danger");
  //     }
  //   );
  // }

  async addDoctorSchedule(id) {
    this.signupService.vaccineData = this.fg.value;
    this.signupService.vaccineData2 = this.doses;

    await this.signupService.addSchedule(id).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create("successfully added");
          this.router.navigate(["./members/doctor/schedule"]);
        } else {
          this.toastService.create(res.Message, "danger");
        }
      },
      err => {
        this.toastService.create(err, "danger");
      }
    );
  }
  onSubmit() {
    console.log("Button Click ")
    const docid = localStorage.getItem("docid")
    console.log(docid);
    this.addDoctorSchedule(docid)
  }



  //   checkScheduleValidity(minage,key) {
  //   console.log(minage);
  //   console.log(key);
  // //  console.log(select);

  //  // this.fg.controls[key].setErrors({ required: true });
  //   }
  //   validation_messages = {
  //     MinAge: [{ type: "required", message: "Can not reschedule" }]
  //   };
}
